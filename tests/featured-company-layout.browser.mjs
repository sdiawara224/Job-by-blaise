// Test visuel facultatif : npm install --no-save --package-lock=false playwright @sparticuz/chromium
// Puis : node tests/featured-company-layout.browser.mjs
// Utilise le vrai composant et la vraie feuille CSS, uniquement avec des données fictives.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs22.x';
const { default: chromium } = await import('@sparticuz/chromium');
const { chromium: playwright } = await import('playwright');
const fixtures = [
  { id: 1, name: 'BANQUE DU SAHEL GUINÉE', sector: 'Banque & Finance', color: '#0f766e', city: 'Conakry', foundedYear: 2010, staffSize: '501 à 1000 collaborateurs', jobCount: 6 },
  { id: 2, name: 'DIGITAL CONAKRY', sector: 'Technologie & Numérique', color: '#2563eb', city: 'Conakry', foundedYear: 2020, staffSize: '1 à 10 collaborateurs', jobCount: 5 },
  { id: 3, name: 'DOUALA INDUSTRIES', sector: 'Industrie & BTP', color: '#7c2d12', city: 'Douala', foundedYear: 2012, staffSize: '201 à 500 collaborateurs', jobCount: 5 },
];
const bundle = await build({
  stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import { MemoryRouter } from 'react-router-dom'; import FeaturedCompanyCard from './client/src/components/FeaturedCompanyCard.jsx'; createRoot(document.getElementById('root')).render(<MemoryRouter><section className="featured-companies"><div className="container featured-companies-grid">{${JSON.stringify(fixtures)}.map(company => <FeaturedCompanyCard key={company.id} company={company}/>)}</div></section></MemoryRouter>);`, resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, format: 'iife', write: false, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
});
const css = await readFile('client/src/styles.css', 'utf8');
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('.cache', { recursive: true });
try {
  for (const width of [1568, 1280, 901, 900, 768, 701, 700, 480, 390, 320]) {
    for (const largeText of [false, true]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style></head><body><div id="root"></div></body></html>');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.locator('.featured-company').first().waitFor();
      if (largeText) await page.locator('.featured-company-sector, .featured-company-cover > strong').evaluateAll(nodes => nodes.forEach(node => { node.style.fontSize = `${parseFloat(getComputedStyle(node).fontSize) * 1.5}px`; }));
      const cards = await page.locator('.featured-company').evaluateAll(nodes => nodes.map(card => {
        const box = selector => card.querySelector(selector).getBoundingClientRect();
        const slogan = box('.featured-company-cover > strong');
        const logo = box('.featured-company-logo');
        const heading = box('h3');
        const sector = box('.featured-company-sector');
        return { gap: logo.top - slogan.bottom, logoToHeading: heading.top - logo.bottom, sectorToSlogan: slogan.top - sector.bottom, overflow: card.scrollWidth - card.clientWidth };
      }));
      for (const [i, card] of cards.entries()) {
        assert.ok(card.gap >= 16, `${width}px ${largeText ? 'texte agrandi' : 'normal'} carte ${i + 1} : slogan/logo superposés (écart ${card.gap}px)`);
        assert.ok(card.logoToHeading >= 12, `logo/nom : ${JSON.stringify(card)}`);
        assert.ok(card.sectorToSlogan >= 12, `secteur/slogan : ${JSON.stringify(card)}`);
        assert.ok(card.overflow <= 1, `débordement horizontal : ${JSON.stringify(card)}`);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `débordement page à ${width}px`);
      if (!largeText && [1568, 390].includes(width)) await page.screenshot({ path: `.cache/featured-companies-${width}.png`, fullPage: true });
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS : 3 cartes × 10 largeurs × 2 tailles de texte ; aucun chevauchement, débordement ou erreur JavaScript.');
} finally { await browser.close(); }
