// Facultatif : npm install --no-save --package-lock=false playwright @sparticuz/chromium
// Puis : node tests/jobs-layout.browser.mjs
// Vrais routeur, composants et CSS ; API simulée, aucune donnée de production modifiée.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs22.x';
const { default: chromium } = await import('@sparticuz/chromium');
const { chromium: playwright } = await import('playwright');
const jobs = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1, title: `Assistant administratif ${i + 1}`, company: { name: 'Entreprise test', color: '#2E6BFF' },
  city: i % 2 ? 'Kindia' : 'Conakry', country: 'Guinée', contract: 'CDI', domain: 'Administration',
  description: 'Gestion administrative et suivi des dossiers.', salaryMin: 3000000, salaryMax: 5000000, postedAt: '2026-10-28',
}));
const bundle = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import App from './client/src/App.jsx';import {AuthProvider} from './client/src/auth.jsx';createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter>);`, resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, write: false, format: 'iife', jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"' } });
const css = await readFile('client/src/styles.css', 'utf8');
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
const page = await browser.newPage({ reducedMotion: 'no-preference' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let failNext = false;
await page.route('http://jobs.test/**', async route => {
  const url = new URL(route.request().url());
  if (url.pathname === '/api/jobs/meta') return route.fulfill({ json: { cities: ['Conakry', 'Kindia'], contracts: ['CDI'], domains: ['Administration'] } });
  if (url.pathname === '/api/jobs') {
    await new Promise(resolve => setTimeout(resolve, 120));
    if (failNext) { failNext = false; return route.fulfill({ status: 503, json: { error: 'Indisponible temporairement' } }); }
    const filtered = jobs.filter(job => (!url.searchParams.get('city') || job.city === url.searchParams.get('city')) && (!url.searchParams.get('search') || job.title.includes(url.searchParams.get('search'))));
    return route.fulfill({ json: { jobs: filtered, total: filtered.length } });
  }
  return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>` });
});
async function visibleCards(count) {
  await page.waitForFunction(count => document.querySelectorAll('.job-card').length === count, count);
  // Vérifie aussi les ancêtres : Playwright considère un élément opacity:0 comme visible.
  await page.waitForFunction(() => [...document.querySelectorAll('.job-card')].every(card => {
    for (let node = card; node; node = node.parentElement) if (Number(getComputedStyle(node).opacity) < .99) return false;
    return true;
  }), null, { timeout: 2500 });
}
await mkdir('.cache', { recursive: true });
try {
  for (const width of [1568, 1280, 900, 768, 480, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('http://jobs.test/jobs');
    await visibleCards(60);
    assert.match(await page.locator('.jobsboard-meta').innerText(), /60 offres trouvées/);
    assert.match(await page.locator('.job-card').first().innerText(), /Entreprise test[\s\S]*CDI[\s\S]*Administration[\s\S]*Gestion administrative/);
    assert.equal(await page.locator('.job-card-title').last().getAttribute('href'), '/jobs/60');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Débordement à ${width}px`);
    if ([1568, 390].includes(width)) await page.screenshot({ path: `.cache/jobs-${width}.png` });
    await page.locator('.job-card').last().scrollIntoViewIfNeeded();
    await visibleCards(60);
    await page.getByLabel('Ville', { exact: true }).selectOption('Conakry');
    await visibleCards(30);
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click();
    await visibleCards(60);
  }
  await page.getByRole('textbox', { name: 'Rechercher', exact: true }).fill('introuvable');
  await page.getByText('Aucune offre ne correspond à ces critères').waitFor();
  failNext = true;
  await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click();
  await page.getByText('Indisponible temporairement', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Réessayer/ }).click();
  await visibleCards(60);
  assert.deepEqual(errors, []);
  console.log('PASS : 60 offres visibles sans animation bloquante, 7 largeurs, filtres, réinitialisation, état vide et nouvelle tentative.');
} finally { await browser.close(); }
