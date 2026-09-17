import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Env } from '@/lib/env';

export function getR2Client() {
  const env = r2Env();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
}

export async function uploadToR2(key: string, body: Buffer | Uint8Array, contentType: string) {
  const env = r2Env();
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: env.bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await client.send(command);
  return { key, bucket: env.bucketName };
}

export async function signedUploadUrl(key: string, contentType: string, expiresIn = 300) {
  const env = r2Env();
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: env.bucketName, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

export async function signedDownloadUrl(key: string, expiresIn = 300) {
  const env = r2Env();
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: env.bucketName, Key: key }),
    { expiresIn }
  );
}
