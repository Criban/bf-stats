import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/app/services/bf6-stats-history.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { compareDailyStats } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const entries = new Map();
const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
const initial = { killDeath: 2, hoursPlayed: 10, matchesPlayed: 538, accuracy: 25, shotsFired: 2000 };
const update = { ...initial, killDeath: 1.9, matchesPlayed: 540, accuracy: 26, shotsFired: 2100 };
const visit = (stats, date, name = 'Player A') => compareDailyStats(name, stats, new Date(date), storage);
const history = (name = 'Player A') => JSON.parse(entries.get(`bf6-stats-history:v2:${encodeURIComponent(name)}`)).snapshots;

assert.equal(visit(initial, '2026-10-02T10:00:00Z').baseline, null);
assert.equal(visit(update, '2026-10-02T11:00:00Z').baseline, null);
assert.equal(history().length, 1, 'Reloads update one entry for today');
assert.deepEqual(history()[0].values, update);
const nextDay = visit(initial, '2026-10-02T22:00:00Z'); // Midnight in Berlin.
assert.deepEqual(nextDay.baseline.values, update);
assert.deepEqual(visit(update, '2026-10-03T10:00:00Z').baseline, nextDay.baseline);
assert.equal(history().length, 2);
assert.deepEqual(visit(initial, '2026-10-09T10:00:00Z').baseline.values, update, 'Skipped days compare against the latest earlier day');
assert.equal(history().length, 3, 'All older daily entries survive');
assert.deepEqual(history().map(snapshot => snapshot.savedAt), ['2026-10-02T11:00:00.000Z', '2026-10-03T10:00:00.000Z', '2026-10-09T10:00:00.000Z']);
assert.equal(visit(initial, '2026-10-09T10:00:00Z', 'Player B').baseline, null);
assert.equal(entries.size, 2, 'Each player needs an independent history');

const beforeFallback = entries.get('bf6-stats-history:v2:Player%20A');
assert.deepEqual(visit({ ...initial, capturedAt: '2026-10-01T10:00:00Z' }, '2026-10-10T10:00:00Z').baseline.values, initial);
assert.equal(entries.get('bf6-stats-history:v2:Player%20A'), beforeFallback, 'Fallback data never create a live entry');
assert.equal(compareDailyStats('A', initial, new Date(), { getItem() { throw new Error('Blocked'); }, setItem() {} }), null);
assert.equal(compareDailyStats('A', initial, new Date(), { getItem() { return null; }, setItem() { throw new Error('Quota'); } }), null);
for (const corrupt of ['broken JSON', '{}', '{"snapshots":null}', JSON.stringify({ version: 2, snapshots: [{ savedAt: 'invalid', values: initial }] })]) {
  let repaired;
  assert.equal(compareDailyStats('A', initial, new Date(), { getItem: () => corrupt, setItem: (_, value) => { repaired = JSON.parse(value); } }).baseline, null);
  assert.deepEqual(repaired.snapshots[0].values, initial);
}
const missing = { ...initial, accuracy: null, shotsFired: null };
visit(missing, '2026-10-10T10:00:00Z', 'Player C');
assert.deepEqual(visit(update, '2026-10-11T10:00:00Z', 'Player C').baseline.values, missing);
visit(initial, '2026-10-25T00:30:00Z', 'DST');
visit(update, '2026-10-25T01:30:00Z', 'DST');
assert.equal(history('DST').length, 1, 'The repeated hour at DST end is the same day');
assert.deepEqual(history('DST')[0].values, update);

const legacy = { previous: { savedAt: '2026-09-30T10:00:00Z', values: initial }, latest: { savedAt: '2026-10-01T10:00:00Z', values: update } };
entries.set('bf6-stats-history:v1:Legacy', JSON.stringify(legacy));
assert.deepEqual(visit(initial, '2026-10-02T10:00:00Z', 'Legacy').baseline, legacy.latest);
assert.equal(history('Legacy').length, 3, 'Both legacy snapshots migrate');
assert.deepEqual(visit(update, '2026-10-03T10:00:00Z', 'Legacy').baseline.values, initial);
assert.equal(history('Legacy').length, 4);

const cribanKey = 'bf6-stats-history:v2:MV-Criban';
assert.equal(visit(initial, '2026-10-02T10:00:00Z', 'MV-Criban').baseline, null, 'Fresh histories contain no dummy');
assert.equal(history('MV-Criban').length, 1);
const oldDemo = { savedAt: '2026-10-01T10:00:00Z', values: initial, source: 'demo' };
const realSnapshot = { savedAt: '2026-09-30T10:00:00Z', values: update };
entries.set(cribanKey, JSON.stringify({ version: 2, snapshots: [realSnapshot, oldDemo] }));
assert.deepEqual(visit(initial, '2026-10-02T10:00:00Z', 'MV-Criban').baseline, realSnapshot, 'Demo cleanup preserves real history');
assert.equal(history('MV-Criban').length, 2);
assert.ok(history('MV-Criban').every(snapshot => snapshot.source !== 'demo'));
entries.set(cribanKey, JSON.stringify({ version: 2, snapshots: [oldDemo] }));
assert.equal(visit({ ...initial, capturedAt: '2026-10-01T15:00:00Z' }, '2026-10-02T10:00:00Z', 'MV-Criban').baseline, null);
assert.deepEqual(history('MV-Criban'), [], 'Demo-only histories are cleared even during API outages');
console.log('PASS daily updates, complete history, previous-day comparison, migration, demo cleanup, Berlin midnight/DST, player isolation, fallback and storage errors');
