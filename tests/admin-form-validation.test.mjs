import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord, decodeList } from '../client/src/pages/admin/recordValidation.js';
import { SECTIONS } from '../client/src/pages/adminConfig.js';
const check = (section, form) => validateRecord(section, SECTIONS[section].fields, form, [{ id: 1, name: 'Entreprise' }]);
const job = { ...SECTIONS.jobs.defaults, title: 'Assistant', company_id: '1' };

test('formulaires : champs requis, entreprises existantes et salaires cohérents', () => {
  assert.deepEqual(check('jobs', job), {});
  const errors = check('jobs', { ...job, title: '   ', company_id: '999', salary_min: 500, salary_max: 100 });
  assert.ok(errors.title); assert.ok(errors.company_id); assert.ok(errors.salary_max);
  assert.deepEqual(check('jobs', { ...job, salary_min: 500, salary_max: 0 }), {});
});
test('formulaires : limites de texte, entiers, dates et listes', () => {
  assert.ok(check('jobs', { ...job, title: 'a'.repeat(181) }).title);
  assert.ok(check('jobs', { ...job, salary_min: -1 }).salary_min);
  assert.ok(check('jobs', { ...job, salary_min: '' }).salary_min);
  assert.ok(check('jobs', { ...job, experience_min: 1.5 }).experience_min);
  assert.ok(check('jobs', { ...job, skills: Array(51).fill('test').join(',') }).skills);
  assert.ok(check('companies', { ...SECTIONS.companies.defaults, name: 'Entreprise', sector: 'Transport', founded_year: 1799 }).founded_year);
});
test('formulaires : article obligatoire, choix fermés et heures valides', () => {
  assert.ok(check('advice', { ...SECTIONS.advice.defaults, title: 'Titre', content: '   ' }).content);
  assert.ok(check('advice', { ...SECTIONS.advice.defaults, title: 'Titre', content: 'Texte', minutes: 121 }).minutes);
  assert.ok(check('applications', { status: 'Invalide' }).status);
  assert.deepEqual(check('applications', { status: 'En attente' }), {});
  assert.ok(check('alerts', { enabled: 1, phone: '', send_time: '25:99', keywords: '', cities: '', contracts: '' }).send_time);
});
test('listes existantes malformées : un tableau sûr est toujours renvoyé', () => {
  for (const value of ['null', '{}', 'invalide', null]) assert.deepEqual(decodeList(value), []);
  assert.deepEqual(decodeList('["Excel",null,1]'), ['Excel']);
});
