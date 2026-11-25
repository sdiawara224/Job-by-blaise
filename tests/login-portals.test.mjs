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
async function mount(path, { existingAdmin = false, denyAdmin = false, adminAccount = false } = {}) {
  localStorage.clear(); if (existingAdmin) localStorage.setItem('jobbyblaise_token', 'existing-session');
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, ...options });
    if (url === '/api/auth/admin/login' && denyAdmin) return { ok: false, status: 403, json: async () => ({ error: 'Ce compte ne possède pas de droits d’administration.' }) };
    return { ok: true, json: async () => ({ token: 'new-session', user: { id: 1, fullName: 'Compte de test', isAdmin: existingAdmin || adminAccount } }) };
  };
  const root = createRoot(container);
  const target = text => React.createElement('h1', null, text);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AuthProvider, null,
    path === '/' ? React.createElement(Navbar) : React.createElement(Routes, null,
      React.createElement(Route, { path: '/app', element: target('Espace candidat') }),
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
for (const adminAccount of [false, true]) test(`connexion publique : destination candidat même pour un compte administrateur (${adminAccount})`, async () => {
  const { root, calls } = await mount('/connexion', { adminAccount });
  try {
    assert.match(container.textContent, /Visiteurs et abonnés/);
    assert.ok(!container.textContent.includes('demo1234'));
    assert.equal(container.querySelector('.demo-box'), null);
    await submit();
    assert.equal(container.querySelector('h1').textContent, 'Espace candidat');
    assert.ok(calls.some(call => call.url === '/api/auth/login'));
    assert.ok(!calls.some(call => call.url === '/api/auth/admin/login'));
  } finally { await React.act(async () => root.unmount()); }
});
for (const path of ['/connexion', '/inscription']) test(`session déjà ouverte : ${path} reste dans le parcours candidat`, async () => {
  const { root } = await mount(path, { existingAdmin: true });
  try { assert.equal(container.querySelector('h1').textContent, 'Espace candidat'); }
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
