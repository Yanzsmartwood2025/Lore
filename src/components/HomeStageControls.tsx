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
  const [open, setOpen] = useState(false);
  const {
    isPlaying,
    isMuted,
    togglePlay,
    toggleMute,
    nextTrack,
    prevTrack,
  } = useMedia();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Ocultar controles básicos' : 'Mostrar controles básicos'}
        className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md transition ${open
          ? 'border-cyan-300/60 bg-cyan-400/12 text-cyan-100 shadow-[0_0_14px_rgba(0,242,234,0.14)]'
          : 'border-white/15 bg-black/35 text-white/75 hover:border-cyan-400/40 hover:text-white'
        }`}
      >
        <FontAwesomeIcon icon={faSliders} className="text-xs text-cyan-300" />
        <span className="hidden min-[390px]:inline">Control</span>
      </button>

      <div
        className={`grid min-w-0 transition-[grid-template-columns,opacity] duration-300 ease-out ${open
          ? 'grid-cols-[repeat(4,2.35rem)] opacity-100'
          : 'pointer-events-none grid-cols-[repeat(4,0rem)] opacity-0'
        }`}
        aria-hidden={!open}
      >
        {[
          { label: 'Anterior', icon: faBackwardStep, action: prevTrack },
          { label: isPlaying ? 'Pausar' : 'Reproducir', icon: isPlaying ? faPause : faPlay, action: togglePlay },
          { label: 'Siguiente', icon: faForwardStep, action: nextTrack },
          { label: isMuted ? 'Activar sonido' : 'Silenciar', icon: isMuted ? faVolumeXmark : faVolumeHigh, action: toggleMute },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            tabIndex={open ? 0 : -1}
            aria-label={item.label}
            className="mx-0.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/12 bg-black/45 text-white/80 transition hover:border-cyan-400/45 hover:text-cyan-100 active:scale-95"
          >
            <FontAwesomeIcon icon={item.icon} className="text-xs" />
          </button>
        ))}
      </div>
    </div>
  );
}
