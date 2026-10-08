import { AfterViewInit, Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import type { StatsSnapshot } from '../services/bf6-stats-history';
import { kdHistoryChart } from './kd-history-chart';

@Component({
  selector: 'app-kd-history',
  standalone: true,
  templateUrl: './kd-history.component.html',
  styleUrl: './kd-history.component.css'
})
export class KdHistoryComponent implements AfterViewInit {
  readonly name = input.required<string>();
  readonly snapshots = input.required<StatsSnapshot[]>();
  readonly closed = output<void>();
  readonly chart = computed(() => kdHistoryChart(this.snapshots()));
  readonly selectedIndex = signal<number | null>(null);
  readonly index = computed(() => Math.min(this.selectedIndex() ?? this.chart().points.length - 1, this.chart().points.length - 1));
  readonly selected = computed(() => this.chart().points[this.index()]);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly numberFormat = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  private readonly dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
  private readonly shortDateFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' });

  ngAfterViewInit(): void { this.dialog().nativeElement.showModal(); }
  close(): void { this.dialog().nativeElement.close(); }
  dismissBackdrop(event: MouseEvent): void {
    if (event.target !== this.dialog().nativeElement) return;
    const rect = this.dialog().nativeElement.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.close();
  }
  selectPoint(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 720;
    const points = this.chart().points;
    if (!points.length) return;
    this.selectedIndex.set(points.reduce((nearest, point, index) => Math.abs(point.x - x) < Math.abs(points[nearest].x - x) ? index : nearest, 0));
  }
  selectSlider(event: Event): void { this.selectedIndex.set(Number((event.target as HTMLInputElement).value)); }
  formatValue(value: number): string { return this.numberFormat.format(value); }
  formatDate(value: string): string { return this.dateFormat.format(new Date(value)); }
  shortDate(value: string): string { return this.shortDateFormat.format(new Date(value)); }
}
