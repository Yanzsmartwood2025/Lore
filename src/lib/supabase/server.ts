import { createClient as createAdminClient } from '@supabase/supabase-js';
import { publicSupabaseEnv, serverSupabaseEnv } from '@/lib/env';
import { verifyFirebaseRequest } from '@/lib/firebase/server';

export async function createClient() {
  const { url, anonKey } = publicSupabaseEnv();
  return createAdminClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createServiceClient() {
  const { url, serviceRoleKey } = serverSupabaseEnv();
  return createAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireUser(request: Request) {
  const identity = await verifyFirebaseRequest(request);
  if (!identity) return null;

  const supabase = createServiceClient();
  const email = typeof identity.email === 'string' ? identity.email : null;
  if (!email) return null;

  const { data: existingProfile, error: lookupError } = await supabase
    .from('lore_profiles')
    .select('id')
    .eq('firebase_uid', identity.sub)
    .maybeSingle();
  if (lookupError) {
    console.error('Unable to find Firebase identity in Lore:', lookupError.message);
    return null;
  }
  if (existingProfile) return { supabase, user: { id: existingProfile.id, firebaseUid: identity.sub, email } };

  const displayName = typeof identity.name === 'string' ? identity.name : email.split('@')[0];
  const avatarUrl = typeof identity.picture === 'string' ? identity.picture : null;
  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: displayName,
      avatar_url: avatarUrl,
      firebase_uid: identity.sub,
    },
  });
  if (createError || !createdUser.user) {
    console.error('Unable to create Lore identity:', createError?.message);
    return null;
  }

  const { error: profileError } = await supabase.from('lore_profiles').update({
    firebase_uid: identity.sub,
    email,
    display_name: displayName,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  }).eq('id', createdUser.user.id);
  if (profileError) {
    console.error('Unable to link Firebase identity to Lore profile:', profileError.message);
    return null;
  }

  return {
    supabase,
    user: { id: createdUser.user.id, firebaseUid: identity.sub, email },
  };
}
