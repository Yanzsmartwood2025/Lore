'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faTiktok, faYoutube, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { TopNavMenu } from '@/components/TopNavMenu';
import { DiscoSphere } from '@/components/DiscoSphere';
import { Model3DCarousel } from '@/components/Model3DCarousel';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { useMedia } from '@/context/MediaContext';
import { models } from '@/data/models';

const APP_VERSION = "2.0.0 (Next.js)";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashOpacity, setSplashOpacity] = useState(1);
  const { isPlaying } = useMedia();

  useEffect(() => {
    // Check sessionStorage only on client side after mount
    const sessionActive = sessionStorage.getItem('session_active_v2');

    if (sessionActive) {
      setShowSplash(false);
    } else {
      const fadeOutTimer = setTimeout(() => {
        setSplashOpacity(0);
        const hideTimer = setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem('session_active_v2', 'true');
        }, 1000);
        return () => clearTimeout(fadeOutTimer);
      }, 2000);
      return () => clearTimeout(fadeOutTimer);
    }
  }, []);

  return (
    <main className="flex-grow relative w-full overflow-hidden flex flex-col min-h-screen bg-black select-none">
      {/* Top Menu Drawer Navigation */}
      <TopNavMenu />

      {/* SPLASH SCREEN */}
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

      {/* LOBBY MAIN SCREEN */}
      <div className="flex-grow flex flex-col justify-between w-full h-full overflow-y-auto animate-fadeIn relative z-10 pt-20 pb-28">

        {/* Central Ambient Disco Sphere */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4 relative">
          <DiscoSphere isPlaying={isPlaying} />

          <div className="text-center mt-4">
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Protocolo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">VIP</span>
            </h1>
          </div>
        </div>

        {/* 3D Model Carousel */}
        <div className="w-full">
          <Model3DCarousel models={models} />
        </div>

        {/* Redes Sociales posicionadas abajo */}
        <div className="flex justify-center space-x-6 py-4 z-20">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors text-2xl hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-pink-500 transition-colors text-2xl hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faTiktok} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-red-600 transition-colors text-2xl hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-2xl hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-purple-500 transition-colors text-2xl hover:scale-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
        </div>

        <PwaInstallPrompt />
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full text-center py-2 bg-black/90 backdrop-blur-md z-30 border-t border-white/5">
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
