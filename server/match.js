// Job by blaise — moteur de matching profil ↔ offre
import { educationRank, jget } from './db.js';

const WEIGHTS = {
  skills: 0.40,
  city: 0.15,
  contract: 0.15,
  education: 0.15,
  experience: 0.15,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function skillsScore(profileSkills, jobSkills) {
  if (!jobSkills?.length) return 60;
  if (!profileSkills?.length) return 35;
  const set = new Set(profileSkills.map((s) => s.toLowerCase()));
  const hits = jobSkills.filter((s) => set.has(s.toLowerCase())).length;
  const coverage = hits / jobSkills.length;
  // bonus si le candidat possède plus de compétences que demandées
  const extra = Math.min(0.15, Math.max(0, (profileSkills.length - jobSkills.length)) * 0.02);
  return clamp(Math.round((coverage + extra * (coverage > 0 ? 1 : 0)) * 100), 0, 100);
}

function cityScore(profileCity, preferredCities, jobCity) {
  if (!jobCity) return 60;
  const wanted = [profileCity, ...(preferredCities || [])].filter(Boolean).map((c) => c.toLowerCase());
  if (wanted.includes(String(jobCity).toLowerCase())) return 100;
  return 45; // ailleurs = score neutre faible
}

function contractScore(jobTypes, contract) {
  if (!jobTypes?.length) return 70;
  return jobTypes.includes(contract) ? 100 : 40;
}

function educationScore(userEdu, minEdu) {
  const u = educationRank(userEdu);
  const m = educationRank(minEdu);
  if (m === 0) return 100;
  if (u >= m) return 100;
  const gap = m - u;
  return clamp(100 - gap * 30, 20, 100);
}

function experienceScore(years, minYears) {
  const y = years || 0;
  const m = minYears || 0;
  if (y >= m) return 100;
  if (m === 0) return 100;
  return clamp(Math.round((y / m) * 100), 25, 100);
}

export function computeMatch(profile, job) {
  if (!profile || !job) return null;
  const breakdown = [
    { key: 'skills', label: 'Compétences', weight: WEIGHTS.skills, score: skillsScore(profile.skills, job.skills) },
    { key: 'city', label: 'Localisation', weight: WEIGHTS.city, score: cityScore(profile.city, profile.preferredCities, job.city) },
    { key: 'contract', label: 'Type de contrat', weight: WEIGHTS.contract, score: contractScore(profile.jobTypes, job.contract) },
    { key: 'education', label: 'Niveau d’études', weight: WEIGHTS.education, score: educationScore(profile.education, job.educationMin) },
    { key: 'experience', label: 'Expérience', weight: WEIGHTS.experience, score: experienceScore(profile.experienceYears, job.experienceMin) },
  ];
  const total = Math.round(
    breakdown.reduce((acc, b) => acc + b.score * b.weight, 0)
  );
  // plafonné à 97 % : un match parfait à 100 % paraît artificiel aux recruteurs
  return { score: clamp(total, 0, 97), breakdown };
}

export function profileCompletion(profile) {
  if (!profile) return { percent: 0, checks: [] };
  const cv = profile.cv || {};
  const experiences = Array.isArray(cv.experiences) ? cv.experiences : [];
  const checks = [
    { id: 'identity', label: 'Informations personnelles', done: !!(profile.fullName && profile.phone && profile.city) },
    { id: 'title', label: 'Titre professionnel', done: !!(profile.title && profile.title.length > 2) },
    { id: 'cv', label: 'CV optimal', done: !!(cv.summary && cv.summary.length > 30 && experiences.length >= 1) },
    { id: 'skills', label: 'Compétences renseignées', done: (profile.skills || []).length >= 3 },
    { id: 'prefs', label: 'Préférences définies', done: (profile.jobTypes || []).length >= 1 },
    { id: 'edu', label: 'Formation & expérience', done: !!profile.education && (profile.experienceYears || 0) >= 0 && !!profile.education.length },
  ];
  const done = checks.filter((c) => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), checks };
}

export { jget };
