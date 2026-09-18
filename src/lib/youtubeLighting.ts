import type { MusicCategory } from '@/lib/music';

export type RgbTriplet = readonly [number, number, number];

export interface YouTubeLightingProfile {
  bpm: number;
  offsetSeconds: number;
  rotationSpeed: number;
  ringSpeed: number;
  beamDensity: number;
  beamWidth: number;
  beamIntensity: number;
  haze: number;
  laserFan: number;
  prism: number;
  warmthBias: number;
  paletteA: RgbTriplet;
  paletteB: RgbTriplet;
  paletteC: RgbTriplet;
}

// Cada género define no solo BPM, sino el comportamiento completo de la sala.
// Los valores están normalizados para mantener el shader ligero y evitar
// flashes agresivos. La paleta se expresa en RGB 0..1.
const CATEGORY_PROFILES: Record<MusicCategory, YouTubeLightingProfile> = {
  reggaeton: {
    bpm: 94,
    offsetSeconds: 0,
    rotationSpeed: 1.05,
    ringSpeed: 1.1,
    beamDensity: 1.0,
    beamWidth: 0.95,
    beamIntensity: 1.0,
    haze: 0.52,
    laserFan: 0.18,
    prism: 0.32,
    warmthBias: 0.72,
    paletteA: [0.03, 0.90, 1.0],
    paletteB: [0.68, 0.18, 1.0],
    paletteC: [1.0, 0.44, 0.10],
  },
  reggaeton_clasico: {
    bpm: 96,
    offsetSeconds: 0,
    rotationSpeed: 0.9,
    ringSpeed: 0.95,
    beamDensity: 0.92,
    beamWidth: 1.08,
    beamIntensity: 0.92,
    haze: 0.46,
    laserFan: 0.08,
    prism: 0.24,
    warmthBias: 0.82,
    paletteA: [0.06, 0.48, 1.0],
    paletteB: [0.92, 0.16, 0.72],
    paletteC: [1.0, 0.53, 0.14],
  },
  electronica: {
    bpm: 128,
    offsetSeconds: 0,
    rotationSpeed: 1.38,
    ringSpeed: 1.48,
    beamDensity: 1.42,
    beamWidth: 0.72,
    beamIntensity: 1.14,
    haze: 0.68,
    laserFan: 0.72,
    prism: 0.7,
    warmthBias: 0.26,
    paletteA: [0.0, 0.92, 1.0],
    paletteB: [0.20, 0.28, 1.0],
    paletteC: [0.70, 0.16, 1.0],
  },
  techno: {
    bpm: 138,
    offsetSeconds: 0,
    rotationSpeed: 1.58,
    ringSpeed: 1.72,
    beamDensity: 1.72,
    beamWidth: 0.56,
    beamIntensity: 1.22,
    haze: 0.78,
    laserFan: 1.0,
    prism: 0.84,
    warmthBias: 0.12,
    paletteA: [0.0, 0.72, 1.0],
    paletteB: [0.48, 0.12, 1.0],
    paletteC: [0.92, 0.96, 1.0],
  },
  rock_latino: {
    bpm: 118,
    offsetSeconds: 0,
    rotationSpeed: 0.86,
    ringSpeed: 0.82,
    beamDensity: 0.82,
    beamWidth: 1.16,
    beamIntensity: 0.92,
    haze: 0.36,
    laserFan: 0.04,
    prism: 0.16,
    warmthBias: 0.76,
    paletteA: [0.02, 0.56, 1.0],
    paletteB: [0.78, 0.10, 0.16],
    paletteC: [1.0, 0.48, 0.08],
  },
  rock_2000: {
    bpm: 124,
    offsetSeconds: 0,
    rotationSpeed: 1.08,
    ringSpeed: 1.0,
    beamDensity: 1.08,
    beamWidth: 0.84,
    beamIntensity: 1.04,
    haze: 0.46,
    laserFan: 0.18,
    prism: 0.3,
    warmthBias: 0.34,
    paletteA: [0.02, 0.54, 1.0],
    paletteB: [0.64, 0.18, 1.0],
    paletteC: [0.92, 0.94, 1.0],
  },
  romantica: {
    bpm: 72,
    offsetSeconds: 0,
    rotationSpeed: 0.44,
    ringSpeed: 0.48,
    beamDensity: 0.48,
    beamWidth: 1.42,
    beamIntensity: 0.52,
    haze: 0.38,
    laserFan: 0,
    prism: 0.08,
    warmthBias: 0.46,
    paletteA: [0.18, 0.48, 0.96],
    paletteB: [0.58, 0.20, 0.88],
    paletteC: [0.96, 0.36, 0.62],
  },
  baladas_ingles: {
    bpm: 74,
    offsetSeconds: 0,
    rotationSpeed: 0.48,
    ringSpeed: 0.5,
    beamDensity: 0.52,
    beamWidth: 1.38,
    beamIntensity: 0.54,
    haze: 0.34,
    laserFan: 0,
    prism: 0.08,
    warmthBias: 0.30,
    paletteA: [0.12, 0.56, 0.98],
    paletteB: [0.42, 0.22, 0.88],
    paletteC: [0.72, 0.42, 0.92],
  },
  vallenato: {
    bpm: 110,
    offsetSeconds: 0,
    rotationSpeed: 0.76,
    ringSpeed: 0.74,
    beamDensity: 0.72,
    beamWidth: 1.22,
    beamIntensity: 0.78,
    haze: 0.3,
    laserFan: 0.02,
    prism: 0.12,
    warmthBias: 0.88,
    paletteA: [0.05, 0.76, 0.92],
    paletteB: [0.98, 0.54, 0.12],
    paletteC: [1.0, 0.76, 0.18],
  },
  bachata: {
    bpm: 128,
    offsetSeconds: 0,
    rotationSpeed: 0.68,
    ringSpeed: 0.72,
    beamDensity: 0.7,
    beamWidth: 1.30,
    beamIntensity: 0.72,
    haze: 0.42,
    laserFan: 0.04,
    prism: 0.14,
    warmthBias: 0.72,
    paletteA: [0.48, 0.18, 0.92],
    paletteB: [0.94, 0.20, 0.58],
    paletteC: [1.0, 0.48, 0.18],
  },
  tropical: {
    bpm: 126,
    offsetSeconds: 0,
    rotationSpeed: 1.08,
    ringSpeed: 1.08,
    beamDensity: 1.18,
    beamWidth: 0.94,
    beamIntensity: 1.0,
    haze: 0.44,
    laserFan: 0.12,
    prism: 0.34,
    warmthBias: 0.84,
    paletteA: [0.02, 0.86, 0.94],
    paletteB: [0.92, 0.18, 0.62],
    paletteC: [1.0, 0.56, 0.08],
  },
  pop_clasicos: {
    bpm: 118,
    offsetSeconds: 0,
    rotationSpeed: 0.96,
    ringSpeed: 0.98,
    beamDensity: 1.02,
    beamWidth: 0.98,
    beamIntensity: 0.94,
    haze: 0.42,
    laserFan: 0.14,
    prism: 0.42,
    warmthBias: 0.48,
    paletteA: [0.04, 0.86, 1.0],
    paletteB: [0.90, 0.18, 0.74],
    paletteC: [0.72, 0.26, 1.0],
  },
};

// Ajustes finos opcionales para videos conocidos. Se mezclan con el perfil
// de su género en vez de reemplazarlo por completo.
const VIDEO_PROFILES: Record<string, Partial<Pick<YouTubeLightingProfile, 'bpm' | 'offsetSeconds'>>> = {
  x7PTOd6eEVw: { bpm: 94, offsetSeconds: 0.08 },
  ExkL3pJ2bp8: { bpm: 96, offsetSeconds: 0.08 },
  P015XXC7JqQ: { bpm: 118, offsetSeconds: 0.05 },
  '7Snj1uTnGhc': { bpm: 124, offsetSeconds: 0.05 },
  '3QDrZupMPuE': { bpm: 128, offsetSeconds: 0.05 },
  '2zI9eujvInE': { bpm: 138, offsetSeconds: 0.04 },
};

export function getYouTubeLightingProfile(videoId: string | undefined, category: MusicCategory) {
  const categoryProfile = CATEGORY_PROFILES[category];
  const videoProfile = videoId ? VIDEO_PROFILES[videoId] : undefined;
  return videoProfile ? { ...categoryProfile, ...videoProfile } : categoryProfile;
}

export function getYouTubeLightingFrame(seconds: number, profile: YouTubeLightingProfile) {
  const beats = Math.max(0, seconds - profile.offsetSeconds) * profile.bpm / 60;
  const beatIndex = Math.floor(beats);
  const phase = beats - beatIndex;

  const attack = Math.pow(Math.max(0, 1 - phase * 5.2), 1.55);
  const tail = Math.pow(Math.max(0, 1 - phase * 2.15), 3.2) * 0.28;
  const pulse = Math.min(1.2, attack + tail);

  const barBeat = ((beatIndex % 4) + 4) % 4;
  const barIndex = Math.floor(beatIndex / 4);
  const sweep = 8 + (0.5 + 0.5 * Math.sin(beats * Math.PI / 8)) * 84;
  const rhythmicWarmth = barBeat === 0 ? 0.96 : barBeat === 2 ? 0.48 : 0.2;
  const warmth = Math.min(1, rhythmicWarmth * 0.58 + profile.warmthBias * 0.42);

  const cardGlow = 0.08 + pulse * (barBeat === 0 ? 0.5 : 0.4) * Math.max(0.58, profile.beamIntensity);

  return { beatIndex, barBeat, barIndex, pulse, sweep, warmth, cardGlow };
}
