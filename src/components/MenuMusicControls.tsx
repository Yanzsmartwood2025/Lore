'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBackwardStep,
  faCheck,
  faChevronDown,
  faForwardStep,
  faPause,
  faPlay,
  faVolumeHigh,
  faVolumeXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useMedia } from '@/context/MediaContext';
import { models } from '@/data/models';
import { MUSIC_CATEGORIES, MUSIC_CATEGORY_GROUPS, type MusicCategory } from '@/lib/music';

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
  const [sceneOpen, setSceneOpen] = useState(false);
  const activeModels = models.filter((model) => model.isActive);
  const selectedModel = activeModels.find((model) => model.slug === selected) ?? activeModels[0];

  function selectPersona(value: string) {
    setSelected(value);
    setSceneOpen(false);
    window.dispatchEvent(new CustomEvent('lore:persona-change', { detail: value }));
  }

  return (
    <section
      aria-label="Centro de control de audio"
      className="overflow-visible rounded-3xl border border-cyan-400/30 bg-[radial-gradient(circle_at_top,rgba(0,242,234,0.10),transparent_36%),linear-gradient(180deg,rgba(4,15,24,0.96),rgba(0,0,0,0.92))] shadow-[0_0_28px_rgba(0,242,234,0.12)]"
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
          className="flex min-w-[92px] items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-950/35 px-3 py-2 text-[11px] font-medium text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-900/35"
          aria-pressed={!isMuted}
        >
          <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} className="text-xs" />
          <span>{isMuted ? 'Silenciado' : 'Sonido ON'}</span>
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
              className="flex h-11 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-950/30 text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-900/35 active:scale-95"
            >
              <FontAwesomeIcon icon={faBackwardStep} className="text-base" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/70 bg-cyan-400/15 px-4 text-sm font-semibold text-white shadow-[inset_0_0_18px_rgba(0,242,234,0.08),0_0_14px_rgba(0,242,234,0.10)] transition hover:bg-cyan-400/25 active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-sm text-white" />
              <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
            </button>
            <button
              type="button"
              onClick={nextTrack}
              aria-label="Siguiente canción"
              className="flex h-11 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-950/30 text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-900/35 active:scale-95"
            >
              <FontAwesomeIcon icon={faForwardStep} className="text-base" />
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between text-left">
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Biblioteca</div>
              <div className="mt-0.5 text-[10px] text-slate-600">Elige un estilo para cambiar el ambiente</div>
            </div>
            <span className="text-[9px] uppercase tracking-[0.16em] text-cyan-400/60">YouTube</span>
          </div>

          <div className="space-y-3">
            {MUSIC_CATEGORY_GROUPS.map((group) => (
              <div key={group.id}>
                <div className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/35">
                  {group.name}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.categories.map((key) => {
                    const category = MUSIC_CATEGORIES[key as MusicCategory];
                    return (
                      <button
                        type="button"
                        key={key}
                        aria-pressed={ambientCategory === key}
                        onClick={() => setAmbientCategory(key as MusicCategory)}
                        className={`min-h-10 rounded-xl border px-2.5 py-2 text-[10px] font-medium leading-tight transition-all ${
                          ambientCategory === key
                            ? 'border-cyan-300/80 bg-cyan-400/20 text-cyan-50 shadow-[0_0_12px_rgba(0,242,234,0.15)]'
                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-500/30'
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isHome && (
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-slate-500">
              <span>Escena activa</span>
              <span className="text-cyan-400/80">Live stage</span>
            </div>

            <button
              type="button"
              onClick={() => setSceneOpen((open) => !open)}
              aria-expanded={sceneOpen}
              aria-haspopup="listbox"
              className={`flex w-full items-center justify-between rounded-xl border bg-black/70 px-3 py-2.5 text-left text-sm text-cyan-50 outline-none transition ${
                sceneOpen
                  ? 'border-cyan-300/70 shadow-[0_0_14px_rgba(0,242,234,0.14)]'
                  : 'border-cyan-500/25 hover:border-cyan-300/50'
              }`}
            >
              <span>{selectedModel?.name ?? 'Lore'}</span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-xs text-cyan-300 transition-transform duration-200 ${sceneOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {sceneOpen && (
              <div
                role="listbox"
                aria-label="Seleccionar personaje en escena"
                className="absolute left-3 right-3 top-[calc(100%-0.15rem)] z-30 overflow-hidden rounded-2xl border border-cyan-400/35 bg-[linear-gradient(180deg,rgba(3,14,22,0.99),rgba(0,0,0,0.99))] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.65),0_0_28px_rgba(0,242,234,0.12)] backdrop-blur-xl"
              >
                {activeModels.map((model) => {
                  const isSelected = model.slug === selected;
                  return (
                    <button
                      key={model.slug}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectPersona(model.slug)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? 'border border-cyan-300/35 bg-cyan-400/12 text-cyan-50'
                          : 'border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span>{model.name}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'border-cyan-300 bg-cyan-400/15 text-cyan-200' : 'border-white/20 text-transparent'}`}>
                        <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-dashed border-white/10 px-3 py-2 text-center text-[9px] uppercase tracking-[0.16em] text-slate-600">
          Módulos futuros · Luces · Video · Efectos
        </div>
      </div>
    </section>
  );
}
