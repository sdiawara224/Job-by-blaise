// Schéma partagé par l’administration et l’API. Aucun profil fictif par défaut.
export const TEAM_FIELDS = [
  ['name', 'Nom complet', 120, true],
  ['role', 'Fonction', 160, true],
  ['bio', 'Présentation', 2000, true],
  ['photoUrl', 'Lien de la photo (HTTPS ou chemin du site)', 1000, false],
];

export function validTeamPhoto(value) {
  if (!value) return true;
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

export function validateTeam(members) {
  const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
  if (!Array.isArray(members) || members.length > 30) fail('30 membres maximum.');
  const ids = new Set();
  return members.map((member, index) => {
    const prefix = `Membre ${index + 1} : `;
    if (!member || typeof member !== 'object' || Array.isArray(member)) fail(prefix + 'fiche invalide.');
    if (Object.keys(member).some(key => !['id', 'isPublished', ...TEAM_FIELDS.map(([key]) => key)].includes(key))) fail(prefix + 'champ inconnu.');
    if (typeof member.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(member.id) || ids.has(member.id)) fail(prefix + 'identifiant invalide ou dupliqué.');
    ids.add(member.id);
    if (typeof member.isPublished !== 'boolean') fail(prefix + 'statut de publication invalide.');
    const result = { id: member.id, isPublished: member.isPublished };
    for (const [key, label, max, required] of TEAM_FIELDS) {
      const value = member[key];
      if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`${prefix}${label} : ${required ? 'texte requis, ' : ''}${max} caractères maximum.`);
      result[key] = value.trim();
    }
    if (!validTeamPhoto(result.photoUrl)) fail(prefix + 'utilisez une photo HTTPS ou un chemin du site.');
    return result;
  });
}
