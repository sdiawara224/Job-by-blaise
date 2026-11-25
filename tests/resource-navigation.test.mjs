import { dom } from './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

await mkdir('.cache', { recursive: true });
await build({ stdin: { contents: "export { default as JobDetail } from './client/src/pages/JobDetail.jsx'; export { default as EntrepriseDetail } from './client/src/pages/EntrepriseDetail.jsx'; export { default as AdviceDetail } from './client/src/pages/AdviceDetail.jsx'; export { default as JobsBoard } from './client/src/components/JobsBoard.jsx'; export { AuthProvider, useAuth } from './client/src/auth.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: '.cache/resource-navigation-test.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' } });
const { JobDetail, EntrepriseDetail, AdviceDetail, JobsBoard, AuthProvider, useAuth } = await import('../.cache/resource-navigation-test.mjs');
const container = document.getElementById('root');
// Déterministe sous jsdom : pas de compteur animé pendant les assertions.
window.matchMedia = () => ({ matches: true });
const company = { id: 1, name: 'Entreprise test', color: '#2E6BFF', city: 'Conakry', sector: 'Tests', rating: 4, jobCount: 0 };
const job = (id) => ({ id, title: `Poste ${id}`, company, city: 'Conakry', country: 'Guinée', skills: [], contract: 'CDD', postedAt: '2025-01-01' });
const fixtures = [
  [JobDetail, 'jobs', (id) => ({ job: job(id), applied: false }), (id) => `Poste ${id}`],
  [EntrepriseDetail, 'companies', (id) => ({ company: { ...company, id, name: `Entreprise ${id}` }, jobs: [] }), (id) => `Entreprise ${id}`],
  [AdviceDetail, 'advice', (id) => ({ article: { id, title: `Conseil ${id}`, content: 'Un conseil utile.', color: '#2E6BFF' } }), (id) => `Conseil ${id}`],
];
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
let navigate, auth;
function Controls({ children }) { navigate = useNavigate(); auth = useAuth(); return children; }
async function mount(Component, path = '/test/1') {
  localStorage.clear();
  const root = createRoot(container);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AuthProvider, null, React.createElement(Controls, null, React.createElement(Routes, null, React.createElement(Route, { path: '/test/:id', element: React.createElement(Component) })))))));
  return root;
}
const retryButton = () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Réessayer');

for (const [Component, resource, fixture, heading] of fixtures) {
  test(`${resource} : l’ancienne fiche disparaît pendant le chargement de la suivante`, async () => {
    let resolveNext;
    globalThis.fetch = url => url.endsWith('/1') ? Promise.resolve(response(fixture(1))) : new Promise(resolve => { resolveNext = resolve; });
    const root = await mount(Component);
    try {
      assert.equal(container.querySelector('h1')?.textContent, heading(1));
      await React.act(async () => navigate('/test/2'));
      assert.equal(container.querySelector('h1'), null);
      await React.act(async () => resolveNext(response(fixture(2))));
      assert.equal(container.querySelector('h1')?.textContent, heading(2));
    } finally { await React.act(async () => root.unmount()); }
  });

  test(`${resource} : une erreur ne bloque pas la fiche suivante`, async () => {
    globalThis.fetch = async url => url.endsWith('/1') ? response({ error: 'Fiche introuvable.' }, 404) : response(fixture(2));
    const root = await mount(Component);
    try {
      assert.match(container.textContent, /Fiche introuvable/);
      await React.act(async () => navigate('/test/2'));
      assert.equal(container.querySelector('h1')?.textContent, heading(2));
      assert.ok(!container.textContent.includes('Fiche introuvable'));
    } finally { await React.act(async () => root.unmount()); }
  });

  test(`${resource} : une réponse ancienne ne remplace pas la fiche courante`, async () => {
    let resolveOld;
    globalThis.fetch = url => url.endsWith('/1') ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(response(fixture(2)));
    const root = await mount(Component);
    try {
      await React.act(async () => navigate('/test/2'));
      assert.equal(container.querySelector('h1')?.textContent, heading(2));
      await React.act(async () => resolveOld(response(fixture(1))));
      assert.equal(container.querySelector('h1')?.textContent, heading(2));
      assert.ok(document.title.includes(heading(2)));
    } finally { await React.act(async () => root.unmount()); }
  });

  test(`${resource} : relancer après une panne sans recharger le navigateur`, async () => {
    let attempts = 0;
    globalThis.fetch = async () => ++attempts === 1 ? response({ error: 'Service indisponible.' }, 503) : response(fixture(1));
    const root = await mount(Component);
    try {
      assert.ok(retryButton());
      await React.act(async () => retryButton().click());
      assert.equal(container.querySelector('h1')?.textContent, heading(1));
      assert.equal(attempts, 2);
    } finally { await React.act(async () => root.unmount()); }
  });
}

test('recherche : une panne ne doit pas être présentée comme une recherche vide', async () => {
  let attempts = 0;
  globalThis.fetch = async url => url === '/api/jobs/meta' ? response({ cities: [], contracts: [], domains: [] }) : ++attempts === 1 ? response({ error: 'Recherche indisponible.' }, 503) : response({ jobs: [job(1)], total: 1 });
  const root = await mount(JobsBoard);
  try {
    assert.match(container.textContent, /Recherche indisponible/);
    assert.ok(!container.textContent.includes('Aucune offre ne correspond'));
    assert.ok(!container.textContent.includes('0 offre trouvée'));
    assert.ok(retryButton());
    await React.act(async () => retryButton().click());
    assert.match(container.textContent, /Poste 1/);
  } finally { await React.act(async () => root.unmount()); }
});

test('recherche : seul le résultat du filtre courant reste affiché', async () => {
  let rejectOld;
  globalThis.fetch = url => url === '/api/jobs/meta' ? Promise.resolve(response({ cities: [], contracts: [], domains: [] })) : url.includes('search=ancien') ? new Promise((resolve, reject) => { rejectOld = reject; }) : Promise.resolve(response({ jobs: [job(2)], total: 1 }));
  const root = await mount(JobsBoard, '/test/1?search=ancien');
  try {
    await React.act(async () => navigate('/test/1?search=nouveau'));
    assert.match(container.textContent, /Poste 2/);
    await React.act(async () => rejectOld(new Error('Ancienne erreur à ignorer')));
    assert.match(container.textContent, /Poste 2/);
    assert.ok(!container.textContent.includes('Ancienne erreur'));
  } finally { await React.act(async () => root.unmount()); }
});

test('recherche : une réponse lente ne réaffiche pas les anciens résultats', async () => {
  let resolveOld;
  globalThis.fetch = url => url === '/api/jobs/meta' ? Promise.resolve(response({ cities: [], contracts: [], domains: [] })) : url.includes('search=ancien') ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(response({ jobs: [job(2)], total: 1 }));
  const root = await mount(JobsBoard, '/test/1?search=ancien');
  try {
    await React.act(async () => navigate('/test/1?search=nouveau'));
    assert.match(container.textContent, /Poste 2/);
    await React.act(async () => resolveOld(response({ jobs: [job(1)], total: 1 })));
    assert.match(container.textContent, /Poste 2/);
    assert.ok(!container.textContent.includes('Poste 1'));
  } finally { await React.act(async () => root.unmount()); }
});

test('recherche : les filtres peuvent être rechargés indépendamment des offres', async () => {
  let metaAttempts = 0, jobCalls = 0;
  globalThis.fetch = async url => {
    if (url === '/api/jobs/meta') return ++metaAttempts === 1 ? response({ error: 'Panne des filtres' }, 503) : response({ cities: ['Conakry'], contracts: ['CDD'], domains: ['Tests'] });
    jobCalls++;
    return response({ jobs: [job(1)], total: 1 });
  };
  const root = await mount(JobsBoard);
  try {
    assert.match(container.textContent, /Les filtres sont temporairement indisponibles/);
    assert.match(container.textContent, /Poste 1/);
    await React.act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Recharger les filtres').click());
    assert.ok(!container.textContent.includes('Les filtres sont temporairement indisponibles'));
    assert.ok([...container.querySelectorAll('[aria-label="Ville"] option')].some(o => o.value === 'Conakry'));
    assert.equal(jobCalls, 1);
  } finally { await React.act(async () => root.unmount()); }
});

test('recherche : connexion, profil modifié et déconnexion rafraîchissent les résultats personnalisés', async () => {
  let calls = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (url === '/api/jobs/meta') return response({ cities: [], contracts: [], domains: [] });
    if (url === '/api/auth/login') return response({ token: 'session-test', user: { id: 1, fullName: 'Candidat' } });
    calls++;
    const authenticated = !!options.headers.Authorization;
    return response({ jobs: [{ ...job(1), title: `Résultat ${calls}`, match: authenticated ? { score: 82 } : null }], total: 1 });
  };
  const root = await mount(JobsBoard);
  try {
    assert.equal(calls, 1);
    await React.act(async () => auth.login('candidat@example.com', 'test123456'));
    assert.equal(calls, 2);
    assert.match(container.textContent, /82%/);
    await React.act(async () => auth.updateUser({ title: 'Nouveau titre' }));
    assert.equal(calls, 3);
    assert.match(container.textContent, /Résultat 3/);
    await React.act(async () => auth.logout());
    assert.equal(calls, 4);
    assert.ok(!container.textContent.includes('82%'));
  } finally { await React.act(async () => root.unmount()); }
});

test('recherche : toutes les offres sont rendues sans dépendre d’une animation de grille', async () => {
  const jobs = Array.from({ length: 60 }, (_, i) => job(i + 1));
  globalThis.fetch = async url => url === '/api/jobs/meta'
    ? response({ cities: ['Conakry'], contracts: ['CDD'], domains: [] })
    : response({ jobs, total: jobs.length });
  const root = await mount(JobsBoard);
  try {
    const grid = container.querySelector('.jobs-grid');
    assert.equal(grid.getAttribute('aria-label'), 'Offres d’emploi disponibles');
    assert.equal(grid.classList.contains('reveal'), false);
    assert.equal(grid.classList.contains('stagger'), false);
    assert.equal(grid.querySelectorAll('article.job-card').length, 60);
    assert.match(container.querySelector('.jobsboard-meta').textContent, /60 offres trouvées/);
    assert.equal(grid.querySelectorAll('.job-card-title')[59].getAttribute('href'), '/jobs/60');
  } finally { await React.act(async () => root.unmount()); }
});
