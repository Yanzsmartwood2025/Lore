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
import { MenuMusicControls } from '@/components/MenuMusicControls';

export function TopNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { enterLobby } = useMedia();

  return (
    <>
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

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        />
      )}

      <div
        className={`fixed left-0 right-0 top-0 z-40 max-h-[88dvh] overflow-y-auto rounded-b-3xl border-b border-[#00f2ea]/40 bg-gradient-to-b from-black via-purple-950/90 to-black/95 px-5 pb-7 pt-20 shadow-[0_10px_30px_rgba(0,242,234,0.2)] backdrop-blur-xl transition-transform duration-500 ease-out sm:px-6 sm:pt-24 ${
          isOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="space-y-1">
            <h2 className="text-xs uppercase font-mono tracking-[0.3em] text-[#00f2ea]">Navegación & Servicios</h2>
            <h3 className="text-xl font-bold text-white tracking-wider uppercase">Protocolo VIP</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            <button
              onClick={() => {
                enterLobby();
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-center space-x-3 rounded-xl border border-[#00f2ea]/60 bg-[#00f2ea]/15 px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#00f2ea] shadow-[0_0_15px_rgba(0,242,234,0.2)] transition hover:bg-[#00f2ea]/25 active:scale-95"
            >
              <FontAwesomeIcon icon={faCirclePlay} className="text-lg animate-pulse" />
              <span>Iniciar Audio & Reproducción</span>
            </button>

            <AuthPanel />

            {/* Los controles dejan de ocupar la parte inferior de la pantalla y viven junto al login. */}
            <MenuMusicControls />
          </div>

          <MusicRequestForm onRequested={() => setIsOpen(false)} />

          <div className="space-y-2 border-t border-white/10 pt-4">
            <p className="mb-3 text-[10px] uppercase font-mono tracking-widest text-gray-400">Información & Legales</p>

            <GlassCard className="p-3 border-white/10 flex items-center justify-between text-xs text-gray-300 hover:border-cyan-400/40 transition">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faConciergeBell} className="text-cyan-400" /> Servicios Exclusivos
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-950 px-2 py-0.5 text-[9px] uppercase tracking-wider text-cyan-400">Próximamente</span>
            </GlassCard>

            <GlassCard className="p-3 border-white/10 flex items-center justify-between text-xs text-gray-300 hover:border-cyan-400/40 transition">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFileContract} className="text-purple-400" /> Términos y Condiciones
              </span>
              <span className="rounded-full border border-purple-400/30 bg-purple-950 px-2 py-0.5 text-[9px] uppercase tracking-wider text-purple-400">Fase 2</span>
            </GlassCard>

            <GlassCard className="p-3 border-white/10 flex items-center justify-between text-xs text-gray-300 hover:border-cyan-400/40 transition">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-pink-400" /> Política de Privacidad
              </span>
              <FontAwesomeIcon icon={faLock} className="text-xs text-gray-500" />
            </GlassCard>
          </div>

          <div className="flex items-center justify-center space-x-1 pt-1 text-[10px] text-gray-500">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs text-cyan-400 animate-pulse" />
            <span>Desliza para explorar más opciones</span>
          </div>
        </div>
      </div>
    </>
  );
}
