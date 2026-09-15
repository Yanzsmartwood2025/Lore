const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
};

export const publicSupabaseEnv = () => ({
  url: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  anonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
});

export const serverSupabaseEnv = () => ({
  ...publicSupabaseEnv(),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
});
