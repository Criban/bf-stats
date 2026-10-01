import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-soldier-portrait',
  standalone: true,
  host: { style: 'display:contents' },
  templateUrl: './soldier-portrait.component.html',
  styleUrl: './soldier-portrait.component.css',
})
export class SoldierPortraitComponent {
  readonly src = input.required<string>();
  readonly description = input.required<string>();
  readonly index = input(0);
  readonly inactive = input(false);
  readonly failed = signal(false);
}
