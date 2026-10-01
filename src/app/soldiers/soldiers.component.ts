import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, input, model, NgZone, output, PLATFORM_ID, signal } from '@angular/core';
import { BattlefieldHistoryComponent } from '../battlefield-history/battlefield-history.component';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import type { Bf6Stats } from '../services/bf6-stats.service';
import { SoldierPortraitComponent } from './soldier-portrait/soldier-portrait.component';
import { getBerlinLighting } from './hangar-lighting';

@Component({
  selector: 'app-soldiers',
  standalone: true,
  imports: [BattlefieldHistoryComponent, SoldierPortraitComponent],
  host: { style: 'display:contents' },
  templateUrl: './soldiers.component.html',
})
export class SoldiersComponent {
  readonly lighting = signal(getBerlinLighting());
  readonly players = input.required<PlayerProfile[]>();
  readonly selected = input.required<number>();
  readonly squadActive = input(false);
  readonly stats = input<Bf6Stats | null>(null);
  readonly historyOpen = model(false);
  readonly soldierSelected = output<number>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    const zone = inject(NgZone);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const refresh = () => zone.run(() => this.lighting.set(getBerlinLighting()));
    zone.runOutsideAngular(() => {
      const timer = window.setInterval(refresh, 60_000);
      const onVisibilityChange = () => { if (!document.hidden) refresh(); };
      document.addEventListener('visibilitychange', onVisibilityChange);
      destroyRef.onDestroy(() => {
        window.clearInterval(timer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      });
    });
  }
}
