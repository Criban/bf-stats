export interface HangarLighting {
  hallBrightness: number;
  hallSaturation: number;
  portraitLight: number;
  warmth: number;
  sunlight: number;
  nightTint: number;
}

const berlinClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin', hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
});

// Fixed local-time lighting cues, smoothly blended between each hour.
// Interior lighting stays on throughout the night; these are not sunrise predictions.
const cues: readonly (HangarLighting & { hour: number })[] = [
  { hour: 0, hallBrightness: .78, hallSaturation: .82, portraitLight: .84, warmth: .02, sunlight: 0, nightTint: .16 },
  { hour: 5, hallBrightness: .78, hallSaturation: .82, portraitLight: .84, warmth: .02, sunlight: 0, nightTint: .16 },
  { hour: 6, hallBrightness: .88, hallSaturation: .90, portraitLight: .88, warmth: .05, sunlight: .03, nightTint: .08 },
  { hour: 9, hallBrightness: 1.14, hallSaturation: 1, portraitLight: 1, warmth: .04, sunlight: .06, nightTint: 0 },
  { hour: 13, hallBrightness: 1.22, hallSaturation: 1.02, portraitLight: 1.04, warmth: .03, sunlight: .06, nightTint: 0 },
  { hour: 17, hallBrightness: 1.18, hallSaturation: 1.04, portraitLight: 1, warmth: .08, sunlight: .10, nightTint: 0 },
  { hour: 20, hallBrightness: .94, hallSaturation: .94, portraitLight: .92, warmth: .11, sunlight: .04, nightTint: .05 },
  { hour: 22, hallBrightness: .78, hallSaturation: .82, portraitLight: .84, warmth: .02, sunlight: 0, nightTint: .16 },
  { hour: 24, hallBrightness: .78, hallSaturation: .82, portraitLight: .84, warmth: .02, sunlight: 0, nightTint: .16 },
];

export function getBerlinLighting(date = new Date()): HangarLighting {
  const parts = berlinClock.formatToParts(date);
  const hour = Number(parts.find(part => part.type === 'hour')!.value)
    + Number(parts.find(part => part.type === 'minute')!.value) / 60;
  const nextIndex = cues.findIndex(cue => cue.hour > hour);
  const start = cues[nextIndex - 1];
  const end = cues[nextIndex];
  const progress = (hour - start.hour) / (end.hour - start.hour);
  const blend = (key: keyof HangarLighting) => start[key] + (end[key] - start[key]) * progress;
  return {
    hallBrightness: blend('hallBrightness'),
    hallSaturation: blend('hallSaturation'),
    portraitLight: blend('portraitLight'),
    warmth: blend('warmth'),
    sunlight: blend('sunlight'),
    nightTint: blend('nightTint'),
  };
}
