// Facultatif : npm install --no-save --package-lock=false playwright @sparticuz/chromium
// Puis : node tests/team-layout.browser.mjs
// Composants/CSS réels ; données de test uniquement, aucun accès à la production.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs22.x';
const { default: chromium } = await import('@sparticuz/chromium');
const { chromium: playwright } = await import('playwright');
const bundle = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import Team from './client/src/pages/Team.jsx';import{AuthProvider}from'./client/src/auth.jsx';createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/notre-equipe']}><AuthProvider><Team/></AuthProvider></MemoryRouter>);`, resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } });
const css = await readFile('client/src/styles.css', 'utf8');
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
const page = await browser.newPage();
let empty = false, failed = false;
const portrait = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#e4ecff"/><circle cx="300" cy="260" r="90" fill="#2e6bff"/><path d="M100 700V600a200 200 0 0 1 400 0v100" fill="#2e6bff"/></svg>';
const members = Array.from({ length: 3 }, (_, index) => ({ id: `test-${index}`, name: `Profil de test ${index + 1}`, role: ['Coordination', 'Accompagnement des candidats', 'Relations entreprises'][index], bio: 'Présentation de test pour vérifier le format des cartes, la lisibilité et les espacements sur tous les écrans.', photoUrl: index === 1 ? '/broken.jpg' : '/portrait.svg', isPublished: true }));
const errors = []; page.on('pageerror', error => errors.push(error.message));
await page.route('http://team.test/**', route => {
  const url = new URL(route.request().url());
  if (url.pathname === '/api/team') return failed ? route.fulfill({ status: 503, json: { error: 'Panne simulée' } }) : route.fulfill({ json: { members: empty ? [] : members } });
  if (url.pathname === '/portrait.svg') return route.fulfill({ contentType: 'image/svg+xml', body: portrait });
  if (url.pathname === '/broken.jpg') return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>` });
});
await mkdir('.cache', { recursive: true });
try {
  for (const width of [1568, 1280, 1024, 900, 768, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://team.test/notre-equipe');
    await page.locator('.team-card').last().waitFor();
    await page.waitForFunction(() => document.querySelectorAll('.team-card img').length === 2 && [...document.images].every(img => img.complete));
    const check = async () => {
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Débordement à ${width}px`);
      const layout = await page.locator('.team-grid').evaluate(grid => ({ columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, opacity: getComputedStyle(grid).opacity, cards: [...grid.children].map(card => ({ scroll: card.scrollWidth, width: card.clientWidth, photo: card.querySelector('.team-card-photo').getBoundingClientRect().bottom, name: card.querySelector('h2').getBoundingClientRect().top })) }));
      assert.equal(layout.columns, width > 900 ? 3 : width > 600 ? 2 : 1);
      assert.equal(layout.opacity, '1');
      for (const card of layout.cards) { assert.ok(card.scroll <= card.width); assert.ok(card.name >= card.photo + 20); }
    };
    await check();
    if ([1568, 390].includes(width)) await page.screenshot({ path: `.cache/team-cards-${width}.png`, fullPage: true });
    await page.locator('.team-card-copy').evaluateAll(nodes => nodes.forEach(node => { for (const child of node.children) child.style.fontSize = `${parseFloat(getComputedStyle(child).fontSize) * 1.5}px`; }));
    await check();
  }
  empty = true; await page.reload(); await page.getByText('La présentation de notre équipe sera disponible prochainement.').waitFor();
  assert.equal(await page.locator('.team-card-upcoming').count(), 3);
  failed = true; await page.reload(); await page.getByText('Panne simulée', { exact: true }).waitFor();
  failed = false; empty = false; await page.getByRole('button', { name: 'Réessayer' }).click(); await page.locator('.team-card').last().waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS : cartes équipe sur 8 largeurs × 2 tailles de texte, 3/2/1 colonnes, photos de repli, état vide et nouvelle tentative.');
} finally { await browser.close(); }
