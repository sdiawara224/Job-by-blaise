// Job by blaise — couche données à double backend
//  • sqlite   : local (node:sqlite, zéro dépendance) et repli de secours
//  • supabase : Postgres managé via la RPC sécurisée app_exec (usage Vercel)
// API unifiée : db.prepare(sql).get/all/run(...) → ASYNCHRONES (await partout).
import { DatabaseSync } from 'node:sqlite';
import { isAdminUser } from './auth.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------- sélection du backend ----------------
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
let backend = SUPABASE_URL && SUPABASE_KEY ? 'supabase' : 'sqlite';

export const backendName = () => backend;

// ---------------- SQLite (local / repli) ----------------
// Vercel : FS en lecture seule sauf /tmp → base éphémère ré-seedée à chaque cold start
const DB_DIR = process.env.JBB_DB_DIR || (process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'database'));
const DB_PATH = path.join(DB_DIR, 'jobbyblaise.db');
fs.mkdirSync(DB_DIR, { recursive: true });

const sqlite = new DatabaseSync(DB_PATH);
sqlite.exec('PRAGMA foreign_keys = ON;');
try { sqlite.exec('PRAGMA journal_mode = WAL;'); } catch { /* ignore */ }

const SQLITE_DDL = `
  CREATE TABLE IF NOT EXISTS site_content (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    city TEXT DEFAULT 'Conakry',
    title TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    education TEXT DEFAULT '',
    experience_years INTEGER DEFAULT 0,
    skills TEXT DEFAULT '[]',
    job_types TEXT DEFAULT '[]',
    preferred_cities TEXT DEFAULT '[]',
    cv TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    city TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#2E6BFF',
    founded_year INTEGER,
    staff_size TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Guinée',
    contract TEXT NOT NULL DEFAULT 'Temps plein',
    salary_min INTEGER DEFAULT 0,
    salary_max INTEGER DEFAULT 0,
    experience_min INTEGER DEFAULT 0,
    education_min TEXT DEFAULT '',
    domain TEXT DEFAULT 'Administration',
    description TEXT DEFAULT '',
    requirements TEXT DEFAULT '',
    skills TEXT DEFAULT '[]',
    posted_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    cover_letter TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'En attente',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, job_id)
  );

  CREATE TABLE IF NOT EXISTS alert_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    enabled INTEGER DEFAULT 1,
    phone TEXT DEFAULT '',
    send_time TEXT DEFAULT '07:00',
    keywords TEXT DEFAULT '[]',
    cities TEXT DEFAULT '[]',
    contracts TEXT DEFAULT '[]',
    last_sent_on TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sms_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS advice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    minutes INTEGER DEFAULT 4,
    color TEXT DEFAULT '#2E6BFF'
  );

  CREATE UNIQUE INDEX IF NOT EXISTS ux_companies_name ON companies (name);
  CREATE UNIQUE INDEX IF NOT EXISTS ux_jobs_title_city ON jobs (title, city);
  CREATE UNIQUE INDEX IF NOT EXISTS ux_advice_title ON advice (title);
  CREATE UNIQUE INDEX IF NOT EXISTS ux_sms_user_body ON sms_messages (user_id, body);
`;

function sqliteStmt(sql) {
  const st = sqlite.prepare(sql);
  return {
    async get(...p) { return st.get(...p); },
    async all(...p) { return st.all(...p); },
    async run(...p) {
      const info = st.run(...p);
      return { changes: Number(info.changes), lastInsertRowid: Number(info.lastInsertRowid) };
    },
  };
}

// ---------------- Supabase (Postgres via RPC app_exec) ----------------
function bindArgs(sql, args) {
  if (sql.includes('@')) {
    // paramètres nommés : @champ → ? dans l'ordre d'apparition
    const obj = args.length === 1 && args[0] && typeof args[0] === 'object' ? args[0] : {};
    const values = [];
    const text = sql.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
      if (!(name in obj)) throw new Error(`Paramètre @${name} manquant.`);
      values.push(obj[name] === undefined ? null : obj[name]);
      return '?';
    });
    return { text, values };
  }
  return { text: sql, values: args };
}

async function rpcCall(kind, text, values) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/app_exec`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ p_kind: kind, p_sql: text, p_params: values }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status} — ${detail.slice(0, 300)}`);
  }
  return res.json();
}

function supaStmt(sql) {
  // LIKE → ILIKE : SQLite est insensible à la casse en LIKE, Postgres non.
  const portable = sql.replace(/\bLIKE\b/g, 'ILIKE');
  return {
    async get(...args) {
      const { text, values } = bindArgs(portable, args);
      const row = await rpcCall('one', text, values);
      return row === null || row === undefined ? undefined : row;
    },
    async all(...args) {
      const { text, values } = bindArgs(portable, args);
      return (await rpcCall('rows', text, values)) || [];
    },
    async run(...args) {
      const { text, values } = bindArgs(portable, args);
      const r = await rpcCall('run', text, values);
      return {
        changes: Number(r?.changes || 0),
        lastInsertRowid: Number(r?.lastInsertRowid || 0),
      };
    },
  };
}

// ---------------- API unifiée ----------------
export const db = {
  prepare(sql) {
    return backend === 'supabase' ? supaStmt(sql) : sqliteStmt(sql);
  },
  async exec(sql) {
    if (backend === 'sqlite') { sqlite.exec(sql); return; }
    for (const part of sql.split(';')) {
      const t = part.trim();
      if (t) await rpcCall('run', t, []);
    }
  },
};

// Init du schéma. Sur Supabase : le schéma est posé par la migration SQL
// (supabase/migration.sql) ; on le sonde, et à défaut on retombe sur SQLite.
export async function initSchema() {
  if (backend === 'supabase') {
    try {
      await rpcCall('one', 'SELECT COUNT(*) AS n FROM jobs', []);
      return;
    } catch (err) {
      console.warn('[db] Supabase indisponible → repli SQLite :', String(err.message).slice(0, 200));
      backend = 'sqlite';
    }
  }
  sqlite.exec(SQLITE_DDL);
}

export const EDUCATION_ORDER = [
  'Sans diplôme', 'BEPC', 'Bac', 'Bac+1', 'Bac+2', 'Bac+3', 'Bac+5', 'Doctorat',
];

export function educationRank(level) {
  const i = EDUCATION_ORDER.indexOf(level);
  return i === -1 ? 0 : i;
}

export const CONTRACT_TYPES = ['Temps plein', 'Temps partiel', 'CDD', 'Stage', 'Freelance'];

export const ALL_SKILLS = [
  'Excel', 'Comptabilité', 'Sage', 'Communication', 'Réseaux', 'JavaScript',
  'React', 'Python', 'SQL', 'CSS', 'Marketing digital', 'Vente', 'Négociation',
  'Gestion de projet', 'Ressources humaines', 'Recrutement', 'AutoCAD',
  'Maintenance', 'Électricité', 'Anglais', 'Français', 'Logistique',
  'Transport', 'Soins infirmiers', 'Analyse de données', 'WordPress',
  'SEO', 'Bases de données', 'Linux', 'Service client', 'Organisation',
  'Rédaction', 'Design graphique', 'PowerPoint', 'Mécanique', 'Climatisation',
  'HACCP', 'Agriculture', 'Sécurité', 'Formation', 'Audit', 'Cisco / TCP-IP',
];

export const CITIES = [
  'Conakry', 'Kankan', 'Labé', 'Nzérékoré', 'Boké', 'Kindia', 'Mamou',
  'Dakar', 'Abidjan', 'Bamako', 'Douala', 'Lomé', 'Ouagadougou',
];

export const jget = (v, fallback) => {
  try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    isAdmin: isAdminUser(row),
    adminAccessExpiresAt: isAdminUser(row) ? process.env.ADMIN_ACCESS_EXPIRES_AT || null : null,
    fullName: row.full_name,
    phone: row.phone,
    city: row.city,
    title: row.title,
    bio: row.bio,
    education: row.education,
    experienceYears: row.experience_years,
    skills: jget(row.skills, []),
    jobTypes: jget(row.job_types, []),
    preferredCities: jget(row.preferred_cities, []),
    cv: jget(row.cv, {}),
    createdAt: row.created_at,
  };
}

export function jobRow(row) {
  if (!row) return null;
  const company = row.company_name
    ? {
        id: row.company_id,
        name: row.company_name,
        sector: row.company_sector,
        city: row.company_city,
        color: row.company_color,
      }
    : null;
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    country: row.country,
    contract: row.contract,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    experienceMin: row.experience_min,
    educationMin: row.education_min,
    domain: row.domain,
    description: row.description,
    requirements: row.requirements,
    skills: jget(row.skills, []),
    postedAt: row.posted_at,
    company,
  };
}

export const JOB_SELECT = `
  SELECT j.*, c.name AS company_name, c.sector AS company_sector,
         c.city AS company_city, c.color AS company_color
  FROM jobs j JOIN companies c ON c.id = j.company_id
`;
