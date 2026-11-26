import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { storeTeamPhoto } from '../server/teamPhotos.js';

const image = await sharp({ create: { width: 20, height: 30, channels: 3, background: '#2456ad' } }).png().toBuffer();

test('portrait : stockage Supabase isolé, clé serveur et image WebP normalisée', async () => {
  const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_KEY, fetch: globalThis.fetch };
  process.env.SUPABASE_URL = 'https://storage.example.test/'; process.env.SUPABASE_KEY = 'test-server-only';
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, ...options }); return { ok: true }; };
  try {
    const url = await storeTeamPhoto(image, 'image/png');
    assert.match(url, /^https:\/\/storage.example.test\/storage\/v1\/object\/public\/job-by-blaise-team\/[a-f0-9-]{36}\.webp$/);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].headers.Authorization, 'Bearer test-server-only');
    assert.equal(calls[0].headers['Content-Type'], 'image/webp');
    assert.equal(calls[0].headers['x-upsert'], 'false');
    assert.equal((await sharp(calls[0].body).metadata()).format, 'webp');
    assert.ok(!url.includes('test-server-only'));
    for (const failingFetch of [async () => ({ ok: false }), async () => { throw new Error('upstream sensitive detail'); }]) {
      globalThis.fetch = failingFetch;
      await assert.rejects(storeTeamPhoto(image, 'image/png'), err => err.status === 502 && !err.message.includes('sensitive'));
    }
  } finally {
    globalThis.fetch = saved.fetch;
    for (const [key, value] of [['SUPABASE_URL', saved.url], ['SUPABASE_KEY', saved.key]]) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

test('portrait : limites de décodage et formats dangereux refusés avant stockage', async () => {
  const huge = await sharp({ create: { width: 5000, height: 4001, channels: 3, background: '#fff' } }).png().toBuffer();
  await assert.rejects(storeTeamPhoto(huge, 'image/png'), err => err.status === 400);
  await assert.rejects(storeTeamPhoto(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>'), 'image/png'), err => err.status === 400);
  await assert.rejects(storeTeamPhoto(Buffer.from('gif'), 'image/gif'), err => err.status === 415);
});
