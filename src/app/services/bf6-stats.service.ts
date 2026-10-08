import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, forkJoin, map, Observable, of, shareReplay, tap, throwError, timeout } from 'rxjs';
import { topWeapons, type WeaponStats } from './weapon-stats';
import { parseAccuracy } from './accuracy';
export interface Bf6Stats { killDeath: number; accuracy: number | null; rank: number | null; rankName: string | null; hoursPlayed: number | null; matchesPlayed: number | null; shotsFired: number | null; weapons: WeaponStats[]; capturedAt?: string; }
type ProfileResponse = { playerProfiles?: { playerCard?: { rank?: unknown }; rankName?: unknown; stats?: { name?: string; value?: unknown }[] }[] };
type Snapshot = { players: Record<string, { capturedAt: string; response: Record<string, unknown>; profile: ProfileResponse }> };
@Injectable({ providedIn: 'root' })
export class Bf6StatsService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, { stats: Bf6Stats; expiresAt: number }>();
  private readonly pending = new Map<string, Observable<Bf6Stats>>();
  private readonly cacheDuration = 5 * 60 * 1000;

  invalidateCache(name: string, playerId?: string): void {
    this.cache.delete(this.cacheKey(name, playerId));
  }

  private cacheKey(name: string, playerId?: string): string {
    return /^\d+$/.test(playerId ?? '') ? `${name}:${playerId}` : name;
  }

  getStats(name: string, playerId?: string): Observable<Bf6Stats> {
    const key = this.cacheKey(name, playerId);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return of(cached.stats);
    this.cache.delete(key);
    const pending = this.pending.get(key);
    if (pending) return pending;
    const request = this.fetchStats({ name }).pipe(
      catchError(error => /^\d+$/.test(playerId ?? '') ? this.fetchStats({ playerid: playerId! }) : throwError(() => error)),
      tap(stats => this.cache.set(key, { stats, expiresAt: Date.now() + this.cacheDuration })),
      catchError(() => this.http.get<Snapshot>('data/bf6-stats-snapshot.json').pipe(
        timeout(5000),
        map(snapshot => {
          const player = snapshot.players[name];
          if (!player || !Number.isFinite(Date.parse(player.capturedAt))) throw new Error('Kein gültiger Statistik-Abzug vorhanden.');
          return { ...this.parseStats(player.response, player.profile), capturedAt: player.capturedAt };
        })
      )),
      finalize(() => this.pending.delete(key)),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    this.pending.set(key, request);
    return request;
  }
  private fetchStats(identity: { name: string } | { playerid: string }): Observable<Bf6Stats> {
    const common = { ...identity, platform: 'ea', skip_battlelog: true, lang: 'de-DE', filter: '{"scopes": [{"category": "global", "name": "global"}]}' };
    const params = new HttpParams({ fromObject: { ...common, categories: 'multiplayer', raw: false, format_values: true, seperation: false } });
    return forkJoin({
      response: this.http.get<Record<string, unknown>>('https://api.gametools.network/bf6/stats/', { params }).pipe(timeout(20000)),
      profile: this.http.get<ProfileResponse>('https://api.gametools.network/bf6/profile/', { params: new HttpParams({ fromObject: common }) }).pipe(timeout(20000))
    }).pipe(map(({ response, profile }) => this.parseStats(response, profile)));
  }
  private parseStats(response: Record<string, unknown>, profile: ProfileResponse): Bf6Stats {
      const number = (value: unknown): number | null => {
        const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
      };
      const killDeath = number(response?.['infantryKillDeath']);
      if (killDeath === null) throw new Error('Keine gültige K/D erhalten.');
      // The API can return a successful but empty stats payload with K/D = 0.
      // A real zero ratio needs recorded deaths and no contradictory human kills.
      if (killDeath === 0) {
        const deaths = number(response['deaths']);
        const humanKills = number(profile?.playerProfiles?.[0]?.stats?.find(stat => stat.name === 'human_kills_total')?.value);
        if (deaths === null || deaths === 0 || (humanKills !== null && humanKills > 0)) {
          throw new Error('Leere oder widersprüchliche K/D-Antwort erhalten.');
        }
      }
      const seconds = number(response['secondsPlayed']);
      const gameModeGroups = response['gameModeGroups'];
      const allModes = Array.isArray(gameModeGroups) ? gameModeGroups.find(group => group?.gamemodeName === 'All') : undefined;
      const matchesPlayed = number(allModes?.matches);
      const weaponGroups = response['weaponGroups'];
      const allWeapons = Array.isArray(weaponGroups) ? weaponGroups.find(group => group?.id === 'wp_temp') : undefined;
      const shotsFired = number(allWeapons?.shotsFired);
      const playerProfile = profile?.playerProfiles?.[0];
      const rankName = typeof playerProfile?.rankName === 'string' ? playerProfile.rankName.trim() || null : null;
      return { killDeath, accuracy: parseAccuracy(response['accuracy']), rank: number(playerProfile?.playerCard?.rank), rankName, hoursPlayed: seconds === null ? null : seconds / 3600, matchesPlayed, shotsFired, weapons: topWeapons(response['weapons']) };
  }
}
