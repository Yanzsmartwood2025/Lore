'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faTimes,
  faLock,
  faFileContract,
  faConciergeBell,
  faShieldHalved,
  faWandMagicSparkles,
  faCirclePlay,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { GlassCard } from '@/components/GlassCard';
import { useMedia } from '@/context/MediaContext';

export function TopNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { enterLobby } = useMedia();

  const handleGoogleLogin = () => {
    alert('Acceso con Google (Próximamente en Fase 2)');
  };

  return (
    <>
      {/* Botón Circular Flotante Superior */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md shadow-lg ${
            isOpen
              ? 'border-pink-500 bg-pink-950/60 text-pink-400 shadow-[0_0_20px_rgba(240,0,184,0.5)] rotate-90 scale-105'
              : 'border-[#00f2ea]/60 bg-black/70 text-[#00f2ea] shadow-[0_0_20px_rgba(0,242,234,0.3)] hover:scale-110 hover:border-[#00f2ea]'
          }`}
          aria-label={isOpen ? 'Cerrar Menú' : 'Abrir Menú Principal'}
        >
          <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-25 pointer-events-none" />
          <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-xl transition-transform duration-300" />
        </button>
      </div>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        />
      )}

      {/* Drawer Deslizable de Arriba hacia Abajo */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 max-h-[85vh] bg-gradient-to-b from-black via-purple-950/90 to-black/95 border-b border-[#00f2ea]/40 shadow-[0_10px_30px_rgba(0,242,234,0.2)] backdrop-blur-xl transition-transform duration-500 ease-out overflow-y-auto pt-24 pb-8 px-6 rounded-b-3xl ${
          isOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
      >
        <div className="max-w-md mx-auto space-y-6 text-center">
          <div className="space-y-1">
            <h2 className="text-xs uppercase font-mono tracking-[0.3em] text-[#00f2ea]">Navegación & Servicios</h2>
            <h3 className="text-xl font-bold text-white tracking-wider uppercase">Protocolo VIP</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            {/* Play / Entrar */}
            <button
              onClick={() => {
                enterLobby();
                setIsOpen(false);
              }}
              className="w-full py-3.5 px-4 rounded-xl border border-[#00f2ea]/60 bg-[#00f2ea]/15 text-[#00f2ea] font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-3 transition hover:bg-[#00f2ea]/25 active:scale-95 shadow-[0_0_15px_rgba(0,242,234,0.2)]"
            >
              <FontAwesomeIcon icon={faCirclePlay} className="text-lg animate-pulse" />
              <span>Iniciar Audio & Reproducción</span>
            </button>

            {/* Login con Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-xl border border-white/20 bg-white/10 text-white font-medium text-xs flex items-center justify-center space-x-3 transition hover:bg-white/20 active:scale-95"
            >
              <FontAwesomeIcon icon={faGoogle} className="text-base" />
              <span>Acceso con Google</span>
            </button>
          </div>

          {/* Opciones Futuras: Servicios, Términos, Privacidad */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <p className="text-[10px] uppercase font-mono tracking-widest text-gray-400 mb-3">
              Información & Legales
            </p>

            <GlassCard className="p-3 border-white/10 flex items-center justify-between text-xs text-gray-300 hover:border-cyan-400/40 transition">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faConciergeBell} className="text-cyan-400" /> Servicios Exclusivos
              </span>
              <span className="text-[9px] uppercase tracking-wider bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/30">
                Próximamente
              </span>
            </GlassCard>

            <GlassCard className="p-3 border-white/10 flex items-center justify-between text-xs text-gray-300 hover:border-cyan-400/40 transition">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFileContract} className="text-purple-400" /> Términos y Condiciones
              </span>
              <span className="text-[9px] uppercase tracking-wider bg-purple-950 text-purple-400 px-2 py-0.5 rounded-full border border-purple-400/30">
                Fase 2
              </span>
            </GlassCard>

            <GlassCard className="p-3 border-white/10 flex items-center justify-between text-xs text-gray-300 hover:border-cyan-400/40 transition">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-pink-400" /> Política de Privacidad
              </span>
              <FontAwesomeIcon icon={faLock} className="text-gray-500 text-xs" />
            </GlassCard>
          </div>

          <div className="pt-2 text-gray-500 text-[10px] flex items-center justify-center space-x-1">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-cyan-400 text-xs animate-pulse" />
            <span>Desliza para explorar más opciones</span>
          </div>
        </div>
      </div>
    </>
  );
}
