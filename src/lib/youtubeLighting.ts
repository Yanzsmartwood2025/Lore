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

// Cada género define BPM y el comportamiento completo de la sala, los rayos y la esfera.
// Los valores están normalizados para mantener el shader ligero y evitar
// flashes agresivos. La paleta se expresa en RGB 0..1. Priorizamos cyan, azul,\n// violeta y dorado suave; evitamos rojos saturados para conservar la identidad de Lore.
const CATEGORY_PROFILES: Record<MusicCategory, YouTubeLightingProfile> = {
  reggaeton: {
    bpm: 94,
    offsetSeconds: 0,
    rotationSpeed: 1.18,
    ringSpeed: 1.22,
    beamDensity: 1.12,
    beamWidth: 0.9,
    beamIntensity: 0.92,
    haze: 0.60,
    laserFan: 0.28,
    prism: 0.42,
    warmthBias: 0.45,
    paletteA: [0.02, 0.90, 1.0],
    paletteB: [0.64, 0.18, 1.0],
    paletteC: [0.92, 0.60, 0.18],
  },
  reggaeton_clasico: {
    bpm: 96,
    offsetSeconds: 0,
    rotationSpeed: 1.02,
    ringSpeed: 1.04,
    beamDensity: 1.0,
    beamWidth: 1.02,
    beamIntensity: 0.86,
    haze: 0.54,
    laserFan: 0.14,
    prism: 0.30,
    warmthBias: 0.52,
    paletteA: [0.04, 0.54, 1.0],
    paletteB: [0.68, 0.20, 0.96],
    paletteC: [0.92, 0.64, 0.22],
  },
  electronica: {
    bpm: 128,
    offsetSeconds: 0,
    rotationSpeed: 1.50,
    ringSpeed: 1.60,
    beamDensity: 1.56,
    beamWidth: 0.70,
    beamIntensity: 1.02,
    haze: 0.74,
    laserFan: 0.84,
    prism: 0.78,
    warmthBias: 0.18,
    paletteA: [0.0, 0.94, 1.0],
    paletteB: [0.18, 0.30, 1.0],
    paletteC: [0.66, 0.18, 1.0],
  },
  techno: {
    bpm: 138,
    offsetSeconds: 0,
    rotationSpeed: 1.72,
    ringSpeed: 1.86,
    beamDensity: 1.88,
    beamWidth: 0.54,
    beamIntensity: 1.06,
    haze: 0.82,
    laserFan: 1.0,
    prism: 0.94,
    warmthBias: 0.08,
    paletteA: [0.0, 0.76, 1.0],
    paletteB: [0.44, 0.12, 1.0],
    paletteC: [0.90, 0.96, 1.0],
  },
  rock_latino: {
    bpm: 118,
    offsetSeconds: 0,
    rotationSpeed: 0.98,
    ringSpeed: 0.94,
    beamDensity: 0.94,
    beamWidth: 1.08,
    beamIntensity: 0.84,
    haze: 0.46,
    laserFan: 0.10,
    prism: 0.24,
    warmthBias: 0.42,
    paletteA: [0.02, 0.60, 1.0],
    paletteB: [0.58, 0.14, 0.92],
    paletteC: [0.92, 0.58, 0.18],
  },
  rock_2000: {
    bpm: 124,
    offsetSeconds: 0,
    rotationSpeed: 1.16,
    ringSpeed: 1.08,
    beamDensity: 1.16,
    beamWidth: 0.82,
    beamIntensity: 0.96,
    haze: 0.52,
    laserFan: 0.24,
    prism: 0.38,
    warmthBias: 0.24,
    paletteA: [0.02, 0.58, 1.0],
    paletteB: [0.60, 0.18, 1.0],
    paletteC: [0.90, 0.94, 1.0],
  },
  romantica: {
    bpm: 72,
    offsetSeconds: 0,
    rotationSpeed: 0.52,
    ringSpeed: 0.56,
    beamDensity: 0.58,
    beamWidth: 1.38,
    beamIntensity: 0.48,
    haze: 0.44,
    laserFan: 0.0,
    prism: 0.12,
    warmthBias: 0.30,
    paletteA: [0.16, 0.50, 0.96],
    paletteB: [0.54, 0.20, 0.88],
    paletteC: [0.76, 0.38, 0.92],
  },
  baladas_ingles: {
    bpm: 74,
    offsetSeconds: 0,
    rotationSpeed: 0.54,
    ringSpeed: 0.56,
    beamDensity: 0.58,
    beamWidth: 1.34,
    beamIntensity: 0.50,
    haze: 0.42,
    laserFan: 0.0,
    prism: 0.12,
    warmthBias: 0.24,
    paletteA: [0.10, 0.58, 0.98],
    paletteB: [0.40, 0.22, 0.88],
    paletteC: [0.68, 0.42, 0.92],
  },
  vallenato: {
    bpm: 110,
    offsetSeconds: 0,
    rotationSpeed: 0.86,
    ringSpeed: 0.84,
    beamDensity: 0.84,
    beamWidth: 1.16,
    beamIntensity: 0.72,
    haze: 0.38,
    laserFan: 0.06,
    prism: 0.18,
    warmthBias: 0.56,
    paletteA: [0.04, 0.78, 0.94],
    paletteB: [0.60, 0.20, 0.92],
    paletteC: [0.94, 0.68, 0.20],
  },
  bachata: {
    bpm: 128,
    offsetSeconds: 0,
    rotationSpeed: 0.78,
    ringSpeed: 0.82,
    beamDensity: 0.82,
    beamWidth: 1.22,
    beamIntensity: 0.68,
    haze: 0.50,
    laserFan: 0.08,
    prism: 0.20,
    warmthBias: 0.44,
    paletteA: [0.42, 0.20, 0.92],
    paletteB: [0.78, 0.20, 0.78],
    paletteC: [0.92, 0.62, 0.24],
  },
  tropical: {
    bpm: 126,
    offsetSeconds: 0,
    rotationSpeed: 1.18,
    ringSpeed: 1.20,
    beamDensity: 1.28,
    beamWidth: 0.90,
    beamIntensity: 0.92,
    haze: 0.52,
    laserFan: 0.20,
    prism: 0.42,
    warmthBias: 0.52,
    paletteA: [0.02, 0.88, 0.96],
    paletteB: [0.64, 0.18, 0.92],
    paletteC: [0.94, 0.66, 0.18],
  },
  pop_clasicos: {
    bpm: 118,
    offsetSeconds: 0,
    rotationSpeed: 1.06,
    ringSpeed: 1.08,
    beamDensity: 1.12,
    beamWidth: 0.94,
    beamIntensity: 0.88,
    haze: 0.50,
    laserFan: 0.22,
    prism: 0.50,
    warmthBias: 0.32,
    paletteA: [0.04, 0.88, 1.0],
    paletteB: [0.74, 0.18, 0.88],
    paletteC: [0.58, 0.30, 1.0],
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
