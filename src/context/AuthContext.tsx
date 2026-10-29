import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';
import { formatNgoAddress } from '@/lib/ngoCategories';

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: Profile['role'],
    age?: number,
    categories?: string[],
    address?: string,
    phone?: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        (async () => {
          await loadProfile(session.user.id);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    let userProfile = data as Profile | null;

    if (error || !userProfile) {
      // Profile might not exist yet (trigger hasn't fired). Retry once.
      await new Promise((r) => setTimeout(r, 600));
      const { data: retry } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      userProfile = retry as Profile | null;
    }

    if (userProfile) {
      // Sync address/phone from auth metadata if profile has them blank
      const { data: sessionData } = await supabase.auth.getSession();
      const meta = sessionData.session?.user?.user_metadata;
      if (meta && (!userProfile.address || userProfile.address === '') && meta.address) {
        await supabase.from('profiles').update({ address: meta.address, phone: meta.phone || userProfile.phone }).eq('id', userId);
        userProfile.address = meta.address;
        if (meta.phone) userProfile.phone = meta.phone;
      }
    }

    setProfile(userProfile);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: Profile['role'],
    age?: number,
    categories?: string[],
    address?: string,
    phone?: string
  ) {
    const formattedAddress = role === 'ngo' && categories && categories.length > 0
      ? formatNgoAddress(categories, address || '')
      : (address || '');

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          age: age?.toString(),
          categories: categories ?? [],
          address: formattedAddress,
          phone: phone || '',
        },
      },
    });

    if (error) return { error: error.message };

    if (signUpData.user) {
      try {
        await supabase
          .from('profiles')
          .update({
            address: formattedAddress,
            phone: phone || '',
          })
          .eq('id', signUpData.user.id);
      } catch (err) {
        console.warn('Initial profile update error:', err);
      }
    }

    return { error: null };
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      setSession(null);
      setProfile(null);
    }
  }

  async function refreshProfile() {
    if (session) {
      await loadProfile(session.user.id);
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
