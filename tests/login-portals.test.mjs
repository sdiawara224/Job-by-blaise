import { dom } from './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

await mkdir('.cache', { recursive: true });
await build({ stdin: { contents: "export {default as App} from './client/src/App.jsx';export {default as Navbar} from './client/src/components/Navbar.jsx';export {AuthProvider} from './client/src/auth.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: '.cache/login-portals-test.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' } });
const { App, Navbar, AuthProvider } = await import('../.cache/login-portals-test.mjs');
const container = document.getElementById('root');
window.scrollTo = () => {};
async function mount(path, { existingAdmin = false, denyAdmin = false, adminAccount = false, expiredAdmin = false } = {}) {
  localStorage.clear(); if (existingAdmin) localStorage.setItem('jobbyblaise_token', 'existing-session');
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, ...options });
    if (url === '/api/admin/summary') return { ok: true, json: async () => ({ stats: { jobs: 0, applications: 0 } }) };
    if (url === '/api/admin/options') return { ok: true, json: async () => ({ companies: [] }) };
    if (url.startsWith('/api/admin/users?')) {
      const params = new URL(url, 'http://test').searchParams;
      const items = [
        { id: 1, email: 'admin@gmail.com', full_name: 'Administration', city: 'Conakry', role: 'super_admin' },
        { id: 2, email: 'test@gmail.com', full_name: 'Compte client', city: 'Conakry', role: 'client' },
      ].filter(row => row.role === params.get('role') && row.email.includes(params.get('q') || ''));
      return { ok: true, json: async () => ({ items, total: items.length, page: 1 }) };
    }

    if (url === '/api/auth/admin/login' && denyAdmin) return { ok: false, status: 403, json: async () => ({ error: 'Ce compte ne possède pas de droits d’administration.' }) };
    return { ok: true, json: async () => ({ token: 'new-session', user: { id: 1, fullName: 'Compte de test', isAdmin: !expiredAdmin && (existingAdmin || adminAccount), role: existingAdmin || adminAccount ? 'super_admin' : 'client' } }) };
  };
  const root = createRoot(container);
  const target = text => React.createElement('h1', null, text);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AuthProvider, null,
    path === '/' ? React.createElement(Navbar) : React.createElement(Routes, null,
      !path.startsWith('/app') && React.createElement(Route, { path: '/app', element: target('Espace candidat') }),
      React.createElement(Route, { path: '/admin', element: target('Administration') }),
      React.createElement(Route, { path: '*', element: React.createElement(App) }))))));
  return { root, calls };
}
async function submit() {
  await React.act(async () => {
    for (const [id, value] of [['login-email', 'test@example.com'], ['login-password', 'test-password']]) {
      const input = document.getElementById(id);
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    }
  });
  await React.act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
}

test('menu public : liens visiteurs/abonnés, aucun accès automatique à l’administration', async () => {
  const { root } = await mount('/');
  try {
    assert.equal([...container.querySelectorAll('a')].find(a => a.textContent === 'Connexion').getAttribute('href'), '/connexion');
    assert.equal([...container.querySelectorAll('a')].find(a => a.textContent === 'Créer un compte').getAttribute('href'), '/inscription');
    assert.equal(container.querySelector('a[href^="/admin"]'), null);
  } finally { await React.act(async () => root.unmount()); }
});
for (const adminAccount of [false, true]) test(`connexion publique : réservée aux clients, refus défensif du compte administrateur (${adminAccount})`, async () => {
  const { root, calls } = await mount('/connexion', { adminAccount });
  try {
    assert.match(container.textContent, /Visiteurs et abonnés/);
    assert.ok(!container.textContent.includes('demo1234'));
    assert.equal(container.querySelector('.demo-box'), null);
    await submit();
    if (adminAccount) {
      assert.match(container.querySelector('[role="alert"]').textContent, /réservé/);
      assert.equal(localStorage.getItem('jobbyblaise_token'), null);
      assert.ok(container.querySelector('a[href="/admin/connexion"]'));
    } else assert.equal(container.querySelector('h1').textContent, 'Espace candidat');
    assert.ok(calls.some(call => call.url === '/api/auth/login'));
    assert.ok(!calls.some(call => call.url === '/api/auth/admin/login'));
  } finally { await React.act(async () => root.unmount()); }
});
for (const path of ['/connexion', '/inscription', '/app', '/app/profil', '/app/candidatures', '/admin/connexion']) test(`session déjà ouverte : ${path} redirige le super administrateur vers son interface`, async () => {
  const { root } = await mount(path, { existingAdmin: true });
  try { assert.equal(container.querySelector('h1').textContent, 'Administration'); }
  finally { await React.act(async () => root.unmount()); }
});
test('connexion administration dédiée et absence d’inscription publique dans son formulaire', async () => {
  const { root, calls } = await mount('/admin/connexion', { adminAccount: true });
  try {
    assert.equal(container.querySelector('a[href="/inscription"]'), null);
    await submit(); assert.equal(container.querySelector('h1').textContent, 'Administration');
    assert.ok(calls.some(call => call.url === '/api/auth/admin/login'));
  } finally { await React.act(async () => root.unmount()); }
});
test('un refus administrateur ne crée aucune session candidat à la place', async () => {
  const { root } = await mount('/admin/connexion', { denyAdmin: true });
  try {
    await submit();
    assert.match(container.querySelector('[role="alert"]').textContent, /droits d’administration/);
    assert.equal(localStorage.getItem('jobbyblaise_token'), null);
    assert.equal(container.querySelector('h1').textContent, 'Votre espace de pilotage');
  } finally { await React.act(async () => root.unmount()); }
});

test('une expiration des droits ne donne pas accès à l’espace candidat', async () => {
  const { root } = await mount('/app/profil', { existingAdmin: true, expiredAdmin: true });
  try { assert.equal(container.querySelector('h1').textContent, 'Administration'); }
  finally { await React.act(async () => root.unmount()); }
});

test('gestion des utilisateurs : deux onglets exclusifs, recherche, clavier et filtres réinitialisés', async () => {
  const { root, calls } = await mount('/admin/users', { existingAdmin: true });
  const waitList = async () => React.act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
  try {
    await waitList();
    assert.ok(container.querySelector('a[href="/admin/users"]').textContent.includes('Gestion des utilisateurs'));
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    assert.deepEqual(tabs.map(tab => tab.textContent), ['Administrateur', 'Abonnés']);
    assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
    assert.equal(container.querySelectorAll('tbody tr').length, 1);
    assert.match(container.querySelector('tbody').textContent, /admin@gmail.com.*Super administrateur/);
    assert.ok(!container.querySelector('tbody').textContent.includes('test@gmail.com'));
    const input = container.querySelector('.adm-search input');
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'introuvable');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    await waitList();
    assert.equal(container.querySelectorAll('tbody tr').length, 0);
    await React.act(async () => tabs[1].click());
    assert.equal(container.querySelectorAll('tbody tr').length, 0); // pas d’ancienne ligne pendant le chargement
    await waitList();
    assert.equal(input.value, '');
    assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
    assert.match(container.querySelector('tbody').textContent, /test@gmail.com.*Client \/ abonné/);
    assert.ok(!container.querySelector('tbody').textContent.includes('admin@gmail.com'));
    const last = new URL(calls.filter(call => call.url.startsWith('/api/admin/users?')).at(-1).url, 'http://test');
    assert.equal(last.searchParams.get('role'), 'client');
    assert.equal(last.searchParams.get('page'), '1');
    assert.equal(last.searchParams.get('q'), '');
    await React.act(async () => tabs[1].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    await waitList();
    assert.equal(document.activeElement, tabs[0]);
    assert.equal(tabs[0].getAttribute('tabindex'), '0');
    assert.equal(container.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby'), tabs[0].id);
    assert.match(container.querySelector('tbody').textContent, /admin@gmail.com/);
    assert.ok(!container.textContent.includes('admintest'));
  } finally { await React.act(async () => root.unmount()); }
});

test('gestion des utilisateurs : lien direct vers les abonnés', async () => {
  const { root } = await mount('/admin/users?role=client', { existingAdmin: true });
  try {
    await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
    assert.equal(container.querySelector('[role="tab"][aria-selected="true"]').textContent, 'Abonnés');
    assert.match(container.querySelector('tbody').textContent, /test@gmail.com/);
    assert.ok(!container.querySelector('tbody').textContent.includes('admin@gmail.com'));
  } finally { await React.act(async () => root.unmount()); }
});
