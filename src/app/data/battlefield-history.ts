export interface BattlefieldHistoryEntry {
  game: string;
  recordedAt?: string;
  period?: { from?: string; to?: string };
  totals?: { hoursPlayed?: number; shotsFired?: number; matchesPlayed?: number };
  stats: { label: string; value: string }[];
}

// Manually supplied snapshots only. Keys match PlayerProfile.id.
// Example entry: { game: 'Battlefield 4', recordedAt: '2026-10-01',
//   stats: [{ label: 'K/D', value: '2,10' }, { label: 'Kills', value: '12.345' }] }
export const BATTLEFIELD_HISTORY: Partial<Record<string, BattlefieldHistoryEntry[]>> = {
  '1811857213': [
    {
      game: 'Battlefield V',
      period: { to: 'November 2021' },
      totals: { hoursPlayed: (2 * 86400 + 9 * 3600 + 38 * 60 + 45) / 3600, shotsFired: 68790, matchesPlayed: 215 },
      stats: [
        { label: 'K/D', value: '1,61' },
        { label: 'Abgefeuerte Schüsse', value: '68.790' },
        { label: 'Spielzeit', value: '57,6 h' },
        { label: 'Matches', value: '215' },
      ],
    },
    {
      game: 'Battlefield 2042',
      period: { from: 'November 2021', to: 'Oktober 2025' },
      totals: { hoursPlayed: 680, shotsFired: 1601710, matchesPlayed: 2027 },
      stats: [
        { label: 'K/D', value: '2,79' },
        { label: 'Abgefeuerte Schüsse', value: '1.601.710' },
        { label: 'Spielzeit', value: '680 h' },
        { label: 'Matches', value: '2.027' },
      ],
    },
    { game: 'Battlefield 6', period: { from: 'Oktober 2025' }, stats: [] },
  ],
  '353727533': [
    {
      game: 'Battlefield V',
      period: { to: 'November 2021' },
      totals: { hoursPlayed: (4 * 86400 + 13 * 3600 + 26 * 60 + 45) / 3600, shotsFired: 188136, matchesPlayed: 364 },
      stats: [
        { label: 'K/D', value: '1,32' },
        { label: 'Abgefeuerte Schüsse', value: '188.136' },
        { label: 'Spielzeit', value: '109,4 h' },
        { label: 'Matches', value: '364' },
      ],
    },
    {
      game: 'Battlefield 2042',
      period: { from: 'November 2021', to: 'Oktober 2025' },
      totals: { hoursPlayed: 590, shotsFired: 1130940, matchesPlayed: 1379 },
      stats: [
        { label: 'K/D', value: '2,02' },
        { label: 'Abgefeuerte Schüsse', value: '1.130.940' },
        { label: 'Spielzeit', value: '590 h' },
        { label: 'Matches', value: '1.379' },
        { label: 'Bevorzugte Klasse', value: 'Aufklärer' },
      ],
    },
    { game: 'Battlefield 6', period: { from: 'Oktober 2025' }, stats: [] },
  ],
  'mv-kingcoffee': [],
  'mv-54bi44': [],
};
