'use client';

import { useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faExpand,
  faMusic,
  faPause,
  faPlay,
  faVideo,
  faVolumeHigh,
  faVolumeMute,
} from '@fortawesome/free-solid-svg-icons';
import { useMedia } from '@/context/MediaContext';

type PresentationMode = 'normal' | 'fullscreen';

export function MediaPanel() {
  const pathname = usePathname();
  const {
    isPlaying,
    isMuted,
    activeTab,
    togglePlay,
    toggleMute,
    setActiveTab,
    playRequestedVideo,
  } = useMedia();
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('normal');
  const [musicRequest, setMusicRequest] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const isHome = pathname === '/';
  const isFullscreen = presentationMode === 'fullscreen';
  const isMusic = activeTab === 'music';

  const submitMusicRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = musicRequest.trim();
    if (!message || isRequesting) return;

    setIsRequesting(true);
    setRequestError('');

    try {
      const response = await fetch('/api/music-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data: { videoId?: string } = await response.json();

      if (!response.ok || !data.videoId) throw new Error('No video found');

      setActiveTab('music');
      playRequestedVideo(data.videoId);
      setMusicRequest('');
    } catch {
      setRequestError('No encontré esa canción, ¿puedes ser más específico?');
    } finally {
      setIsRequesting(false);
    }
  };

  const openMusicPictureInPicture = () => {
    setActiveTab('music');
    setPresentationMode('normal');
  };

  if (!isHome) return null;

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm" aria-hidden="true" />
      )}

      {/* The mode state lives here so both surfaces always swap together. */}
      <section
        className={`fixed z-[60] transition-all duration-500 ease-out ${
          isFullscreen
            ? 'inset-0 flex items-center justify-center p-0 sm:p-5'
            : 'top-4 right-4 w-[min(23rem,calc(100vw-2rem))]'
        }`}
        aria-label="Reproductor musical"
      >
        <div
          className={`relative overflow-hidden border border-[#00f2ea]/45 bg-black/90 shadow-[0_0_30px_rgba(0,242,234,0.2)] transition-all duration-500 ease-out ${
            isFullscreen
              ? 'h-full w-full rounded-none sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-6xl sm:rounded-3xl'
              : 'rounded-2xl'
          }`}
        >
          <div
            className={`relative bg-black transition-all duration-500 ${
              isFullscreen ? 'h-full w-full' : 'aspect-video w-full'
            }`}
          >
            {/* This target remains visible: YouTube is always presented without native controls. */}
            <div id="yt-player-element" className="h-full w-full" />

            {!isFullscreen && (
              <button
                type="button"
                onClick={() => setPresentationMode('fullscreen')}
                className="absolute inset-0 z-0 cursor-pointer"
                aria-label="Expandir video musical"
              />
            )}

            {isFullscreen && (
              <button
                type="button"
                onClick={() => setPresentationMode('normal')}
                className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-md transition hover:border-[#00f2ea] hover:text-[#00f2ea]"
                title="Salir de pantalla completa"
                aria-label="Salir de pantalla completa"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}

            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-12">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); togglePlay(); }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#00f2ea]/60 bg-[#00f2ea]/15 text-[#00f2ea] shadow-[0_0_14px_rgba(0,242,234,0.35)] transition hover:scale-105"
                  title={isPlaying ? 'Pausar' : 'Reproducir'}
                  aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </button>
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); toggleMute(); }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:border-[#00f2ea] hover:text-[#00f2ea]"
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                  aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeHigh} />
                </button>
              </div>
              {!isFullscreen && (
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); setPresentationMode('fullscreen'); }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:border-[#00f2ea] hover:text-[#00f2ea]"
                  title="Pantalla completa"
                  aria-label="Pantalla completa"
                >
                  <FontAwesomeIcon icon={faExpand} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* In fullscreen the VIP/chica content becomes the small inverse PiP surface. */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setPresentationMode('normal')}
            className="absolute right-4 top-4 flex aspect-video w-40 flex-col items-center justify-center rounded-xl border border-[#f000b8]/60 bg-gradient-to-br from-purple-950 via-black to-[#f000b8]/20 p-3 text-center shadow-[0_0_22px_rgba(240,0,184,0.35)] transition hover:scale-[1.03] sm:right-8 sm:top-8 sm:w-56"
            aria-label="Volver al contenido principal"
          >
            <FontAwesomeIcon icon={faVideo} className="mb-1 text-lg text-[#f000b8]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Contenido VIP</span>
            <span className="mt-1 text-[9px] text-gray-300">Volver al contenido</span>
          </button>
        )}
      </section>

      {!isFullscreen && (
        <div className="fixed bottom-20 left-1/2 z-40 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-[#f000b8]/35 bg-black/75 p-3 shadow-[0_0_20px_rgba(240,0,184,0.15)] backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <button type="button" onClick={openMusicPictureInPicture} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00f2ea]">
              <FontAwesomeIcon icon={faMusic} /> Ver el video musical
            </button>
            {!isMusic && <span className="text-[10px] text-gray-400">El video está en el cuadrito</span>}
          </div>
          <form onSubmit={submitMusicRequest} className="flex gap-2">
            <input
              id="music-request"
              type="text"
              value={musicRequest}
              onChange={(event) => setMusicRequest(event.target.value)}
              placeholder="Pide una canción"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#00f2ea]/60"
              disabled={isRequesting}
            />
            <button type="submit" className="rounded-lg border border-[#00f2ea]/45 bg-[#00f2ea]/15 px-3 text-xs font-semibold text-[#00f2ea] disabled:opacity-50" disabled={!musicRequest.trim() || isRequesting}>
              {isRequesting ? 'Buscando...' : 'Reproducir'}
            </button>
          </form>
          {requestError && <p className="mt-2 text-xs text-red-300" role="alert">{requestError}</p>}
        </div>
      )}
    </>
  );
}
