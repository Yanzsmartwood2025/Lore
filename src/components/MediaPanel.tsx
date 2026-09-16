'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBackwardStep,
  faExpand,
  faForwardStep,
  faPause,
  faPlay,
  faVideo,
  faVolumeHigh,
  faVolumeMute,
} from '@fortawesome/free-solid-svg-icons';
import { useMedia } from '@/context/MediaContext';
import { MUSIC_CATEGORIES, type MusicCategory } from '@/lib/music';

type PresentationMode = 'normal' | 'fullscreen';

export function MediaPanel() {
  const panelRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
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
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('normal');

  const isHome = pathname === '/';
  const isFullscreen = isHome && presentationMode === 'fullscreen';

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setPresentationMode('normal');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    setPresentationMode('fullscreen');

    try {
      await panelRef.current?.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      await orientation.lock?.('landscape');
    } catch {
      // Algunos navegadores (especialmente iOS) no permiten bloquear la
      // orientación. La presentación ampliada sigue funcionando en ese caso.
    }
  };

  const exitFullscreen = async () => {
    setPresentationMode('normal');
    screen.orientation?.unlock?.();
    if (document.fullscreenElement) await document.exitFullscreen();
  };

  return (
    <>
      {isFullscreen && <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm" aria-hidden="true" />}

      {/* El mismo nodo del reproductor permanece montado al navegar: el audio no
          se reinicia cuando se abre un chat. Solo cambia su presentación. */}
      <section
        ref={panelRef}
        className={`fixed transition-all duration-500 ease-out ${
          isFullscreen
            ? 'inset-0 z-[60] flex items-center justify-center p-0 sm:p-5'
            : isHome
              ? 'left-1/2 top-[max(3.25rem,env(safe-area-inset-top))] z-40 w-[min(34rem,calc(100vw-1rem))] -translate-x-1/2'
              : 'right-3 top-3 z-40 w-44'
        }`}
        aria-label={isHome ? 'Reproductor musical' : 'Reproductor musical compacto'}
      >
        <div
          className={`relative overflow-hidden border bg-black/90 transition-all duration-500 ease-out ${
            isFullscreen
              ? 'h-full w-full rounded-none border-[#00f2ea]/45 shadow-[0_0_30px_rgba(0,242,234,0.2)] sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-6xl sm:rounded-3xl'
              : isHome
                ? 'rounded-2xl border-[#00f2ea]/45 shadow-[0_0_24px_rgba(0,242,234,0.18)]'
                : 'rounded-xl border-[#00f2ea]/30 shadow-[0_0_16px_rgba(0,242,234,0.16)] backdrop-blur-xl'
          }`}
        >
          <div className={`relative bg-black transition-all duration-500 ${isFullscreen ? 'h-full w-full' : 'aspect-video w-full'}`}>
            <div id="yt-player-element" className="h-full w-full" />

            {isHome && !isFullscreen && (
              <button
                type="button"
                onClick={enterFullscreen}
                className="absolute inset-0 z-0 cursor-pointer"
                aria-label="Expandir video musical"
              />
            )}

            {isFullscreen && (
              <button
                type="button"
                onClick={exitFullscreen}
                className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-md transition hover:border-[#00f2ea] hover:text-[#00f2ea]"
                aria-label="Salir de pantalla completa"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}

            <div className={`absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between bg-gradient-to-t from-black/95 via-black/60 to-transparent ${isHome ? 'px-4 pb-4 pt-12' : 'px-2 pb-2 pt-8'}`}>
              <div className={`flex items-center ${isHome ? 'gap-2' : 'gap-1'}`}>
                <PlayerButton label="Canción anterior" onClick={prevTrack} compact={!isHome} icon={faBackwardStep} />
                <PlayerButton
                  label={isPlaying ? 'Pausar' : 'Reproducir'}
                  onClick={togglePlay}
                  compact={!isHome}
                  primary
                  icon={isPlaying ? faPause : faPlay}
                />
                <PlayerButton label="Siguiente canción" onClick={nextTrack} compact={!isHome} icon={faForwardStep} />
              </div>
              <div className={`flex items-center ${isHome ? 'gap-2' : 'gap-1'}`}>
                <PlayerButton
                  label={isMuted ? 'Activar sonido' : 'Silenciar'}
                  onClick={toggleMute}
                  compact={!isHome}
                  icon={isMuted ? faVolumeMute : faVolumeHigh}
                />
                {isHome && !isFullscreen && (
                  <PlayerButton label="Pantalla completa" onClick={enterFullscreen} icon={faExpand} />
                )}
              </div>
            </div>
          </div>
          {!isHome && (
            <p className="px-2 py-1 text-center text-[8px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">
              Música en vivo
            </p>
          )}
        </div>

        {isHome && !isFullscreen && (
          <div className="mt-2 flex justify-center gap-2" aria-label="Ambiente musical">
            {(Object.entries(MUSIC_CATEGORIES) as Array<[MusicCategory, (typeof MUSIC_CATEGORIES)[MusicCategory]]>).map(([key, category]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAmbientCategory(key)}
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition ${
                  ambientCategory === key
                    ? 'border-[#00f2ea]/70 bg-[#00f2ea]/20 text-[#00f2ea]'
                    : 'border-white/20 bg-black/70 text-gray-300 hover:border-white/40'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {isFullscreen && (
          <button
            type="button"
            onClick={exitFullscreen}
            className="absolute right-4 top-4 flex aspect-video w-40 flex-col items-center justify-center rounded-xl border border-[#f000b8]/60 bg-gradient-to-br from-purple-950 via-black to-[#f000b8]/20 p-3 text-center shadow-[0_0_22px_rgba(240,0,184,0.35)] transition hover:scale-[1.03] sm:right-8 sm:top-8 sm:w-56"
            aria-label="Volver al contenido principal"
          >
            <FontAwesomeIcon icon={faVideo} className="mb-1 text-lg text-[#f000b8]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Contenido VIP</span>
            <span className="mt-1 text-[9px] text-gray-300">Volver al contenido</span>
          </button>
        )}
      </section>
    </>
  );
}

interface PlayerButtonProps {
  label: string;
  onClick: () => void;
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
  compact?: boolean;
  primary?: boolean;
}

function PlayerButton({ label, onClick, icon, compact = false, primary = false }: PlayerButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex items-center justify-center rounded-full border backdrop-blur-md transition hover:scale-105 ${
        compact ? 'h-6 w-6 text-[9px]' : 'h-10 w-10 text-sm'
      } ${
        primary
          ? 'border-[#00f2ea]/60 bg-[#00f2ea]/15 text-[#00f2ea] shadow-[0_0_12px_rgba(0,242,234,0.3)]'
          : 'border-white/25 bg-black/35 text-white hover:border-[#00f2ea] hover:text-[#00f2ea]'
      }`}
      aria-label={label}
      title={label}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}
