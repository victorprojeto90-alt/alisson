import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Empresa {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
  owner_id: string;
  created_at: string;
  telefone?: string | null;
  cnpj?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
  // Campos de cobrança (Asaas) — só existem depois que a migração SQL em
  // supabase/sql/2026-08-add-asaas-billing-fields.sql for rodada no Supabase.
  // Ficam undefined até lá; todo código que os lê trata undefined como "sem efeito".
  asaas_customer_id?: string | null;
  asaas_subscription_id?: string | null;
  plan_type?: 'trial' | 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'bloqueado' | null;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  is_blocked?: boolean | null;
  block_reason?: string | null;
  ultimo_pagamento_at?: string | null;
}

export interface Profile {
  id: string;
  empresa_id: string;
  name: string;
  role: 'admin' | 'engineer' | 'viewer';
  tipo_usuario?: 'pessoa_fisica' | 'empresa';
  telefone?: string | null;
  cpf_cnpj?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
  empresa: Empresa;
}

export interface ExtraSignUpData {
  tipoUsuario?: 'pessoa_fisica' | 'empresa';
  telefone?: string;
  cpfCnpj?: string;
  cidade?: string;
  estadoUf?: string;
}

// Lê o hash da URL (#access_token=...&type=recovery, ou #error=...&error_description=...
// quando o link já expirou/foi usado) de forma SÍNCRONA, antes de qualquer chamada
// assíncrona ao Supabase. Isso existe porque supabase.auth.getSession() resolve antes do
// evento PASSWORD_RECOVERY ser notificado (o auth-js dispara esse evento dentro de um
// setTimeout(…, 0) separado de _initialize()) — se isPasswordRecovery só fosse setado ao
// reagir ao evento, PublicOnlyRoute via `user` truthy primeiro (pelo getSession) e
// redirecionava para o dashboard antes do PASSWORD_RECOVERY chegar. Lendo a URL de forma
// síncrona no estado inicial, isPasswordRecovery já nasce correto no primeiro render.
function readRecoveryStateFromUrl(): { isRecovery: boolean; error: string | null } {
  if (typeof window === 'undefined') return { isRecovery: false, error: null };
  const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  if (!raw) return { isRecovery: false, error: null };
  const params = new URLSearchParams(raw);
  const errorDescription = params.get('error_description');
  if (errorDescription) {
    return { isRecovery: false, error: errorDescription };
  }
  if (params.get('type') === 'recovery') {
    return { isRecovery: true, error: null };
  }
  return { isRecovery: false, error: null };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  empresa: Empresa | null;
  loading: boolean;
  // true entre o clique no link de recuperação de senha (evento PASSWORD_RECOVERY) e a
  // troca de senha ser concluída — enquanto true, rotas públicas não devem redirecionar
  // o usuário para dentro do app só porque uma sessão (temporária, de recovery) existe.
  // true durante a animação de entrada após o login (mantém a tela de login visível até terminar)
  entrando: boolean;
  setEntrando: (value: boolean) => void;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (value: boolean) => void;
  // Preenchido quando o link de recuperação chega expirado/já utilizado (Supabase
  // redireciona com #error=...&error_description=... em vez de um token válido).
  passwordRecoveryError: string | null;
  clearPasswordRecoveryError: () => void;
  // true quando a empresa está bloqueada (trial expirado, assinatura cancelada ou
  // pagamento em atraso além do prazo) — ver ProtectedRoute em App.tsx.
  isBlocked: boolean;
  blockReason: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, companyName: string, extra?: ExtraSignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => readRecoveryStateFromUrl().isRecovery);
  const [passwordRecoveryError, setPasswordRecoveryError] = useState(() => readRecoveryStateFromUrl().error);
  const [isBlocked, setIsBlocked] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  // Avalia se a empresa deve estar bloqueada. A decisão definitiva é do servidor
  // (billing-scheduler bloqueia trials vencidos e o RLS impede gravações de empresas
  // bloqueadas); aqui só refletimos isso na tela — o navegador não grava mais nada.
  const avaliarBloqueio = (empresaData: Empresa | null | undefined) => {
    if (!empresaData) { setIsBlocked(false); setBlockReason(null); return; }

    const planEfetivo = empresaData.plan_type ?? empresaData.plan;
    const trialFim = empresaData.trial_ends_at ? new Date(empresaData.trial_ends_at) : null;
    const isTrialExpirado = !!trialFim && new Date() > trialFim && planEfetivo === 'trial';

    if (empresaData.is_blocked) {
      setIsBlocked(true);
      setBlockReason(empresaData.block_reason ?? 'Acesso bloqueado');
    } else if (isTrialExpirado) {
      setIsBlocked(true);
      setBlockReason('Trial expirado');
    } else {
      setIsBlocked(false);
      setBlockReason(null);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, empresa:empresas(*)')
      .eq('id', userId)
      .maybeSingle();
    if (error) console.warn('[AuthContext] Erro ao carregar perfil:', error.message);
    return data as Profile | null;
  };

  // Empresa + perfil são criados pelo próprio banco no cadastro (trigger
  // on_auth_user_created). Se o perfil ainda não apareceu, tenta de novo algumas vezes.
  const loadingProfileFor = useRef<string | null>(null);
  const loadProfile = async (userId: string) => {
    if (loadingProfileFor.current === userId) return;
    loadingProfileFor.current = userId;
    try {
      for (let tentativa = 0; tentativa < 4; tentativa++) {
        const data = await fetchProfile(userId);
        if (data) {
          setProfile(data);
          avaliarBloqueio(data.empresa);
          return;
        }
        await new Promise((r) => setTimeout(r, 800));
      }
      console.error('[AuthContext] Perfil não encontrado para o usuário', userId);
    } finally {
      loadingProfileFor.current = null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Evento PASSWORD_RECOVERY cria uma sessão temporária só para permitir a troca de
      // senha — não é um login normal, então marcamos isso separadamente para que rotas
      // públicas (ver PublicOnlyRoute em App.tsx) não redirecionem o usuário para dentro
      // do app antes de ele conseguir definir a nova senha.
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    companyName: string,
    extra?: ExtraSignUpData
  ) => {
    // Dados vão como metadata; empresa + perfil são criados pelo trigger
    // on_auth_user_created no banco.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          company_name: companyName,
          tipo_usuario: extra?.tipoUsuario ?? 'pessoa_fisica',
          telefone: extra?.telefone ?? null,
          cpf_cnpj: extra?.cpfCnpj ?? null,
          cidade: extra?.cidade ?? null,
          estado_uf: extra?.estadoUf ?? null,
        },
      },
    });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Erro ao criar usuário' };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsBlocked(false);
    setBlockReason(null);
  };

  const clearPasswordRecoveryError = () => setPasswordRecoveryError(null);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      empresa: profile?.empresa ?? null,
      loading,
      isPasswordRecovery,
      setIsPasswordRecovery,
      entrando,
      setEntrando,
      passwordRecoveryError,
      clearPasswordRecoveryError,
      isBlocked,
      blockReason,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
