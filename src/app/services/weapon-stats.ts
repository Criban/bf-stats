export interface WeaponStats { weaponName: string; kills: number; }

export function topWeapons(value: unknown): WeaponStats[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((weapon: unknown): WeaponStats[] => {
    if (!weapon || typeof weapon !== 'object') return [];
    const { weaponName, kills } = weapon as Record<string, unknown>;
    const count = typeof kills === 'number' ? kills
      : typeof kills === 'string' && kills.trim() ? Number(kills) : NaN;
    if (typeof weaponName !== 'string' || !weaponName.trim() || !Number.isFinite(count) || count < 0) return [];
    return [{ weaponName: weaponName.trim(), kills: count }];
  }).sort((a, b) => b.kills - a.kills || a.weaponName.localeCompare(b.weaponName)).slice(0, 3);
}
