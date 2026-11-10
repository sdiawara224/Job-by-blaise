import { STATUSES } from '../adminConfig.js';

const TEXT_LIMITS = {
  jobs: { title: 180, city: 100, country: 100, contract: 80, domain: 120, education_min: 100, description: 20000, requirements: 20000 },
  companies: { name: 180, sector: 120, city: 100, description: 10000, staff_size: 100 },
  advice: { title: 200, category: 100, excerpt: 1000, content: 40000 },
  users: { full_name: 180, phone: 40, city: 100, title: 180, bio: 5000, education: 100 },
  alerts: { phone: 40 },
};
export function fieldRules(section, key, type) {
  if (type !== 'number') return { maxLength: TEXT_LIMITS[section]?.[key] };
  const ranges = { founded_year: [1800, new Date().getFullYear()], minutes: [1, 120], experience_min: [0, 60], experience_years: [0, 60] };
  const [min, max] = ranges[key] || [0, 100000000000];
  return { min, max, step: 1 };
}
export function validateRecord(section, fields, form, companies = []) {
  const errors = {};
  for (const [key, , type, required] of fields) {
    const value = String(form[key] ?? '');
    const rules = fieldRules(section, key, type);
    if (required && !value.trim()) { errors[key] = 'Ce champ est obligatoire.'; continue; }
    if (rules.maxLength && value.length > rules.maxLength) errors[key] = `${rules.maxLength.toLocaleString('fr-FR')} caractères maximum.`;
    if (type === 'number' && (!value.trim() || !Number.isSafeInteger(Number(value)) || Number(value) < rules.min || Number(value) > rules.max)) errors[key] = `Renseignez un nombre entier entre ${rules.min.toLocaleString('fr-FR')} et ${rules.max.toLocaleString('fr-FR')}.`;
    if (type === 'company' && !companies.some((c) => String(c.id) === value)) errors[key] = 'Sélectionnez une entreprise existante.';
    if (type === 'list') {
      const list = value.split(',').map((v) => v.trim()).filter(Boolean);
      if (list.length > 50 || list.some((v) => v.length > 120)) errors[key] = '50 éléments maximum, de 120 caractères chacun, séparés par des virgules.';
    }
    if (type === 'color' && !/^#[a-f\d]{6}$/i.test(value)) errors[key] = 'Choisissez une couleur hexadécimale à 6 caractères.';
    if (type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) errors[key] = 'Renseignez une heure valide au format HH:MM.';
    if (type === 'status' && !STATUSES.includes(value)) errors[key] = 'Sélectionnez un statut de candidature proposé.';
    if (['publication', 'enabled'].includes(type) && !['0', '1'].includes(value)) errors[key] = 'Sélectionnez une valeur proposée.';
  }
  if (section === 'jobs' && Number(form.salary_max) > 0 && Number(form.salary_min) > Number(form.salary_max)) errors.salary_max = 'Le maximum doit être supérieur ou égal au minimum.';
  return errors;
}

export function decodeList(value) {
  try { const parsed = Array.isArray(value) ? value : JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []; } catch { return []; }
}
