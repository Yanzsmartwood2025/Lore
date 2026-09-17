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

export const r2Env = () => ({
  accountId: required('R2_ACCOUNT_ID', process.env.R2_ACCOUNT_ID),
  accessKeyId: required('R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID),
  secretAccessKey: required('R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY),
  bucketName: required('R2_BUCKET_NAME', process.env.R2_BUCKET_NAME),
});

export const adminEnv = () => ({
  adminUploadKey: process.env.ADMIN_UPLOAD_KEY || '',
});
