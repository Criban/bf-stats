import { bootstrapApplication } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ProfileCardComponent, type PlayerProfile } from './app/profile-card/profile-card.component';
@Component({ selector: 'app-root', standalone: true, imports: [ProfileCardComponent], templateUrl: './app/app.component.html' })
export class AppComponent {
  readonly view = signal<'squad' | 'clan'>('clan');
  readonly selected = signal(0);
  readonly players: PlayerProfile[] = [
    { id: '01', image: 'images/8lackh4wk-soldier.png', imageAlt: 'Soldat mit Kapuze', name: 'MV-8lackh4wk', description: 'Zusammen auf dem Battlefield.', trackerUrl: 'https://tracker.gg/bf6/profile/3116857178/overview' },
    { id: '02', image: 'images/criban-soldier.png', imageAlt: 'Soldat mit Helm', name: 'MV-Criban', description: 'Gemeinsam rein. Gemeinsam raus.', trackerUrl: 'https://tracker.gg/bf6/profile/3009163313/overview' },
  ];
  selectSoldier(index: number): void { this.selected.set(index); this.view.set('squad'); }
}
bootstrapApplication(AppComponent, { providers: [provideHttpClient()] }).catch(console.error);



