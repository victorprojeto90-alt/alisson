import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Empresa {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string;
  owner_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  empresa_id: string;
  name: string;
  role: 'admin' | 'engineer' | 'viewer';
  empresa: Empresa;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  empresa: Empresa | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, companyName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*, empresa:empresas(*)')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // User exists in auth but has no empresa/profile yet (e.g. signed up before migration
    // or email confirmation flow where insert ran before session was established).
    // Auto-provision both records so the app works immediately.
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const emailBase = authUser?.email?.split('@')[0] ?? 'Empresa';
    const companyName = (authUser?.user_metadata?.company_name as string | undefined)
      ?? (emailBase.charAt(0).toUpperCase() + emailBase.slice(1));

    const { data: empresa } = await supabase
      .from('empresas')
      .insert({ name: companyName, owner_id: userId })
      .select()
      .single();

    if (empresa) {
      await supabase.from('profiles').insert({
        id: userId,
        empresa_id: empresa.id,
        name: authUser?.user_metadata?.name ?? companyName,
        role: 'admin',
      });

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

  const signUp = async (email: string, password: string, name: string, companyName: string) => {
    // Only create the auth user here. Empresa + profile are provisioned by loadProfile
    // once the user has a valid session (immediately if email confirmation is off,
    // or after email confirmation otherwise).
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company_name: companyName } },
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
