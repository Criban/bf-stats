import type { Bf6Stats } from './bf6-stats.service';

export const HISTORY_METRICS = ['killDeath', 'hoursPlayed', 'matchesPlayed', 'accuracy', 'shotsFired'] as const;
export type HistoryMetric = typeof HISTORY_METRICS[number];
type Values = Record<HistoryMetric, number | null>;
export type StatsSnapshot = { savedAt: string; values: Values };
type History = { latest: StatsSnapshot; previous: StatsSnapshot | null };
export type StatsComparison = { baseline: StatsSnapshot | null; savedAt: string };
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

function validSnapshot(value: unknown): value is StatsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as StatsSnapshot;
  return typeof snapshot.savedAt === 'string' && Number.isFinite(Date.parse(snapshot.savedAt))
    && !!snapshot.values && HISTORY_METRICS.every(key => snapshot.values[key] === null
      || (typeof snapshot.values[key] === 'number' && Number.isFinite(snapshot.values[key]) && snapshot.values[key]! >= 0));
}

function calendarDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Keep the first live reading of each Berlin calendar day and its predecessor. */
export function compareDailyStats(name: string, stats: Bf6Stats, now = new Date(), storage?: StorageAccess): StatsComparison | null {
  if (stats.capturedAt) return null;
  try {
    const target = storage ?? globalThis.localStorage;
    const key = `bf6-stats-history:v1:${encodeURIComponent(name)}`;
    const raw = target.getItem(key);
    let history: History | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as History;
        if (parsed && validSnapshot(parsed.latest) && (parsed.previous === null || validSnapshot(parsed.previous))
          && Date.parse(parsed.latest.savedAt) <= now.getTime()
          && (!parsed.previous || Date.parse(parsed.previous.savedAt) < Date.parse(parsed.latest.savedAt))) history = parsed;
      } catch { /* Replace an unreadable entry with a fresh starting point. */ }
    }
    if (history && calendarDay(new Date(history.latest.savedAt)) === calendarDay(now)) {
      return { baseline: history.previous, savedAt: history.latest.savedAt };
    }
    const latest: StatsSnapshot = {
      savedAt: now.toISOString(),
      values: Object.fromEntries(HISTORY_METRICS.map(key => [key, stats[key]])) as Values
    };
    target.setItem(key, JSON.stringify({ latest, previous: history?.latest ?? null } satisfies History));
    return { baseline: history?.latest ?? null, savedAt: latest.savedAt };
  } catch {
    // Disabled storage or a full quota must not prevent displaying live statistics.
    return null;
  }
}
