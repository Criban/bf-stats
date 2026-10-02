import { Component, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, distinctUntilChanged, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { Bf6StatsService, type Bf6Stats } from '../services/bf6-stats.service';
import { compareDailyStats, HISTORY_METRICS, type HistoryMetric } from '../services/bf6-stats-history';

type StatChange = { text: string; direction: 'positive' | 'negative' | 'neutral' };
type StatsState = { status: 'private' } | { status: 'loading' } | { status: 'error' } | { status: 'ready'; killDeath: string; accuracy: string; rank: string; rankName: string | null; hours: string; matches: string; shots: string; capturedAt?: string; changes: Record<HistoryMetric, StatChange | null>; comparisonNote: string | null; weapons: { weaponName: string; kills: string }[] };

export interface PlayerProfile {
  id: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  privateProfile?: boolean;
  inactive?: boolean;
}

@Component({
  selector: 'app-profile-card',
  standalone: true,
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.css'
})
export class ProfileCardComponent {
  readonly player = input.required<PlayerProfile>();
  readonly statsLoaded = output<{ playerId: string; stats: Bf6Stats }>();
  private readonly statsService = inject(Bf6StatsService);
  private readonly reload = new Subject<void>();
  private readonly formatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  readonly stats = toSignal(combineLatest([
    toObservable(this.player).pipe(distinctUntilChanged((a, b) => a.name === b.name && a.privateProfile === b.privateProfile)),
    this.reload.pipe(startWith(undefined))
  ]).pipe(
    switchMap(([player]) => player.privateProfile ? of<StatsState>({ status: 'private' }) : this.statsService.getStats(player.name).pipe(
      tap(stats => this.statsLoaded.emit({ playerId: player.id, stats })),
      map((stats): StatsState => ({ status: 'ready', killDeath: this.formatter.format(stats.killDeath), accuracy: stats.accuracy === null ? '—' : this.formatValue(stats.accuracy, 1) + ' %', rank: this.formatValue(stats.rank), rankName: stats.rankName, hours: this.formatValue(stats.hoursPlayed, 1), matches: this.formatValue(stats.matchesPlayed), shots: this.formatValue(stats.shotsFired), capturedAt: stats.capturedAt ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(stats.capturedAt)) : undefined, ...this.compareStats(player.name, stats), weapons: stats.weapons.map(weapon => ({ weaponName: weapon.weaponName, kills: this.formatValue(weapon.kills) })) })),
      catchError(() => of<StatsState>({ status: 'error' })),
      startWith<StatsState>({ status: 'loading' })
    ))
  ), { initialValue: { status: 'loading' } as StatsState });

  private compareStats(name: string, stats: Bf6Stats): { changes: Record<HistoryMetric, StatChange | null>; comparisonNote: string | null } {
    const comparison = compareDailyStats(name, stats);
    const changes = Object.fromEntries(HISTORY_METRICS.map(key => {
      const current = stats[key];
      const previous = comparison?.baseline?.values[key];
      if (current === null || previous === null || previous === undefined) return [key, null];
      const digits = key === 'killDeath' ? 2 : key === 'accuracy' || key === 'hoursPlayed' ? 1 : 0;
      // Round at the displayed precision so tiny fluctuations do not show as +0.
      const difference = Number((current - previous).toFixed(digits));
      const text = `${difference > 0 ? '+' : difference < 0 ? '−' : ''}${this.formatValue(Math.abs(difference), digits)}${key === 'accuracy' ? ' PP' : ''}`;
      return [key, { text, direction: difference > 0 ? 'positive' : difference < 0 ? 'negative' : 'neutral' }];
    })) as Record<HistoryMetric, StatChange | null>;
    const date = comparison ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(comparison.baseline?.savedAt ?? comparison.savedAt)) : null;
    return { changes, comparisonNote: comparison?.baseline
      ? `Änderung zum gespeicherten BF6-Stand vom ${date} Uhr (Berlin). Ein Stand pro Tag in diesem Browser; heutige Werte werden bei jedem Abruf aktualisiert. PP = Prozentpunkte.`
      : null };
  }

  private formatValue(value: number | null, digits = 0): string {
    return value === null ? '—' : new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
  }

  retryStats(): void {
    this.statsService.invalidateCache(this.player().name);
    this.reload.next();
  }
}

