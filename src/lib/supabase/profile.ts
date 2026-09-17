import type { SupabaseClient } from '@supabase/supabase-js';

type ProfileIdentity = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export async function ensureLoreProfile(supabase: SupabaseClient, identity: ProfileIdentity) {
  // Explicit columns only: never send credits, VIP status, or other privileges.
  const { error } = await supabase.from('lore_profiles').upsert({
    id: identity.id,
    firebase_uid: identity.id,
    email: identity.email,
    display_name: identity.displayName,
    avatar_url: identity.avatarUrl,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) {
    throw new Error('No se pudo preparar tu perfil. Vuelve a intentarlo en unos momentos.');
  }
}
