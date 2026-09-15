'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faLock,
  faFileContract,
  faConciergeBell,
  faShieldHalved,
  faWandMagicSparkles,
  faCirclePlay,
} from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/components/GlassCard';
import { useMedia } from '@/context/MediaContext';
import { MusicRequestForm } from '@/components/MusicRequestForm';
import { AuthPanel } from '@/components/AuthPanel';

export function TopNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { enterLobby } = useMedia();

  return (
    <>
      {/* Botón Circular Flotante Superior */}
      <div className="fixed top-[max(.6rem,env(safe-area-inset-top))] right-[max(.75rem,env(safe-area-inset-right))] z-50 flex items-center justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex h-[30px] w-[30px] items-center justify-center rounded-lg border transition-all duration-300 backdrop-blur-xl ${
            isOpen
              ? 'border-pink-400/70 bg-pink-950/35 text-pink-300 shadow-[0_0_16px_rgba(240,0,184,0.28)]'
              : 'border-[#00f2ea]/35 bg-black/35 text-[#00f2ea] shadow-[0_0_14px_rgba(0,242,234,0.18)] hover:border-[#00f2ea]/70 hover:bg-[#00f2ea]/10'
          }`}
          aria-label={isOpen ? 'Cerrar Menú' : 'Abrir Menú Principal'}
        >
          <div className="absolute -inset-1.5 -z-10 rounded-2xl bg-[#00f2ea]/10 blur-lg opacity-60 transition-opacity group-hover:opacity-90" />
          {isOpen ? (
            <FontAwesomeIcon icon={faTimes} className="text-sm transition-transform duration-300" />
          ) : (
            <span className="relative h-[13px] w-[15px] rounded-[3px] border border-current" aria-hidden="true">
              <span className="absolute bottom-[3px] left-[3px] top-[3px] w-px rounded-full bg-current opacity-80" />
              <span className="absolute left-[7px] right-[3px] top-1/2 h-px -translate-y-1/2 rounded-full bg-current" />
            </span>
          )}
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

            <AuthPanel />
          </div>

          <MusicRequestForm onRequested={() => setIsOpen(false)} />

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
