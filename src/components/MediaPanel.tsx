'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTiktok, faXTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { useMedia } from '@/context/MediaContext';
import { models } from '@/data/models';
import { DiscoSphere } from './DiscoSphere';

export function MediaPanel() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { isPlaying, play, pause } = useMedia();
  const [selected, setSelected] = useState('lore');
  const [showYtPanel, setShowYtPanel] = useState(false);
  const [homeYouTubeExpanded, setHomeYouTubeExpanded] = useState(false);
  const [homeStageRect, setHomeStageRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const persona = models.find((model) => model.slug === (isHome ? selected : pathname.split('/')[1])) ?? models[0];
  const loreSignature = models[0].signature ?? '/assets/brand/intro/Lore-intro.png';

  useEffect(() => {
    const onPersonaChange = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (value) setSelected(value);
    };
    window.addEventListener('lore:persona-change', onPersonaChange as EventListener);
    return () => window.removeEventListener('lore:persona-change', onPersonaChange as EventListener);
  }, []);

  useEffect(() => {
    setShowYtPanel(false);
    setHomeYouTubeExpanded(false);
    setHomeStageRect(null);
  }, [pathname]);

  useEffect(() => {
    const revealFromChatHeader = () => {
      if (!isHome) setShowYtPanel(true);
    };

    window.addEventListener('lore:youtube-reveal', revealFromChatHeader);
    return () => window.removeEventListener('lore:youtube-reveal', revealFromChatHeader);
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;

    const handleSwap = (event: Event) => {
      const expanded = Boolean((event as CustomEvent<boolean>).detail);
      setHomeYouTubeExpanded(expanded);

      if (expanded) {
        const stage = document.getElementById('home-main-youtube-slot');
        if (stage) {
          const rect = stage.getBoundingClientRect();
          setHomeStageRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        }
        play();
      } else {
        pause();
      }
    };

    window.addEventListener('lore:home-youtube-swap', handleSwap as EventListener);
    return () => window.removeEventListener('lore:home-youtube-swap', handleSwap as EventListener);
  }, [isHome, play, pause]);

  useEffect(() => {
    if (!isHome || !homeYouTubeExpanded) return;

    const stage = document.getElementById('home-main-youtube-slot');
    if (!stage) return;

    const syncRect = () => {
      const rect = stage.getBoundingClientRect();
      setHomeStageRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };

    syncRect();
    const resizeObserver = new ResizeObserver(syncRect);
    resizeObserver.observe(stage);
    window.addEventListener('resize', syncRect);
    window.addEventListener('orientationchange', syncRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncRect);
      window.removeEventListener('orientationchange', syncRect);
    };
  }, [isHome, homeYouTubeExpanded]);

  return (
    <>
      <div className="fixed inset-0 z-0 h-full w-full select-none overflow-hidden bg-black pointer-events-none">
        {persona.danceVideoSrc ? (
          <DanceVideo key={persona.danceVideoSrc} src={persona.danceVideoSrc} playing={isPlaying} />
        ) : (
          <DiscoSphere isPlaying={isPlaying} className="h-full w-full" />
        )}
      </div>

      {isHome && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(.5rem,env(safe-area-inset-bottom))] z-20 flex items-end justify-between px-5 sm:px-8">
          <div className="pointer-events-none flex min-w-0 flex-col items-start">
            <div className="h-10 w-32 overflow-hidden sm:h-11 sm:w-36">
              <img
                src={loreSignature}
                alt="Firma de Lore"
                className="h-full w-full object-contain object-left"
                draggable={false}
              />
            </div>
          </div>

          <div className="pointer-events-auto mb-1 flex items-center gap-5 text-lg text-slate-500">
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="transition-transform hover:scale-110 hover:text-cyan-300">
              <FontAwesomeIcon icon={faTiktok} />
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X" className="transition-transform hover:scale-110 hover:text-white">
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="transition-transform hover:scale-110 hover:text-purple-300">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
          </div>
        </div>
      )}

      {isHome ? (
        <div
          className={`fixed z-40 overflow-hidden rounded-b-[1.65rem] bg-black shadow-[0_0_24px_rgba(0,0,0,0.45)] transition-opacity duration-300 [&>iframe]:h-full [&>iframe]:w-full ${
            homeYouTubeExpanded && homeStageRect ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={homeYouTubeExpanded && homeStageRect
            ? {
                top: homeStageRect.top,
                left: homeStageRect.left,
                width: homeStageRect.width,
                height: homeStageRect.height,
              }
            : { top: -1000, left: -1000, width: 320, height: 200 }}
          aria-hidden={!homeYouTubeExpanded}
        >
          <div className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" id="yt-player-element" />
        </div>
      ) : (
        <div
          className={`fixed left-0 right-0 top-0 z-40 flex justify-center border-b border-cyan-500/30 bg-black/90 p-2 shadow-2xl backdrop-blur-md transition-transform duration-350 ease-in-out ${
            showYtPanel ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="relative h-[158px] w-[280px] overflow-hidden rounded-lg border border-cyan-500/40 bg-black sm:h-[202px] sm:w-[360px]">
            <div className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" id="yt-player-element" />
            <button
              type="button"
              onClick={() => setShowYtPanel(false)}
              className="absolute right-2 top-2 rounded border border-cyan-500/40 bg-black/75 px-2 py-1 text-xs text-cyan-300 backdrop-blur-sm"
              title="Ocultar reproductor"
            >
              ✕ Ocultar
            </button>
          </div>
        </div>
      )}
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
    return () => {
      video.pause();
      document.removeEventListener('visibilitychange', update);
    };
  }, [playing]);

  if (failed) return <DiscoSphere isPlaying={playing} />;
  return <video ref={ref} src={src} muted loop playsInline preload="metadata" onError={() => setFailed(true)} aria-label="Video del personaje" />;
}
