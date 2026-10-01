import { Component, ElementRef, HostListener, afterRenderEffect, computed, input, model, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import type { Bf6Stats } from '../services/bf6-stats.service';
import { BATTLEFIELD_HISTORY } from '../data/battlefield-history';
import { historyTotals } from '../data/history-totals';

@Component({
  selector: 'app-battlefield-history',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './battlefield-history.component.html',
  styleUrl: './battlefield-history.component.css'
})
export class BattlefieldHistoryComponent {
  readonly player = input.required<PlayerProfile>();
  readonly stats = input<Bf6Stats | null>(null);
  readonly open = model(false);
  readonly entries = computed(() => BATTLEFIELD_HISTORY[this.player().id] ?? []);
  readonly overallStats = computed(() => historyTotals(this.entries(), this.stats()));
  private readonly mobile = signal(window.matchMedia('(max-width: 760px)').matches);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('historyDialog');

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && this.mobile()) {
        if (!dialog.open) { dialog.scrollTop = 0; dialog.showModal(); }
      } else if (dialog.open) { dialog.close(); }
    });
  }
  close(): void { this.open.set(false); }
  onDialogClose(): void {
    if (!this.dialog().nativeElement.open) { this.close(); }
  }
  @HostListener('window:resize')
  syncLayout(): void {
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    if (!mobile && this.dialog().nativeElement.open) { this.close(); }
    this.mobile.set(mobile);
  }
  formatTotal(value: number | null, digits = 0): string {
    return value === null ? '—' : new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
  }
  formatSnapshotDate(value: string): string {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(value));
  }
}
