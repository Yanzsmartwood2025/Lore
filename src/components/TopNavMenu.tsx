'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { useAuth } from '@/context/AuthContext';
import { MusicRequestForm } from '@/components/MusicRequestForm';
import { AuthPanel } from '@/components/AuthPanel';
import { MenuMusicControls } from '@/components/MenuMusicControls';

export function TopNavMenu({ embedded = false }: { embedded?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { enterLobby } = useMedia();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuLayer = (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        />
      )}

      <div
        className={`fixed left-0 right-0 top-0 z-[100] max-h-[92dvh] overflow-y-auto rounded-b-3xl border-b border-[#00f2ea]/40 bg-gradient-to-b from-black via-slate-950/95 to-black/95 px-5 pb-7 pt-20 shadow-[0_14px_38px_rgba(0,242,234,0.18)] backdrop-blur-xl transition-transform duration-500 ease-out sm:px-6 sm:pt-24 ${
          isOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-cyan-400/70">Lore Command Center</p>
            <h2 className="text-xl font-bold uppercase tracking-[0.14em] text-white">Centro de Control</h2>
            <p className="text-[10px] text-slate-500">Acceso, audio y servicios en un solo panel</p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            <button
              onClick={enterLobby}
              className="flex w-full items-center justify-center space-x-3 rounded-2xl border border-[#00f2ea]/50 bg-[#00f2ea]/10 px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#00f2ea] shadow-[0_0_16px_rgba(0,242,234,0.12)] transition hover:bg-[#00f2ea]/20 active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faCirclePlay} className="text-lg" />
              <span>Activar sesión de audio</span>
            </button>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-3 text-left">
              <div className="mb-2 flex items-center justify-between px-1">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Cuenta</p>
                  <p className="text-xs font-medium text-white">Acceso VIP</p>
                </div>
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${
                    user
                      ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.12)]'
                      : 'border-white/10 bg-black/50 text-slate-500'
                  }`}
                >
                  {user && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.95)]" />}
                  {user ? 'Online' : 'Login'}
                </span>
              </div>
              <AuthPanel />
            </div>

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
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs text-cyan-400" />
            <span>Panel preparado para nuevos módulos</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        className={
          embedded
            ? 'relative z-50 flex items-center justify-center'
            : 'fixed top-[max(.6rem,env(safe-area-inset-top))] right-[max(.75rem,env(safe-area-inset-right))] z-50 flex items-center justify-center'
        }
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 backdrop-blur-xl ${
            isOpen
              ? 'border-pink-400/70 bg-pink-950/35 text-pink-300 shadow-[0_0_16px_rgba(240,0,184,0.28)]'
              : 'border-[#00f2ea]/35 bg-black/35 text-[#00f2ea] shadow-[0_0_14px_rgba(0,242,234,0.18)] hover:border-[#00f2ea]/70 hover:bg-[#00f2ea]/10'
          }`}
          aria-label={isOpen ? 'Cerrar centro de control' : 'Abrir centro de control y acceso'}
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

      {mounted ? createPortal(menuLayer, document.body) : null}
    </>
  );
}
