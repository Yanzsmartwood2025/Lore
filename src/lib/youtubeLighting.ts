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
