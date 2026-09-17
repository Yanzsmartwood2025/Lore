import assert from 'node:assert/strict';
import { test } from 'node:test';
import Module from 'node:module';
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

// Stub 'server-only' package so it doesn't throw when running directly under Node.js test harness
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'server-only') return {};
  return originalRequire.apply(this, arguments);
};

// Ensure test variables if not provided
process.env.ADMIN_UPLOAD_KEY = process.env.ADMIN_UPLOAD_KEY || 'test_admin_upload_key';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lore-test-proj.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Intercept global fetch for Supabase calls in test harness
const originalFetch = globalThis.fetch;
const dbAssets = new Map();

globalThis.fetch = async function (url, options = {}) {
  const urlStr = String(url);
  if (urlStr.includes('lore-test-proj.supabase.co')) {
    const method = options.method || 'GET';
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      const id = `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const record = { id, created_at: new Date().toISOString(), ...body };
      dbAssets.set(id, record);
      return new Response(JSON.stringify(record), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (method === 'GET') {
      const match = urlStr.match(/id=eq\.([^&]+)/);
      const assetId = match ? match[1] : null;
      const record = dbAssets.get(assetId);
      if (record) {
        return new Response(JSON.stringify(record), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return originalFetch.apply(this, arguments);
};

async function main() {
  const { POST: uploadHandler } = await import('../src/app/api/media/upload/route.ts');
  const { GET: downloadHandler } = await import('../src/app/api/media/[id]/route.ts');

  test('POST /api/media/upload rejects unauthenticated requests', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'photo.jpg');

    const req = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await uploadHandler(req);
    assert.equal(res.status, 401);
  });

  test('POST /api/media/upload uploads photo to fotos/{persona}/... and verifies signed URL retrieval', async () => {
    const photoBlob = new Blob(['REAL_JPG_CONTENT_VIA_API'], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', photoBlob, 'my-photo.jpg');
    formData.append('persona', 'lore');
    formData.append('isVip', 'false');

    const req = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: {
        'x-admin-key': process.env.ADMIN_UPLOAD_KEY,
      },
      body: formData,
    });

    const res = await uploadHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.asset.r2_key.startsWith('fotos/lore/'));
    assert.ok(json.asset.r2_key.endsWith('.jpg'));
    assert.equal(json.asset.mime_type, 'image/jpeg');

    // Verify download endpoint
    const getReq = new Request(`http://localhost/api/media/${json.asset.id}`, {
      method: 'GET',
      headers: {
        'x-admin-key': process.env.ADMIN_UPLOAD_KEY,
      },
    });

    const getRes = await downloadHandler(getReq, { params: Promise.resolve({ id: json.asset.id }) });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.ok(getJson.url.includes(`https://${process.env.R2_BUCKET_NAME || 'lore-media'}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/fotos/lore/`));
    assert.equal(getJson.expiresIn, 300);

    // Test downloading from R2 via generated URL
    const r2Fetch = await fetch(getJson.url);
    assert.equal(r2Fetch.status, 200);
    const fetchedText = await r2Fetch.text();
    assert.equal(fetchedText, 'REAL_JPG_CONTENT_VIA_API');
  });

  test('POST /api/media/upload uploads video to videos/{persona}/... and verifies signed URL retrieval', async () => {
    const videoBlob = new Blob(['REAL_MP4_CONTENT_VIA_API'], { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', videoBlob, 'clip.mp4');
    formData.append('persona', 'camila');

    const req = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: {
        'x-admin-key': process.env.ADMIN_UPLOAD_KEY,
      },
      body: formData,
    });

    const res = await uploadHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.asset.r2_key.startsWith('videos/camila/'));
    assert.ok(json.asset.r2_key.endsWith('.mp4'));

    // Test downloading from R2 via generated URL
    const getReq = new Request(`http://localhost/api/media/${json.asset.id}`, {
      method: 'GET',
      headers: {
        'x-admin-key': process.env.ADMIN_UPLOAD_KEY,
      },
    });

    const getRes = await downloadHandler(getReq, { params: Promise.resolve({ id: json.asset.id }) });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.ok(getJson.url.includes(`https://${process.env.R2_BUCKET_NAME || 'lore-media'}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/videos/camila/`));

    const r2Fetch = await fetch(getJson.url);
    assert.equal(r2Fetch.status, 200);
    const fetchedText = await r2Fetch.text();
    assert.equal(fetchedText, 'REAL_MP4_CONTENT_VIA_API');
  });

  test('POST /api/media/upload uploads music to musica/... and verifies signed URL retrieval', async () => {
    const musicBlob = new Blob(['REAL_MP3_CONTENT_VIA_API'], { type: 'audio/mpeg' });
    const formData = new FormData();
    formData.append('file', musicBlob, 'song.mp3');

    const req = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: {
        'x-admin-key': process.env.ADMIN_UPLOAD_KEY,
      },
      body: formData,
    });

    const res = await uploadHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.asset.r2_key.startsWith('musica/'));
    assert.ok(json.asset.r2_key.endsWith('.mp3'));

    // Test downloading from R2 via generated URL
    const getReq = new Request(`http://localhost/api/media/${json.asset.id}`, {
      method: 'GET',
      headers: {
        'x-admin-key': process.env.ADMIN_UPLOAD_KEY,
      },
    });

    const getRes = await downloadHandler(getReq, { params: Promise.resolve({ id: json.asset.id }) });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.ok(getJson.url.includes(`https://${process.env.R2_BUCKET_NAME || 'lore-media'}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/musica/`));

    const r2Fetch = await fetch(getJson.url);
    assert.equal(r2Fetch.status, 200);
    const fetchedText = await r2Fetch.text();
    assert.equal(fetchedText, 'REAL_MP3_CONTENT_VIA_API');
  });

  test('GET /api/media/[id] returns 404 for non-existent asset ID', async () => {
    const getReq = new Request('http://localhost/api/media/non-existent-asset-id', {
      method: 'GET',
      headers: {
        'x-admin-key': process.env.ADMIN_UPLOAD_KEY,
      },
    });

    const getRes = await downloadHandler(getReq, { params: Promise.resolve({ id: 'non-existent-asset-id' }) });
    assert.equal(getRes.status, 404);
  });
}

main().catch(console.error);
