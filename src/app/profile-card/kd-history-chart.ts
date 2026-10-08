import type { StatsSnapshot } from '../services/bf6-stats-history';

export function kdHistoryChart(snapshots: StatsSnapshot[]) {
  const readings = snapshots.filter(snapshot => typeof snapshot.values.killDeath === 'number'
    && Number.isFinite(snapshot.values.killDeath) && snapshot.values.killDeath >= 0)
    .sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt));
  if (!readings.length) return { points: [], line: '', ticks: [] };
  const values = readings.map(snapshot => snapshot.values.killDeath!);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * .2, .05);
  const min = Math.max(0, Math.floor((low - padding) * 100) / 100);
  const max = Math.ceil((high + padding) * 100) / 100;
  const first = Date.parse(readings[0].savedAt);
  const last = Date.parse(readings.at(-1)!.savedAt);
  const points = readings.map(snapshot => ({
    savedAt: snapshot.savedAt, value: snapshot.values.killDeath!,
    x: last === first ? 360 : 64 + (Date.parse(snapshot.savedAt) - first) / (last - first) * 592,
    y: 244 - (snapshot.values.killDeath! - min) / (max - min) * 212
  }));
  return {
    points,
    line: points.map(point => `${point.x},${point.y}`).join(' '),
    ticks: [max, (min + max) / 2, min].map((value, index) => ({ value, y: 32 + index * 106 }))
  };
}
