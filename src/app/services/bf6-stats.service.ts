import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, timeout } from 'rxjs';
import { topWeapons, type WeaponStats } from './weapon-stats';
import { parseAccuracy } from './accuracy';
export interface Bf6Stats { killDeath: number; accuracy: number | null; rank: number | null; hoursPlayed: number | null; matchesPlayed: number | null; shotsFired: number | null; weapons: WeaponStats[]; capturedAt?: string; }
type ProfileResponse = { playerProfiles?: { playerCard?: { rank?: unknown } }[] };
type Snapshot = { players: Record<string, { capturedAt: string; response: Record<string, unknown>; profile: ProfileResponse }> };
@Injectable({ providedIn: 'root' })
export class Bf6StatsService {
  private readonly http = inject(HttpClient);
  getStats(name: string): Observable<Bf6Stats> {
    const common = { name, platform: 'ea', skip_battlelog: true, lang: 'de-DE', filter: '{"scopes": [{"category": "global", "name": "global"}]}' };
    const params = new HttpParams({ fromObject: { ...common, categories: 'multiplayer', raw: false, format_values: true, seperation: false } });
    const profile = this.http.get<ProfileResponse>('https://api.gametools.network/bf6/profile/', { params: new HttpParams({ fromObject: common }) }).pipe(timeout(20000));
    return forkJoin({ response: this.http.get<Record<string, unknown>>('https://api.gametools.network/bf6/stats/', { params }).pipe(timeout(20000)), profile }).pipe(
      map(({ response, profile }) => this.parseStats(response, profile)),
      catchError(() => this.http.get<Snapshot>('data/bf6-stats-snapshot.json').pipe(
        timeout(5000),
        map(snapshot => {
          const player = snapshot.players[name];
          if (!player || !Number.isFinite(Date.parse(player.capturedAt))) throw new Error('Kein gültiger Statistik-Abzug vorhanden.');
          return { ...this.parseStats(player.response, player.profile), capturedAt: player.capturedAt };
        })
      ))
    );
  }
  private parseStats(response: Record<string, unknown>, profile: ProfileResponse): Bf6Stats {
      const number = (value: unknown): number | null => {
        const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
      };
      const killDeath = number(response?.['infantryKillDeath']);
      if (killDeath === null) throw new Error('Keine gültige K/D erhalten.');
      const seconds = number(response['secondsPlayed']);
      return { killDeath, accuracy: parseAccuracy(response['accuracy']), rank: number(profile?.playerProfiles?.[0]?.playerCard?.rank), hoursPlayed: seconds === null ? null : seconds / 3600, matchesPlayed: number(response['matchesPlayed']), shotsFired: number(response['shotsFired'] ?? response['shotsfired']), weapons: topWeapons(response['weapons']) };
  }
}
