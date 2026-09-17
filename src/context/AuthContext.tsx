'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { getSupabaseToken } from '@/lib/firebase/claims';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ensureLoreProfile } from '@/lib/supabase/profile';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  retryProfile: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  retryProfile: async () => undefined,
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const prepareProfile = useCallback(async (nextUser: User) => {
    await getSupabaseToken(nextUser);
    if (getFirebaseAuth().currentUser !== nextUser) return;
    await ensureLoreProfile(getSupabaseClient(), {
      id: nextUser.uid,
      email: nextUser.email,
      displayName: nextUser.displayName,
      avatarUrl: nextUser.photoURL,
    });
  }, []);

  const retryProfile = useCallback(async () => {
    const nextUser = getFirebaseAuth().currentUser;
    if (!nextUser) return;
    setLoading(true);
    setError(null);
    try {
      await prepareProfile(nextUser);
    } catch (error) {
      if (getFirebaseAuth().currentUser === nextUser) {
        setError(error instanceof Error ? error.message : 'No se pudo preparar tu cuenta.');
      }
    } finally {
      if (getFirebaseAuth().currentUser === nextUser) setLoading(false);
    }
  }, [prepareProfile]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setError(null);
      setLoading(Boolean(nextUser));
      if (!nextUser) return;
      void prepareProfile(nextUser).catch((error: unknown) => {
        if (active && getFirebaseAuth().currentUser === nextUser) {
          setError(error instanceof Error ? error.message : 'No se pudo preparar tu cuenta.');
        }
      }).finally(() => {
        if (active && getFirebaseAuth().currentUser === nextUser) setLoading(false);
      });
    });
    return () => { active = false; unsubscribe(); };
  }, [prepareProfile]);

  const getIdToken = useCallback(async () => {
    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser) return null;
    const token = await getSupabaseToken(currentUser);
    return getFirebaseAuth().currentUser === currentUser ? token : null;
  }, []);

  return <AuthContext.Provider value={{ user, loading, error, retryProfile, getIdToken }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
