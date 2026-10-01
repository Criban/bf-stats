export interface BattlefieldHistoryEntry {
  game: string;
  recordedAt?: string;
  period?: { from: string; to?: string };
  stats: { label: string; value: string }[];
}

// Manually supplied snapshots only. Keys match PlayerProfile.id.
// Example entry: { game: 'Battlefield 4', recordedAt: '2026-10-01',
//   stats: [{ label: 'K/D', value: '2,10' }, { label: 'Kills', value: '12.345' }] }
export const BATTLEFIELD_HISTORY: Partial<Record<string, BattlefieldHistoryEntry[]>> = {
  '1811857213': [],
  '353727533': [
    {
      game: 'Battlefield 2042',
      period: { from: 'November 2021', to: 'Oktober 2025' },
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
};
