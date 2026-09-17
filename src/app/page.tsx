'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTiktok, faXTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { TopNavMenu } from '@/components/TopNavMenu';
import { Model3DCarousel } from '@/components/Model3DCarousel';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { models } from '@/data/models';

const APP_VERSION = "2.0.0 (Next.js)";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashOpacity, setSplashOpacity] = useState(1);
  useEffect(() => {
    const sessionActive = sessionStorage.getItem('session_active_v2');
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (sessionActive) {
      hideTimer = setTimeout(() => setShowSplash(false), 0);
    } else {
      const fadeOutTimer = setTimeout(() => {
        setSplashOpacity(0);
        hideTimer = setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem('session_active_v2', 'true');
        }, 1000);
      }, 2000);
      return () => {
        clearTimeout(fadeOutTimer);
        if (hideTimer) clearTimeout(hideTimer);
      };
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-transparent select-none pb-28">
      <TopNavMenu />

      {showSplash && (
        <div
          className="fixed inset-0 flex flex-col justify-center items-center w-full h-full bg-black z-50 transition-opacity duration-1000 pointer-events-auto"
          style={{ opacity: splashOpacity }}
        >
          <div className="z-10 text-center relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-900 rounded-full filter blur-[80px] opacity-30 animate-pulse"></div>

            <h1 className="font-serif text-6xl text-white animate-pulseGlow mb-2 relative z-10">LORE</h1>
            <p className="text-gray-400 text-xs tracking-[0.3em] uppercase relative z-10">Acceso Restringido</p>

            <div className="mt-12 relative z-10">
              <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-600 w-1/2 animate-shimmer"></div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 text-gray-700 text-[10px] font-mono">
            Cargando...
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

        {/* Pantalla principal independiente. Queda preparada para el video destacado del Home. */}
        <section
          aria-label="Pantalla principal de contenido"
          className="relative z-20 mx-auto mt-4 h-[190px] w-[calc(100%-2rem)] max-w-sm flex-none overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/45 backdrop-blur-sm shadow-[0_0_24px_rgba(0,242,234,0.10)] sm:h-[230px] sm:max-w-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/10 via-black/20 to-black/55" aria-hidden="true" />
        </section>

        {/* Tarjetas de presentación separadas y más abajo */}
        <div className="mt-7 w-full h-[460px] flex-none">
          <Model3DCarousel models={models} />
        </div>

        {/* Redes sociales debajo del bloque de tarjetas */}
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
