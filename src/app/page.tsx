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
          className="relative z-20 mx-auto w-[calc(100%-0.75rem)] max-w-2xl flex-none overflow-hidden rounded-[1.75rem] border border-cyan-500/20 bg-black shadow-[0_0_30px_rgba(0,242,234,0.08)]"
        >
          <div className="relative h-[7.4rem] rounded-t-[1.75rem] border-b border-white/10 bg-[linear-gradient(180deg,rgba(7,18,24,0.72),rgba(0,0,0,0.48))] px-2.5 pt-1.5 sm:h-[7.8rem] sm:px-3">
            <div className="absolute left-2.5 top-1.5 z-10 sm:left-3">
              <TopNavMenu embedded />
            </div>

            <h1 className="absolute left-[4.5rem] right-[7.8rem] top-3 text-center text-[0.88rem] font-medium uppercase tracking-[0.19em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.22)] sm:left-[5rem] sm:right-[9rem] sm:text-base">
              Protocolo <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">VIP</span>
            </h1>

            <div className="absolute bottom-2 left-2.5 right-[8.3rem] sm:left-3 sm:right-[9.4rem]">
              <HomeStageControls />
              <p className="mt-1.5 truncate pl-1 text-[7px] uppercase tracking-[0.20em] text-white/25">
                Audio · escena · efectos
              </p>
            </div>

            <div
              className="absolute right-2 top-1.5 w-[7.1rem] aspect-video overflow-hidden rounded-xl border border-white/16 bg-black shadow-[0_0_16px_rgba(0,242,234,0.08),inset_0_0_18px_rgba(255,255,255,0.025)] sm:right-3 sm:top-2 sm:w-[8.1rem]"
              aria-label="Monitor secundario reservado"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,242,234,0.07),transparent_58%)]" aria-hidden="true" />
              <div className="absolute inset-x-2 bottom-1.5 flex items-center justify-between text-[6px] uppercase tracking-[0.17em] text-white/28">
                <span>Monitor</span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_7px_rgba(103,232,249,0.7)]" />
              </div>
            </div>
          </div>

          <div
            aria-label="Pantalla principal de contenido"
            className="relative aspect-video w-full overflow-hidden rounded-b-[1.75rem] bg-black shadow-[inset_0_0_22px_rgba(0,0,0,0.98)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/[0.07] via-black/95 to-black" aria-hidden="true" />
          </div>
        </section>

        <div className="h-3 flex-none bg-black/95" aria-hidden="true" />
        <div className="min-h-0 w-full flex-1">
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
