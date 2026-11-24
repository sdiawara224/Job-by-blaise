import { dom } from './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

await mkdir('.cache', { recursive: true });
await build({ stdin: { contents: "export { default as Profile } from './client/src/pages/Profile.jsx'; export { default as Alerts } from './client/src/pages/Alerts.jsx'; export { AuthProvider } from './client/src/auth.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: '.cache/candidate-ui-test.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' } });
const { Profile, Alerts, AuthProvider } = await import('../.cache/candidate-ui-test.mjs');
const container = document.getElementById('root');
const profile = { fullName: 'Test', phone: '', city: 'Conakry', title: '', education: '', bio: '', experienceYears: 0, skills: [], jobTypes: [], preferredCities: [], cv: {} };

for (const [Component, path, heading, payload] of [
  [Profile, '/profile', 'Mon profil', { profile, completion: { percent: 0, checks: [] } }],
  [Alerts, '/alerts', 'Mes alertes SMS', { settings: { enabled: false, phone: '', sendTime: '07:00', keywords: [], cities: [], contracts: [] }, messages: [] }],
]) {
  test(`${path} : une erreur initiale est visible et la relance rétablit l’écran`, async () => {
    localStorage.clear();
    let attempts = 0;
    globalThis.fetch = async (url) => {
      if (url === `/api${path}` && ++attempts === 1) return { ok: false, status: 503, json: async () => ({ error: 'Service temporairement indisponible.' }) };
      return { ok: true, json: async () => url === `/api${path}` ? payload : { skills: [], allCities: [] } };
    };
    const root = createRoot(container);
    try {
      await React.act(async () => root.render(React.createElement(MemoryRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AuthProvider, null, React.createElement(Component)))));
      assert.match(container.querySelector('[role="alert"]').textContent, /Service temporairement indisponible/);
      const retry = [...container.querySelectorAll('button')].find(b => b.textContent === 'Réessayer');
      assert.ok(retry);
      await React.act(async () => retry.click());
      assert.equal(container.querySelector('h1').textContent, heading);
      assert.equal(container.querySelector('[role="alert"]'), null);
      assert.equal(attempts, 2);
    } finally {
      await React.act(async () => root.unmount());
    }
  });
}
