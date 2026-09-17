'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMedia } from '@/context/MediaContext';
import { models } from '@/data/models';
import { MUSIC_CATEGORIES, type MusicCategory } from '@/lib/music';
import { DiscoSphere } from './DiscoSphere';

export function MediaPanel() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { isPlaying, isMuted, togglePlay, toggleMute, nextTrack, prevTrack, ambientCategory, setAmbientCategory } = useMedia();
  const [selected, setSelected] = useState('lore');
  const [controls, setControls] = useState(true);
  const [showYtPanel, setShowYtPanel] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const persona = models.find(m => m.slug === (isHome ? selected : pathname.split('/')[1])) ?? models[0];

  function reveal() {
    setControls(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!toolbar.current?.querySelector(':focus-visible')) setControls(false);
    }, 8000);
  }

  useEffect(() => {
    timer.current = setTimeout(() => { if (!toolbar.current?.querySelector(':focus-visible')) setControls(false); }, 8000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  // Handle Scroll to show/hide top YouTube panel
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          // Hide when scrolling DOWN, show when scrolling UP (and scrollY > 10)
          if (currentScrollY > lastScrollY.current && currentScrollY > 20) {
            setShowYtPanel(false);
          } else if (currentScrollY < lastScrollY.current) {
            setShowYtPanel(true);
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 1. STAGE FULLSCREEN BACKGROUND (Esfera / Chica a Pantalla Completa) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-black select-none">
        {persona.danceVideoSrc ? (
          <DanceVideo key={persona.danceVideoSrc} src={persona.danceVideoSrc} playing={isPlaying} />
        ) : (
          <DiscoSphere isPlaying={isPlaying} className="w-full h-full" />
        )}
        <div className="absolute bottom-16 left-6 z-10 pointer-events-none drop-shadow-md">
          <span className="text-[10px] tracking-[0.3em] uppercase text-cyan-400 font-semibold block">EL CLUB DE LORE</span>
          <strong className="text-2xl sm:text-3xl tracking-wider font-bold text-white uppercase">{persona.name}</strong>
        </div>
      </div>

      {/* 2. TOP SLIDING YOUTUBE PANEL (Panel de YouTube Oculto/Revelado con Scroll) */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-350 ease-in-out flex justify-center p-2 bg-black/85 backdrop-blur-md border-b border-cyan-500/30 shadow-2xl ${
          showYtPanel ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ transitionDuration: '350ms' }}
      >
        <div className="relative w-[280px] sm:w-[360px] h-[158px] sm:h-[202px] rounded-lg overflow-hidden border border-cyan-500/40 bg-black">
          {/* Maintained YT Player iFrame Host */}
          <div className="w-full h-full" id="yt-player-element" />
          <button
            type="button"
            onClick={() => setShowYtPanel(false)}
            className="absolute top-2 right-2 bg-black/70 text-cyan-400 hover:text-white text-xs px-2 py-1 rounded border border-cyan-500/40 backdrop-blur-sm transition-colors"
            title="Ocultar reproductor"
          >
            ✕ Ocultar
          </button>
        </div>
      </div>

      {/* 3. BOTTOM FLOATING CONTROLS (Controles flotantes inferiores) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center p-2 pointer-events-none select-none">
        <div className="pointer-events-auto flex items-center justify-center mb-1">
          <button
            type="button"
            onClick={() => { if (controls) setControls(false); else reveal(); }}
            aria-expanded={controls}
            aria-controls="lore-player-controls"
            className="text-[11px] bg-black/70 hover:bg-black/90 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 px-3 py-1 rounded-full backdrop-blur-md shadow-lg transition-all"
          >
            {controls ? '▼ Ocultar Controles' : '▲ Controles de Música'}
          </button>
        </div>

        {controls && (
          <div
            ref={toolbar}
            id="lore-player-controls"
            className="pointer-events-auto w-full max-w-xl bg-black/80 backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-3 shadow-2xl space-y-2 text-xs"
            onPointerDown={reveal}
            onKeyDown={reveal}
          >
            {/* Transport controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={prevTrack}
                aria-label="Canción anterior"
                className="px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 transition-colors"
              >
                ⏮
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="px-4 py-1.5 rounded-full border border-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30 text-white font-medium transition-colors"
              >
                {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
              </button>
              <button
                type="button"
                onClick={nextTrack}
                aria-label="Siguiente canción"
                className="px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 transition-colors"
              >
                ⏭
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 transition-colors ml-2"
              >
                {isMuted ? '🔇 Sin sonido' : '🔊 Con sonido'}
              </button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {(Object.entries(MUSIC_CATEGORIES) as [MusicCategory, (typeof MUSIC_CATEGORIES)[MusicCategory]][]).map(([key, category]) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={ambientCategory === key}
                  onClick={() => setAmbientCategory(key)}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                    ambientCategory === key
                      ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200 font-semibold shadow-[0_0_8px_rgba(0,242,234,0.4)]'
                      : 'border-slate-700/60 bg-black/40 hover:border-cyan-500/40 text-slate-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {isHome && (
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-cyan-300/80">
                <span>En escena:</span>
                <select
                  value={selected}
                  onChange={e => setSelected(e.target.value)}
                  className="bg-black/80 text-cyan-200 border border-cyan-500/40 rounded-lg px-2 py-0.5 outline-none focus:border-cyan-400"
                >
                  {models.filter(m => m.isActive).map(m => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function DanceVideo({ src, playing }: { src: string; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const update = () => {
      if (playing && !document.hidden) void video.play().catch(() => setFailed(true));
      else video.pause();
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => { video.pause(); document.removeEventListener('visibilitychange', update); };
  }, [playing]);
  if (failed) return <DiscoSphere isPlaying={playing} />;
  return <video ref={ref} src={src} muted loop playsInline preload="metadata" onError={() => setFailed(true)} aria-label="Video del personaje" />;
}
