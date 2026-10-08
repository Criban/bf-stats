import { mkdir, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const identities = [{ name: 'MV-8lackh4wk', playerid: '1811857213' }, { name: 'MV-Criban', playerid: '353727533' }];
const endpoint = 'https://api.gametools.network/bf6/';
const players = {};
for (const { name, playerid } of identities) {
  const common = { platform: 'ea', skip_battlelog: 'true', lang: 'de-DE', filter: '{"scopes": [{"category": "global", "name": "global"}]}' };
  const fetchData = async (path, params) => {
    const response = await fetch(`${endpoint}${path}/?${new URLSearchParams(params)}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${name}: ${path} returned HTTP ${response.status}`);
    return response.json();
  };
  const fetchPlayer = async identity => {
    const [stats, profile] = await Promise.all([
      fetchData('stats', { ...common, ...identity, categories: 'multiplayer', raw: 'false', format_values: 'true', seperation: 'false' }),
      fetchData('profile', { ...common, ...identity })
    ]);
    const kd = stats.infantryKillDeath;
    if (kd === null || kd === undefined || kd === '' || !Number.isFinite(Number(kd)) || Number(kd) < 0) {
      throw new Error(`${name}: no valid K/D; existing snapshot preserved.`);
    }
    const rank = profile.playerProfiles?.[0]?.playerCard?.rank;
    if (rank === null || rank === undefined || !Number.isFinite(Number(rank))) {
      throw new Error(`${name}: no valid rank; existing snapshot preserved.`);
    }
    return { stats, profile, rank };
  };
  const { stats, profile, rank } = await fetchPlayer({ name }).catch(error => {
    console.log(`${name}: name lookup failed (${error.message}); trying playerid=${playerid}`);
    return fetchPlayer({ playerid });
  });
  players[name] = {
    capturedAt: new Date().toISOString(),
    response: Object.fromEntries(['infantryKillDeath', 'accuracy', 'secondsPlayed', 'gameModeGroups', 'weaponGroups', 'weapons'].map(key => [key, stats[key]])),
    profile: { playerProfiles: [{ playerCard: { rank }, rankName: profile.playerProfiles?.[0]?.rankName }] }
  };
  console.log(`${name}: snapshot captured (${players[name].capturedAt})`);
}
const directory = fileURLToPath(new URL('../public/data/', import.meta.url));
const destination = fileURLToPath(new URL('../public/data/bf6-stats-snapshot.json', import.meta.url));
await mkdir(directory, { recursive: true });
await writeFile(`${destination}.tmp`, JSON.stringify({ players }, null, 2) + '\n');
await rename(`${destination}.tmp`, destination);
console.log('Saved public/data/bf6-stats-snapshot.json');
