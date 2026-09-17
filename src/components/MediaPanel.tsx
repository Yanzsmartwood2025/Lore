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
  const { isPlaying } = useMedia();
  const [selected, setSelected] = useState('lore');
  const [showYtPanel, setShowYtPanel] = useState(false);
  const armedAt = useRef(0);
  const touchStartY = useRef<number | null>(null);

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
    armedAt.current = 0;
  }, [pathname]);

  useEffect(() => {
    function requestReveal() {
      if (showYtPanel) return;

      if (!isHome) {
        setShowYtPanel(true);
        return;
      }

      const now = Date.now();
      if (now - armedAt.current < 1400) {
        armedAt.current = 0;
        setShowYtPanel(true);
      } else {
        armedAt.current = now;
      }
    }

    function handleWheel(event: WheelEvent) {
      if (showYtPanel) {
        if (event.deltaY > 45) setShowYtPanel(false);
        return;
      }
      if (event.deltaY < -45) requestReveal();
    }

    function handleTouchStart(event: TouchEvent) {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchEnd(event: TouchEvent) {
      if (touchStartY.current === null) return;
      const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
      const distance = endY - touchStartY.current;
      touchStartY.current = null;

      if (!showYtPanel && distance > 55) requestReveal();
      if (showYtPanel && distance < -55) setShowYtPanel(false);
    }

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showYtPanel, isHome]);

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

      <div
        className={`fixed left-0 right-0 top-0 z-40 flex justify-center border-b border-cyan-500/30 bg-black/90 p-2 shadow-2xl backdrop-blur-md transition-transform duration-350 ease-in-out ${
          showYtPanel ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="relative h-[158px] w-[280px] overflow-hidden rounded-lg border border-cyan-500/40 bg-black sm:h-[202px] sm:w-[360px]">
          <div className="h-full w-full" id="yt-player-element" />
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
