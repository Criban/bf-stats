import { bootstrapApplication } from '@angular/platform-browser';
import { Component, computed, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ProfileCardComponent, type PlayerProfile } from './app/profile-card/profile-card.component';
import { BattlefieldHistoryComponent } from './app/battlefield-history/battlefield-history.component';
import type { Bf6Stats } from './app/services/bf6-stats.service';
@Component({ selector: 'app-root', standalone: true, imports: [ProfileCardComponent, BattlefieldHistoryComponent], templateUrl: './app/app.component.html' })
export class AppComponent {
  readonly view = signal<'squad' | 'clan'>('clan');
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
    { id: 'mv-kingcoffee', image: 'images/kingcoffee-support-transparent.png', imageAlt: 'Versorger von vorne mit Helm, Sonnenbrille und locker auf Hüfthöhe gehaltenem Gewehr', name: 'MV-KingCoffee', description: 'Versorger – hält das Squad am Laufen.', privateProfile: true },
  ];
  toggleHistory(): void { this.historyOpen.update(open => !open); }
  closeHistory(): void { this.historyOpen.set(false); }
  selectSoldier(index: number): void { this.closeHistory(); this.selected.set(index); this.view.set('squad'); }
}
bootstrapApplication(AppComponent, { providers: [provideHttpClient()] }).catch(console.error);



