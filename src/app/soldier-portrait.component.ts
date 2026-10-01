import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-soldier-portrait',
  standalone: true,
  host: { style: 'display:contents' },
  template: `@if (index() === 1 && !failed()) {
    <svg class="soldier-image criban-rig" viewBox="0 0 1024 1536" width="1024" height="1536"
      role="img" [attr.aria-label]="description()" xmlns="http://www.w3.org/2000/svg">
      <image href="images/criban-rig/legs.png" x="102" y="425" width="778.24" height="1167.36" (error)="failed.set(true)" />
      <g class="arm-left">
        <image href="images/criban-rig/arm-left.png" x="45" y="55" width="819.2" height="1228.8" (error)="failed.set(true)" />
      </g>
      <g class="arm-right">
        <image href="images/criban-rig/arm-right.png" x="117" y="16" width="839.68" height="1259.52" (error)="failed.set(true)" />
      </g>
      <g class="ribcage">
        <image href="images/criban-rig/torso.png" x="180" y="105" width="614.4" height="921.6" (error)="failed.set(true)" />
      </g>
      <g class="head">
        <image href="images/criban-rig/head.png" x="245" y="0" width="512" height="768" (error)="failed.set(true)" />
      </g>
    </svg>
  } @else {
    <img class="soldier-image" [class.kingcoffee-portrait]="index() === 2" [src]="src()" [alt]="description()" width="1024" height="1536">
  }`,
  styles: `
    .criban-rig g { transform-box:view-box; }
    .ribcage { transform-origin:51% 41%; animation:chest-breath 4.8s ease-in-out infinite; }
    .head { transform-origin:50% 17%; animation:head-breath 4.8s ease-in-out infinite; }
    .arm-left { transform-origin:36% 18%; animation:left-arm-breath 4.8s ease-in-out infinite; }
    .arm-right { transform-origin:64% 18%; animation:right-arm-breath 4.8s ease-in-out infinite; }
    @keyframes chest-breath {
      0%,100% { transform:translateY(0) scale(1); }
      45% { transform:translateY(-4px) scale(1.018,1.025); }
    }
    @keyframes head-breath {
      0%,100% { transform:translateY(0) rotate(0); }
      45% { transform:translateY(-9px) rotate(.15deg); }
    }
    @keyframes left-arm-breath {
      0%,100% { transform:translateY(0) rotate(0); }
      48% { transform:translateY(-6px) rotate(.8deg); }
    }
    @keyframes right-arm-breath {
      0%,100% { transform:translateY(0) rotate(0); }
      48% { transform:translateY(-6px) rotate(-.8deg); }
    }
    @media(prefers-reduced-motion:reduce) { .criban-rig g { animation:none; } }
  `,
})
export class SoldierPortraitComponent {
  readonly src = input.required<string>();
  readonly description = input.required<string>();
  readonly index = input(0);
  readonly inactive = input(false);
  readonly failed = signal(false);
}
