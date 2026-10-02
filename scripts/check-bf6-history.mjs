import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/app/services/bf6-stats-history.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { compareDailyStats } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const entries = new Map();
let writes = 0;
const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => { writes++; entries.set(key, value); } };
const initial = { killDeath: 2, hoursPlayed: 10, matchesPlayed: 538, accuracy: 25, shotsFired: 2000 };
const update = { ...initial, killDeath: 1.9, matchesPlayed: 540, accuracy: 26, shotsFired: 2100 };
const visit = (stats, date, name = 'Player A') => compareDailyStats(name, stats, new Date(date), storage);

assert.equal(visit(initial, '2026-10-02T10:00:00Z').baseline, null);
assert.equal(writes, 1);
assert.equal(visit(update, '2026-10-02T11:00:00Z').baseline, null, 'The first daily snapshot alone must not show a comparison');
assert.equal(writes, 1, 'Reloads must not overwrite the daily snapshot');
const nextDay = visit(update, '2026-10-02T22:00:00Z'); // Midnight in Berlin.
assert.deepEqual(nextDay.baseline.values, initial);
assert.equal(writes, 2);
assert.deepEqual(visit({ ...update, matchesPlayed: 542 }, '2026-10-03T10:00:00Z').baseline, nextDay.baseline);
assert.equal(writes, 2, 'The comparison must survive another visit on the new day');
assert.deepEqual(visit(initial, '2026-10-09T10:00:00Z').baseline.values, update, 'Skipped days compare against the last visit');
assert.equal(visit(initial, '2026-10-09T10:00:00Z', 'Player B').baseline, null);
assert.equal(entries.size, 2, 'Each player needs an independent history');
assert.deepEqual(Object.keys(JSON.parse([...entries.values()][0]).latest.values), ['killDeath', 'hoursPlayed', 'matchesPlayed', 'accuracy', 'shotsFired']);

const beforeFallback = writes;
assert.equal(visit({ ...initial, capturedAt: '2026-10-01T10:00:00Z' }, '2026-10-10T10:00:00Z'), null);
assert.equal(writes, beforeFallback, 'Fallback data must not replace live history');
assert.equal(compareDailyStats('A', initial, new Date(), { getItem() { throw new Error('Blocked'); }, setItem() {} }), null);
assert.equal(compareDailyStats('A', initial, new Date(), { getItem() { return null; }, setItem() { throw new Error('Quota'); } }), null);
for (const corrupt of ['broken JSON', '{}', '{"latest":null}', JSON.stringify({ latest: { savedAt: 'invalid', values: initial }, previous: null })]) {
  let repaired;
  assert.equal(compareDailyStats('A', initial, new Date(), { getItem: () => corrupt, setItem: (_, value) => { repaired = JSON.parse(value); } }).baseline, null);
  assert.deepEqual(repaired.latest.values, initial);
}
const missing = { ...initial, accuracy: null, shotsFired: null };
assert.equal(visit(missing, '2026-10-10T10:00:00Z', 'Player C').baseline, null);
assert.deepEqual(visit(update, '2026-10-11T10:00:00Z', 'Player C').baseline.values, missing);
// The repeated hour when daylight saving time ends is still the same calendar day.
visit(initial, '2026-10-25T00:30:00Z', 'DST');
const beforeRepeatedHour = writes;
visit(update, '2026-10-25T01:30:00Z', 'DST');
assert.equal(writes, beforeRepeatedHour);
console.log('PASS daily BF6 history, reloads, Berlin midnight/DST, skipped days, player isolation, fallback, unavailable storage and corrupt entries');
