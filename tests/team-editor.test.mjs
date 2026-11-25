import { dom } from './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { validateTeam, validTeamPhoto } from '../client/src/teamContent.js';

await mkdir('.cache', { recursive: true });
await build({ stdin: { contents: "export {default as TeamEditor} from './client/src/pages/admin/TeamEditor.jsx';export {default as Team} from './client/src/pages/Team.jsx';export {AuthProvider} from './client/src/auth.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: '.cache/team-editor-test.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'] });
const { TeamEditor, Team, AuthProvider } = await import('../.cache/team-editor-test.mjs');
const container = document.getElementById('root');
const member = { id: 'test-member', name: 'Personne test', role: 'Fonction test', bio: 'Présentation test.', photoUrl: '', isPublished: false };
const button = name => [...container.querySelectorAll('button')].find(node => node.textContent === name);
async function mount(Component, props = {}) {
  const root = createRoot(container);
  await React.act(async () => root.render(React.createElement(MemoryRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(Component, props))));
  return root;
}

test('équipe : validation partagée, limites et URL de photo sûres', () => {
  assert.deepEqual(validateTeam([member]), [member]);
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/photo.jpg', '/\\example.com/photo.jpg', 'http://example.com/photo.jpg']) assert.equal(validTeamPhoto(url), false, url);
  for (const url of ['', '/images/portrait.jpg', 'https://example.com/photo.jpg']) assert.equal(validTeamPhoto(url), true, url);
  for (const bad of [null, {}, Array.from({ length: 31 }, (_, i) => ({ ...member, id: `m-${i}` })), [{ ...member, bio: 'a'.repeat(2001) }], [{ ...member, id: '' }]]) assert.throws(() => validateTeam(bad));
});

test('équipe : formulaire admin, brouillon par défaut, publication, réordre et enregistrement', async () => {
  const calls = [], notices = [], dirties = [];
  globalThis.fetch = async (url, options = {}) => { calls.push({ url, ...options }); return { ok: true, json: async () => ({ members: options.method === 'PUT' ? JSON.parse(options.body).members : [member] }) }; };
  const root = await mount(TeamEditor, { notify: text => notices.push(text), onDirtyChange: value => dirties.push(value) });
  try {
    assert.equal(container.querySelector('input[type="checkbox"]').checked, false);
    await React.act(async () => button('Ajouter un membre').click());
    assert.equal(container.querySelectorAll('input[type="checkbox"]')[1].checked, false);
    const sections = container.querySelectorAll('.adm-team-member');
    for (const [suffix, value] of [['name', 'Autre personne'], ['role', 'Autre fonction'], ['bio', 'Autre présentation.']]) {
      const input = sections[1].querySelector(`[id$="-${suffix}"]`);
      await React.act(async () => { Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new window.Event('input', { bubbles: true })); });
    }
    await React.act(async () => sections[1].querySelector('input[type="checkbox"]').click());
    await React.act(async () => [...sections[1].querySelectorAll('button')].find(node => node.textContent === 'Monter').click());
    await React.act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    const payload = JSON.parse(calls.find(call => call.method === 'PUT').body).members;
    assert.equal(payload[0].name, 'Autre personne'); assert.equal(payload[0].isPublished, true);
    assert.equal(payload[1].id, member.id); assert.equal(payload[1].isPublished, false);
    assert.ok(notices.length); assert.ok(dirties.includes(true)); assert.equal(dirties.at(-1), false);
    assert.equal(button('Enregistrer l’équipe').disabled, true);
  } finally { await React.act(async () => root.unmount()); }
});

test('équipe : une panne de sauvegarde conserve les modifications et permet une nouvelle tentative', async () => {
  let attempts = 0;
  globalThis.fetch = async (url, options = {}) => options.method === 'PUT' && ++attempts === 1 ? { ok: false, status: 503, json: async () => ({ error: 'Panne simulée' }) } : { ok: true, json: async () => ({ members: options.method === 'PUT' ? JSON.parse(options.body).members : [member] }) };
  const root = await mount(TeamEditor, { notify: () => {}, onDirtyChange: () => {} });
  try {
    await React.act(async () => container.querySelector('input[type="checkbox"]').click());
    const submit = () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await React.act(async () => submit());
    assert.match(container.querySelector('[role="alert"]').textContent, /Panne simulée/);
    assert.equal(container.querySelector('input[type="checkbox"]').checked, true);
    await React.act(async () => submit()); assert.equal(attempts, 2);
  } finally { await React.act(async () => root.unmount()); }
});

test('équipe publique : profils API, biographie en texte et image manquante remplacée', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ members: [{ ...member, name: '<script>Nom test</script>', photoUrl: '/missing.jpg' }] }) });
  // Team requiert une Navbar et donc le contexte Auth.
  const Wrapped = () => React.createElement(AuthProvider, null, React.createElement(Team));
  const root = await mount(Wrapped);
  try {
    assert.match(container.querySelector('.team-card h2').textContent, /<script>/);
    assert.equal(container.querySelector('main script'), null);
    assert.equal(container.querySelectorAll('.team-card').length, 1);
    await React.act(async () => container.querySelector('.team-card img').dispatchEvent(new window.Event('error')));
    assert.equal(container.querySelector('.team-card img'), null);
    assert.match(container.querySelector('.team-card-photo').textContent, /Photo à venir/);
  } finally { await React.act(async () => root.unmount()); }
});
