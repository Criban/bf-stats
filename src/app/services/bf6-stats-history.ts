import type { Bf6Stats } from './bf6-stats.service';

export const HISTORY_METRICS = ['killDeath', 'hoursPlayed', 'matchesPlayed', 'accuracy', 'shotsFired'] as const;
export type HistoryMetric = typeof HISTORY_METRICS[number];
type Values = Record<HistoryMetric, number | null>;
export type StatsSnapshot = { savedAt: string; values: Values };
type History = { version: 2; snapshots: StatsSnapshot[] };
export type StatsComparison = { baseline: StatsSnapshot | null; savedAt: string };
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

function validSnapshot(value: unknown): value is StatsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as StatsSnapshot;
  // Remove test snapshots persisted by the former Criban demo.
  return (value as { source?: unknown }).source !== 'demo'
    && typeof snapshot.savedAt === 'string' && Number.isFinite(Date.parse(snapshot.savedAt))
    && !!snapshot.values && HISTORY_METRICS.every(key => snapshot.values[key] === null
      || (typeof snapshot.values[key] === 'number' && Number.isFinite(snapshot.values[key]) && snapshot.values[key]! >= 0));
}

function calendarDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Retain one live snapshot per Berlin calendar day; compare with the latest earlier day. */
export function compareDailyStats(name: string, stats: Bf6Stats, now = new Date(), storage?: StorageAccess): StatsComparison | null {
  try {
    const target = storage ?? globalThis.localStorage;
    const key = `bf6-stats-history:v2:${encodeURIComponent(name)}`;
    const raw = target.getItem(key);
    let snapshots: StatsSnapshot[] = [];
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.version === 2 && Array.isArray(parsed.snapshots)) snapshots = parsed.snapshots.filter(validSnapshot);
      } else {
        const legacy = JSON.parse(target.getItem(`bf6-stats-history:v1:${encodeURIComponent(name)}`) ?? 'null');
        snapshots = [legacy?.previous, legacy?.latest].filter(validSnapshot);
      }
    } catch { /* Recover an unreadable entry with a fresh history. */ }
    const today = calendarDay(now);
    const daily = new Map<string, StatsSnapshot>();
    for (const snapshot of snapshots.sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt))) {
      if (Date.parse(snapshot.savedAt) <= now.getTime()) daily.set(calendarDay(new Date(snapshot.savedAt)), snapshot);
    }
    // An API fallback must never be saved as today's live reading.
    if (!stats.capturedAt) daily.set(today, {
      savedAt: now.toISOString(), values: Object.fromEntries(HISTORY_METRICS.map(key => [key, stats[key]])) as Values
    });
    snapshots = [...daily.values()].sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt));
    const baseline = snapshots.filter(snapshot => calendarDay(new Date(snapshot.savedAt)) < today).at(-1) ?? null;
    const serialized = JSON.stringify({ version: 2, snapshots } satisfies History);
    if (serialized !== raw && (snapshots.length || raw)) target.setItem(key, serialized);
    // The bundled fallback can be older than the baseline. Comparing it would
    // incorrectly report lost matches, hours or shots during an API outage.
    if (stats.capturedAt) return null;
    return { baseline, savedAt: daily.get(today)?.savedAt ?? stats.capturedAt ?? now.toISOString() };
  } catch {
    // Disabled storage or a full quota must not prevent displaying live statistics.
    return null;
  }
}
