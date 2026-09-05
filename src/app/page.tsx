'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF, faTiktok, faYoutube, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faHeadphonesAlt, faGem } from '@fortawesome/free-solid-svg-icons';
import { NeonButton } from '@/components/NeonButton';
import { GlassCard } from '@/components/GlassCard';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

const APP_VERSION = "2.0.0 (Next.js)";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashOpacity, setSplashOpacity] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Retrasar el montaje para evitar hydration mismatches sin causar warning de eslint
    setTimeout(() => setIsMounted(true), 0);

    // Solo comprobamos sessionStorage en el cliente
    const sessionActive = sessionStorage.getItem('session_active_v2');

    if (sessionActive) {
      setTimeout(() => setShowSplash(false), 0);
    } else {
      const fadeOutTimer = setTimeout(() => {
        setSplashOpacity(0);
        const hideTimer = setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem('session_active_v2', 'true');
        }, 1000); // Wait for transition
        return () => clearTimeout(hideTimer);
      }, 2000); // 2 seconds splash
      return () => clearTimeout(fadeOutTimer);
    }
  }, []);

  // Prevenimos renderizar nada hasta que no estemos en el cliente para evitar hidratación diferente
  if (!isMounted) return null;

  const handleGoogleLogin = () => {
    alert("Login con Google (Próximamente en Fase 2)");
  };

  return (
    <main className="flex-grow relative w-full overflow-hidden flex flex-col">
      {/* SPLASH SCREEN */}
      {showSplash && (
        <div
          className="fixed inset-0 flex flex-col justify-center items-center w-full h-full bg-black z-50 transition-opacity duration-1000"
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

      {/* LOBBY SCREEN */}
      {!showSplash && (
        <>
          <div className="flex-grow flex flex-col w-full h-full overflow-y-auto animate-fadeIn relative z-10 pb-48">
            <div className="flex-grow flex flex-col justify-center items-center p-6 space-y-8 mt-4">

              <div className="text-center space-y-1">
                <h2 className="text-xl text-gray-400 tracking-wider font-light">Bienvenido al</h2>
                <h1 className="text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  Protocolo<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">VIP</span>
                </h1>
              </div>

              {/* Botón Login */}
              <GlassCard className="w-full max-w-xs transition-all hover:bg-white/10 active:scale-95">
                <button onClick={handleGoogleLogin} className="w-full py-3 px-4 flex items-center justify-center space-x-3">
                  <FontAwesomeIcon icon={faGoogle} className="text-white text-xl" />
                  <span className="text-sm font-bold text-gray-200">Acceso con Google</span>
                </button>
              </GlassCard>

              {/* Puertas */}
              <div className="w-full flex flex-col items-center space-y-6">
                <NeonButton
                  href="/fan"
                  variant="fan"
                  icon={<FontAwesomeIcon icon={faHeadphonesAlt} />}
                  subtitle="Música & Trueque"
                >
                  FAN
                </NeonButton>

                <NeonButton
                  href="/vip"
                  variant="vip"
                  icon={<FontAwesomeIcon icon={faGem} />}
                  subtitle="Grok & Cripto"
                >
                  VIP
                </NeonButton>
              </div>

              {/* Redes Sociales */}
              <div className="flex justify-center space-x-6 pt-4 pb-2">
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

            </div>

            <PwaInstallPrompt />
          </div>

          {/* Footer */}
          <footer className="fixed bottom-0 w-full text-center py-3 bg-black/90 backdrop-blur-md z-30 border-t border-white/5">
            <div className="flex flex-col justify-center items-center">
              <p className="text-[10px] text-gray-600">© 2025 Todos los derechos reservados.</p>
              <p className="text-[9px] text-gray-800 mt-1 uppercase tracking-widest">
                v<span>{APP_VERSION}</span>
              </p>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}