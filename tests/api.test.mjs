import test from 'node:test';
import assert from 'node:assert/strict';
import { fmtDate } from '../client/src/api.js';

test('Postgres offsets, UTC et SQLite produisent la même date', () => {
  const expected = fmtDate('2025-01-15T12:00:00Z');
  assert.equal(fmtDate('2025-01-15T12:00:00+00:00'), expected);
  assert.equal(fmtDate('2025-01-15 12:00:00'), expected);
  assert.equal(fmtDate('2025-01-15T14:00:00+02:00'), expected);
  assert.equal(fmtDate('2025-01-15T12:00:00+0000'), expected);
  assert.ok(!expected.includes('Invalid'));
});
test('Dates absentes et invalides : texte de repli', () => {
  for (const value of [null, undefined, '', 'incorrect']) {
    assert.equal(fmtDate(value), 'Date non précisée');
  }
});
test('Date récente correctement affichée', () => {
  assert.equal(fmtDate(new Date().toISOString()), "Aujourd'hui");
});
