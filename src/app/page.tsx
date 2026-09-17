'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTiktok, faXTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { TopNavMenu } from '@/components/TopNavMenu';
import { Model3DCarousel } from '@/components/Model3DCarousel';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
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
      <TopNavMenu />

      {showSplash && (
        <div className={styles.splash} aria-label="Presentación de Lore">
          <div className={`${styles.frame} ${currentFrame.kind === 'signature' ? styles.signature : styles.identity}`}>
            <img src={currentFrame.src} alt={currentFrame.alt} className={styles.image} draggable={false} />
          </div>
        </div>
      )}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col animate-fadeIn pb-[max(.4rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-none flex-col items-center justify-center pb-1 pt-[max(.7rem,env(safe-area-inset-top))]">
          <h1 className="text-xl font-medium uppercase tracking-[0.18em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] sm:text-2xl">
            Protocolo <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">VIP</span>
          </h1>
        </div>

        {/* Pantalla principal independiente: más alta para futuros videos de baile. */}
        <section
          aria-label="Pantalla principal de contenido"
          className="relative z-20 mx-auto mt-2 h-[clamp(220px,30dvh,310px)] w-[calc(100%-1.25rem)] max-w-xl flex-none overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/50 shadow-[0_0_24px_rgba(0,242,234,0.10)] backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/10 via-black/20 to-black/55" aria-hidden="true" />
        </section>

        {/* Carrusel ocupa el espacio restante sin crear scroll vertical. */}
        <div className="mt-2 min-h-0 w-full flex-1">
          <Model3DCarousel models={models} />
        </div>

        <div className="z-20 mt-1 flex flex-none justify-center space-x-8 bg-transparent py-1.5">
          <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-lg text-gray-500 transition-colors hover:scale-125 hover:text-pink-500">
            <FontAwesomeIcon icon={faTiktok} />
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="text-lg text-gray-500 transition-colors hover:scale-125 hover:text-white">
            <FontAwesomeIcon icon={faXTwitter} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-lg text-gray-500 transition-colors hover:scale-125 hover:text-purple-500">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
        </div>

        <PwaInstallPrompt />
      </div>

      <footer className="pointer-events-none absolute bottom-0 right-2 hidden text-right sm:block">
        <p className="text-[9px] text-gray-700">© 2025 · v{APP_VERSION}</p>
      </footer>
    </main>
  );
}
