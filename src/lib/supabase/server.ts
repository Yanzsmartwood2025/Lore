import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicSupabaseEnv, serverSupabaseEnv } from '@/lib/env';
import { verifyFirebaseRequest } from '@/lib/firebase/server';
import { ensureLoreProfile } from '@/lib/supabase/profile';

export async function createClient(accessToken: string | null = null) {
  const { url, anonKey } = publicSupabaseEnv();
  return createSupabaseClient(url, anonKey, {
    accessToken: async () => accessToken,
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createServiceClient() {
  const { url, serviceRoleKey } = serverSupabaseEnv();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireUser(request: Request) {
  const identity = await verifyFirebaseRequest(request);
  if (!identity || identity.role !== 'authenticated') return null;

  // Supabase independently verifies this Firebase JWT and applies RLS.
  // No synthetic Supabase Auth user and no service-role client for user queries.
  const token = request.headers.get('authorization')!.slice('Bearer '.length).trim();
  const supabase = await createClient(token);
  const email = typeof identity.email === 'string' ? identity.email : null;
  await ensureLoreProfile(supabase, {
    id: identity.sub,
    email,
    displayName: typeof identity.name === 'string' ? identity.name : email?.split('@')[0] ?? null,
    avatarUrl: typeof identity.picture === 'string' ? identity.picture : null,
  });

  return {
    supabase,
    user: { id: identity.sub, firebaseUid: identity.sub, email },
  };
}
