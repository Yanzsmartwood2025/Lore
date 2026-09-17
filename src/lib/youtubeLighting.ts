import type { MusicCategory } from '@/lib/music';

export interface YouTubeLightingProfile {
  bpm: number;
  offsetSeconds: number;
}

// Motor visual exclusivo para la fuente actual de YouTube.
// No analiza ni extrae audio del iframe: usa el tiempo oficial del player
// para mantener una coreografía ligera y determinista. Cuando Lore tenga
// audio propio, ese flujo deberá usar un analizador separado de Web Audio.
const CATEGORY_PROFILES: Record<MusicCategory, YouTubeLightingProfile> = {
  reggaeton: { bpm: 92, offsetSeconds: 0 },
  romantica: { bpm: 76, offsetSeconds: 0 },
};

// Perfiles visuales opcionales para videos conocidos. Si el video actual no
// está aquí, se usa el perfil de la categoría sin romper la reproducción.
const VIDEO_PROFILES: Record<string, YouTubeLightingProfile> = {
  IU219AUOh3I: { bpm: 88, offsetSeconds: 0.12 },
};

export function getYouTubeLightingProfile(videoId: string | undefined, category: MusicCategory) {
  if (videoId && VIDEO_PROFILES[videoId]) return VIDEO_PROFILES[videoId];
  return CATEGORY_PROFILES[category];
}

export function getYouTubeLightingFrame(seconds: number, profile: YouTubeLightingProfile) {
  const beats = Math.max(0, seconds - profile.offsetSeconds) * profile.bpm / 60;
  const beatIndex = Math.floor(beats);
  const phase = beats - beatIndex;
  const pulse = Math.pow(Math.max(0, 1 - phase * 4.25), 2);
  const barBeat = ((beatIndex % 4) + 4) % 4;
  const barIndex = Math.floor(beatIndex / 4);
  const sweep = 10 + (0.5 + 0.5 * Math.sin(beats * Math.PI / 8)) * 80;
  const warmth = barBeat === 0 ? 0.9 : barBeat === 2 ? 0.42 : 0.18;
  const cardGlow = 0.08 + pulse * 0.34;

  return { beatIndex, barBeat, barIndex, pulse, sweep, warmth, cardGlow };
}
