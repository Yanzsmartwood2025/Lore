export const MUSIC_CATEGORIES = {
  reggaeton: {
    name: 'Reggaetón/Fiesta',
    source: { type: 'video', id: 'IU219AUOh3I' },
    fallback: { type: 'playlist', id: 'PLdDWv759fZOVpISTFiez5Nl8iNL5M4Nj9' },
  },
  romantica: {
    name: 'Romántica/Despecho',
    source: { type: 'playlist', id: 'PLIYEKz6xQJo6-ZrWWbzmG92wIWxbdA143' },
  },
} as const;

export type MusicCategory = keyof typeof MUSIC_CATEGORIES;
export type MusicSource = { type: 'video' | 'playlist'; id: string };

export const DEFAULT_MUSIC_CATEGORY: MusicCategory = 'reggaeton';
export const REQUESTED_SONG_START_SECONDS = 18;

export function isMusicCategory(value: unknown): value is MusicCategory {
  return typeof value === 'string' && value in MUSIC_CATEGORIES;
}
