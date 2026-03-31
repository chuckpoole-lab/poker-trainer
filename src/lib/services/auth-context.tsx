'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  preferred_mode: string | null;
  poker_iq: number;
  league_slug: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isGuest: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isGuest: false,
    loading: true,
  });

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as Profile;
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Check if user previously chose guest mode
    const isGuest = typeof window !== 'undefined' && localStorage.getItem('poker-trainer-guest') === 'true';

    let resolved = false;

    // Safety timeout — if getSession hangs (Supabase lock issue), fall back after 4s
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setState({
          user: null,
          profile: null,
          session: null,
          isGuest,
          loading: false,
        });
      }
    }, 4000);

    // Get current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (resolved) return; // timeout already fired
      resolved = true;
      clearTimeout(timeout);

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          session,
          isGuest: false,
          loading: false,
        });
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          isGuest,
          loading: false,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            session,
            isGuest: false,
            loading: false,
          });
          // Clear guest flag if they sign in
          localStorage.removeItem('poker-trainer-guest');
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            isGuest: false,
            loading: false,
          });
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}`
          : undefined,
      },
    });
    if (error) console.error('Google sign-in error:', error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      session: null,
      isGuest: false,
      loading: false,
    });
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem('poker-trainer-guest', 'true');
    setState(prev => ({ ...prev, isGuest: true, loading: false }));
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      signInWithGoogle,
      signOut,
      continueAsGuest,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
