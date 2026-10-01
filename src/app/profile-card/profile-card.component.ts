import { Component, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, distinctUntilChanged, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { Bf6StatsService, type Bf6Stats } from '../services/bf6-stats.service';

type StatsState = { status: 'private' } | { status: 'loading' } | { status: 'error' } | { status: 'ready'; killDeath: string; accuracy: string; rank: string; hours: string; matches: string; shots: string; capturedAt?: string; weapons: { weaponName: string; kills: string }[] };

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
      map((stats): StatsState => ({ status: 'ready', killDeath: this.formatter.format(stats.killDeath), accuracy: stats.accuracy === null ? '—' : this.formatValue(stats.accuracy, 1) + ' %', rank: this.formatValue(stats.rank), hours: this.formatValue(stats.hoursPlayed, 1), matches: this.formatValue(stats.matchesPlayed), shots: this.formatValue(stats.shotsFired), capturedAt: stats.capturedAt ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(stats.capturedAt)) : undefined, weapons: stats.weapons.map(weapon => ({ weaponName: weapon.weaponName, kills: this.formatValue(weapon.kills) })) })),
      catchError(() => of<StatsState>({ status: 'error' })),
      startWith<StatsState>({ status: 'loading' })
    ))
  ), { initialValue: { status: 'loading' } as StatsState });

  private formatValue(value: number | null, digits = 0): string {
    return value === null ? '—' : new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
  }

  retryStats(): void {
    this.statsService.invalidateCache(this.player().name);
    this.reload.next();
  }
}

