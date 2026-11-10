import { dom } from './dom-setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DEFAULT_CONTENT } from '../client/src/siteContent.js';

await mkdir('.cache', { recursive: true });
await build({ stdin: { contents: "export { default as Admin } from './client/src/pages/Admin.jsx'; export { AuthProvider } from './client/src/auth.jsx'; export { default as CandidateCv } from './client/src/pages/admin/CandidateCv.jsx'; export { default as RecordDialog } from './client/src/pages/admin/RecordDialog.jsx'; export { default as ArticleBody } from './client/src/components/ArticleBody.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, outfile: '.cache/admin-ui-test.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' } });
const { Admin, AuthProvider, CandidateCv, RecordDialog, ArticleBody } = await import('../.cache/admin-ui-test.mjs');
window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
window.HTMLDialogElement.prototype.close = function () { this.open = false; };
const container = document.getElementById('root');
const act = React.act;
const wait = () => new Promise((resolve) => setTimeout(resolve, 250));
async function mount(path = '/admin/jobs', isAdmin = true) {
  localStorage.setItem('jobbyblaise_token', 'test-token');
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, ...options });
    const body = url === '/api/admin/content' ? { content: options.method === 'PUT' ? JSON.parse(options.body).content : DEFAULT_CONTENT } : url === '/api/auth/me' ? { user: { id: 1, fullName: 'Test Admin', email: 'admin@example.com', isAdmin } }
      : url === '/api/admin/summary' ? { stats: { jobs: 2, activeJobs: 1, users: 3, applications: 1, companies: 1, pending: 1, alerts: 1, advice: 2 }, recent: [], backend: 'sqlite' }
      : url === '/api/admin/options' ? { companies: [{ id: 1, name: 'Entreprise test' }] }
      : url.startsWith('/api/admin/jobs?') ? { items: [{ id: 1, title: 'Assistant', company_name: 'Entreprise test', city: 'Conakry', is_active: 1 }], total: 1, page: 1, limit: 20 }
      : { ok: true };
    return { ok: true, json: async () => body };
  };
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(MemoryRouter, { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AuthProvider, null, React.createElement(Routes, null,
      React.createElement(Route, { path: '/admin', element: React.createElement(Admin) }),
      React.createElement(Route, { path: '/admin/:section', element: React.createElement(Admin) }),
    ))));
  });
  await act(wait);
  return { root, calls };
}
const button = (text) => [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === text);

test('UI : un candidat voit un refus et ne charge aucune ressource admin', async () => {
  const { root, calls } = await mount('/admin/jobs', false);
  try {
    assert.match(container.textContent, /Un espace réservé à l’équipe/);
    assert.ok(!calls.some((c) => c.url.startsWith('/api/admin/')));
  } finally { await act(async () => root.unmount()); }
});
test('UI : liste réelle, statut, formulaire et création non publiée par défaut', async () => {
  const { root, calls } = await mount();
  try {
    assert.match(container.querySelector('tbody').textContent, /Assistant/);
    assert.match(container.querySelector('tbody').textContent, /Publiée/);
    await act(async () => button('Créer une offre').click());
    const dialog = container.querySelector('dialog[open]'); assert.ok(dialog);
    const field = [...dialog.querySelectorAll('label')].find((el) => el.textContent.startsWith('Publication')).querySelector('select');
    assert.equal(field.value, '0');
    await act(async () => {
      const title = dialog.querySelector('#adm-record-title');
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(title, 'Assistant test');
      title.dispatchEvent(new window.Event('input', { bubbles: true }));
      const company = dialog.querySelector('#adm-record-company_id');
      company.value = '1'; company.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    await act(async () => dialog.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    const write = calls.find((c) => c.url === '/api/admin/jobs' && c.method === 'POST');
    assert.ok(write); assert.equal(JSON.parse(write.body).is_active, 0);
    assert.equal(container.querySelector('dialog'), null);
    assert.match(container.querySelector('[role="status"]').textContent, /Nouveau contenu créé/);
  } finally { await act(async () => root.unmount()); }
});
test('UI : raccourci du tableau de bord ouvre le formulaire de création', async () => {
  const { root } = await mount('/admin');
  try {
    assert.match(container.textContent, /Dernières candidatures/);
    await act(async () => button('Créer une offre').click());
    assert.ok(container.querySelector('dialog[open]'));
    assert.match(container.querySelector('dialog').textContent, /Créer une offre/);
  } finally { await act(async () => root.unmount()); }
});
test('UI : filtres et tri sont transmis à l’API puis réinitialisables', async () => {
  const { root, calls } = await mount();
  try {
    const select = container.querySelector('[aria-label="Trier les enregistrements"]');
    await act(async () => { select.value = 'az'; select.dispatchEvent(new window.Event('change', { bubbles: true })); });
    await act(wait);
    assert.ok(calls.some((c) => c.url.startsWith('/api/admin/jobs?') && new URLSearchParams(c.url.split('?')[1]).get('sort') === 'az'));
    await act(async () => button('Réinitialiser').click()); await act(wait);
    assert.equal(select.value, 'newest');
  } finally { await act(async () => root.unmount()); }
});
test('UI : supprimer demande une confirmation explicite et annuler ne modifie rien', async () => {
  const { root, calls } = await mount();
  try {
    const remove = () => container.querySelector('[aria-label="Supprimer Assistant"]');
    await act(async () => remove().click());
    const dialog = container.querySelector('[role="alertdialog"]');
    assert.ok(dialog); assert.match(dialog.textContent, /Assistant/);
    assert.ok(!calls.some((c) => c.method === 'DELETE'));
    assert.equal(document.activeElement.textContent, 'Conserver');
    await act(async () => button('Conserver').click());
    assert.equal(container.querySelector('[role="alertdialog"]'), null);
    assert.ok(!calls.some((c) => c.method === 'DELETE'));
    await act(async () => remove().click());
    await act(async () => button('Supprimer définitivement').click());
    assert.ok(calls.some((c) => c.method === 'DELETE' && c.url === '/api/admin/jobs/1'));
  } finally { await act(async () => root.unmount()); }
});
test('UI : édition par sections, aperçu local et validation des champs des autres onglets', async () => {
  const { root, calls } = await mount('/admin/content');
  const change = async (id, value) => {
    const input = document.getElementById(id);
    await act(async () => {
      Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
  };
  try {
    assert.equal(container.querySelectorAll('[role="tab"]').length, 7);
    assert.equal(container.querySelectorAll('.adm-copy-fields label').length, 3);
    await change('adm-content-heroSubtitle', 'Votre avenir commence ici.');
    assert.match(container.querySelector('.adm-copy-preview').textContent, /Votre avenir commence ici/);
    assert.ok(!calls.some((c) => c.method === 'PUT'));
    const footerTab = [...container.querySelectorAll('[role="tab"]')].find((el) => el.textContent.includes('Pied de page'));
    await act(async () => footerTab.click());
    await change('adm-content-contactEmail', 'invalide');
    await act(async () => container.querySelector('[role="tab"]').click());
    await act(async () => container.querySelector('.adm-content-editor').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(container.querySelector('[role="tab"][aria-selected=true]').textContent, 'Pied de page');
    assert.ok(document.getElementById('adm-content-contactEmail').getAttribute('aria-invalid'));
    assert.ok(!calls.some((c) => c.method === 'PUT'));
    await change('adm-content-contactEmail', 'contact@example.com');
    await act(async () => container.querySelector('.adm-content-editor').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    const payload = JSON.parse(calls.find((c) => c.method === 'PUT').body);
    assert.equal(payload.content.heroSubtitle, 'Votre avenir commence ici.');
    assert.equal(payload.content.contactEmail, 'contact@example.com');
  } finally { await act(async () => root.unmount()); }
});
test('UI : CV lisible, champs malformés tolérés et texte échappé', async () => {
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(CandidateCv, { record: { full_name: 'Test Candidat', skills: '["Excel"]', cv: JSON.stringify({ summary: '<script>test</script>', experiences: [null, { role: 'Assistant', org: 'Entreprise', period: '2024 – 2026', detail: 'Gestion documentaire' }], education: [{ level: 'BTS Gestion', org: 'Institut' }] }) } })));
    assert.match(container.textContent, /Assistant/); assert.match(container.textContent, /BTS Gestion/);
    assert.match(container.textContent, /Excel/); assert.equal(container.querySelector('script'), null);
    assert.equal(container.querySelector('pre'), null);
    await act(async () => root.render(React.createElement(CandidateCv, { record: { full_name: 'Profil vide', cv: '{incorrect', skills: 'null' } })));
    assert.match(container.textContent, /Le CV reste à compléter/);
  } finally { await act(async () => root.unmount()); }
});
test('UI : validation depuis l’aperçu, saisies conservées et enregistrement verrouillé', async () => {
  const root = createRoot(container);
  let complete, saved = 0;
  const calls = [];
  globalThis.fetch = (url, options) => { calls.push({ url, ...options }); return new Promise((resolve) => { complete = () => resolve({ ok: true, json: async () => ({ ok: true }) }); }); };
  const set = async (key, value) => {
    const field = document.getElementById(`adm-record-${key}`);
    await act(async () => {
      if (field.tagName === 'SELECT') { field.value = value; field.dispatchEvent(new window.Event('change', { bubbles: true })); }
      else { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(field, value); field.dispatchEvent(new window.Event('input', { bubbles: true })); }
    });
  };
  try {
    await act(async () => root.render(React.createElement(RecordDialog, { section: 'jobs', record: { country: 'Guinée', city: 'Conakry', contract: 'CDI', domain: 'Administration', salary_min: 0, salary_max: 0, experience_min: 0, education_min: '', skills: [], description: '', requirements: '', is_active: 0 }, companies: [{ id: 1, name: 'Entreprise' }], onClose: () => {}, onSaved: () => { saved++; } })));
    await act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(document.activeElement.id, 'adm-record-title'); assert.equal(calls.length, 0);
    await set('title', 'Assistant test'); await set('company_id', '1');
    await set('salary_min', '500'); await set('salary_max', '100');
    await act(async () => button('Aperçu local').click());
    assert.match(container.querySelector('.adm-record-preview').textContent, /Assistant test/);
    assert.equal(calls.length, 0);
    await act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(document.activeElement.id, 'adm-record-salary_max');
    assert.ok(container.querySelector('#adm-record-salary_max-error'));
    await set('salary_max', '700');
    const unload = new window.Event('beforeunload', { cancelable: true }); window.dispatchEvent(unload); assert.equal(unload.defaultPrevented, true);
    await act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(calls.length, 1); assert.ok(container.querySelector('fieldset').disabled);
    assert.equal(JSON.parse(calls[0].body).title, 'Assistant test');
    await act(async () => complete()); assert.equal(saved, 1);
  } finally { await act(async () => root.unmount()); }
});
test('article public et aperçu : gras et listes sans exécuter du HTML', async () => {
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(ArticleBody, { text: '**Bonjour**\n- Conseil\n\n**<img src=x onerror=alert(1)>**' })));
    assert.equal(container.querySelector('b').textContent, 'Bonjour');
    assert.ok(container.querySelector('.art-li.dash')); assert.ok(container.querySelector('.art-gap'));
    assert.equal(container.querySelector('img'), null); assert.match(container.textContent, /<img/);
  } finally { await act(async () => root.unmount()); }
});
test.after(async () => { dom.window.close(); await rm('.cache/admin-ui-test.mjs', { force: true }); });
