'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF, faTiktok, faYoutube, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faPlay, faWandMagicSparkles, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/components/GlassCard';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { useMedia } from '@/context/MediaContext';
import { models } from '@/data/models';

const APP_VERSION = "2.0.0 (Next.js)";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashOpacity, setSplashOpacity] = useState(1);
  const { enterLobby } = useMedia();

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
        return () => clearTimeout(hideTimer);
      }, 2000);
      return () => clearTimeout(fadeOutTimer);
    }
  }, []);

  const handleGoogleLogin = () => {
    alert("Login con Google (Próximamente en Fase 2)");
  };

  const handlePlayEnter = () => {
    enterLobby();
  };

  return (
    <main className="flex-grow relative w-full overflow-hidden flex flex-col min-h-screen bg-black">
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

      {/* LOBBY SCREEN */}
      <div className="flex-grow flex flex-col w-full h-full overflow-y-auto animate-fadeIn relative z-10 pb-48">
        <div className="flex-grow flex flex-col justify-center items-center p-4 sm:p-6 space-y-8 mt-2 max-w-4xl mx-auto w-full">

          {/* Encabezado Principal */}
          <div className="text-center space-y-1 mt-2">
            <h2 className="text-lg sm:text-xl text-gray-400 tracking-wider font-light">Bienvenido al</h2>
            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Protocolo<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">VIP</span>
            </h1>
          </div>

          {/* Botones de Entrada / Disparador User Gesture */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            {/* Botón Play / Entrar */}
            <GlassCard className="w-full sm:w-1/2 transition-all hover:bg-cyan-500/20 active:scale-95 border-[#00f2ea]/40 shadow-[0_0_15px_rgba(0,242,234,0.2)]">
              <button
                onClick={handlePlayEnter}
                className="w-full py-3 px-4 flex items-center justify-center space-x-3 text-[#00f2ea] font-bold"
              >
                <FontAwesomeIcon icon={faPlay} className="text-base animate-pulse" />
                <span className="text-sm uppercase tracking-wider">Play / Entrar</span>
              </button>
            </GlassCard>

            {/* Botón Login Google */}
            <GlassCard className="w-full sm:w-1/2 transition-all hover:bg-white/10 active:scale-95">
              <button onClick={handleGoogleLogin} className="w-full py-3 px-4 flex items-center justify-center space-x-3">
                <FontAwesomeIcon icon={faGoogle} className="text-white text-base" />
                <span className="text-xs font-bold text-gray-200">Acceso con Google</span>
              </button>
            </GlassCard>
          </div>

          {/* Grid de Modelos / Personas */}
          <div className="w-full max-w-3xl pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {models.map((model) => {
                if (model.isActive) {
                  return (
                    <Link key={model.id} href={`/${model.slug}`} className="block">
                      <GlassCard className="h-full p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 border-cyan-400/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,242,234,0.15)] hover:shadow-[0_0_20px_rgba(0,242,234,0.3)] bg-cyan-950/20">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-400/30 flex items-center justify-center mb-3 text-cyan-400">
                          <FontAwesomeIcon icon={faUser} className="text-2xl" />
                        </div>
                        <h3 className="text-base font-bold text-white tracking-wide">{model.name}</h3>
                        <p className="text-[11px] text-cyan-300/80 mt-1">{model.tagline}</p>
                      </GlassCard>
                    </Link>
                  );
                }

                return (
                  <GlassCard key={model.id} className="h-full p-4 flex flex-col items-center justify-center text-center opacity-60 border-white/5 bg-white/5 pointer-events-none relative overflow-hidden">
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-pink-400 bg-pink-950/60 border border-pink-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FontAwesomeIcon icon={faLock} className="text-[8px]" />
                      Próximamente
                    </span>
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-gray-500">
                      <FontAwesomeIcon icon={faUser} className="text-2xl" />
                    </div>
                    <h3 className="text-base font-medium text-gray-400 tracking-wide">{model.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">{model.tagline}</p>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Placeholder Estilizado para Contenido Futuro */}
          <div className="w-full max-w-xl px-2">
            <GlassCard className="w-full p-6 text-center border-white/10 bg-gradient-to-b from-white/5 to-purple-950/20">
              <div className="flex items-center justify-center space-x-2 text-purple-400 mb-2">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-sm animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-[0.2em]">Próximamente</span>
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-sm animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-gray-200 mb-1">Espacio Reservado para Nuevo Contenido</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Este módulo flexible alojará las próximas características VIP, eventos en vivo y lanzamientos exclusivos de la comunidad.
              </p>
            </GlassCard>
          </div>

          {/* Redes Sociales */}
          <div className="flex justify-center space-x-6 pt-2 pb-2">
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
    </main>
  );
}
