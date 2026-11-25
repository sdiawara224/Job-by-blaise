import './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';

await mkdir('.cache', { recursive: true });
await build({ stdin: { contents: "export {default as App} from './client/src/App.jsx';export {AuthProvider} from './client/src/auth.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: '.cache/candidate-notifications-test.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' } });
const { App, AuthProvider } = await import('../.cache/candidate-notifications-test.mjs');
const container = document.getElementById('root');
window.scrollTo = () => {};
window.matchMedia = () => ({ matches: true });
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
let navigate;
function Controls() { navigate = useNavigate(); return React.createElement(App); }
const activity = (status = 'En attente', unread = 0) => ({
  applications: [{ id: 1, jobId: 1, title: 'Poste test', city: 'Conakry', contract: 'CDD', company: { name: 'Entreprise', color: '#2E6BFF' }, status, createdAt: '2026-10-29' }],
  stats: { total: 1, pending: status === 'En attente' ? 1 : 0, inProgress: status === 'En cours' ? 1 : 0, accepted: status === 'Acceptée' ? 1 : 0 },
  notifications: status === 'En attente' ? [] : [{ id: 4, applicationId: 1, title: 'Poste test', company: 'Entreprise', oldStatus: 'En attente', newStatus: status, createdAt: '2026-10-29', isRead: unread === 0 }],
  unreadNotifications: unread, unreadSms: 0,
});
async function mount() {
  localStorage.setItem('jobbyblaise_token', 'candidate');
  const root = createRoot(container);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/app'], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AuthProvider, null, React.createElement(Controls)))));
  return root;
}

test('statut modifié : focus actualise compteur, cloche et liste, lecture synchronisée sans modifier les SMS', async () => {
  let current = activity(), failRead = false;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, ...options });
    if (url === '/api/auth/me') return response({ user: { id: 2, fullName: 'Test', city: 'Conakry', role: 'client', isAdmin: false } });
    if (url === '/api/activity') return response(structuredClone(current));
    if (url === '/api/dashboard') return response({ greeting: { fullName: 'Test', city: 'Conakry' }, applications: activity().stats, completion: { percent: 17, checks: [] }, unreadSms: 0, recommended: [], alertsEnabled: false });
    if (url === '/api/notifications/read') {
      if (failRead) return response({ error: 'Lecture indisponible' }, 503);
      current = activity('Acceptée', 0);
      return response({ ok: true });
    }
    throw new Error(`Unexpected ${url}`);
  };
  const root = await mount();
  try {
    assert.equal(container.querySelector('.dash-hero-stats .dash-stat:nth-child(2) b').textContent, '0');
    current = activity('Acceptée', 1);
    await React.act(async () => window.dispatchEvent(new window.Event('focus')));
    assert.equal(container.querySelector('.dash-hero-stats .dash-stat:nth-child(2) b').textContent, '1');
    assert.equal(container.querySelector('a[title="Notifications de candidatures"]').getAttribute('aria-label'), 'Notifications : 1 non lue');
    assert.ok(container.querySelector('.candidate-notice'));
    assert.equal(container.querySelector('.dash-hero-stats .dash-stat:nth-child(3) b').textContent, '0');
    await React.act(async () => navigate('/app/candidatures'));
    assert.equal(container.querySelector('.status').textContent, 'Acceptée');
    await React.act(async () => navigate('/app/notifications'));
    assert.match(container.querySelector('.candidate-notification').textContent, /En attente à Acceptée/);
    assert.ok(!calls.some(c => c.url === '/api/notifications/read')); // ouvrir n’est pas lire
    const read = () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Marquer comme lue');
    failRead = true;
    await React.act(async () => read().click());
    assert.match(container.querySelector('[role="alert"]').textContent, /Lecture indisponible/);
    assert.ok(container.querySelector('.candidate-notification.is-unread'));
    failRead = false;
    await React.act(async () => read().click());
    assert.equal(container.querySelector('.candidate-notification.is-unread'), null);
    assert.equal(container.querySelector('.dot-badge'), null);
    assert.equal(container.querySelector('.candidate-notice'), null);
    assert.equal(container.querySelector('a[title="Notifications de candidatures"]').getAttribute('aria-label'), 'Notifications : 0 non lue');
    await React.act(async () => navigate('/app'));
    assert.equal(container.querySelector('.dash-hero-stats .dash-stat:nth-child(2) b').textContent, '1');
    assert.equal(container.querySelector('.dash-hero-stats .dash-stat:nth-child(3) b').textContent, '0');
  } finally { await React.act(async () => root.unmount()); }
});

test('panne de synchronisation visible, puis retour au premier plan sans perdre les anciennes données', async () => {
  let failure = false;
  globalThis.fetch = async url => {
    if (url === '/api/auth/me') return response({ user: { id: 2, fullName: 'Test', role: 'client' } });
    if (url === '/api/activity') return failure ? response({ error: 'Indisponible temporairement' }, 503) : response(activity('En cours', 1));
    if (url === '/api/dashboard') return response({ greeting: { fullName: 'Test' }, applications: activity().stats, completion: { percent: 0, checks: [] }, unreadSms: 0, recommended: [] });
    throw new Error(url);
  };
  const root = await mount();
  try {
    failure = true;
    await React.act(async () => window.dispatchEvent(new window.Event('focus')));
    assert.match(container.querySelector('[role="alert"]').textContent, /Indisponible temporairement/);
    assert.ok(container.querySelector('.candidate-notice'));
    failure = false;
    await React.act(async () => window.dispatchEvent(new window.Event('focus')));
    assert.equal(container.querySelector('[role="alert"]'), null);
    await React.act(async () => navigate('/app/candidatures'));
    assert.equal(container.querySelector('.status').textContent, 'En cours');
  } finally { await React.act(async () => root.unmount()); }
});
