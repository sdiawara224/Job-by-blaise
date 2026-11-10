import express from 'express';
import { db, backendName } from './db.js';
import { isAdminUser } from './auth.js';
import { DEFAULT_CONTENT } from '../client/src/siteContent.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const text = (max = 300, required = false) => (v) => {
  if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw fail(`Texte ${required ? 'requis, ' : ''}${max} caractères maximum.`);
  return v.trim();
};
const integer = (min = 0, max = 100000000000) => (v) => {
  if (!['number', 'string'].includes(typeof v) || v === '' || !Number.isSafeInteger(Number(v)) || Number(v) < min || Number(v) > max) throw fail(`Nombre entier attendu entre ${min} et ${max}.`);
  return Number(v);
};
const choice = (values) => (v) => { if (!values.includes(v)) throw fail('Valeur non autorisée.'); return v; };
const color = (v) => { if (!/^#[0-9a-f]{6}$/i.test(v)) throw fail('Couleur hexadécimale attendue (#2E6BFF).'); return v; };
const list = (v) => {
  if (!Array.isArray(v) || v.length > 50 || v.some((x) => typeof x !== 'string' || x.length > 120)) throw fail('Liste invalide (50 éléments maximum).');
  return JSON.stringify(v.map((x) => x.trim()).filter(Boolean));
};
const time = (v) => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw fail('Heure invalide (HH:MM).'); return v; };

// Identifiants SQL exclusivement issus de cette liste interne, jamais de la requête.
const RESOURCES = {
  jobs: {
    table: 'jobs', search: ['title', 'city', 'domain'],
    fields: { title: text(180, true), company_id: integer(1), city: text(100, true), country: text(100, true), contract: text(80, true), domain: text(120, true), salary_min: integer(), salary_max: integer(), experience_min: integer(0, 60), education_min: text(100), description: text(20000), requirements: text(20000), skills: list, is_active: integer(0, 1) },
    required: ['title', 'company_id', 'city', 'country', 'contract', 'domain'], defaults: { salary_min: 0, salary_max: 0, experience_min: 0, education_min: '', description: '', requirements: '', skills: [], is_active: 1 },
  },
  companies: { table: 'companies', search: ['name', 'sector', 'city'], fields: { name: text(180, true), sector: text(120, true), city: text(100, true), description: text(10000), color, founded_year: integer(1800, new Date().getFullYear()), staff_size: text(100) }, required: ['name', 'sector', 'city'], defaults: { description: '', color: '#2E6BFF', founded_year: 2020, staff_size: '1 à 10 collaborateurs' } },
  advice: { table: 'advice', search: ['title', 'category', 'excerpt'], fields: { title: text(200, true), category: text(100, true), excerpt: text(1000), content: text(40000, true), minutes: integer(1, 120), color }, required: ['title', 'category', 'content'], defaults: { excerpt: '', minutes: 4, color: '#2E6BFF' } },
  users: { table: 'users', search: ['full_name', 'email', 'city'], fields: { full_name: text(180, true), phone: text(40), city: text(100, true), title: text(180), bio: text(5000), education: text(100), experience_years: integer(0, 60), skills: list }, select: 'id, full_name, email, phone, city, title, bio, education, experience_years, skills, cv, created_at', noCreate: true, noDelete: true },
  applications: { table: 'applications', search: ['status', 'cover_letter'], fields: { status: choice(['En attente', 'En cours', 'Acceptée', 'Refusée']) }, noCreate: true },
  alerts: { table: 'alert_settings', key: 'user_id', search: ['phone', 'send_time'], fields: { enabled: integer(0, 1), phone: text(40), send_time: time, keywords: list, cities: list, contracts: list }, noCreate: true, noDelete: true },
  sms: { table: 'sms_messages', search: ['body'], fields: {}, noCreate: true, noEdit: true },
};

export async function readSiteContent() {
  const row = await db.prepare('SELECT data, updated_at FROM site_content WHERE id = 1').get();
  let saved = {};
  try { saved = JSON.parse(row?.data || '{}'); } catch { /* contenu par défaut */ }
  return { content: { ...DEFAULT_CONTENT, ...saved }, updatedAt: row?.updated_at || null };
}

export function createAdminRouter() {
  const router = express.Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!isAdminUser(req.user)) return res.status(403).json({ error: 'Cet espace est réservé aux administrateurs autorisés.' });
    next();
  });
  router.get('/summary', wrap(async (req, res) => {
    const queries = {
      jobs: 'SELECT COUNT(*) AS n FROM jobs', activeJobs: 'SELECT COUNT(*) AS n FROM jobs WHERE is_active = 1',
      companies: 'SELECT COUNT(*) AS n FROM companies', users: 'SELECT COUNT(*) AS n FROM users',
      advice: 'SELECT COUNT(*) AS n FROM advice', applications: 'SELECT COUNT(*) AS n FROM applications',
      pending: "SELECT COUNT(*) AS n FROM applications WHERE status = 'En attente'",
      alerts: 'SELECT COUNT(*) AS n FROM alert_settings WHERE enabled = 1', sms: 'SELECT COUNT(*) AS n FROM sms_messages',
    };
    const stats = Object.fromEntries(await Promise.all(Object.entries(queries).map(async ([key, sql]) => [key, Number((await db.prepare(sql).get()).n)])));
    const recent = await db.prepare('SELECT a.id, a.status, a.created_at, u.full_name, j.title FROM applications a JOIN users u ON u.id = a.user_id JOIN jobs j ON j.id = a.job_id ORDER BY a.created_at DESC, a.id DESC LIMIT 5').all();
    res.json({ stats, recent, backend: backendName() });
  }));
  router.get('/options', wrap(async (req, res) => {
    res.json({ companies: await db.prepare('SELECT id, name FROM companies ORDER BY name').all() });
  }));
  router.get('/content', wrap(async (req, res) => res.json(await readSiteContent())));
  router.put('/content', wrap(async (req, res) => {
    const body = req.body?.content;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Contenu invalide.');
    const values = {};
    for (const key of Object.keys(body)) {
      if (!Object.hasOwn(DEFAULT_CONTENT, key)) throw fail('Champ éditorial inconnu.');
      values[key] = text(2000, true)(body[key]);
    }
    if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) throw fail('E-mail de contact invalide.');
    const current = await readSiteContent();
    await db.prepare('INSERT INTO site_content (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run(JSON.stringify({ ...current.content, ...values }));
    res.json(await readSiteContent());
  }));

  router.param('resource', (req, res, next, name) => {
    if (!Object.hasOwn(RESOURCES, name)) return res.status(404).json({ error: 'Ressource inconnue.' });
    req.resource = RESOURCES[name]; next();
  });
  router.get('/:resource', wrap(async (req, res) => {
    const r = req.resource, resource = req.params.resource;
    const requestedPage = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = 20;
    const q = String(req.query.q || '').trim().slice(0, 200);
    const joins = {
      jobs: ['t.*, c.name AS company_name', ' LEFT JOIN companies c ON c.id = t.company_id', ['c.name', 'c.sector']],
      applications: ['t.*, u.full_name, j.title AS job_title', ' LEFT JOIN users u ON u.id = t.user_id LEFT JOIN jobs j ON j.id = t.job_id LEFT JOIN companies c ON c.id = j.company_id', ['u.full_name', 'u.email', 'j.title', 'c.name']],
      alerts: ['t.*, u.full_name', ' LEFT JOIN users u ON u.id = t.user_id', ['u.full_name', 'u.email']],
      sms: ['t.*, u.full_name', ' LEFT JOIN users u ON u.id = t.user_id', ['u.full_name', 'u.email']],
    };
    const [select, join, relatedSearch = []] = joins[resource] || [r.select ? r.select.split(', ').map((f) => `t.${f}`).join(', ') : 't.*', ''];
    const clauses = [], params = [];
    if (q) {
      const columns = [...r.search.map((f) => `t.${f}`), ...relatedSearch];
      clauses.push(`(${columns.map((f) => `${f} LIKE ?`).join(' OR ')})`);
      params.push(...columns.map(() => `%${q}%`));
    }
    const statusColumns = { jobs: 'is_active', alerts: 'enabled', sms: 'is_read' };
    if (Object.hasOwn(statusColumns, resource) && ['0', '1'].includes(req.query.status)) {
      clauses.push(`t.${statusColumns[resource]} = ?`); params.push(Number(req.query.status));
    }
    if (resource === 'applications' && ['En attente', 'En cours', 'Acceptée', 'Refusée'].includes(req.query.status)) { clauses.push('t.status = ?'); params.push(req.query.status); }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const idColumn = `t.${r.key || 'id'}`;
    const dateColumn = { jobs: 't.posted_at', users: 't.created_at', applications: 't.created_at', alerts: 't.updated_at', sms: 't.sent_at' }[resource] || idColumn;
    const nameColumn = ['applications', 'alerts', 'sms'].includes(resource) ? 'u.full_name' : `t.${r.search[0]}`;
    const orders = { newest: `${dateColumn} DESC, ${idColumn} DESC`, oldest: `${dateColumn} ASC, ${idColumn} ASC`, az: `LOWER(${nameColumn}) ASC, ${idColumn} ASC`, za: `LOWER(${nameColumn}) DESC, ${idColumn} DESC` };
    const sort = req.query.sort || 'newest';
    if (!Object.hasOwn(orders, sort)) throw fail('Tri non autorisé.');
    const count = await db.prepare(`SELECT COUNT(*) AS n FROM ${r.table} t${join}${where}`).get(...params);
    const total = Number(count.n);
    const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / limit)));
    const items = await db.prepare(`SELECT ${select} FROM ${r.table} t${join}${where} ORDER BY ${orders[sort]} LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);
    res.json({ items, total, page, limit, sort });
  }));
  const save = (create) => wrap(async (req, res) => {
    const r = req.resource;
    if ((create && r.noCreate) || (!create && r.noEdit)) throw fail('Opération non autorisée.', 405);
    const id = create ? null : integer(1)(req.params.id);
    const old = create ? r.defaults || {} : await db.prepare(`SELECT * FROM ${r.table} WHERE ${r.key || 'id'} = ?`).get(id);
    if (!old) throw fail('Enregistrement introuvable.', 404);
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Formulaire invalide.');
    for (const key of Object.keys(body)) if (!Object.hasOwn(r.fields, key)) throw fail(`Champ non modifiable : ${key}.`);
    const input = create ? { ...r.defaults, ...body } : body;
    const values = {};
    for (const [key, value] of Object.entries(input)) {
      try { values[key] = r.fields[key](value); } catch (err) { throw fail(`${key} : ${err.message}`); }
    }
    if (!Object.keys(values).length) throw fail('Aucune modification.');
    if (create && r.required?.some((key) => values[key] === undefined || values[key] === '')) throw fail('Renseignez tous les champs obligatoires.');
    const merged = { ...old, ...values };
    if (req.params.resource === 'jobs') {
      if (merged.salary_max && merged.salary_min > merged.salary_max) throw fail('Le salaire maximum doit être supérieur au minimum.');
      if (!await db.prepare('SELECT id FROM companies WHERE id = ?').get(merged.company_id)) throw fail('Choisissez une entreprise existante.');
    }
    const keys = Object.keys(values);
    if (create) {
      const info = await db.prepare(`INSERT INTO ${r.table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...Object.values(values));
      res.status(201).json({ ok: true, id: Number(info.lastInsertRowid) });
    } else {
      await db.prepare(`UPDATE ${r.table} SET ${keys.map((key) => `${key} = ?`).join(', ')}${r.table === 'alert_settings' ? ', updated_at = CURRENT_TIMESTAMP' : ''} WHERE ${r.key || 'id'} = ?`).run(...Object.values(values), id);
      res.json({ ok: true, id });
    }
  });
  router.post('/:resource', save(true));
  router.put('/:resource/:id', save(false));
  router.delete('/:resource/:id', wrap(async (req, res) => {
    const r = req.resource;
    if (r.noDelete) throw fail('Suppression de compte ou de préférences désactivée pour préserver les données personnelles.', 405);
    const id = integer(1)(req.params.id);
    if (!await db.prepare(`SELECT ${r.key || 'id'} FROM ${r.table} WHERE ${r.key || 'id'} = ?`).get(id)) throw fail('Enregistrement introuvable.', 404);
    if (req.params.resource === 'companies' && await db.prepare('SELECT id FROM jobs WHERE company_id = ? LIMIT 1').get(id)) throw fail('Cette entreprise possède des offres. Réaffectez ou supprimez ses offres avant de la supprimer.', 409);
    if (req.params.resource === 'jobs' && await db.prepare('SELECT id FROM applications WHERE job_id = ? LIMIT 1').get(id)) throw fail('Des candidatures sont liées à cette offre. Archivez-la plutôt que de la supprimer.', 409);
    await db.prepare(`DELETE FROM ${r.table} WHERE ${r.key || 'id'} = ?`).run(id);
    res.json({ ok: true });
  }));
  router.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (/unique|constraint|foreign key/i.test(err.message)) return res.status(409).json({ error: 'Conflit : cet enregistrement existe déjà ou possède des éléments liés.' });
    console.error('[admin]', err.message);
    res.status(500).json({ error: 'Enregistrement impossible. Vérifiez la disponibilité de la base et les migrations.' });
  });
  return router;
}
