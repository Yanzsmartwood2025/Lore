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
    <section
      aria-label="Centro de control de audio"
      className="overflow-hidden rounded-3xl border border-cyan-400/30 bg-[radial-gradient(circle_at_top,rgba(0,242,234,0.10),transparent_36%),linear-gradient(180deg,rgba(4,15,24,0.96),rgba(0,0,0,0.92))] shadow-[0_0_28px_rgba(0,242,234,0.12)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-left">
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-cyan-400/70">Control Center</p>
          <div className="mt-0.5 flex items-center gap-2">
            <h4 className="text-sm font-semibold tracking-wide text-white">Lore DJ Console</h4>
            <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-slate-500'}`} />
          </div>
        </div>
        <button
          type="button"
          onClick={toggleMute}
          className="min-w-[92px] rounded-xl border border-cyan-400/25 bg-cyan-950/35 px-3 py-2 text-[11px] font-medium text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-900/35"
          aria-pressed={!isMuted}
        >
          {isMuted ? '🔇 Silenciado' : '🔊 Sonido ON'}
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-slate-500">
            <span>Transporte</span>
            <span>{isPlaying ? 'Reproduciendo' : 'En pausa'}</span>
          </div>
          <div className="grid grid-cols-[48px_1fr_48px] items-center gap-2">
            <button
              type="button"
              onClick={prevTrack}
              aria-label="Canción anterior"
              className="h-11 rounded-2xl border border-cyan-500/25 bg-cyan-950/30 text-base text-cyan-100 transition active:scale-95"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="h-11 rounded-2xl border border-cyan-300/70 bg-cyan-400/15 px-4 text-sm font-semibold text-white shadow-[inset_0_0_18px_rgba(0,242,234,0.08),0_0_14px_rgba(0,242,234,0.10)] transition hover:bg-cyan-400/25 active:scale-[0.98]"
            >
              {isPlaying ? '⏸  Pausar' : '▶  Reproducir'}
            </button>
            <button
              type="button"
              onClick={nextTrack}
              aria-label="Siguiente canción"
              className="h-11 rounded-2xl border border-cyan-500/25 bg-cyan-950/30 text-base text-cyan-100 transition active:scale-95"
            >
              ⏭
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 text-left text-[9px] uppercase tracking-[0.2em] text-slate-500">Ambiente</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(MUSIC_CATEGORIES) as [MusicCategory, (typeof MUSIC_CATEGORIES)[MusicCategory]][]).map(([key, category]) => (
              <button
                type="button"
                key={key}
                aria-pressed={ambientCategory === key}
                onClick={() => setAmbientCategory(key)}
                className={`rounded-xl border px-3 py-2 text-[11px] font-medium transition-all ${
                  ambientCategory === key
                    ? 'border-cyan-300/80 bg-cyan-400/20 text-cyan-50 shadow-[0_0_12px_rgba(0,242,234,0.15)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-500/30'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {isHome && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-slate-500">
              <span>Escena activa</span>
              <span className="text-cyan-400/80">Live stage</span>
            </div>
            <select
              value={selected}
              onChange={(event) => selectPersona(event.target.value)}
              className="w-full rounded-xl border border-cyan-500/25 bg-black/70 px-3 py-2.5 text-sm text-cyan-50 outline-none transition focus:border-cyan-300/70"
              aria-label="Seleccionar personaje en escena"
            >
              {models.filter((model) => model.isActive).map((model) => (
                <option key={model.slug} value={model.slug}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rounded-xl border border-dashed border-white/10 px-3 py-2 text-center text-[9px] uppercase tracking-[0.16em] text-slate-600">
          Módulos futuros · Luces · Video · Efectos
        </div>
      </div>
    </section>
  );
}
