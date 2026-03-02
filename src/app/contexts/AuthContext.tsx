import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  empresa: Empresa | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, companyName: string, extra?: ExtraSignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data, error: selectError } = await supabase
      .from('profiles')
      .select('*, empresa:empresas(*)')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // Log permission errors (broken admin SQL policies) but continue trying to provision.
    if (selectError && selectError.code !== 'PGRST116') {
      console.warn('[AuthContext] Profile query error:', selectError.message, '— tentando provisionar...');
    }

    // Auto-provision empresa + profile for users created before migration
    // or when email confirmation is required (session comes after confirmation).
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const meta = authUser?.user_metadata ?? {};
    const emailBase = authUser?.email?.split('@')[0] ?? 'Empresa';
    const companyName = (meta.company_name as string | undefined)
      ?? (emailBase.charAt(0).toUpperCase() + emailBase.slice(1));

    const empresaInsert: Record<string, string | null> = {
      name: companyName,
      owner_id: userId,
    };
    if (meta.telefone) empresaInsert.telefone = meta.telefone as string;
    if (meta.cpf_cnpj && meta.tipo_usuario === 'empresa') empresaInsert.cnpj = meta.cpf_cnpj as string;
    if (meta.cidade) empresaInsert.cidade = meta.cidade as string;
    if (meta.estado_uf) empresaInsert.estado_uf = meta.estado_uf as string;

    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert(empresaInsert)
      .select()
      .single();

    if (empresaError) {
      console.error('[AuthContext] Falha ao provisionar empresa:', empresaError.message,
        '— Execute o SQL de correção das policies no Supabase.');
      return;
    }

    if (empresa) {
      const profileInsert: Record<string, string | null> = {
        id: userId,
        empresa_id: empresa.id,
        name: (meta.name as string | undefined) ?? companyName,
        role: 'admin',
        tipo_usuario: (meta.tipo_usuario as string | undefined) ?? 'pessoa_fisica',
      };
      if (meta.telefone) profileInsert.telefone = meta.telefone as string;
      if (meta.cpf_cnpj) profileInsert.cpf_cnpj = meta.cpf_cnpj as string;
      if (meta.cidade) profileInsert.cidade = meta.cidade as string;
      if (meta.estado_uf) profileInsert.estado_uf = meta.estado_uf as string;

      const { error: profileError } = await supabase.from('profiles').insert(profileInsert);
      if (profileError) {
        console.error('[AuthContext] Falha ao provisionar profile:', profileError.message);
        return;
      }

      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*, empresa:empresas(*)')
        .eq('id', userId)
        .maybeSingle();

      if (newProfile) setProfile(newProfile as Profile);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    // Store all data as user metadata. Empresa + profile records are created
    // by loadProfile when the user first gets a valid session.
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
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      empresa: profile?.empresa ?? null,
      loading,
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
