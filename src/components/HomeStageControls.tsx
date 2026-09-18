'use client';

import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBackwardStep,
  faForwardStep,
  faPause,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { useMedia } from '@/context/MediaContext';

const HOLD_DELAY_MS = 420;
const SEEK_REPEAT_MS = 220;
const SEEK_STEP_SECONDS = 4;

export function HomeStageControls() {
  const {
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    seekBy,
  } = useMedia();

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heldRef = useRef(false);

  function clearHoldTimers() {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (repeatTimerRef.current) clearInterval(repeatTimerRef.current);
    holdTimerRef.current = null;
    repeatTimerRef.current = null;
  }

  function startHold(direction: -1 | 1) {
    clearHoldTimers();
    heldRef.current = false;

    holdTimerRef.current = setTimeout(() => {
      heldRef.current = true;
      seekBy(direction * SEEK_STEP_SECONDS);
      repeatTimerRef.current = setInterval(() => {
        seekBy(direction * SEEK_STEP_SECONDS);
      }, SEEK_REPEAT_MS);
    }, HOLD_DELAY_MS);
  }

  function finishHold(singlePressAction: () => void) {
    const wasHeld = heldRef.current;
    clearHoldTimers();
    heldRef.current = false;
    if (!wasHeld) singlePressAction();
  }

  function cancelHold() {
    clearHoldTimers();
    heldRef.current = false;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/45 p-1 shadow-[0_0_12px_rgba(0,242,234,0.05)] backdrop-blur-md">
        <button
          type="button"
          onPointerDown={() => startHold(-1)}
          onPointerUp={() => finishHold(prevTrack)}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          onContextMenu={(event) => event.preventDefault()}
          aria-label="Anterior. Mantén presionado para retroceder dentro de la pista."
          className="flex h-8 w-8 touch-none items-center justify-center rounded-lg border border-white/10 bg-black/55 text-white/80 transition hover:border-cyan-400/40 hover:text-cyan-100 active:scale-95"
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
          onPointerDown={() => startHold(1)}
          onPointerUp={() => finishHold(nextTrack)}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          onContextMenu={(event) => event.preventDefault()}
          aria-label="Siguiente. Mantén presionado para avanzar dentro de la pista."
          className="flex h-8 w-8 touch-none items-center justify-center rounded-lg border border-white/10 bg-black/55 text-white/80 transition hover:border-cyan-400/40 hover:text-cyan-100 active:scale-95"
        >
          <FontAwesomeIcon icon={faForwardStep} className="text-[11px]" />
        </button>
      </div>
    </div>
  );
}
