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
  reggaeton: { bpm: 94, offsetSeconds: 0 },
  reggaeton_clasico: { bpm: 96, offsetSeconds: 0 },
  electronica: { bpm: 128, offsetSeconds: 0 },
  techno: { bpm: 138, offsetSeconds: 0 },
  rock_latino: { bpm: 118, offsetSeconds: 0 },
  rock_2000: { bpm: 124, offsetSeconds: 0 },
  romantica: { bpm: 72, offsetSeconds: 0 },
  baladas_ingles: { bpm: 74, offsetSeconds: 0 },
  vallenato: { bpm: 110, offsetSeconds: 0 },
  bachata: { bpm: 128, offsetSeconds: 0 },
  tropical: { bpm: 126, offsetSeconds: 0 },
  pop_clasicos: { bpm: 118, offsetSeconds: 0 },
};

// Perfiles visuales opcionales para videos conocidos. Si el video actual no
// está aquí, se usa el perfil de la categoría sin romper la reproducción.
const VIDEO_PROFILES: Record<string, YouTubeLightingProfile> = {
  x7PTOd6eEVw: { bpm: 94, offsetSeconds: 0.08 },
  ExkL3pJ2bp8: { bpm: 96, offsetSeconds: 0.08 },
  P015XXC7JqQ: { bpm: 118, offsetSeconds: 0.05 },
  '7Snj1uTnGhc': { bpm: 124, offsetSeconds: 0.05 },
  '3QDrZupMPuE': { bpm: 128, offsetSeconds: 0.05 },
  '2zI9eujvInE': { bpm: 138, offsetSeconds: 0.04 },
};

export function getYouTubeLightingProfile(videoId: string | undefined, category: MusicCategory) {
  if (videoId && VIDEO_PROFILES[videoId]) return VIDEO_PROFILES[videoId];
  return CATEGORY_PROFILES[category];
}

export function getYouTubeLightingFrame(seconds: number, profile: YouTubeLightingProfile) {
  const beats = Math.max(0, seconds - profile.offsetSeconds) * profile.bpm / 60;
  const beatIndex = Math.floor(beats);
  const phase = beats - beatIndex;

  // Ataque corto y visible para que el bombo se sienta como un golpe de luz,
  // con una cola breve para que no parezca un simple parpadeo digital.
  const attack = Math.pow(Math.max(0, 1 - phase * 5.2), 1.55);
  const tail = Math.pow(Math.max(0, 1 - phase * 2.15), 3.2) * 0.28;
  const pulse = Math.min(1.2, attack + tail);

  const barBeat = ((beatIndex % 4) + 4) % 4;
  const barIndex = Math.floor(beatIndex / 4);
  const sweep = 8 + (0.5 + 0.5 * Math.sin(beats * Math.PI / 8)) * 84;
  const warmth = barBeat === 0 ? 0.96 : barBeat === 2 ? 0.48 : 0.2;

  // Más reflexión en las tarjetas para que el "vidrio" recoja el golpe de la sala.
  const cardGlow = 0.1 + pulse * (barBeat === 0 ? 0.54 : 0.44);

  return { beatIndex, barBeat, barIndex, pulse, sweep, warmth, cardGlow };
}
