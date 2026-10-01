import { Component, input, model, output } from '@angular/core';
import { BattlefieldHistoryComponent } from '../battlefield-history/battlefield-history.component';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import type { Bf6Stats } from '../services/bf6-stats.service';
import { SoldierPortraitComponent } from './soldier-portrait/soldier-portrait.component';

@Component({
  selector: 'app-soldiers',
  standalone: true,
  imports: [BattlefieldHistoryComponent, SoldierPortraitComponent],
  host: { style: 'display:contents' },
  templateUrl: './soldiers.component.html',
})
export class SoldiersComponent {
  readonly players = input.required<PlayerProfile[]>();
  readonly selected = input.required<number>();
  readonly squadActive = input(false);
  readonly stats = input<Bf6Stats | null>(null);
  readonly historyOpen = model(false);
  readonly soldierSelected = output<number>();
}
