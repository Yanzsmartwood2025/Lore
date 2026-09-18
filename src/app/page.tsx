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
          className="relative z-20 mx-auto w-[calc(100%-1.25rem)] max-w-xl flex-none overflow-visible rounded-[1.75rem] border border-cyan-500/20 bg-black/30 shadow-[0_0_30px_rgba(0,242,234,0.08)] backdrop-blur-md"
        >
          <div className="relative rounded-t-[1.75rem] border-b border-white/10 bg-[linear-gradient(180deg,rgba(7,18,24,0.68),rgba(0,0,0,0.40))] px-3 pb-2.5 pt-2 sm:px-4">
            <div className="grid grid-cols-[2.5rem_1fr] items-center gap-2">
              <TopNavMenu embedded />
              <h1 className="translate-x-1 text-center text-[1.05rem] font-medium uppercase tracking-[0.20em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.22)] sm:text-xl">
                Protocolo <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">VIP</span>
              </h1>
            </div>

            <div className="mt-1.5 flex items-end gap-2.5">
              <div className="min-w-0 flex-1 pb-1">
                <HomeStageControls />
                <p className="mt-2 truncate pl-1 text-[8px] uppercase tracking-[0.22em] text-white/30">
                  Audio · escena · efectos
                </p>
              </div>

              <div
                className="relative h-[4.65rem] w-[6.25rem] shrink-0 overflow-hidden rounded-2xl border border-white/16 bg-black shadow-[0_0_16px_rgba(0,242,234,0.08),inset_0_0_18px_rgba(255,255,255,0.025)] sm:h-[5.1rem] sm:w-[7.2rem]"
                aria-label="Monitor secundario reservado"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,242,234,0.07),transparent_58%)]" aria-hidden="true" />
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-[7px] uppercase tracking-[0.18em] text-white/30">
                  <span>Monitor</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_7px_rgba(103,232,249,0.7)]" />
                </div>
              </div>
            </div>
          </div>

          <div
            aria-label="Pantalla principal de contenido"
            className="relative h-[clamp(265px,35dvh,360px)] overflow-hidden rounded-b-[1.75rem] bg-black shadow-[inset_0_0_22px_rgba(0,0,0,0.98)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/[0.07] via-black/95 to-black" aria-hidden="true" />
          </div>
        </section>

        <div className="mt-2 min-h-0 w-full flex-1">
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
