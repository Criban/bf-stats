import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, timeout } from 'rxjs';
export interface Bf6Stats { killDeath: number; rank: number | null; hoursPlayed: number | null; matchesPlayed: number | null; }
@Injectable({ providedIn: 'root' })
export class Bf6StatsService {
  private readonly http = inject(HttpClient);
  getStats(name: string): Observable<Bf6Stats> {
    const common = { name, platform: 'ea', skip_battlelog: true, lang: 'en-us', filter: '{"scopes": [{"category": "global", "name": "global"}]}' };
    const params = new HttpParams({ fromObject: { ...common, categories: 'multiplayer', raw: false, format_values: true, seperation: false } });
    const profile = this.http.get<{ playerProfiles?: { playerCard?: { rank?: unknown } }[] }>('https://api.gametools.network/bf6/profile/', { params: new HttpParams({ fromObject: common }) }).pipe(timeout(20000), catchError(() => of(null)));
    return forkJoin({ response: this.http.get<Record<string, unknown>>('https://api.gametools.network/bf6/stats/', { params }).pipe(timeout(20000)), profile }).pipe(map(({ response, profile }) => {
      const number = (value: unknown): number | null => {
        const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
      };
      const killDeath = number(response?.['infantryKillDeath']);
      if (killDeath === null) throw new Error('Keine gültige K/D erhalten.');
      const seconds = number(response['secondsPlayed']);
      return { killDeath, rank: number(profile?.playerProfiles?.[0]?.playerCard?.rank), hoursPlayed: seconds === null ? null : seconds / 3600, matchesPlayed: number(response['matchesPlayed']) };
    }));
  }
}
