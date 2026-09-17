'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { getSupabaseToken } from '@/lib/firebase/claims';
import { publicSupabaseEnv } from '@/lib/env';

let client: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (!client) {
    const { url, anonKey } = publicSupabaseEnv();
    client = createClient(url, anonKey, {
      accessToken: async () => {
        const auth = getFirebaseAuth();
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) return null;
        const token = await getSupabaseToken(user);
        // Do not send a token from a session that ended during claim refresh.
        return auth.currentUser === user ? token : null;
      },
    });
  }
  return client;
}
