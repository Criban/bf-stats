import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { ProfileCardComponent, type PlayerProfile } from './profile-card/profile-card.component';
import { SoldiersComponent } from './soldiers/soldiers.component';
import { Bf6StatsService, type Bf6Stats } from './services/bf6-stats.service';
import { compareDailyStats } from './services/bf6-stats-history';
import { VideosComponent } from './videos/videos.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProfileCardComponent, SoldiersComponent, VideosComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly view = signal<'squad' | 'clan' | 'videos'>('clan');
  readonly selected = signal(0);
  readonly historyOpen = signal(false);
  readonly hasHistoryStats = computed(() => !this.players[this.selected()].privateProfile);
  readonly playerStats = signal<Partial<Record<string, Bf6Stats>>>({});
  readonly selectedStats = computed(() => this.playerStats()[this.players[this.selected()].id] ?? null);
  recordStats(event: { playerId: string; stats: Bf6Stats }): void {
    this.playerStats.update(players => ({ ...players, [event.playerId]: event.stats }));
  }
  readonly players: PlayerProfile[] = [
    { id: '1811857213', image: 'images/8lackh4wk-aiming-soldier.png', imageAlt: 'Soldat mit schwarzer Ausrüstung, Schutzbrille und Gewehr im Schulteranschlag', name: 'MV-8lackh4wk', description: 'Zusammen auf dem Battlefield.' },
    { id: '353727533', image: 'images/criban-gasmask-soldier.png', imageAlt: 'Soldat mit Gasmaske, Helm und dunkler taktischer Ausrüstung', name: 'MV-Criban', description: 'Wir geben unser Bestes – meistens reicht\'s.' },
    { id: 'unknown', image: 'images/kingcoffee-support-transparent.png', imageAlt: 'Versorger von vorne mit Helm, Sonnenbrille und locker auf Hüfthöhe gehaltenem Gewehr', name: 'MV-KingCoffee', description: 'Versorger – hält das Squad am Laufen.', privateProfile: true },
    { id: '1008896742053', image: 'images/54bi44-camping-chair.png', imageAlt: 'Soldat mit Kapuze und Schutzbrille sitzt entspannt auf einem Campingstuhl', name: 'MV-54bI44', description: 'Kurze Einsatzpause.' },
  ];
  private readonly statsService = inject(Bf6StatsService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    for (const player of this.players.filter(player => !player.privateProfile)) {
      this.statsService.getStats(player.name, player.id).pipe(
        catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef)
      ).subscribe(stats => {
        compareDailyStats(player.name, stats);
        this.recordStats({ playerId: player.id, stats });
      });
    }
  }
  toggleHistory(): void { this.historyOpen.update(open => !open); }
  closeHistory(): void { this.historyOpen.set(false); }
  selectSoldier(index: number): void {
    if (!this.players[index] || this.players[index].inactive) return;
    this.closeHistory(); this.selected.set(index); this.view.set('squad');
  }
}
