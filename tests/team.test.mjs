import { dom } from './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

await mkdir('.cache', { recursive: true });
await build({ stdin: { contents: "export { default as App } from './client/src/App.jsx'; export { AuthProvider } from './client/src/auth.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: '.cache/team-test.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' } });
const { App, AuthProvider } = await import('../.cache/team-test.mjs');
window.scrollTo = () => {};
const container = document.getElementById('root');
const link = text => [...container.querySelectorAll('.navbar-links a')].find(a => a.textContent === text);
async function mount(authenticated = false) {
  localStorage.clear();
  if (authenticated) localStorage.setItem('jobbyblaise_token', 'test-token');
  globalThis.fetch = async url => ({ ok: true, json: async () => url === '/api/auth/me' ? { user: { id: 1, fullName: 'Test', isAdmin: false } } : url === '/api/jobs/meta' ? { cities: [], domains: [], contracts: [] } : { jobs: [], total: 0 } });
  const root = createRoot(container);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/notre-equipe'], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AuthProvider, null, React.createElement(App)))));
  return root;
}

test('Notre équipe : route publique, onglet actif et page sans profils inventés', async () => {
  const root = await mount();
  try {
    assert.equal(link('Notre équipe').getAttribute('href'), '/notre-equipe');
    assert.equal(link('Notre équipe').getAttribute('aria-current'), 'page');
    assert.equal(container.querySelector('h1').textContent, 'Les visages derrière Job by blaise');
    assert.equal(document.title, 'Notre équipe | Job by blaise');
    assert.match(container.querySelector('main').textContent, /sera disponible prochainement/);
    assert.equal(container.querySelector('main img'), null);
    for (const name of ['Emplois', 'Entreprises', 'Conseils carrière']) assert.ok(link(name));
    assert.ok(container.querySelector('.navbar-actions a[href="/connexion"]'));
  } finally { await React.act(async () => root.unmount()); }
});

test('Notre équipe : le menu permet de revenir à la page depuis les offres', async () => {
  const root = await mount();
  try {
    await React.act(async () => link('Emplois').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
    assert.equal(link('Emplois').getAttribute('aria-current'), 'page');
    await React.act(async () => link('Notre équipe').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
    assert.match(container.querySelector('h1').textContent, /Les visages derrière/);
    assert.equal(link('Notre équipe').getAttribute('aria-current'), 'page');
  } finally { await React.act(async () => root.unmount()); }
});

test('Notre équipe : onglet disponible pour un candidat connecté sans perdre ses actions', async () => {
  const root = await mount(true);
  try {
    assert.ok(link('Notre équipe'));
    assert.ok(container.querySelector('.navbar-actions a[href="/app"]'));
    assert.match(container.querySelector('.navbar-actions').textContent, /Déconnexion/);
  } finally { await React.act(async () => root.unmount()); }
});
