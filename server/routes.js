// Job by blaise — API REST
import express from 'express';
import {
  db, initSchema, jget, publicUser, jobRow, JOB_SELECT, ALL_SKILLS, CITIES,
  CONTRACT_TYPES, EDUCATION_ORDER,
} from './db.js';
import { hashPassword, verifyPassword, createToken, getUserFromRequest } from './auth.js';
import { computeMatch, profileCompletion } from './match.js';
import { seed } from './seed.js';

initSchema();
seed(); // auto-seed si la base est vide

const router = express.Router();

// ---------- utilitaires ----------
function loadUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function requireAuth(req, res, next) {
  const uid = getUserFromRequest(req);
  if (!uid) return res.status(401).json({ error: 'Authentification requise.' });
  const user = loadUser(uid);
  if (!user) return res.status(401).json({ error: 'Session expirée.' });
  req.user = user;
  next();
}

function searchJobs({ search, city, contract, domain, sort } = {}) {
  const clauses = ['j.is_active = 1'];
  const params = [];
  if (search) {
    clauses.push('(j.title LIKE ? OR c.name LIKE ? OR j.domain LIKE ? OR j.skills LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (city) { clauses.push('j.city = ?'); params.push(city); }
  if (contract) { clauses.push('j.contract = ?'); params.push(contract); }
  if (domain) { clauses.push('j.domain = ?'); params.push(domain); }
  let sql = `${JOB_SELECT} WHERE ${clauses.join(' AND ')}`;
  if (sort === 'salary') sql += ' ORDER BY j.salary_max DESC';
  else sql += ' ORDER BY j.posted_at DESC';
  return db.prepare(sql).all(...params).map(jobRow);
}

function withMatch(profile, jobs) {
  if (!profile) return jobs.map((j) => ({ ...j, match: null }));
  return jobs.map((j) => ({ ...j, match: computeMatch(profile, j) }));
}

// ================= AUTH =================
router.post('/auth/register', (req, res) => {
  const { email, password, fullName, phone, city } = req.body || {};
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'E-mail, mot de passe et nom complet sont requis.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'E-mail invalide.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum.' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'Un compte existe déjà avec cet e-mail.' });

  const info = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, phone, city, title)
    VALUES (?, ?, ?, ?, ?, '')
  `).run(String(email).toLowerCase(), hashPassword(password), fullName.trim(), phone || '', city || 'Conakry');

  const uid = Number(info.lastInsertRowid);
  db.prepare(`
    INSERT OR REPLACE INTO alert_settings (user_id, enabled, phone, send_time, keywords, cities, contracts, updated_at)
    VALUES (?, 1, ?, '07:00', '[]', ?, '[]', datetime('now'))
  `).run(uid, phone || '', JSON.stringify([city || 'Conakry']));

  res.status(201).json({ token: createToken(uid), user: publicUser(loadUser(uid)) });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase());
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' });
  }
  res.json({ token: createToken(user.id), user: publicUser(user) });
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// ================= PROFIL =================
router.get('/profile', requireAuth, (req, res) => {
  const profile = publicUser(req.user);
  res.json({ profile, completion: profileCompletion(profile) });
});

router.put('/profile', requireAuth, (req, res) => {
  const b = req.body || {};
  const u = req.user;
  const fields = {
    full_name: b.fullName ?? u.full_name,
    phone: b.phone ?? u.phone,
    city: b.city ?? u.city,
    title: b.title ?? u.title,
    bio: b.bio ?? u.bio,
    education: b.education ?? u.education,
    experience_years: Number.isFinite(Number(b.experienceYears)) ? Number(b.experienceYears) : u.experience_years,
    skills: JSON.stringify(Array.isArray(b.skills) ? b.skills : jget(u.skills, [])),
    job_types: JSON.stringify(Array.isArray(b.jobTypes) ? b.jobTypes : jget(u.job_types, [])),
    preferred_cities: JSON.stringify(Array.isArray(b.preferredCities) ? b.preferredCities : jget(u.preferred_cities, [])),
    cv: JSON.stringify(b.cv && typeof b.cv === 'object' ? b.cv : jget(u.cv, {})),
  };
  db.prepare(`
    UPDATE users SET full_name=@full_name, phone=@phone, city=@city, title=@title, bio=@bio,
      education=@education, experience_years=@experience_years, skills=@skills,
      job_types=@job_types, preferred_cities=@preferred_cities, cv=@cv
    WHERE id=${u.id}
  `).run(fields);
  const profile = publicUser(loadUser(u.id));
  res.json({ profile, completion: profileCompletion(profile) });
});

// ================= OFFRES =================
router.get('/jobs/meta', (req, res) => {
  const domains = db.prepare('SELECT DISTINCT domain FROM jobs WHERE is_active=1 ORDER BY domain').all().map((r) => r.domain);
  const cities = db.prepare('SELECT DISTINCT city FROM jobs WHERE is_active=1 ORDER BY city').all().map((r) => r.city);
  res.json({
    cities, domains,
    contracts: CONTRACT_TYPES,
    skills: [...new Set(ALL_SKILLS)],
    allCities: CITIES,
    education: EDUCATION_ORDER,
  });
});

router.get('/jobs', (req, res) => {
  const uid = getUserFromRequest(req);
  const profile = uid ? publicUser(loadUser(uid)) : null;
  const jobs = searchJobs(req.query);
  res.json({ jobs: withMatch(profile, jobs), total: jobs.length });
});

router.get('/jobs/recommended', requireAuth, (req, res) => {
  const profile = publicUser(req.user);
  const scored = withMatch(profile, searchJobs({}))
    .filter((j) => j.match)
    .sort((a, b) => b.match.score - a.match.score);
  const limit = Math.max(1, Math.min(12, Number(req.query.limit) || 4));
  res.json({ jobs: scored.slice(0, limit) });
});

router.get('/jobs/:id(\\d+)', (req, res) => {
  const row = db.prepare(`${JOB_SELECT} WHERE j.id = ?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Offre introuvable.' });
  const job = jobRow(row);
  const uid = getUserFromRequest(req);
  const profile = uid ? publicUser(loadUser(uid)) : null;
  const applied = uid
    ? !!db.prepare('SELECT id FROM applications WHERE user_id = ? AND job_id = ?').get(uid, job.id)
    : false;
  res.json({ job: { ...job, match: profile ? computeMatch(profile, job) : null }, applied });
});

// ================= CANDIDATURES =================
router.get('/applications', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, j.title, j.city, j.contract, c.name AS company_name, c.color AS company_color
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.user_id = ? ORDER BY a.created_at DESC
  `).all(req.user.id);
  const applications = rows.map((r) => ({
    id: r.id, jobId: r.job_id, title: r.title, city: r.city, contract: r.contract,
    company: { name: r.company_name, color: r.company_color },
    status: r.status, coverLetter: r.cover_letter, createdAt: r.created_at,
  }));
  res.json({
    applications,
    stats: {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'En attente').length,
      inProgress: applications.filter((a) => a.status === 'En cours').length,
      accepted: applications.filter((a) => a.status === 'Acceptée').length,
    },
  });
});

router.post('/applications', requireAuth, (req, res) => {
  const { jobId, coverLetter } = req.body || {};
  const job = db.prepare('SELECT id FROM jobs WHERE id = ? AND is_active = 1').get(Number(jobId));
  if (!job) return res.status(404).json({ error: 'Offre introuvable.' });
  const exists = db.prepare('SELECT id FROM applications WHERE user_id = ? AND job_id = ?').get(req.user.id, job.id);
  if (exists) return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre.' });
  const info = db.prepare(`
    INSERT INTO applications (user_id, job_id, cover_letter, status) VALUES (?, ?, ?, 'En attente')
  `).run(req.user.id, job.id, String(coverLetter || '').slice(0, 4000));
  res.status(201).json({ id: Number(info.lastInsertRowid), status: 'En attente' });
});

router.delete('/applications/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?')
    .run(Number(req.params.id), req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Candidature introuvable.' });
  res.json({ ok: true });
});

// ================= ALERTES SMS =================
function loadAlerts(uid) {
  let a = db.prepare('SELECT * FROM alert_settings WHERE user_id = ?').get(uid);
  if (!a) {
    const u = loadUser(uid);
    db.prepare(`
      INSERT INTO alert_settings (user_id, enabled, phone, send_time, keywords, cities, contracts)
      VALUES (?, 1, ?, '07:00', '[]', ?, '[]')
    `).run(uid, u.phone || '', JSON.stringify([u.city || 'Conakry']));
    a = db.prepare('SELECT * FROM alert_settings WHERE user_id = ?').get(uid);
  }
  return a;
}

export function buildAlertMessage(user, matchCount, topJobs) {
  const first = user.full_name.split(' ')[0];
  if (matchCount === 0) {
    return `Job by blaise: Bonjour ${first}, aucune nouvelle offre ne correspond à vos critères ce matin. Élargissez vos préférences sur votre profil.`;
  }
  const names = topJobs.slice(0, 2).map((j) => `${j.title} (${j.city})`).join(', ');
  return `Job by blaise: Bonjour ${first}, ${matchCount} nouvelle${matchCount > 1 ? 's' : ''} offre${matchCount > 1 ? 's' : ''} correspondent à votre profil — ${names}. Postulez → jobbyblaise.com/jobs`;
}

export function sendAlertToUser(userRow, { force = false } = {}) {
  const profile = publicUser(userRow);
  const alerts = loadAlerts(userRow.id);
  if (!alerts.enabled && !force) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (alerts.last_sent_on === today && !force) return null;

  const keywords = jget(alerts.keywords, []);
  const cities = jget(alerts.cities, []);
  const contracts = jget(alerts.contracts, []);

  let jobs = searchJobs({}).filter((j) => {
    if (cities.length && !cities.includes(j.city)) return false;
    if (contracts.length && !contracts.includes(j.contract)) return false;
    if (keywords.length) {
      const hay = `${j.title} ${j.domain} ${j.skills.join(' ')}`.toLowerCase();
      return keywords.some((k) => hay.includes(String(k).toLowerCase()));
    }
    return true;
  });
  jobs = withMatch(profile, jobs).filter((j) => j.match && j.match.score >= 70);
  jobs.sort((a, b) => b.match.score - a.match.score);

  const body = buildAlertMessage(userRow, jobs.length, jobs);
  db.prepare('INSERT INTO sms_messages (user_id, body) VALUES (?, ?)').run(userRow.id, body);
  db.prepare('UPDATE alert_settings SET last_sent_on = ? WHERE user_id = ?').run(today, userRow.id);
  return { body, count: jobs.length };
}

router.get('/alerts', requireAuth, (req, res) => {
  const a = loadAlerts(req.user.id);
  const messages = db.prepare('SELECT id, body, sent_at, is_read FROM sms_messages WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50')
    .all(req.user.id)
    .map((m) => ({ id: m.id, body: m.body, sentAt: m.sent_at, isRead: !!m.is_read }));
  res.json({
    settings: {
      enabled: !!a.enabled,
      phone: a.phone,
      sendTime: a.send_time,
      keywords: jget(a.keywords, []),
      cities: jget(a.cities, []),
      contracts: jget(a.contracts, []),
      lastSentOn: a.last_sent_on,
    },
    messages,
    unread: messages.filter((m) => !m.isRead).length,
  });
});

router.put('/alerts', requireAuth, (req, res) => {
  const b = req.body || {};
  const u = req.user;
  db.prepare(`
    INSERT INTO alert_settings (user_id, enabled, phone, send_time, keywords, cities, contracts, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      enabled=excluded.enabled, phone=excluded.phone, send_time=excluded.send_time,
      keywords=excluded.keywords, cities=excluded.cities, contracts=excluded.contracts,
      updated_at=datetime('now')
  `).run(
    u.id,
    b.enabled === false ? 0 : 1,
    String(b.phone ?? loadAlerts(u.id).phone ?? ''),
    /^\d{2}:\d{2}$/.test(b.sendTime || '') ? b.sendTime : '07:00',
    JSON.stringify(Array.isArray(b.keywords) ? b.keywords : []),
    JSON.stringify(Array.isArray(b.cities) ? b.cities : []),
    JSON.stringify(Array.isArray(b.contracts) ? b.contracts : [])
  );
  res.json({ ok: true });
});

router.post('/alerts/test', requireAuth, (req, res) => {
  const result = sendAlertToUser(req.user, { force: true });
  if (!result) return res.status(400).json({ error: 'Impossible de générer l’alerte.' });
  res.json({ ok: true, body: result.body, count: result.count });
});

router.post('/alerts/read', requireAuth, (req, res) => {
  db.prepare('UPDATE sms_messages SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

// ================= ENTREPRISES =================
function companyRow(r, jobCount) {
  return {
    id: r.id,
    name: r.name,
    sector: r.sector,
    city: r.city,
    description: r.description,
    color: r.color,
    foundedYear: r.founded_year || 2020,
    staffSize: r.staff_size || '1 à 10 collaborateurs',
    jobCount: jobCount ?? r.job_count ?? 0,
    rating: Number((r.id % 3 === 0 ? 5 : 4 + ((r.id * 7) % 10) / 10).toFixed(1)),
  };
}

router.get('/companies', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, COUNT(j.id) AS job_count
    FROM companies c LEFT JOIN jobs j ON j.company_id = c.id AND j.is_active = 1
    GROUP BY c.id ORDER BY job_count DESC, c.name
  `).all();
  res.json({ companies: rows.map((r) => companyRow(r)) });
});

router.get('/companies/:id(\\d+)', (req, res) => {
  const row = db.prepare('SELECT * FROM companies WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Entreprise introuvable.' });
  const uid = getUserFromRequest(req);
  const profile = uid ? publicUser(loadUser(uid)) : null;
  const jobs = withMatch(profile, searchJobs({})).filter((j) => j.company && j.company.id === row.id);
  res.json({ company: companyRow(row, jobs.length), jobs });
});

// ================= CONSEILS =================
router.get('/advice', (req, res) => {
  const rows = db.prepare('SELECT id, title, category, excerpt, minutes, color FROM advice ORDER BY id').all();
  res.json({ advice: rows });
});

router.get('/advice/:id(\\d+)', (req, res) => {
  const row = db.prepare('SELECT * FROM advice WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Conseil introuvable.' });
  res.json({ article: row });
});

// ================= DASHBOARD / STATS =================
router.get('/dashboard', requireAuth, (req, res) => {
  const profile = publicUser(req.user);
  const completion = profileCompletion(profile);
  const recommended = withMatch(profile, searchJobs({}))
    .filter((j) => j.match)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4);

  const appStats = db.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN status='En attente' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='En cours' THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN status='Acceptée' THEN 1 ELSE 0 END) AS accepted
    FROM applications WHERE user_id = ?
  `).get(req.user.id);

  const unread = db.prepare('SELECT COUNT(*) AS n FROM sms_messages WHERE user_id = ? AND is_read = 0').get(req.user.id).n;
  const lastSms = db.prepare('SELECT id, body, sent_at FROM sms_messages WHERE user_id = ? ORDER BY sent_at DESC LIMIT 1').get(req.user.id);
  const alerts = loadAlerts(req.user.id);

  res.json({
    greeting: { fullName: profile.fullName, city: profile.city },
    recommended,
    completion,
    applications: {
      total: appStats.total || 0,
      pending: appStats.pending || 0,
      inProgress: appStats.inProgress || 0,
      accepted: appStats.accepted || 0,
    },
    unreadSms: unread,
    lastSms: lastSms ? { id: lastSms.id, body: lastSms.body, sentAt: lastSms.sent_at } : null,
    alertsEnabled: !!alerts.enabled,
    alertsTime: alerts.send_time,
  });
});

router.get('/stats', (req, res) => {
  res.json({
    jobs: db.prepare('SELECT COUNT(*) AS n FROM jobs WHERE is_active = 1').get().n,
    companies: db.prepare('SELECT COUNT(*) AS n FROM companies').get().n,
    cities: db.prepare('SELECT COUNT(DISTINCT city) AS n FROM jobs WHERE is_active = 1').get().n,
    users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
  });
});

export default router;
