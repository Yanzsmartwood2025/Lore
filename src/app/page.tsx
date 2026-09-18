'use client';

import { useState, useEffect } from 'react';
import { TopNavMenu } from '@/components/TopNavMenu';
import { Model3DCarousel } from '@/components/Model3DCarousel';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { HomeStageControls } from '@/components/HomeStageControls';
import { models } from '@/data/models';
import styles from './splash.module.css';

const APP_VERSION = "2.0.0 (Next.js)";
const SPLASH_SESSION_KEY = 'session_active_v5';
const SPLASH_FRAMES = [
  { src: '/assets/brand/intro/Lore-intro.png', alt: 'Lore', hold: 2200, kind: 'signature' },
  { src: '/assets/brand/intro/ajnliq128.png', alt: 'AJN-LIQ-128', hold: 1800, kind: 'identity' },
] as const;

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const sessionActive = sessionStorage.getItem(SPLASH_SESSION_KEY);
    if (sessionActive) {
      setShowSplash(false);
      return;
    }

    const firstFrame = new Image();
    firstFrame.src = SPLASH_FRAMES[0].src;
    const secondFrame = new Image();
    secondFrame.src = SPLASH_FRAMES[1].src;

    let firstTimer: ReturnType<typeof setTimeout> | undefined;
    let secondTimer: ReturnType<typeof setTimeout> | undefined;

    firstTimer = setTimeout(() => {
      setFrameIndex(1);
      secondTimer = setTimeout(() => {
        sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
        setShowSplash(false);
      }, SPLASH_FRAMES[1].hold);
    }, SPLASH_FRAMES[0].hold);

    return () => {
      if (firstTimer) clearTimeout(firstTimer);
      if (secondTimer) clearTimeout(secondTimer);
    };
  }, []);

  const currentFrame = SPLASH_FRAMES[frameIndex];

  return (
    <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-transparent select-none">
      {showSplash && (
        <div className={styles.splash} aria-label="Presentación de Lore">
          <div className={`${styles.frame} ${currentFrame.kind === 'signature' ? styles.signature : styles.identity}`}>
            <img src={currentFrame.src} alt={currentFrame.alt} className={styles.image} draggable={false} />
          </div>
        </div>
      )}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col pb-[max(4.2rem,calc(env(safe-area-inset-bottom)+3.7rem))] pt-[max(.55rem,env(safe-area-inset-top))]">
        <section
          aria-label="Cabina principal de Lore"
          className="relative z-20 mx-auto w-[calc(100%-0.5rem)] max-w-2xl flex-none overflow-hidden rounded-[1.65rem] border border-cyan-500/18 border-b-transparent bg-black shadow-[0_0_26px_rgba(0,242,234,0.07)]"
        >
          <div className="relative h-[5.9rem] rounded-t-[1.65rem] border-b border-white/8 bg-[linear-gradient(180deg,rgba(7,18,24,0.74),rgba(0,0,0,0.50))] px-2.5 pt-1.5 sm:h-[6.2rem] sm:px-3">
            <div className="absolute left-2.5 top-1.5 z-10 sm:left-3">
              <TopNavMenu embedded />
            </div>

            <h1 className="absolute left-[4.2rem] right-[7.3rem] top-2.5 text-center text-[0.76rem] font-medium uppercase tracking-[0.16em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.18)] sm:left-[4.8rem] sm:right-[8.5rem] sm:text-[0.9rem]">
              Protocolo <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">VIP</span>
            </h1>

            <div className="absolute bottom-1.5 left-[3.5rem] right-[7.65rem] flex justify-center sm:left-[4rem] sm:right-[8.9rem]">
              <HomeStageControls />
            </div>

            <div
              className="absolute right-2 top-1.5 aspect-video w-[6.8rem] overflow-hidden rounded-xl border border-white/14 bg-black shadow-[0_0_14px_rgba(0,242,234,0.07),inset_0_0_16px_rgba(255,255,255,0.02)] sm:right-3 sm:w-[7.8rem]"
              aria-label="Monitor secundario reservado"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,242,234,0.06),transparent_58%)]" aria-hidden="true" />
              <div className="absolute inset-x-2 bottom-1 flex items-center justify-between text-[6px] uppercase tracking-[0.16em] text-white/26">
                <span>Monitor</span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_7px_rgba(103,232,249,0.65)]" />
              </div>
            </div>
          </div>

          <div
            aria-label="Pantalla principal de contenido"
            className="relative aspect-video w-full overflow-hidden rounded-b-[1.65rem] bg-black shadow-[inset_0_0_18px_rgba(0,0,0,0.98)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/[0.07] via-black/95 to-black" aria-hidden="true" />
          </div>
        </section>

        <div className="h-1.5 flex-none" aria-hidden="true" />
        <div className="relative min-h-0 w-full flex-1">
          <Model3DCarousel models={models} />
        </div>

        <PwaInstallPrompt />
      </div>

      <footer className="pointer-events-none absolute bottom-0 right-2 hidden text-right sm:block">
        <p className="text-[9px] text-gray-700">© 2025 · v{APP_VERSION}</p>
      </footer>
    </main>
  );
}
