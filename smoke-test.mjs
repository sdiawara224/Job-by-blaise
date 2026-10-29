// Smoke test : charge le bundle buildé dans jsdom et détecte les erreurs runtime
// usage : node smoke-test.mjs [route]   (défaut : /)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const ROUTE = process.argv[2] || '/';
const html = fs.readFileSync('dist/index.html', 'utf8');
const jsFile = fs.readdirSync('dist/assets').find((f) => f.endsWith('.js'));

const dom = new JSDOM(html.replace(/<script[^>]*><\/script>/g, ''), {
  url: `http://localhost:3001${ROUTE}`,
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});

const { window } = dom;
const errors = [];
if (process.env.WITH_TOKEN) window.localStorage.setItem('carriereos_token', 'fake-token-jwt');

// globals navigateur requis par React
for (const k of ['window', 'document', 'navigator', 'location', 'history',
  'HTMLElement', 'Element', 'Node', 'SVGElement', 'CustomEvent', 'Event',
  'KeyboardEvent', 'MouseEvent', 'getComputedStyle', 'requestAnimationFrame',
  'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'MutationObserver']) {
  try { globalThis[k] = window[k] ?? globalThis[k]; } catch { /* read-only */ }
}
globalThis.window = window;
globalThis.document = window.document;
const define = (k, v) => {
  try { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); }
  catch { try { globalThis[k] = v; } catch { /* ignore */ } }
};
define('navigator', window.navigator);
define('localStorage', window.localStorage);
define('sessionStorage', window.sessionStorage);
define('location', window.location);
define('history', window.history);
define('getComputedStyle', window.getComputedStyle.bind(window));
define('MutationObserver', window.MutationObserver);
define('requestAnimationFrame', (cb) => setTimeout(() => cb(Date.now()), 16));
define('cancelAnimationFrame', (t) => clearTimeout(t));
define('fetch', async (url) => {
  const u = String(url);
  const user = {
    id: 1, email: 'mamadou@carriereos.com', fullName: 'Mamadou Diallo',
    phone: '+224 622 000 111', city: 'Conakry', title: 'Assistant Administratif',
    bio: '…', education: 'Bac+2', experienceYears: 4,
    skills: ['Excel', 'Organisation'], jobTypes: ['Temps plein'],
    preferredCities: ['Conakry'], cv: { summary: '…', experiences: [{ a: 1 }], education: [] },
  };
  const job = {
    id: 1, title: 'Assistant Administratif', city: 'Conakry', country: 'Guinée',
    contract: 'Temps plein', salaryMin: 3500000, salaryMax: 5000000,
    experienceMin: 1, educationMin: 'Bac+2', domain: 'Administration',
    description: 'Desc.', requirements: 'Req.', skills: ['Excel'], postedAt: '2026-10-28 10:00:00',
    company: { id: 1, name: 'Ghapia Logistics', sector: 'Transport', city: 'Conakry', color: '#2E6BFF' },
    match: { score: 91, breakdown: [{ key: 'skills', label: 'Compétences', weight: 0.4, score: 95 }] },
  };
  const completion = {
    percent: 85,
    checks: [{ id: 'a', label: 'CV optimal', done: true }, { id: 'b', label: 'Préférences définies', done: false }],
  };
  let body = {};
  if (u.includes('/auth/me')) body = { user };
  else if (u.includes('/jobs/meta')) body = { cities: ['Conakry'], domains: ['Administration'], contracts: ['Temps plein'], skills: ['Excel'], allCities: ['Conakry', 'Kankan'], education: ['Bac'] };
  else if (u.includes('/jobs/recommended')) body = { jobs: [{ ...job }, { ...job, id: 2 }] };
  else if (/\/jobs\/\d+/.test(u)) body = { job, applied: false };
  else if (u.includes('/jobs?')) body = { jobs: [job], total: 1 };
  else if (u.includes('/stats')) body = { jobs: 60, companies: 18, cities: 10, users: 1 };
  else if (u.includes('/dashboard')) body = {
    greeting: { fullName: user.fullName, city: user.city },
    recommended: [{ ...job }], completion,
    applications: { total: 4, pending: 1, inProgress: 1, accepted: 1 },
    unreadSms: 1, lastSms: { id: 1, body: 'CarrièreOS: …', sentAt: '2026-10-29 07:00:00' },
    alertsEnabled: true, alertsTime: '07:00',
  };
  else if (u.includes('/profile')) body = { profile: user, completion };
  else if (u.includes('/applications')) body = {
    applications: [{ id: 1, jobId: 1, title: 'Assistant', city: 'Conakry', contract: 'Temps plein', company: { name: 'Ghapia', color: '#2E6BFF' }, status: 'En cours', coverLetter: '', createdAt: '2026-10-28 10:00:00' }],
    stats: { total: 1, pending: 0, inProgress: 1, accepted: 0 },
  };
  else if (u.includes('/alerts')) body = {
    settings: { enabled: true, phone: user.phone, sendTime: '07:00', keywords: [], cities: ['Conakry'], contracts: [], lastSentOn: '' },
    messages: [{ id: 1, body: 'CarrièreOS: Bonjour Mamadou, …', sentAt: '2026-10-29 07:00:00', isRead: false }],
    unread: 1,
  };
  else if (/\/advice\/\d+/.test(u)) body = { article: { id: 3, title: 'Alertes SMS', category: 'Alertes SMS', excerpt: '…', minutes: 3, color: '#00A868', content: 'Texte.\n\n1. **Un** point\n- une puce' } };
  else if (u.includes('/advice')) body = { advice: [{ id: 1, title: 'CV', category: 'CV', excerpt: '…', minutes: 5, color: '#2E6BFF' }] };
  else if (u.includes('/auth/login') || u.includes('/auth/register')) body = { token: 'fake', user };
  return { ok: true, status: 200, json: async () => body };
});

window.addEventListener('error', (e) => errors.push('window.onerror: ' + (e.error?.stack || e.message)));
process.on('uncaughtException', (e) => errors.push('uncaught: ' + e.stack));
process.on('unhandledRejection', (e) => errors.push('unhandledRejection: ' + (e?.stack || e)));
const origErr = console.error.bind(console);
console.error = (...args) => { errors.push('console.error: ' + args.map(String).join(' ').slice(0, 900)); origErr(...args); };

const codePath = pathToFileURL(path.join('dist', 'assets', jsFile)).href;
try {
  await import(codePath);
} catch (e) {
  errors.push('import: ' + e.stack);
}

// laisse React monter + les effets s'exécuter
await new Promise((r) => setTimeout(r, 600));

const root = window.document.getElementById('root');
const len = root ? root.innerHTML.length : -1;
const realErrors = errors.filter((e) => !e.includes('act(')); // bruits React act() connus
console.log(`[${ROUTE}] root HTML: ${len} octets | erreurs: ${realErrors.length}`);
if (realErrors.length) {
  realErrors.slice(0, 4).forEach((e) => console.log('---\n' + e));
  process.exit(1);
}
if (len < 200) { console.log('ERREUR: rendu quasi vide !'); process.exit(1); }
