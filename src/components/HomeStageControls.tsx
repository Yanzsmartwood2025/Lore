'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBackwardStep,
  faForwardStep,
  faPause,
  faPlay,
  faSliders,
  faVolumeHigh,
  faVolumeXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useMedia } from '@/context/MediaContext';

export function HomeStageControls() {
  const [trayOpen, setTrayOpen] = useState(false);
  const {
    isPlaying,
    isMuted,
    togglePlay,
    toggleMute,
    nextTrack,
    prevTrack,
  } = useMedia();

  return (
    <div className="relative flex items-center gap-1.5">
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/45 p-1 shadow-[0_0_12px_rgba(0,242,234,0.05)] backdrop-blur-md">
        <button
          type="button"
          onClick={prevTrack}
          aria-label="Canción anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/55 text-white/80 transition hover:border-cyan-400/40 hover:text-cyan-100 active:scale-95"
        >
          <FontAwesomeIcon icon={faBackwardStep} className="text-[11px]" />
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          className="flex h-8 w-10 items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-400/10 text-white shadow-[0_0_10px_rgba(0,242,234,0.08)] transition hover:border-cyan-300/60 hover:bg-cyan-400/15 active:scale-95"
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xs" />
        </button>

        <button
          type="button"
          onClick={nextTrack}
          aria-label="Siguiente canción"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/55 text-white/80 transition hover:border-cyan-400/40 hover:text-cyan-100 active:scale-95"
        >
          <FontAwesomeIcon icon={faForwardStep} className="text-[11px]" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setTrayOpen((value) => !value)}
        aria-expanded={trayOpen}
        aria-label={trayOpen ? 'Cerrar bandeja de herramientas' : 'Abrir bandeja de herramientas'}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition active:scale-95 ${trayOpen
          ? 'border-cyan-300/55 bg-cyan-400/12 text-cyan-100'
          : 'border-white/10 bg-black/45 text-white/65 hover:border-cyan-400/40 hover:text-cyan-100'
        }`}
      >
        <FontAwesomeIcon icon={faSliders} className="text-[11px]" />
      </button>

      {trayOpen && (
        <div className="absolute left-0 top-[calc(100%+0.45rem)] z-50 w-44 rounded-2xl border border-white/12 bg-black/92 p-2 shadow-[0_14px_30px_rgba(0,0,0,0.55),0_0_20px_rgba(0,242,234,0.08)] backdrop-blur-xl">
          <p className="px-2 pb-1.5 text-[8px] uppercase tracking-[0.2em] text-white/35">Herramientas rápidas</p>

          <button
            type="button"
            onClick={toggleMute}
            className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2 text-left text-[11px] text-white/80 transition hover:border-cyan-400/30 hover:bg-cyan-400/8"
          >
            <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} className="w-3 text-cyan-200" />
            <span>{isMuted ? 'Activar sonido' : 'Silenciar'}</span>
          </button>

          <div className="mt-1.5 rounded-xl border border-dashed border-white/8 px-2.5 py-2 text-[8px] uppercase tracking-[0.16em] text-white/30">
            Ambiente · luces · efectos
          </div>
        </div>
      )}
    </div>
  );
}
