'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMedia } from '@/context/MediaContext';
import { models } from '@/data/models';
import { MUSIC_CATEGORIES, type MusicCategory } from '@/lib/music';

export function MenuMusicControls() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const {
    isPlaying,
    isMuted,
    togglePlay,
    toggleMute,
    nextTrack,
    prevTrack,
    ambientCategory,
    setAmbientCategory,
  } = useMedia();
  const [selected, setSelected] = useState('lore');

  function selectPersona(value: string) {
    setSelected(value);
    window.dispatchEvent(new CustomEvent('lore:persona-change', { detail: value }));
  }

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-black/45 p-3 text-xs shadow-[0_0_18px_rgba(0,242,234,0.08)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-400/80">Audio</p>
          <p className="text-sm font-medium text-white">Controles de música</p>
        </div>
        <button
          type="button"
          onClick={toggleMute}
          className="rounded-full border border-cyan-500/25 bg-cyan-950/30 px-3 py-1.5 text-cyan-200"
        >
          {isMuted ? '🔇 Sin sonido' : '🔊 Con sonido'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={prevTrack}
          aria-label="Canción anterior"
          className="rounded-full border border-cyan-500/25 bg-cyan-950/30 px-3 py-2 text-cyan-200"
        >
          ⏮
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="min-w-28 rounded-full border border-cyan-400 bg-cyan-500/15 px-4 py-2 font-medium text-white"
        >
          {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
        </button>
        <button
          type="button"
          onClick={nextTrack}
          aria-label="Siguiente canción"
          className="rounded-full border border-cyan-500/25 bg-cyan-950/30 px-3 py-2 text-cyan-200"
        >
          ⏭
        </button>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {(Object.entries(MUSIC_CATEGORIES) as [MusicCategory, (typeof MUSIC_CATEGORIES)[MusicCategory]][]).map(([key, category]) => (
          <button
            type="button"
            key={key}
            aria-pressed={ambientCategory === key}
            onClick={() => setAmbientCategory(key)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition-all ${
              ambientCategory === key
                ? 'border-cyan-400 bg-cyan-500/25 text-cyan-100'
                : 'border-slate-700/60 bg-black/35 text-slate-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {isHome && (
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-cyan-300/80">
          <span>En escena:</span>
          <select
            value={selected}
            onChange={(event) => selectPersona(event.target.value)}
            className="rounded-lg border border-cyan-500/35 bg-black/80 px-2 py-1 text-cyan-100 outline-none"
          >
            {models.filter((model) => model.isActive).map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
