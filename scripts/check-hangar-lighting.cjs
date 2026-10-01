const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/app/soldiers/hangar-lighting.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = { exports: {}, Intl, Date };
vm.runInNewContext(compiled, context);
const { getBerlinLighting } = context.exports;
const lighting = utc => getBerlinLighting(new Date(utc));

// 17:00 Berlin is 16:00 UTC in winter and 15:00 UTC in summer.
assert.equal(lighting('2026-01-15T16:00:00Z').hallBrightness, 1.18);
assert.deepEqual(lighting('2026-01-15T16:00:00Z'), lighting('2026-07-15T15:00:00Z'));
// The same UTC hour has different local lighting on either side of DST changes.
assert.notEqual(lighting('2026-03-28T06:00:00Z').hallBrightness, lighting('2026-03-29T06:00:00Z').hallBrightness);
assert.notEqual(lighting('2026-10-24T06:00:00Z').hallBrightness, lighting('2026-10-25T06:00:00Z').hallBrightness);
assert.deepEqual(lighting('2026-07-15T21:59:00Z'), lighting('2026-07-15T22:00:00Z'));
assert.ok(lighting('2026-07-15T11:00:00Z').hallBrightness > lighting('2026-07-15T22:00:00Z').hallBrightness);
assert.equal(lighting('2026-07-15T22:00:00Z').sunlight, 0);

for (const day of ['2026-01-15', '2026-03-29', '2026-07-15', '2026-10-25']) {
  let previous;
  for (let minute = 0; minute < 1440; minute++) {
    const current = getBerlinLighting(new Date(Date.parse(day + 'T00:00:00Z') + minute * 60_000));
    for (const value of Object.values(current)) assert.ok(Number.isFinite(value));
    assert.ok(current.hallBrightness >= .78 && current.hallBrightness <= 1.22);
    assert.ok(current.portraitLight >= .84 && current.portraitLight <= 1.04);
    if (previous) {
      for (const key of Object.keys(current)) assert.ok(Math.abs(current[key] - previous[key]) < .003);
    }
    previous = current;
  }
}
console.log('Berlin lighting: winter/summer offsets, DST changes, midnight, brightness limits and smooth transitions passed.');
