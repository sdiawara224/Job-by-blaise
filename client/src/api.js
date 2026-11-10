// Job by blaise — client API
const TOKEN_KEY = 'jobbyblaise_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* pas de corps */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const fmtSalary = (min, max) => {
  const f = (n) => Number(n || 0).toLocaleString('fr-FR');
  if (!min && !max) return 'Salaire à discuter';
  if (min && max) return `${f(min)} – ${f(max)} GNF`;
  return `${f(min || max)} GNF / mois`;
};

export const fmtDate = (iso) => {
  // Postgres renvoie un offset (+00:00), SQLite aucun : ajouter Z uniquement
  // en l'absence de fuseau, sinon la date devient invalide (…+00:00Z).
  const value = String(iso || '').trim().replace(' ', 'T');
  if (!value) return 'Date non précisée';
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const d = new Date(value + (hasZone ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return 'Date non précisée';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `il y a ${days} jours`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
