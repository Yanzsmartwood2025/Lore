'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
};
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const getIdToken = useCallback(async () => {
    return getFirebaseAuth().currentUser?.getIdToken() ?? null;
  }, []);

  return <AuthContext.Provider value={{ user, loading, getIdToken }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
