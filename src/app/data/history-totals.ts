import type { BattlefieldHistoryEntry } from './battlefield-history';
import type { Bf6Stats } from '../services/bf6-stats.service';

export function historyTotals(entries: BattlefieldHistoryEntry[], bf6: Bf6Stats | null) {
  const sources: ({ hoursPlayed?: number | null; shotsFired?: number | null; matchesPlayed?: number | null } | undefined)[] = entries.filter(entry => entry.game !== 'Battlefield 6').map(entry => entry.totals);
  // Current BF6 values replace any historical BF6 record, so it is counted once.
  sources.push(bf6 ?? entries.find(entry => entry.game === 'Battlefield 6')?.totals);
  const sum = (key: 'hoursPlayed' | 'shotsFired' | 'matchesPlayed') => {
    const values = sources.map(source => source?.[key]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);
    return { value: values.length ? values.reduce((total, value) => total + value, 0) : null, partial: values.length < sources.length };
  };
  return { hours: sum('hoursPlayed'), shots: sum('shotsFired'), matches: sum('matchesPlayed') };
}
