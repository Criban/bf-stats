import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SQUAD_VIDEOS } from '../data/videos';

@Component({
  selector: 'app-videos',
  standalone: true,
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.css',
})
export class VideosComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly videos = SQUAD_VIDEOS;
  readonly selected = signal(this.videos[0]);
  readonly playerUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://www.youtube-nocookie.com/embed/${this.selected().id}?playsinline=1&rel=0`,
  ));
}
