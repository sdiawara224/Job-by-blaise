// Validation des saisies candidat avant toute écriture en base.
export const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const validList = (value) => Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 200);

function textError(body, fields) {
  for (const [key, max] of Object.entries(fields)) {
    if (has(body, key) && (typeof body[key] !== 'string' || body[key].length > max)) return `Le champ ${key} doit être un texte de ${max} caractères maximum.`;
  }
  return null;
}

export function validateRegistration(body) {
  if (!isRecord(body)) return 'Données d’inscription invalides.';
  const error = textError(body, { email: 254, password: 1024, fullName: 200, phone: 80, city: 120 });
  if (error) return error;
  if (!body.email?.trim() || !body.password || !body.fullName?.trim()) return 'E-mail, mot de passe et nom complet sont requis.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return 'E-mail invalide.';
  if (body.password.length < 6) return 'Mot de passe : 6 caractères minimum.';
  return null;
}

export function validateProfile(body) {
  if (!isRecord(body)) return 'Données de profil invalides.';
  const error = textError(body, { fullName: 200, phone: 80, city: 120, title: 200, bio: 10000, education: 120 });
  if (error) return error;
  if (has(body, 'fullName') && !body.fullName.trim()) return 'Le nom complet est requis.';
  if (has(body, 'experienceYears')) {
    const value = body.experienceYears;
    if (!['string', 'number'].includes(typeof value) || String(value).trim() === '' || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 100) return 'L’expérience doit être un nombre entier entre 0 et 100 ans.';
  }
  for (const key of ['skills', 'jobTypes', 'preferredCities']) {
    if (has(body, key) && !validList(body[key])) return `Le champ ${key} doit être une liste de textes non vides (100 éléments maximum).`;
  }
  if (has(body, 'cv')) {
    if (!isRecord(body.cv)) return 'Le CV doit être un objet structuré.';
    if (has(body.cv, 'summary') && (typeof body.cv.summary !== 'string' || body.cv.summary.length > 10000)) return 'Le résumé du CV est invalide (10 000 caractères maximum).';
    for (const key of ['experiences', 'education']) {
      if (!has(body.cv, key)) continue;
      const entries = body.cv[key];
      if (!Array.isArray(entries) || entries.length > 100 || entries.some((entry) => !isRecord(entry) || Object.values(entry).some((value) => typeof value !== 'string' || value.length > 10000))) return `La rubrique ${key} du CV doit contenir une liste d’entrées textuelles valides.`;
    }
  }
  return null;
}

export function validateAlerts(body) {
  if (!isRecord(body)) return 'Préférences d’alertes invalides.';
  const error = textError(body, { phone: 80 });
  if (error) return error;
  if (has(body, 'enabled') && typeof body.enabled !== 'boolean') return 'L’activation des alertes doit être un booléen.';
  if (has(body, 'sendTime') && (typeof body.sendTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.sendTime))) return 'Heure invalide : utilisez une heure entre 00:00 et 23:59.';
  for (const key of ['keywords', 'cities', 'contracts']) {
    if (has(body, key) && !validList(body[key])) return `Le champ ${key} doit être une liste de textes non vides (100 éléments maximum).`;
  }
  return null;
}
