'use client';

import { useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForward,
  faBackward,
  faVolumeHigh,
  faVolumeMute,
  faExpand,
  faCompress,
  faMusic,
  faVideo,
  faMinimize,
} from '@fortawesome/free-solid-svg-icons';
import { useMedia } from '@/context/MediaContext';

export function MediaPanel() {
  const pathname = usePathname();
  const {
    isPlaying,
    isMuted,
    videoSize,
    activeTab,
    currentPlaylistIndex,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleMute,
    setVideoSize,
    toggleVideoSize,
    setActiveTab,
    playRequestedVideo,
  } = useMedia();
  const [musicRequest, setMusicRequest] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

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

      if (!response.ok || !data.videoId) {
        throw new Error('No video found');
      }

      setActiveTab('music');
      playRequestedVideo(data.videoId);
      setMusicRequest('');
    } catch {
      setRequestError('No encontré esa canción, ¿puedes ser más específico?');
    } finally {
      setIsRequesting(false);
    }
  };

  const isHome = pathname === '/';
  const isHeroMode = isHome && videoSize === 'hero';
  const isMusic = activeTab === 'music';

  return (
    <>
      {/*
        Single persistent player container.
        When isHeroMode is true on Home, it renders in the top hero area.
        When isHeroMode is false (or on non-home routes), it transitions to floating bottom-right corner.
      */}
      <div
        className={`transition-all duration-500 ease-in-out z-40 ${
          isHeroMode
            ? 'w-full max-w-2xl mx-auto px-4 pt-6 pb-2 pointer-events-auto'
            : 'fixed bottom-4 right-4 pointer-events-auto'
        }`}
      >
        <div
          className={`bg-black/90 border backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 ${
            isMusic ? 'border-[#00f2ea]/40 shadow-[0_0_20px_rgba(0,242,234,0.15)]' : 'border-[#f000b8]/40 shadow-[0_0_20px_rgba(240,0,184,0.15)]'
          } ${
            isHeroMode
              ? 'w-full'
              : videoSize === 'micro'
              ? 'w-[190px] sm:w-[220px]'
              : 'w-[300px] sm:w-[350px]'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-black/80 border-b border-white/10 text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('music')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isMusic
                    ? 'text-[#00f2ea] bg-[#00f2ea]/20 border border-[#00f2ea]/50 shadow-[0_0_8px_rgba(0,242,234,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faMusic} />
                <span>Música</span>
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  !isMusic
                    ? 'text-[#f000b8] bg-[#f000b8]/20 border border-[#f000b8]/50 shadow-[0_0_8px_rgba(240,0,184,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faVideo} />
                <span>VIP</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                Playlist {currentPlaylistIndex + 1}/2
              </span>

              {/* View mode toggle controls */}
              {isHome && isHeroMode ? (
                <button
                  onClick={() => setVideoSize('expanded')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-[#00f2ea] text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all"
                  title="Minimizar reproductor a esquina flotante"
                >
                  <FontAwesomeIcon icon={faMinimize} className="text-xs" />
                  <span className="hidden sm:inline">Minimizar</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1">
                  {isHome && (
                    <button
                      onClick={() => setVideoSize('hero')}
                      className="text-gray-400 hover:text-[#00f2ea] text-xs p-1 transition-colors"
                      title="Volver a vista Grande Hero"
                    >
                      <FontAwesomeIcon icon={faExpand} />
                    </button>
                  )}
                  <button
                    onClick={toggleVideoSize}
                    className="text-gray-400 hover:text-white text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                    title={videoSize === 'micro' ? 'Cambiar a tamaño expandido' : 'Cambiar a tamaño micro'}
                  >
                    <FontAwesomeIcon icon={videoSize === 'micro' ? faExpand : faCompress} className="mr-1" />
                    <span>{videoSize === 'micro' ? 'Expandir' : 'Micro'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Player Container */}
          <div
            className={`relative bg-black overflow-hidden transition-all duration-300 ${
              isHeroMode
                ? 'aspect-video w-full max-h-[360px]'
                : videoSize === 'micro'
                ? 'h-[110px] w-full'
                : 'h-[190px] w-full'
            }`}
          >
            {/* YouTube IFrame target element - GUARANTEED ALWAYS VISIBLE for YT TOS */}
            <div
              id="yt-player-element"
              className={`w-full h-full transition-opacity duration-300 ${
                isMusic ? 'block' : 'hidden'
              }`}
            />

            {!isMusic && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/40 to-black text-gray-300 p-4 text-center">
                <FontAwesomeIcon icon={faVideo} className="text-3xl text-[#f000b8] mb-2 animate-pulse" />
                <p className="text-xs font-semibold">Contenido Exclusivo VIP</p>
                <p className="text-[10px] text-gray-400 mt-1">Avances promocionales e interacciones</p>
              </div>
            )}
          </div>

          {isMusic && (
            <form onSubmit={submitMusicRequest} className="border-t border-white/10 p-3">
              <label htmlFor="music-request" className="block text-xs text-gray-300 mb-2">
                Pide una canción
              </label>
              <div className="flex gap-2">
                <input
                  id="music-request"
                  type="text"
                  value={musicRequest}
                  onChange={(event) => setMusicRequest(event.target.value)}
                  placeholder="Ej. Blinding Lights de The Weeknd"
                  className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 text-xs text-white placeholder:text-gray-500"
                  disabled={isRequesting}
                />
                <button
                  type="submit"
                  className="rounded bg-[#00f2ea]/20 px-3 py-1 text-xs font-semibold text-[#00f2ea] disabled:opacity-50"
                  disabled={!musicRequest.trim() || isRequesting}
                >
                  {isRequesting ? 'Buscando...' : 'Reproducir'}
                </button>
              </div>
              {requestError && <p className="mt-2 text-xs text-red-300" role="alert">{requestError}</p>}
            </form>
          )}

          {/* Controls Overlay / Footer */}
          <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={prevTrack}
                className="text-gray-400 hover:text-white transition-colors p-1.5 hover:scale-110 active:scale-95"
                title="Pista anterior"
              >
                <FontAwesomeIcon icon={faBackward} className="text-sm" />
              </button>

              <button
                onClick={togglePlay}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                  isMusic
                    ? 'bg-[#00f2ea]/20 text-[#00f2ea] border border-[#00f2ea]/60 shadow-[0_0_10px_rgba(0,242,234,0.3)]'
                    : 'bg-[#f000b8]/20 text-[#f000b8] border border-[#f000b8]/60 shadow-[0_0_10px_rgba(240,0,184,0.3)]'
                }`}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-sm" />
              </button>

              <button
                onClick={nextTrack}
                className="text-gray-400 hover:text-white transition-colors p-1.5 hover:scale-110 active:scale-95"
                title="Siguiente pista"
              >
                <FontAwesomeIcon icon={faForward} className="text-sm" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold hidden sm:inline">
                {isPlaying ? 'Reproduciendo' : 'En Pausa'}
              </span>

              <button
                onClick={toggleMute}
                className={`p-1.5 transition-colors ${
                  isMuted ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-white'
                }`}
                title={isMuted ? 'Dessilenciar' : 'Silenciar'}
              >
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeHigh} className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
