import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function run(source, extraEnv = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'jbb-publication-'));
  try {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: process.cwd(), encoding: 'utf8', timeout: 15000, env: { ...process.env, JBB_DB_DIR: directory, JBB_SEED_DEMO: '0', NODE_ENV: 'test', SUPABASE_URL: '', SUPABASE_KEY: '', VERCEL: '1', VERCEL_ENV: 'preview', ...extraEnv } });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    return result.stdout;
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('démarrage sans auto-seed : base vide et aucune offre fictive après redémarrage', async () => {
  await run(`import assert from 'node:assert/strict'; await import('./server/routes.js'); const {db, initSchema} = await import('./server/db.js');
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM jobs').get()).n, 0);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users').get()).n, 0);
    await initSchema();
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM jobs').get()).n, 0);`);
});

test('migration SQLite additive : ancienne offre conservée mais non approuvée', async () => {
  await run(`import assert from 'node:assert/strict'; import {DatabaseSync} from 'node:sqlite'; import path from 'node:path';
    const old = new DatabaseSync(path.join(process.env.JBB_DB_DIR, 'jobbyblaise.db'));
    old.exec("CREATE TABLE jobs (id INTEGER PRIMARY KEY, title TEXT, city TEXT, is_active INTEGER DEFAULT 1); INSERT INTO jobs (title) VALUES ('Ancienne offre');");old.close();
    const {db, initSchema} = await import('./server/db.js');await initSchema();await initSchema();
    const row = await db.prepare('SELECT * FROM jobs WHERE id = 1').get();
    assert.equal(row.title, 'Ancienne offre'); assert.equal(row.is_active, 1); assert.equal(row.published_by_admin, 0);`);
});

test('la production refuse le seed et ne bascule pas silencieusement sur une fausse base', async () => {
  await run(`import assert from 'node:assert/strict'; const {seed} = await import('./server/seed.js');
    await assert.rejects(seed({force:true}), /réservé à une base SQLite locale/);`, { NODE_ENV: 'production' });
  await run(`import assert from 'node:assert/strict';globalThis.fetch = async () => {throw new Error('panne simulée');};
    const {initSchema, backendName} = await import('./server/db.js');
    await assert.rejects(initSchema(), /migration publication manquante/);assert.equal(backendName(), 'supabase');`, { SUPABASE_URL: 'https://example.invalid', SUPABASE_KEY: 'test-only', NODE_ENV: 'production' });
});
