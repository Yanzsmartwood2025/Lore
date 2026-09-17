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
const SPLASH_SESSION_KEY = 'session_active_v3';
const SPLASH_FRAMES = [
  { src: '/intro/lore-signature-intro.png', alt: 'Lore', hold: 2200, kind: 'signature' },
  { src: '/intro/ajn-liq-128.svg', alt: 'AJN-LIQ-128', hold: 1800, kind: 'identity' },
] as const;

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameVisible, setFrameVisible] = useState(false);

  useEffect(() => {
    const sessionActive = sessionStorage.getItem(SPLASH_SESSION_KEY);
    if (sessionActive) {
      setShowSplash(false);
      return;
    }

    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let transitionTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const runFrame = (index: number) => {
      if (cancelled) return;
      if (index >= SPLASH_FRAMES.length) {
        sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
        setShowSplash(false);
        return;
      }

      setFrameIndex(index);
      requestAnimationFrame(() => {
        if (!cancelled) setFrameVisible(true);
      });

      holdTimer = setTimeout(() => {
        setFrameVisible(false);
        transitionTimer = setTimeout(() => runFrame(index + 1), 520);
      }, SPLASH_FRAMES[index].hold);
    };

    const startTimer = setTimeout(() => runFrame(0), 40);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (holdTimer) clearTimeout(holdTimer);
      if (transitionTimer) clearTimeout(transitionTimer);
    };
  }, []);

  const currentFrame = SPLASH_FRAMES[frameIndex];

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-transparent select-none pb-28">
      <TopNavMenu />

      {showSplash && (
        <div className={`${styles.splash} ${frameVisible ? styles.visible : styles.hidden}`} aria-label="Presentación de Lore">
          <div className={`${styles.frame} ${currentFrame.kind === 'signature' ? styles.signature : styles.identity}`}>
            <img src={currentFrame.src} alt={currentFrame.alt} className={styles.image} draggable={false} />
            <div className={styles.lightSweep} aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-[600px] w-full flex-1 animate-fadeIn flex-col pb-11">
        <div className="relative flex flex-none flex-col items-center justify-center pt-3 pb-1">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-medium text-white uppercase tracking-[0.18em] drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
              Protocolo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">VIP</span>
            </h1>
          </div>
        </div>

        <section
          aria-label="Pantalla principal de contenido"
          className="relative z-20 mx-auto mt-4 h-[190px] w-[calc(100%-2rem)] max-w-sm flex-none overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/45 backdrop-blur-sm shadow-[0_0_24px_rgba(0,242,234,0.10)] sm:h-[230px] sm:max-w-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/10 via-black/20 to-black/55" aria-hidden="true" />
        </section>

        <div className="mt-7 w-full h-[460px] flex-none">
          <Model3DCarousel models={models} />
        </div>

        <div className="z-20 mt-6 flex flex-none justify-center space-x-8 bg-transparent pt-3 pb-5">
          <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-[1.275rem] text-gray-500 hover:text-pink-500 transition-colors hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faTiktok} />
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="text-[1.275rem] text-gray-500 hover:text-white transition-colors hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faXTwitter} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-[1.275rem] text-gray-500 hover:text-purple-500 transition-colors hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
        </div>

        <PwaInstallPrompt />
      </div>

      <footer className="pointer-events-none w-full bg-transparent py-1.5 text-center">
        <div className="flex flex-col justify-center items-center">
          <p className="text-[10px] text-gray-600">© 2025 Todos los derechos reservados.</p>
          <p className="text-[9px] text-gray-800 mt-0.5 uppercase tracking-widest">
            v<span>{APP_VERSION}</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
