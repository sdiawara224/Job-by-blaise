// Provisionnement explicite, jamais via l'inscription publique.
// ADMIN_CREATE_EMAIL=... ADMIN_CREATE_PASSWORD=... npm run admin:create
import { db, initSchema, backendName } from '../server/db.js';
import { hashPassword } from '../server/auth.js';
const email = String(process.env.ADMIN_CREATE_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_CREATE_PASSWORD || '';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
  console.error('Définissez ADMIN_CREATE_EMAIL et ADMIN_CREATE_PASSWORD (12 caractères minimum).');
  process.exit(1);
}
await initSchema();
if (process.env.SUPABASE_URL && backendName() !== 'supabase') {
  console.error('Provisionnement annulé : Supabase indisponible. Aucun compte de repli créé.');
  process.exit(1);
}
if (await db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
  console.error('Ce compte existe déjà. Aucun mot de passe ni profil modifié. Ajoutez son e-mail à ADMIN_EMAILS si approprié.');
  process.exit(1);
}
await db.prepare("INSERT INTO users (email, password_hash, full_name, city) VALUES (?, ?, 'Administration Job by blaise', 'Conakry')").run(email, hashPassword(password));
console.log('Compte créé. Ajoutez cet e-mail à ADMIN_EMAILS et configurez JBB_SECRET avant de relancer le serveur.');
