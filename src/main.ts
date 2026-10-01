import { bootstrapApplication } from '@angular/platform-browser';
import { Component, computed, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ProfileCardComponent, type PlayerProfile } from './app/profile-card/profile-card.component';
import { BATTLEFIELD_HISTORY } from './app/data/battlefield-history';
@Component({ selector: 'app-root', standalone: true, imports: [ProfileCardComponent], templateUrl: './app/app.component.html' })
export class AppComponent {
  readonly view = signal<'squad' | 'clan'>('clan');
  readonly selected = signal(0);
  readonly historyOpen = signal(false);
  readonly history = BATTLEFIELD_HISTORY;
  readonly hasHistoryStats = computed(() => this.history[this.players[this.selected()].id]?.some(entry => entry.stats.length > 0) ?? false);
  readonly players: PlayerProfile[] = [
    { id: '1811857213', image: 'images/8lackh4wk-aiming-soldier.png', imageAlt: 'Soldat mit schwarzer Ausrüstung, Schutzbrille und Gewehr im Schulteranschlag', name: 'MV-8lackh4wk', description: 'Zusammen auf dem Battlefield.' },
    { id: '353727533', image: 'images/criban-gasmask-soldier.png', imageAlt: 'Soldat mit Gasmaske, Helm und dunkler taktischer Ausrüstung', name: 'MV-Criban', description: 'Wir geben unser Bestes – meistens reicht\'s.' },
    { id: 'mv-kingcoffee', image: 'images/kingcoffee-support-transparent.png', imageAlt: 'Versorger von vorne mit Helm, Sonnenbrille und locker auf Hüfthöhe gehaltenem Gewehr', name: 'MV-KingCoffee', description: 'Versorger – hält das Squad am Laufen.', privateProfile: true },
  ];
  selectSoldier(index: number): void { this.historyOpen.set(false); this.selected.set(index); this.view.set('squad'); }
}
bootstrapApplication(AppComponent, { providers: [provideHttpClient()] }).catch(console.error);



