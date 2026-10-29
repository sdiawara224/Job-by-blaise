// Job by blaise — serveur : API + fichiers statiques (SPA buildée)
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import router, { sendAlertToUser } from './routes.js';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  }
  next();
});

app.use('/api', router);

// statiques + repli SPA
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Job by blaise API — lancez « npm run build » pour générer le front.');
  });
}

// ---------- planificateur d'alertes SMS (heure choisie par l'utilisateur) ----------
function runDueAlerts() {
  try {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().slice(0, 10);
    const due = db.prepare(`
      SELECT u.* FROM users u
      JOIN alert_settings a ON a.user_id = u.id
      WHERE a.enabled = 1 AND a.send_time = ? AND (a.last_sent_on IS NULL OR a.last_sent_on != ?)
    `).all(hhmm, today);
    for (const u of due) {
      const r = sendAlertToUser(u);
      if (r) console.log(`[SMS] Alerte envoyée à ${u.email} (${r.count} offre${r.count > 1 ? 's' : ''})`);
    }
  } catch (err) {
    console.error('[SMS] erreur planificateur :', err.message);
  }
}
setInterval(runDueAlerts, 60 * 1000);

app.listen(PORT, '0.0.0.0', () => {
  const inner = 'Job by blaise — Le bon emploi. Au bon moment.';
  const width = 2 + inner.length + 1;
  const rule = '─'.repeat(width);
  console.log('');
  console.log(`  ┌${rule}┐`);
  console.log(`  │  ${inner} │`);
  console.log(`  └${rule}┘`);
  console.log(`  API      : http://localhost:${PORT}/api`);
  console.log(`  Front    : ${fs.existsSync(DIST) ? `http://localhost:${PORT}/ (fichiers statiques)` : 'non buildé → npm run build'}`);
  console.log(`  Démo     : mamadou@jobbyblaise.com / demo1234`);
  console.log('');
  runDueAlerts();
});
