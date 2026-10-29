// CarrièreOS — serveur : API + fichiers statiques (SPA buildée)
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

// log léger des requêtes API
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  }
  next();
});

app.use('/api', router);

// statiques + SPA fallback
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('CarrièreOS API — lancez « npm run build » pour générer le front.');
  });
}

// ---------- planificateur d'alertes SMS (7h00 par utilisateur) ----------
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
  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │  CarrièreOS — Le bon emploi. Au bon moment. │');
  console.log('  └─────────────────────────────────────────────┘');
  console.log(`  API      : http://localhost:${PORT}/api`);
  console.log(`  Front    : ${fs.existsSync(DIST) ? `http://localhost:${PORT}/ (fichiers statiques)` : 'non buildé → npm run build'}`);
  console.log(`  Démo     : mamadou@carriereos.com / demo1234`);
  console.log('');
  runDueAlerts();
});
