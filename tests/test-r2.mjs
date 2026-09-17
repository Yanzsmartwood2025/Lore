import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'node:fs';

// Load .env.local if present
if (fs.existsSync('.env.local')) {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
}

// Read credentials from process.env (loaded from .env.local)
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'lore-media';

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error('Missing R2 environment variables. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function runTests() {
  console.log('--- STARTING R2 END-TO-END TESTS ---');

  const testCases = [
    {
      category: 'fotos',
      persona: 'lore',
      key: `fotos/lore/test-photo-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
      content: Buffer.from('FAKE_JPG_BINARY_DATA_FOR_R2_TEST'),
    },
    {
      category: 'videos',
      persona: 'camila',
      key: `videos/camila/test-video-${Date.now()}.mp4`,
      contentType: 'video/mp4',
      content: Buffer.from('FAKE_MP4_BINARY_DATA_FOR_R2_TEST'),
    },
    {
      category: 'musica',
      persona: null,
      key: `musica/test-track-${Date.now()}.mp3`,
      contentType: 'audio/mpeg',
      content: Buffer.from('FAKE_MP3_BINARY_DATA_FOR_R2_TEST'),
    },
  ];

  for (const tc of testCases) {
    console.log(`\n[TEST 1] Uploading to R2: key="${tc.key}", type="${tc.contentType}"...`);
    const putCmd = new PutObjectCommand({
      Bucket: bucketName,
      Key: tc.key,
      Body: tc.content,
      ContentType: tc.contentType,
    });
    await s3.send(putCmd);
    console.log(`=> Upload successful!`);

    console.log(`[TEST 2] Generating signed download URL (expires in 300s)...`);
    const getCmd = new GetObjectCommand({
      Bucket: bucketName,
      Key: tc.key,
    });
    const signedUrl = await getSignedUrl(s3, getCmd, { expiresIn: 300 });
    console.log(`=> Signed URL generated: ${signedUrl}`);

    console.log(`[TEST 3] Fetching file via signed URL...`);
    const res = await fetch(signedUrl);
    console.log(`=> HTTP Status: ${res.status} ${res.statusText}`);
    const fetchedContent = Buffer.from(await res.arrayBuffer());
    console.log(`=> Fetched ${fetchedContent.length} bytes.`);

    if (res.status === 200 && fetchedContent.equals(tc.content)) {
      console.log(`=> SUCCESS: File uploaded to R2, signed URL generated, and content retrieved matches exactly!`);
    } else {
      console.error(`=> FAILURE: Mismatch or non-200 status!`);
      process.exit(1);
    }
  }

  console.log('\n--- ALL R2 END-TO-END TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
