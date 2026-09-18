export const MUSIC_CATEGORIES = {
  reggaeton: {
    name: 'Reggaetón actual',
    group: 'club',
    source: { type: 'video', id: 'x7PTOd6eEVw' },
    fallback: { type: 'playlist', id: 'PLdDWv759fZOVpISTFiez5Nl8iNL5M4Nj9' },
  },
  reggaeton_clasico: {
    name: 'Reggaetón clásico',
    group: 'club',
    source: { type: 'video', id: 'ExkL3pJ2bp8' },
    fallback: { type: 'video', id: 'huu_nH7QwPE' },
  },
  electronica: {
    name: 'Electrónica / EDM',
    group: 'club',
    source: { type: 'video', id: '3QDrZupMPuE' },
  },
  techno: {
    name: 'Techno 90s / 2000s',
    group: 'club',
    source: { type: 'video', id: '2zI9eujvInE' },
  },
  rock_latino: {
    name: 'Rock latino clásico',
    group: 'rock',
    source: { type: 'video', id: 'P015XXC7JqQ' },
    fallback: { type: 'video', id: 'wqlPHqW46Mw' },
  },
  rock_2000: {
    name: 'Rock 2000+',
    group: 'rock',
    source: { type: 'video', id: '7Snj1uTnGhc' },
    fallback: { type: 'video', id: 'Y70p7YUFU7g' },
  },
  romantica: {
    name: 'Baladas en español',
    group: 'romantica',
    source: { type: 'video', id: '7PHlrKAkFPU' },
    fallback: { type: 'playlist', id: 'PLIYEKz6xQJo6-ZrWWbzmG92wIWxbdA143' },
  },
  baladas_ingles: {
    name: 'Baladas en inglés',
    group: 'romantica',
    source: { type: 'video', id: 'n0K8iAi0ZMo' },
  },
  vallenato: {
    name: 'Vallenato clásico',
    group: 'latina',
    source: { type: 'video', id: 'lIRQS71Ggfs' },
    fallback: { type: 'video', id: 'ZOwqnyxQuEk' },
  },
  bachata: {
    name: 'Bachata',
    group: 'latina',
    source: { type: 'video', id: 'SWFBRHTdUuM' },
    fallback: { type: 'video', id: 'B7znCMA7yzY' },
  },
  tropical: {
    name: 'Salsa / Merengue',
    group: 'latina',
    source: { type: 'video', id: 'FrSe2bIzo2Q' },
    fallback: { type: 'video', id: 'sxA6PWXvu9w' },
  },
  pop_clasicos: {
    name: 'Pop / fiesta clásicos',
    group: 'pop',
    source: { type: 'video', id: 'hLqUb_cBTfA' },
  },
} as const;

export type MusicCategory = keyof typeof MUSIC_CATEGORIES;
export type MusicSource = { type: 'video' | 'playlist'; id: string };

export const MUSIC_CATEGORY_GROUPS = [
  {
    id: 'club',
    name: 'Club',
    categories: ['reggaeton', 'reggaeton_clasico', 'electronica', 'techno'],
  },
  {
    id: 'rock',
    name: 'Rock',
    categories: ['rock_latino', 'rock_2000'],
  },
  {
    id: 'romantica',
    name: 'Romántica',
    categories: ['romantica', 'baladas_ingles'],
  },
  {
    id: 'latina',
    name: 'Latina',
    categories: ['vallenato', 'bachata', 'tropical'],
  },
  {
    id: 'pop',
    name: 'Pop / Clásicos',
    categories: ['pop_clasicos'],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  categories: readonly MusicCategory[];
}>;

export const DEFAULT_MUSIC_CATEGORY: MusicCategory = 'reggaeton';
export const REQUESTED_SONG_START_SECONDS = 18;

export function isMusicCategory(value: unknown): value is MusicCategory {
  return typeof value === 'string' && value in MUSIC_CATEGORIES;
}
