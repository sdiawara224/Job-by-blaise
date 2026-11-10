import { dom } from './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';

await mkdir('.cache', { recursive: true });
const file = '.cache/landing-test.mjs';
await build({ stdin: { contents: "export { default as Landing } from './client/src/pages/Landing.jsx'; export { AuthProvider } from './client/src/auth.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: file,
  bundle: true, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react-dom', 'react-router-dom'] });
const { Landing, AuthProvider } = await import('../.cache/landing-test.mjs');
const container = document.getElementById('root');
const act = React.act;
function Location() {
  return React.createElement('output', { id: 'location' }, useLocation().search);
}
async function mount(companies = [{ id: 8, name: 'Digital Conakry', color: '#2e6bff' }], fail = false) {
  globalThis.fetch = async (url) => {
    const data = url === '/api/stats' ? { jobs: 60 }
      : url === '/api/jobs/meta' ? { cities: ['Conakry', 'Labé'] } : { companies };
    return { ok: !(fail && url === '/api/companies'), status: fail ? 503 : 200,
      json: async () => data };
  };
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(MemoryRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      React.createElement(AuthProvider, null, React.createElement(Landing)), React.createElement(Location)));
  });
  return root;
}

test('Hero : compteur réel et bandeau entreprises immédiatement après', async () => {
  const root = await mount();
  try {
    assert.match(container.querySelector('h1').textContent, /60 offres/);
    const hero = container.querySelector('.job-search-hero');
    assert.ok(hero.nextElementSibling.classList.contains('recruiters-strip'));
    assert.equal(container.querySelector('.recruiter-tile').getAttribute('href'), '/entreprises/8');
    assert.equal(container.querySelector('.recruiters-cta').getAttribute('href'), '/jobs');
  } finally { await act(async () => root.unmount()); }
});
test('Trois grandes cartes entre le bandeau et le CV, avec liens et données réelles', async () => {
  const companies = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1, name: `Entreprise ${i + 1}`, color: '#2e6bff', city: 'Conakry',
    sector: 'Technologie', foundedYear: 2022, staffSize: '11 à 50 collaborateurs', jobCount: i + 1,
  }));
  const root = await mount(companies);
  try {
    const strip = container.querySelector('.recruiters-strip');
    const section = strip.nextElementSibling;
    assert.ok(section.classList.contains('featured-companies'));
    assert.match(section.nextElementSibling.textContent, /Votre CV moderne en 3 clics/);
    const cards = section.querySelectorAll('.featured-company');
    assert.equal(cards.length, 3);
    assert.equal(cards[0].getAttribute('href'), '/entreprises/1');
    assert.match(cards[0].textContent, /Conakry/);
    assert.match(cards[0].textContent, /Créée en 2022/);
    assert.match(cards[0].textContent, /11 à 50 collaborateurs/);
    assert.match(cards[0].textContent, /1 offre d’emploi disponible/);
    assert.match(cards[1].textContent, /2 offres d’emploi disponibles/);
  } finally { await act(async () => root.unmount()); }
});
test('Recherche : ville conservée et mots-clés nettoyés', async () => {
  const root = await mount();
  try {
    const input = container.querySelector('.hero-search-field input');
    const select = container.querySelector('.hero-search-city select');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, '  assistant  ');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
      select.value = 'Conakry';
      select.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    await act(async () => container.querySelector('.hero-search-bar').dispatchEvent(
      new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(container.querySelector('#location').textContent, '?search=assistant&city=Conakry');
  } finally { await act(async () => root.unmount()); }
});
test('Entreprises vides : aucun chargement infini', async () => {
  const root = await mount([]);
  try { assert.match(container.querySelector('[role="status"]').textContent, /arrivent bientôt/); }
  finally { await act(async () => root.unmount()); }
});
test('Erreur API entreprises : message de repli explicite', async () => {
  const root = await mount([], true);
  try { assert.match(container.querySelector('[role="status"]').textContent, /momentanément indisponibles/); }
  finally { await act(async () => root.unmount()); }
});
test.after(async () => { dom.window.close(); await rm(file, { force: true }); });
