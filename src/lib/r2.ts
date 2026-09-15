import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function config() {
  const names = ['R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME'] as const;
  const values = Object.fromEntries(names.map((name) => {
    const value = process.env[name];
    if (!value) throw new Error(`Falta la variable de entorno ${name}`);
    return [name, value];
  })) as Record<(typeof names)[number], string>;
  return values;
}

function client() {
  const env = config();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
}

export async function signedUploadUrl(key: string, contentType: string) {
  const env = config();
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ContentType: contentType }), { expiresIn: 300 });
}

export async function signedDownloadUrl(key: string) {
  const env = config();
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }), { expiresIn: 300 });
}
