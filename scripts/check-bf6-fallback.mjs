import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(path.join(root, 'scripts', '.bf6-check-'));
const files = ['accuracy', 'weapon-stats', 'bf6-stats.service', 'history-totals', 'battlefield-history'];
try {
  for (const file of files) {
    const source = await readFile(path.join(root, file === 'history-totals' || file === 'battlefield-history' ? 'src/app/data' : 'src/app/services', `${file}.ts`), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, experimentalDecorators: true } }).outputText;
    await writeFile(path.join(temporary, `${file}.mjs`), compiled.replace(/from '\.\/(accuracy|weapon-stats)'/g, "from './$1.mjs'"));
  }
  const { Bf6StatsService } = await import(pathToFileURL(path.join(temporary, 'bf6-stats.service.mjs')));
  const snapshot = JSON.parse(await readFile(path.join(root, 'public/data/bf6-stats-snapshot.json'), 'utf8'));
  const name = 'MV-8lackh4wk';
  const parser = runInInjectionContext(Injector.create({ providers: [{ provide: HttpClient, useValue: {} }] }), () => new Bf6StatsService());
  const parseMatches = gameModeGroups => parser.parseStats({ infantryKillDeath: 2, matchesPlayed: 999, gameModes: [{ matches: 888 }], maps: [{ wins: 258, losses: 196 }], gameModeGroups }, {}).matchesPlayed;
  assert.equal(parseMatches([{ gamemodeName: 'Conquest', matches: 123 }, { gamemodeName: 'All', matches: 576 }]), 576);
  assert.equal(parseMatches([{ gamemodeName: 'All', matches: '576' }]), 576);
  assert.equal(parseMatches([{ gamemodeName: 'All', matches: 0 }]), 0);
  assert.equal(parseMatches([]), null);
  assert.equal(parseMatches(undefined), null);
  assert.equal(parseMatches([{ gamemodeName: 'Conquest', matches: 123 }]), null);
  assert.equal(parseMatches([{ gamemodeName: 'All', matches: -1 }]), null);
  assert.equal(parseMatches([{ gamemodeName: 'All' }]), null);
  console.log('PASS matches from All gameModeGroups entry, zero and missing/invalid counts');
  const parseShots = weaponGroups => parser.parseStats({ infantryKillDeath: 2, shotsFired: 999, weaponGroups }, {}).shotsFired;
  assert.equal(parseShots([{ id: 'wp_other', shotsFired: 123 }, { id: 'wp_temp', shotsFired: 236067 }]), 236067);
  assert.equal(parseShots([{ id: 'wp_temp', shotsFired: '236067' }]), 236067);
  assert.equal(parseShots([{ id: 'wp_temp', shotsFired: 0 }]), 0);
  assert.equal(parseShots(undefined), null);
  assert.equal(parseShots([]), null);
  assert.equal(parseShots([{ id: 'wp_other', shotsFired: 123 }]), null);
  assert.equal(parseShots([{ id: 'wp_temp', shotsFired: -1 }]), null);
  assert.equal(parseShots([{ id: 'wp_temp' }]), null);
  console.log('PASS shots from wp_temp weapon group, zero and missing/invalid counts');
  for (const mode of ['live', 'stats-error', 'profile-error', 'invalid-kd', 'missing-snapshot']) {
    const calls = [];
    const http = { get(url) {
      calls.push(url);
      if (url.startsWith('data/')) return mode === 'missing-snapshot' ? throwError(() => new Error('Missing snapshot')) : of(snapshot);
      if ((mode === 'stats-error' || mode === 'missing-snapshot') && url.includes('/stats/')) return throwError(() => new Error('API failure'));
      if (mode === 'profile-error' && url.includes('/profile/')) return throwError(() => new Error('Profile failure'));
      if (url.includes('/profile/')) return of(snapshot.players[name].profile);
      return of(mode === 'invalid-kd' ? { infantryKillDeath: null } : snapshot.players[name].response);
    } };
    const injector = Injector.create({ providers: [{ provide: HttpClient, useValue: http }] });
    const service = runInInjectionContext(injector, () => new Bf6StatsService());
    if (mode === 'missing-snapshot') {
      await assert.rejects(firstValueFrom(service.getStats(name)), /Missing snapshot/);
    } else {
      const result = await firstValueFrom(service.getStats(name));
      assert.equal(result.killDeath, Number(snapshot.players[name].response.infantryKillDeath));
      assert.equal(result.shotsFired, Number(snapshot.players[name].response.weaponGroups.find(group => group.id === 'wp_temp').shotsFired));
      assert.equal(result.matchesPlayed, Number(snapshot.players[name].response.gameModeGroups.find(group => group.gamemodeName === 'All').matches));
      assert.ok(Number.isFinite(result.shotsFired));
      assert.ok(result.weapons.length > 0);
      assert.equal(result.capturedAt, mode === 'live' ? undefined : snapshot.players[name].capturedAt);
      assert.equal(calls.includes('data/bf6-stats-snapshot.json'), mode !== 'live');
      const firstCallCount = calls.length;
      await firstValueFrom(service.getStats(name));
      assert.equal(calls.length, mode === 'live' ? firstCallCount : firstCallCount * 2,
        'Only successful API responses should be cached');
      if (mode === 'live') {
        service.invalidateCache(name);
        await firstValueFrom(service.getStats(name));
        assert.equal(calls.length, firstCallCount * 2, 'Reload must bypass cached stats');
        const realNow = Date.now;
        try {
          Date.now = () => realNow() + 5 * 60 * 1000 + 1;
          await firstValueFrom(service.getStats(name));
          assert.equal(calls.length, firstCallCount * 3, 'Expired stats must be fetched again');
        } finally {
          Date.now = realNow;
        }
      }
    }
    console.log(`PASS ${mode}`);
  }
  for (const mode of ['name-success', 'name-error', 'invalid-kd', 'profile-error', 'both-error', 'unknown-id']) {
    const calls = [];
    const playerName = 'MV-Criban';
    const playerId = mode === 'unknown-id' ? 'unknown' : '353727533';
    const http = { get(url, options) {
      if (url.startsWith('data/')) { calls.push({ snapshot: true }); return of(snapshot); }
      const params = options.params;
      calls.push({ url, name: params.get('name'), playerid: params.get('playerid') });
      const byId = params.has('playerid');
      if (mode === 'both-error' || mode === 'unknown-id' || (!byId && mode === 'name-error')) return throwError(() => new Error('Player not found'));
      if (!byId && mode === 'profile-error' && url.includes('/profile/')) return throwError(() => new Error('Profile not found'));
      if (url.includes('/profile/')) return of(snapshot.players[playerName].profile);
      return of(!byId && mode === 'invalid-kd' ? { infantryKillDeath: null } : snapshot.players[playerName].response);
    } };
    const service = runInInjectionContext(Injector.create({ providers: [{ provide: HttpClient, useValue: http }] }), () => new Bf6StatsService());
    const result = await firstValueFrom(service.getStats(playerName, playerId));
    const usesSnapshot = mode === 'both-error' || mode === 'unknown-id';
    assert.equal(result.capturedAt, usesSnapshot ? snapshot.players[playerName].capturedAt : undefined);
    const idCalls = calls.filter(call => call.playerid);
    assert.equal(idCalls.length, mode === 'name-success' || mode === 'unknown-id' ? 0 : 2);
    for (const call of idCalls) {
      assert.equal(call.playerid, '353727533');
      assert.equal(call.name, null, 'ID lookup must omit name');
    }
    assert.equal(calls.some(call => call.snapshot), usesSnapshot);
    if (!usesSnapshot) {
      const count = calls.length;
      await firstValueFrom(service.getStats(playerName, playerId));
      assert.equal(calls.length, count, 'Successful ID fallback must be cached');
      service.invalidateCache(playerName, playerId);
      await firstValueFrom(service.getStats(playerName, playerId));
      assert.equal(calls.length, count * 2);
    }
    console.log(`PASS playerid fallback ${mode}`);
  }
  const { historyTotals } = await import(pathToFileURL(path.join(temporary, 'history-totals.mjs')));
  const { BATTLEFIELD_HISTORY } = await import(pathToFileURL(path.join(temporary, 'battlefield-history.mjs')));
  const bf6 = { hoursPlayed: 10.25, shotsFired: 2000, matchesPlayed: 12 };
  const totals = historyTotals(BATTLEFIELD_HISTORY['353727533'], bf6);
  assert.deepEqual(totals, { hours: { value: 749.8727777777779, partial: false }, shots: { value: 1339806, partial: false }, matches: { value: 1876, partial: false } });
  const hawkTotals = historyTotals(BATTLEFIELD_HISTORY['1811857213'], bf6);
  assert.deepEqual(hawkTotals, { hours: { value: 747.8958333333334, partial: false }, shots: { value: 1672500, partial: false }, matches: { value: 2254, partial: false } });
  assert.equal(historyTotals([{ game: 'Battlefield 6', stats: [], totals: bf6 }], bf6).shots.value, 2000);
  assert.deepEqual(historyTotals([], null).shots, { value: null, partial: true });
  assert.deepEqual(historyTotals([], { ...bf6, shotsFired: 0 }).shots, { value: 0, partial: false });
  assert.deepEqual(historyTotals(BATTLEFIELD_HISTORY['353727533'], { ...bf6, shotsFired: null }).shots, { value: 1337806, partial: true });
  console.log('PASS history totals, BF6 counted once, missing values and zero');
} finally {
  for (const file of files) await unlink(path.join(temporary, `${file}.mjs`)).catch(() => {});
  await rmdir(temporary);
}
