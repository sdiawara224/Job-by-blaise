// Job by blaise — base de données SQLite (node:sqlite)
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'jobbyblaise.db');

fs.mkdirSync(DB_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');

export function initSchema() {
  db.exec(`
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
  `);

  // Migration : colonnes entreprises ajoutées après-coup (bases déjà créées)
  const cols = db.prepare('PRAGMA table_info(companies)').all().map((c) => c.name);
  if (!cols.includes('founded_year')) db.exec('ALTER TABLE companies ADD COLUMN founded_year INTEGER');
  if (!cols.includes('staff_size')) db.exec('ALTER TABLE companies ADD COLUMN staff_size TEXT');
}

export const EDUCATION_ORDER = [
  'Sans diplôme',
  'BEPC',
  'Bac',
  'Bac+1',
  'Bac+2',
  'Bac+3',
  'Bac+5',
  'Doctorat',
];

export function educationRank(level) {
  const i = EDUCATION_ORDER.indexOf(level);
  return i === -1 ? 0 : i;
}

export const CONTRACT_TYPES = ['Temps plein', 'Temps partiel', 'CDD', 'Stage', 'Freelance'];

export const ALL_SKILLS = [
  'Excel', 'Comptabilité', 'Sage', 'Communication', 'Réseaux', 'JavaScript',
  'React', 'Python', 'SQL', 'Marketing digital', 'Vente', 'Négociation',
  'Gestion de projet', 'Ressources humaines', 'Recrutement', 'AutoCAD',
  'Maintenance', 'Électricité', 'Anglais', 'Français', 'Logistique',
  'Transport', 'Soins infirmiers', 'Analyse de données', 'WordPress',
  'SEO', 'Bases de données', 'Linux', 'Service client', 'Organisation',
  'Rédaction', 'Design graphique', 'PowerPoint', 'Mécanique', 'Climatisation',
  'HACCP', 'Agriculture', 'Sécurité', 'Data visualization', 'Cisco / TCP-IP',
  'CSS', 'Formation', 'Comptabilité', 'Audit',
];

export const CITIES = [
  'Conakry', 'Kankan', 'Labé', 'Nzérékoré', 'Boké', 'Kindia', 'Mamou',
  'Dakar', 'Abidjan', 'Bamako', 'Douala', 'Lomé', 'Ouagadougou',
];

// ---------- helpers JSON ----------
export const jget = (v, fallback) => {
  try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
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
    ? { id: row.company_id, name: row.company_name, sector: row.company_sector, city: row.company_city, color: row.company_color }
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
