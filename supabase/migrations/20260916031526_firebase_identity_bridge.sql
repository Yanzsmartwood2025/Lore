-- Firebase Authentication owns the public login. Each Firebase identity is
-- linked to a private Supabase Auth user so all existing UUID foreign keys and
-- row-level security policies remain intact.
alter table public.lore_profiles
  add column firebase_uid text unique,
  add column email text;

alter table public.lore_profiles
  add constraint lore_profiles_firebase_uid_not_blank
  check (firebase_uid is null or length(trim(firebase_uid)) > 0);
