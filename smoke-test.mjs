// Smoke test — Job by blaise : 13 endpoints critiques avec payloads réalistes.
// Usage : node smoke-test.mjs   (le serveur doit tourner sur :3001, une base seedée)
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:3001';
const TOKEN_FILE = '/tmp/jobbyblaise-smoke-token.json';

function bodyFor(method, path, payload) {
  if (method === 'GET' || method === 'HEAD') return undefined;
  const stubs = {
    'POST /api/auth/register': {
      fullName: 'Fatoumata Diallo', email: `smoke-${Date.now()}@jobbyblaise.com`,
      phone: '+224 622 000 111', city: 'Conakry', password: 'smoketest123',
    },
    'POST /api/auth/login': { email: 'mamadou@jobbyblaise.com', password: 'demo1234' },
    'POST /api/profile': { fullName: 'Mamadou Diallo', phone: '+224 621 44 55 66', city: 'Conakry' },
    'PUT /api/profile': {
      fullName: 'Mamadou Diallo', phone: '+224 621 44 55 66', city: 'Conakry',
      title: 'Assistant Administratif', bio: 'Organisé et rigoureux, 4 ans d’expérience en PME à Conakry.',
      education: 'Bac+2', experienceYears: 4,
      skills: ['Excel', 'Organisation', 'Communication', 'Bureau', 'Gestion'],
      jobTypes: ['Temps plein', 'CDD'], preferredCities: ['Conakry'],
      cv: {
        summary: 'Assistant administratif confirmé, maîtrise Excel et gestion de la relation client.',
        experiences: [{ role: 'Assistant administratif', org: 'SARL Camara & Fils', period: '2022 – 2025', detail: 'Suivi des commandes et gestion des archives.' }],
        education: [{ level: 'BTS Gestion', org: 'Institut Supérieur de Commerce', period: '2019 – 2021' }],
      },
    },
    'POST /api/applications': { jobId: 1, coverLetter: 'Motivé par ce poste, je souhaite contribuer à vos équipes.' },
    'PUT /api/alerts': { enabled: true, phone: '+224 621 44 55 66', sendTime: '07:00', cities: ['Conakry'], contracts: ['Temps plein'], keywords: ['assistant'] },
    'POST /api/alerts/read': {},
    'POST /api/alerts/test': {},
  };
  return stubs[`${method} ${path}`] ?? payload ?? {};
}

const endpoints = [
  ['POST', '/api/auth/register'],
  ['POST', '/api/auth/login'],
  ['GET', '/api/jobs'],
  ['GET', '/api/jobs/meta'],
  ['GET', '/api/jobs/1'],
  ['GET', '/api/companies'],
  ['GET', '/api/companies/1'],
  ['GET', '/api/dashboard'],
  ['PUT', '/api/profile'],
  ['POST', '/api/applications'],
  ['GET', '/api/advice'],
  ['GET', '/api/advice/1'],
  ['PUT', '/api/alerts'],
  ['POST', '/api/alerts/test'],
  ['GET', '/api/stats'],
];

let token = '';
if (process.env.WITH_TOKEN === '1') {
  try {
    token = JSON.parse(readFileSync(TOKEN_FILE, 'utf8')).token || '';
  } catch {}
  if (!token) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'mamadou@jobbyblaise.com', password: 'demo1234' }),
    });
    const data = await res.json();
    token = data.token;
    writeFileSync(TOKEN_FILE, JSON.stringify({ token }));
  }
}

let pass = 0;
let fail = 0;

for (const [method, path] of endpoints) {
  try {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const payload = bodyFor(method, path);
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const text = await res.text();
    let ok = res.ok;
    if (!ok && res.status === 409 && path === '/api/applications') {
      // déjà postulé à l'offre 1 = l'endpoint fonctionne (idempotent)
      ok = true;
      console.log(`✓ ${method} ${path} → 409 (déjà postulé, idempotent)`);
    }
    if (!ok && token && res.status === 401) {
      // token expiré onboarding : on retente une fois via login
      const r2 = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'mamadou@jobbyblaise.com', password: 'demo1234' }),
      });
      if (r2.ok) {
        token = (await r2.json()).token;
        writeFileSync(TOKEN_FILE, JSON.stringify({ token }));
        const h2 = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
        const p2 = bodyFor(method, path);
        const res2 = await fetch(`${BASE}${path}`, { method, headers: h2, body: p2 === undefined ? undefined : JSON.stringify(p2) });
        ok = res2.ok;
      }
    }
    if (ok) pass++;
    else {
      fail++;
      console.error(`✗ ${method} ${path} → HTTP ${res.status} :: ${text.slice(0, 180)}`);
      continue;
    }
    // petite validation de contenu
    const j = text ? JSON.parse(text) : {};
    if (path === '/api/jobs' && !(j.jobs || []).length) throw new Error('jobs vide');
    if (path === '/api/jobs/meta' && !(j.cities || []).length) throw new Error('meta vide');
    if (path === '/api/jobs/1' && !j.job) throw new Error('job manquant');
    if (path === '/api/companies' && !(j.companies || []).length) throw new Error('companies vide');
    if (path === '/api/advice' && !(j.advice || []).length) throw new Error('advice vide');
    if (path === '/api/dashboard' && !j.greeting) throw new Error('dashboard incomplet');
    if (path === '/api/profile' && typeof j.completion?.percent !== 'number') throw new Error('completion manquante');
    console.log(`✓ ${method} ${path} → 200`);
  } catch (e) {
    fail++;
    console.error(`✗ ${method} ${path} :: ${e.message}`);
  }
}

console.log(`\nSmoke: ${pass} OK, ${fail} échec(s) sur ${endpoints.length} endpoints.`);
process.exit(fail ? 1 : 0);
