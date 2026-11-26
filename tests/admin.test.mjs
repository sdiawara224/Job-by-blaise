import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { isAdminUser } from '../server/auth.js';
import sharp from 'sharp';

const directory = await mkdtemp(join(tmpdir(), 'jbb-admin-test-'));
const secret = randomBytes(48).toString('hex');
const child = spawn(process.execPath, ['--input-type=module', '-e', `
  const { default: app } = await import('./server/index.js');
  const { db } = await import('./server/db.js');
  const { hashPassword } = await import('./server/auth.js');
  // Simule aussi une ancienne offre active, jamais validée dans le back-office.
  await db.prepare('UPDATE jobs SET is_active = 1 WHERE id = 1').run();
  await db.prepare('INSERT INTO users (email, password_hash, full_name, city) VALUES (?, ?, ?, ?)').run('admin@example.com', hashPassword('Admin-test-password-123'), 'Administrateur', 'Conakry');
  const server = app.listen(0, '127.0.0.1', () => console.log('TEST_PORT:' + server.address().port));
`], { cwd: process.cwd(), env: { ...process.env, VERCEL: '1', VERCEL_ENV: 'preview', NODE_ENV: 'test', JBB_SEED_DEMO: '1', JBB_DB_DIR: directory, JBB_SECRET: secret, ADMIN_EMAILS: 'admin@example.com,reserved@example.com', SUPABASE_URL: '', SUPABASE_KEY: '' } });
let logs = '';
child.stderr.on('data', (d) => { logs += d; });
const port = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => { child.kill(); reject(new Error(`Server timeout: ${logs}`)); }, 15000);
  child.stdout.on('data', (d) => { logs += d; const found = logs.match(/TEST_PORT:(\d+)/); if (found) { clearTimeout(timer); resolve(Number(found[1])); } });
  child.once('exit', () => { clearTimeout(timer); reject(new Error(logs)); });
});
async function request(path, { token, method = 'GET', body, rawType } = {}) {
  const res = await fetch(`http://127.0.0.1:${port}/api${path}`, { method, headers: { 'Content-Type': rawType || 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: rawType ? body : body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json() };
}
const admin = (await request('/auth/admin/login', { method: 'POST', body: { email: 'admin@example.com', password: 'Admin-test-password-123' } })).data;
const candidate = (await request('/auth/login', { method: 'POST', body: { email: 'mamadou@jobbyblaise.com', password: 'demo1234' } })).data;
const adminReq = (path, options) => request(`/admin${path}`, { token: admin.token, ...options });

test.after(async () => { const stopped = new Promise((resolve) => child.once('exit', resolve)); child.kill(); await stopped; await rm(directory, { recursive: true, force: true }); });

test('administration fermée sans secret robuste et sans liste explicite', () => {
  const savedSecret = process.env.JBB_SECRET, savedEmails = process.env.ADMIN_EMAILS;
  try {
    process.env.ADMIN_EMAILS = 'admin@example.com'; delete process.env.JBB_SECRET;
    assert.equal(isAdminUser({ email: 'admin@example.com' }), false);
    process.env.JBB_SECRET = secret;
    assert.equal(isAdminUser({ email: 'ADMIN@example.com' }), true);
    assert.equal(isAdminUser({ email: 'mamadou@jobbyblaise.com' }), false);
    delete process.env.ADMIN_EMAILS;
    assert.equal(isAdminUser({ email: 'admin@example.com' }), false);
  } finally {
    if (savedSecret === undefined) delete process.env.JBB_SECRET; else process.env.JBB_SECRET = savedSecret;
    if (savedEmails === undefined) delete process.env.ADMIN_EMAILS; else process.env.ADMIN_EMAILS = savedEmails;
  }
});
test('authentification et autorisation serveur sur chaque ressource', async () => {
  assert.equal(admin.user.isAdmin, true);
  assert.equal(candidate.user.isAdmin, false);
  for (const path of ['/summary', '/options', '/content', '/team', '/jobs', '/companies', '/advice', '/users', '/applications', '/alerts', '/sms']) {
    assert.equal((await request(`/admin${path}`)).status, 401, path);
    assert.equal((await request(`/admin${path}`, { token: candidate.token })).status, 403, path);
    assert.equal((await adminReq(path)).status, 200, path);
  }
  for (const method of ['POST', 'PUT', 'DELETE']) {
    assert.equal((await request('/admin/jobs/1', { token: candidate.token, method, body: { is_active: 0 } })).status, 403);
  }
});
test('inscription publique ne peut pas créer un administrateur réservé', async () => {
  const r = await request('/auth/register', { method: 'POST', body: { email: 'reserved@example.com', password: 'test12345678', fullName: 'Usurpation', isAdmin: true } });
  assert.equal(r.status, 403);
});
test('listes paginées, recherche et absence de secrets', async () => {
  const jobs = await adminReq('/jobs');
  assert.equal(jobs.data.items.length, 20); assert.equal(jobs.data.total, 60);
  const filtered = await adminReq('/jobs?q=introuvable-xyz'); assert.equal(filtered.data.total, 0);
  const users = await adminReq('/users'); assert.ok(users.data.items.length > 0);
  assert.ok(users.data.items.every((u) => !('password_hash' in u)));
  assert.equal((await adminReq('/unknown')).status, 404);
  assert.equal((await adminReq('/users/1', { method: 'PUT', body: { isAdmin: true } })).status, 400);
  assert.equal((await adminReq('/users/1', { method: 'DELETE' })).status, 405);
});
test('publication : les démonstrations et offres non validées sont absentes de tous les accès publics', async () => {
  assert.equal((await request('/jobs')).data.total, 0);
  assert.equal((await request('/jobs/1')).status, 404);
  assert.equal((await request('/stats')).data.jobs, 0);
  assert.equal((await request('/stats')).data.cities, 0);
  assert.deepEqual((await request('/jobs/meta')).data.cities, []);
  assert.ok((await request('/companies')).data.companies.every(company => company.jobCount === 0));
  assert.deepEqual((await request('/companies/1')).data.jobs, []);
  assert.deepEqual((await request('/jobs/recommended', { token: candidate.token })).data.jobs, []);
  assert.deepEqual((await request('/dashboard', { token: candidate.token })).data.recommended, []);
  assert.equal((await request('/applications', { token: candidate.token, method: 'POST', body: { jobId: 1 } })).status, 404);
  assert.equal((await adminReq('/jobs?status=1')).data.total, 0);
  assert.equal((await adminReq('/jobs?status=0')).data.total, 60);
  // Modifier le titre d’une ancienne offre n’est pas une publication.
  assert.equal((await adminReq('/jobs/1', { method: 'PUT', body: { title: 'Assistant Administratif' } })).status, 200);
  assert.equal((await request('/jobs/1')).status, 404);
  assert.equal((await adminReq('/jobs/1', { method: 'PUT', body: { published_by_admin: 1 } })).status, 400);
});
test('CRUD entreprise/offre et archive publique sans casser les références', async () => {
  const company = await adminReq('/companies', { method: 'POST', body: { name: 'Entreprise test admin', sector: 'Tests', city: 'Conakry' } });
  assert.equal(company.status, 201); const companyId = company.data.id;
  const created = await adminReq('/jobs', { method: 'POST', body: { title: 'Offre test admin', company_id: companyId, city: 'Labé', country: 'Guinée', contract: 'CDI', domain: 'Tests', skills: ['JavaScript'], is_active: 0 } });
  assert.equal(created.status, 201); const id = created.data.id;
  assert.equal((await request(`/jobs/${id}`)).status, 404);
  assert.equal((await adminReq(`/jobs/${id}`, { method: 'PUT', body: { is_active: 1 } })).status, 200);
  assert.equal((await request(`/jobs/${id}`)).data.job.title, 'Offre test admin');
  assert.equal((await adminReq(`/companies/${companyId}`, { method: 'DELETE' })).status, 409);
  assert.equal((await adminReq(`/jobs/${id}`, { method: 'PUT', body: { salary_min: 200, salary_max: 100 } })).status, 400);
  assert.equal((await adminReq(`/jobs/${id}`, { method: 'PUT', body: { company_id: 999999 } })).status, 400);
  assert.equal((await adminReq(`/jobs/${id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await adminReq(`/companies/${companyId}`, { method: 'DELETE' })).status, 200);
});
test('publication explicite, modifications et archivage suivent la même source de vérité', async () => {
  const companyId = (await adminReq('/options')).data.companies[0].id;
  const body = { title: 'Offre de validation', company_id: companyId, city: 'Ville test', country: 'Guinée', contract: 'CDD', domain: 'Domaine test' };
  const created = await adminReq('/jobs', { method: 'POST', body });
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal((await request(`/jobs/${id}`)).status, 404); // brouillon par défaut côté serveur
  assert.equal((await request('/admin/jobs', { method: 'POST', body })).status, 401);
  assert.equal((await request('/admin/jobs', { token: candidate.token, method: 'POST', body })).status, 403);
  await adminReq(`/jobs/${id}`, { method: 'PUT', body: { is_active: 1 } });
  assert.equal((await request('/jobs')).data.total, 1);
  assert.equal((await request('/stats')).data.jobs, 1);
  assert.deepEqual((await request('/jobs/meta')).data.cities, ['Ville test']);
  assert.equal((await request(`/companies/${companyId}`)).data.jobs[0].id, id);
  assert.equal((await adminReq('/summary')).data.stats.activeJobs, 1);
  await adminReq(`/jobs/${id}`, { method: 'PUT', body: { title: 'Titre corrigé' } });
  assert.equal((await request(`/jobs/${id}`)).data.job.title, 'Titre corrigé');
  await adminReq(`/jobs/${id}`, { method: 'PUT', body: { is_active: 0 } });
  assert.equal((await request('/jobs')).data.total, 0);
  assert.equal((await request(`/jobs/${id}`)).status, 404);
  assert.equal((await request('/stats')).data.jobs, 0);
  assert.deepEqual((await request(`/companies/${companyId}`)).data.jobs, []);
  await adminReq(`/jobs/${id}`, { method: 'DELETE' });
});
test('conseils éditables avec validation et conflit de doublon', async () => {
  const body = { title: 'Conseil test admin', category: 'CV', content: '**Bonjour**', minutes: 3 };
  const created = await adminReq('/advice', { method: 'POST', body }); assert.equal(created.status, 201);
  assert.equal((await adminReq('/advice', { method: 'POST', body })).status, 409);
  assert.equal((await request(`/advice/${created.data.id}`)).data.article.content, '**Bonjour**');
  assert.equal((await adminReq(`/advice/${created.data.id}`, { method: 'PUT', body: { color: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await adminReq(`/advice/${created.data.id}`, { method: 'PUT', body: { content: '   ' } })).status, 400);
  assert.equal((await adminReq(`/advice/${created.data.id}`, { method: 'DELETE' })).status, 200);
});
test('candidatures : statuts contrôlés et protection des offres liées', async () => {
  const rows = (await adminReq('/applications')).data.items; assert.ok(rows.length);
  const row = rows[0];
  assert.equal((await adminReq(`/applications/${row.id}`, { method: 'PUT', body: { status: 'En cours' } })).status, 200);
  assert.equal((await adminReq(`/applications/${row.id}`, { method: 'PUT', body: { status: 'Invalide' } })).status, 400);
  assert.equal((await adminReq(`/jobs/${row.job_id}`, { method: 'DELETE' })).status, 409);
});
test('alertes : listes et heure valides, journal non réécrivable', async () => {
  const row = (await adminReq('/alerts')).data.items[0]; assert.ok(row);
  assert.equal((await adminReq(`/alerts/${row.user_id}`, { method: 'PUT', body: { enabled: 0, send_time: '08:30', keywords: ['assistant'] } })).status, 200);
  assert.equal((await adminReq(`/alerts/${row.user_id}`, { method: 'PUT', body: { send_time: '28:99' } })).status, 400);
  assert.equal((await adminReq('/sms/1', { method: 'PUT', body: { body: 'altéré' } })).status, 405);
});
test('édition des textes persistée et exposée au site public', async () => {
  const r = await adminReq('/content', { method: 'PUT', body: { content: { heroSubtitle: 'Votre avenir commence ici.' } } });
  assert.equal(r.status, 200);
  const publicContent = await request('/content'); assert.equal(publicContent.data.content.heroSubtitle, 'Votre avenir commence ici.');
  assert.ok(publicContent.data.content.cvTitle); assert.ok(publicContent.data.updatedAt);
  assert.equal((await adminReq('/content', { method: 'PUT', body: { content: { unknown: 'test' } } })).status, 400);
  assert.equal((await adminReq('/content', { method: 'PUT', body: { content: { contactEmail: 'invalid' } } })).status, 400);
});

test('recherche relationnelle : candidat, e-mail, poste et entreprise', async () => {
  const all = (await adminReq('/applications')).data;
  assert.ok(all.total > 0);
  const first = all.items[0];
  for (const q of ['Mamadou', 'mamadou@jobbyblaise.com', first.job_title]) {
    const result = await adminReq(`/applications?q=${encodeURIComponent(q)}`);
    assert.equal(result.status, 200);
    assert.ok(result.data.total > 0, q);
  }
  await adminReq(`/jobs/${first.job_id}`, { method: 'PUT', body: { is_active: 1 } });
  const job = (await request(`/jobs/${first.job_id}`)).data.job;
  assert.ok((await adminReq(`/applications?q=${encodeURIComponent(job.company.name)}`)).data.items.some((a) => a.id === first.id));
  assert.ok((await adminReq(`/jobs?q=${encodeURIComponent(job.company.name)}`)).data.items.every((j) => j.company_name === job.company.name));
  assert.equal((await adminReq('/applications?q=personne-inconnue-xyz')).data.total, 0);
  assert.equal((await adminReq('/alerts?q=mamadou%40jobbyblaise.com')).data.total, 1);
  assert.ok((await adminReq('/sms?q=Mamadou')).data.total > 0);
});
test('tris fermés, pagination bornée et filtres d’alertes et de lecture', async () => {
  const oldest = (await adminReq('/companies?sort=oldest')).data.items;
  const newest = (await adminReq('/companies?sort=newest')).data.items;
  assert.ok(oldest[0].id < newest[0].id);
  const az = (await adminReq('/companies?sort=az')).data.items;
  const za = (await adminReq('/companies?sort=za')).data.items;
  assert.equal(az[0].id, za.at(-1).id);
  assert.equal((await adminReq('/jobs?page=999999')).data.page, 3);
  assert.equal((await adminReq('/jobs?sort=title%3BDROP%20TABLE%20users')).status, 400);
  assert.equal((await adminReq('/alerts?status=0')).data.total, 1);
  assert.equal((await adminReq('/alerts?status=1')).data.total, 0);
  for (const status of ['0', '1']) {
    const sms = (await adminReq(`/sms?status=${status}`)).data;
    assert.ok(sms.items.every((s) => Number(s.is_read) === Number(status)));
  }
});

test('accès temporaire : expiration serveur, date invalide refusée et échéance future autorisée', () => {
  const keys = ['JBB_SECRET', 'ADMIN_EMAILS', 'ADMIN_ACCESS_EXPIRES_AT'];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.JBB_SECRET = secret;
    process.env.ADMIN_EMAILS = 'admin@example.com';
    for (const expiry of ['incorrect', new Date(Date.now() - 1000).toISOString()]) {
      process.env.ADMIN_ACCESS_EXPIRES_AT = expiry;
      assert.equal(isAdminUser({ email: 'admin@example.com' }), false);
    }
    process.env.ADMIN_ACCESS_EXPIRES_AT = new Date(Date.now() + 60000).toISOString();
    assert.equal(isAdminUser({ email: 'admin@example.com' }), true);
    assert.equal(isAdminUser({ email: 'autre@example.com' }), false);
    delete process.env.ADMIN_ACCESS_EXPIRES_AT;
    assert.equal(isAdminUser({ email: 'admin@example.com' }), true);
  } finally {
    for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
});

test('inscription : types invalides refusés et adresse normalisée avant validation', async () => {
  for (const patch of [{ fullName: 42 }, { fullName: '   ' }, { password: { value: 'abcdef' } }, { email: ['candidate@example.com'] }]) {
    const result = await request('/auth/register', { method: 'POST', body: { email: 'validation@example.com', fullName: 'Validation', password: 'test123456', ...patch } });
    assert.equal(result.status, 400, JSON.stringify(patch));
  }
  const registered = await request('/auth/register', { method: 'POST', body: { email: '  NORMALIZED@example.com  ', fullName: '  Test Normalisation  ', password: 'test123456' } });
  assert.equal(registered.status, 201);
  assert.equal(registered.data.user.email, 'normalized@example.com');
  assert.equal(registered.data.user.fullName, 'Test Normalisation');
});

test('connexion : un mot de passe non textuel ne provoque pas d’erreur serveur', async () => {
  const result = await request('/auth/login', { method: 'POST', body: { email: 'mamadou@jobbyblaise.com', password: { value: 'demo1234' } } });
  assert.equal(result.status, 400);
});

test('profil : rejeter les valeurs qui cassent le matching sans modifier le profil', async () => {
  const before = (await request('/profile', { token: candidate.token })).data.profile;
  try {
    for (const body of [{ skills: [42] }, { preferredCities: [{}] }, { city: {} }, { fullName: '   ' }, { experienceYears: -1 }, { cv: { experiences: [null] } }]) {
      const result = await request('/profile', { token: candidate.token, method: 'PUT', body });
      assert.equal(result.status, 400, JSON.stringify(body));
    }
    assert.deepEqual((await request('/profile', { token: candidate.token })).data.profile, before);
    assert.equal((await request('/jobs/recommended', { token: candidate.token })).status, 200);
  } finally {
    await request('/profile', { token: candidate.token, method: 'PUT', body: before });
  }
});

test('alertes : heure réelle validée et mise à jour partielle sans effacer les préférences', async () => {
  const before = (await request('/alerts', { token: candidate.token })).data.settings;
  try {
    for (const body of [{ sendTime: '99:99' }, { sendTime: '12:60' }, { keywords: [null] }, { enabled: 'false' }]) {
      const result = await request('/alerts', { token: candidate.token, method: 'PUT', body });
      assert.equal(result.status, 400, JSON.stringify(body));
    }
    assert.equal((await request('/alerts', { token: candidate.token, method: 'PUT', body: { ...before, enabled: false, sendTime: '08:30', keywords: ['assistant'], cities: ['Conakry'], contracts: ['CDD'] } })).status, 200);
    assert.equal((await request('/alerts', { token: candidate.token, method: 'PUT', body: { phone: '+224 600 000 000' } })).status, 200);
    const settings = (await request('/alerts', { token: candidate.token })).data.settings;
    assert.equal(settings.enabled, false);
    assert.equal(settings.sendTime, '08:30');
    assert.deepEqual(settings.keywords, ['assistant']);
    assert.deepEqual(settings.cities, ['Conakry']);
    assert.deepEqual(settings.contracts, ['CDD']);
  } finally {
    await request('/alerts', { token: candidate.token, method: 'PUT', body: before });
  }
});


test('équipe : administration sécurisée, brouillons privés, ordre et changements persistés', async () => {
  const member = { id: 'membre-1', name: 'Personne de test', role: 'Fonction de test', bio: 'Présentation de test.', photoUrl: '/portraits/test.jpg', isPublished: false };
  assert.equal((await request('/admin/team', { method: 'PUT', body: { members: [member] } })).status, 401);
  assert.equal((await request('/admin/team', { method: 'PUT', token: candidate.token, body: { members: [member] } })).status, 403);
  assert.equal((await adminReq('/team', { method: 'PUT', body: { members: [member] } })).status, 200);
  assert.deepEqual((await request('/team')).data.members, []);
  const second = { ...member, id: 'membre-2', name: 'Autre personne de test', isPublished: true };
  await adminReq('/team', { method: 'PUT', body: { members: [second, { ...member, isPublished: true }] } });
  assert.deepEqual((await request('/team')).data.members.map(m => m.id), ['membre-2', 'membre-1']);
  assert.equal((await adminReq('/team')).data.members[1].name, member.name);
  assert.equal((await request('/content')).data.content.heroSubtitle, 'Votre avenir commence ici.');
  assert.ok(!JSON.stringify((await request('/content')).data).includes('Personne de test'));
  for (const bad of [{ ...member, photoUrl: 'javascript:alert(1)' }, { ...member, photoUrl: '//example.com/image.jpg' }, { ...member, name: ' ' }, { ...member, isPublished: 'true' }, { ...member, unexpected: true }]) {
    assert.equal((await adminReq('/team', { method: 'PUT', body: { members: [bad] } })).status, 400);
  }
  assert.equal((await adminReq('/team', { method: 'PUT', body: { members: [member, member] } })).status, 400);
  assert.equal((await request('/team')).data.members.length, 2); // validation atomique
  await adminReq('/team', { method: 'PUT', body: { members: [] } });
  assert.deepEqual((await request('/team')).data.members, []);
});

test('connexion administration dédiée : valide les droits avant de délivrer un jeton', async () => {
  const denied = await request('/auth/admin/login', { method: 'POST', body: { email: 'mamadou@jobbyblaise.com', password: 'demo1234' } });
  assert.equal(denied.status, 403); assert.equal(denied.data.token, undefined);
  const invalid = await request('/auth/admin/login', { method: 'POST', body: { email: 'admin@example.com', password: 'incorrect' } });
  assert.equal(invalid.status, 401); assert.equal(invalid.data.token, undefined);
  const allowed = await request('/auth/admin/login', { method: 'POST', body: { email: 'admin@example.com', password: 'Admin-test-password-123' } });
  assert.equal(allowed.status, 200); assert.equal(allowed.data.user.isAdmin, true); assert.ok(allowed.data.token);
  assert.equal((await request('/auth/admin/login', { method: 'POST', body: { email: [], password: null } })).status, 400);
});


test('compte super administrateur : portail candidat et API candidat interdits', async () => {
  const denied = await request('/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: 'Admin-test-password-123' } });
  assert.equal(denied.status, 403);
  assert.equal(denied.data.loginUrl, '/admin/connexion');
  assert.equal(denied.data.token, undefined);
  assert.equal(admin.user.role, 'super_admin');
  assert.equal(candidate.user.role, 'client');
  for (const path of ['/dashboard', '/profile', '/applications', '/alerts', '/jobs/recommended']) {
    assert.equal((await request(path, { token: admin.token })).status, 403, path);
  }
  assert.equal((await request('/profile', { token: admin.token, method: 'PUT', body: { fullName: 'Non' } })).status, 403);
  assert.equal((await request('/auth/me', { token: admin.token })).data.user.role, 'super_admin');
  const users = (await adminReq('/users')).data.items;
  assert.equal(users.find(u => u.email === 'admin@example.com').role, 'super_admin');
  assert.equal(users.find(u => u.email === 'mamadou@jobbyblaise.com').role, 'client');
  assert.ok(users.every(u => !('password_hash' in u)));
  const id = users.find(u => u.email === 'mamadou@jobbyblaise.com').id;
  assert.equal((await adminReq(`/users/${id}`, { method: 'PUT', body: { role: 'super_admin' } })).status, 400);
  assert.equal((await adminReq('/users?q=admin%40example.com')).data.total, 1);
});


test('utilisateurs : catégories filtrées avant total, recherche et pagination', async () => {
  const admins = await adminReq('/users?role=super_admin');
  assert.equal(admins.status, 200);
  assert.equal(admins.data.total, 1);
  assert.deepEqual(admins.data.items.map(u => u.email), ['admin@example.com']);
  assert.equal((await adminReq('/users?role=super_admin&q=mamadou')).data.total, 0);
  assert.equal((await adminReq('/users?role=client&q=admin%40example.com')).data.total, 0);
  assert.equal((await adminReq('/users?role=super_admin%27%3B--')).status, 400);
  assert.equal((await request('/admin/users?role=super_admin', { token: candidate.token })).status, 403);
  // Plus d’une page de clients : le compte admin ne doit jamais se glisser dans une page.
  for (let i = 0; i < 23; i++) {
    assert.equal((await request('/auth/register', { method: 'POST', body: { email: `pagination-${i}@example.com`, password: 'test-pagination-123', fullName: `Abonné ${i}` } })).status, 201);
  }
  const first = (await adminReq('/users?role=client&sort=oldest')).data;
  const second = (await adminReq('/users?role=client&sort=oldest&page=2')).data;
  assert.equal(first.items.length, 20);
  assert.equal(first.total, second.total);
  assert.equal(first.items.length + second.items.length, first.total);
  assert.ok([...first.items, ...second.items].every(u => u.role === 'client' && !('password_hash' in u)));
  const matching = (await adminReq('/users?role=client&q=pagination-&sort=az')).data;
  assert.equal(matching.total, 23);
  assert.equal(matching.items.length, 20);
  const stillAdmins = (await adminReq('/users?role=super_admin&page=99')).data;
  assert.equal(stillAdmins.total, 1);
  assert.equal(stillAdmins.page, 1);
});


test('notifications : changement effectif, compteurs cohérents, isolation et lecture bornée', async () => {
  const owner = (await request('/auth/register', { method: 'POST', body: { email: 'notified@example.com', fullName: 'Abonné notifié', password: 'test-notifications-123' } })).data;
  const own = (path, options) => request(path, { token: owner.token, ...options });
  const activity = async () => (await own('/activity')).data;
  assert.equal((await request('/activity')).status, 401);
  assert.equal((await request('/activity', { token: admin.token })).status, 403);
  await own('/alerts', { method: 'PUT', body: { enabled: false } });
  await adminReq('/jobs/60', { method: 'PUT', body: { is_active: 1 } });
  const app = await own('/applications', { method: 'POST', body: { jobId: 60 } });
  assert.equal(app.status, 201);
  const id = app.data.id;
  assert.equal((await activity()).notifications.length, 0);
  assert.equal((await activity()).stats.pending, 1);
  const change = status => adminReq(`/applications/${id}`, { method: 'PUT', body: { status } });
  assert.equal((await change('En cours')).status, 200);
  const progress = await activity();
  assert.equal(progress.unreadNotifications, 1);
  assert.equal(progress.stats.inProgress, 1);
  assert.equal(progress.notifications[0].oldStatus, 'En attente');
  assert.equal(progress.notifications[0].newStatus, 'En cours');
  assert.ok(progress.notifications[0].title);
  assert.equal(progress.unreadSms, 0); // les notifications ne sont pas des SMS
  assert.equal((await change('En cours')).status, 200);
  assert.equal((await activity()).notifications.length, 1);
  assert.equal((await change('Invalide')).status, 400);
  assert.equal((await request(`/admin/applications/${id}`, { method: 'PUT', token: owner.token, body: { status: 'Acceptée' } })).status, 403);
  await change('Acceptée');
  const accepted = await activity();
  assert.equal(accepted.stats.accepted, 1);
  assert.equal(accepted.stats.inProgress, 0);
  assert.equal(accepted.notifications.length, 2);
  assert.equal((await own('/dashboard')).data.applications.accepted, accepted.stats.accepted);
  assert.deepEqual((await own('/applications')).data.stats, accepted.stats);
  const latestId = accepted.notifications[0].id;
  const other = (await request('/activity', { token: candidate.token })).data;
  assert.ok(!other.notifications.some(n => n.id === latestId));
  await request('/notifications/read', { token: candidate.token, method: 'POST', body: { ids: [latestId] } });
  assert.equal((await activity()).unreadNotifications, 2);
  assert.equal((await own('/notifications/read', { method: 'POST', body: { ids: [progress.notifications[0].id] } })).status, 200);
  assert.equal((await activity()).unreadNotifications, 1);
  await change('Refusée'); // arrive après l’affichage de latestId
  await own('/notifications/read', { method: 'POST', body: { upTo: latestId } });
  const rejected = await activity();
  assert.equal(rejected.unreadNotifications, 1);
  assert.equal(rejected.stats.accepted, 0);
  assert.equal(rejected.stats.total, 1);
  assert.equal(rejected.notifications[0].isRead, false);
  for (const body of [{}, { ids: [] }, { ids: ['1'] }, { upTo: -1 }, { ids: [1], user_id: owner.user.id }]) {
    assert.equal((await own('/notifications/read', { method: 'POST', body })).status, 400);
  }
  await own(`/applications/${id}`, { method: 'DELETE' });
  const withdrawn = await activity();
  assert.equal(withdrawn.stats.total, 0);
  assert.equal(withdrawn.notifications.length, 3);
  assert.ok(withdrawn.notifications.every(n => n.applicationId === null));
  assert.equal(withdrawn.notifications[0].newStatus, 'Refusée');
});


test('photos équipe : import sécurisé, réencodage, URL persistante et publication explicite', async () => {
  const image = await sharp({ create: { width: 1500, height: 1800, channels: 3, background: '#3366cc' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const upload = (token, body = image, rawType = 'image/jpeg') => request('/admin/team/photo', { token, method: 'POST', body, rawType });
  assert.equal((await upload(null)).status, 401);
  assert.equal((await upload(candidate.token)).status, 403);
  assert.equal((await upload(admin.token, Buffer.from('<svg></svg>'), 'image/svg+xml')).status, 415);
  assert.equal((await upload(admin.token, Buffer.from('not an image'), 'image/png')).status, 400);
  assert.equal((await upload(admin.token, image, 'image/png')).status, 400);
  assert.equal((await upload(admin.token, Buffer.alloc(3 * 1024 * 1024 + 1), 'image/png')).status, 413);
  const before = (await adminReq('/team')).data.members;
  const uploaded = await upload(admin.token);
  assert.equal(uploaded.status, 201);
  assert.match(uploaded.data.photoUrl, /^\/api\/team\/photos\/[a-f0-9-]{36}\.webp$/);
  assert.deepEqual((await adminReq('/team')).data.members, before); // téléverser ne publie pas un profil
  const photo = await fetch(`http://127.0.0.1:${port}${uploaded.data.photoUrl}`);
  assert.equal(photo.status, 200);
  assert.match(photo.headers.get('content-type'), /image\/webp/);
  assert.equal(photo.headers.get('x-content-type-options'), 'nosniff');
  const metadata = await sharp(Buffer.from(await photo.arrayBuffer())).metadata();
  assert.equal(metadata.format, 'webp');
  assert.ok(metadata.width <= 1200 && metadata.height <= 1600);
  assert.equal(metadata.exif, undefined);
  const member = { id: 'uploaded-member', name: 'Profil importé', role: 'Fonction', bio: 'Présentation.', photoUrl: uploaded.data.photoUrl, isPublished: false };
  await adminReq('/team', { method: 'PUT', body: { members: [member] } });
  assert.equal((await adminReq('/team')).data.members[0].photoUrl, uploaded.data.photoUrl);
  assert.deepEqual((await request('/team')).data.members, []);
  await adminReq('/team', { method: 'PUT', body: { members: [{ ...member, isPublished: true }] } });
  assert.equal((await request('/team')).data.members[0].photoUrl, uploaded.data.photoUrl);
  assert.equal((await request('/team/photos/invalid.webp')).status, 404);
  await adminReq('/team', { method: 'PUT', body: { members: before } });
});
