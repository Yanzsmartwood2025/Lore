'use client';

import { useState, useRef, type TouchEvent, type MouseEvent } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faUser, faLock, faPlay } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/components/GlassCard';
import { ModelPersona } from '@/data/models';

interface Model3DCarouselProps {
  models: ModelPersona[];
}

export function Model3DCarousel({ models }: Model3DCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const total = models.length;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartXRef.current = null;
  };

  const handleMouseDown = (e: MouseEvent) => {
    mouseStartXRef.current = e.clientX;
    isDraggingRef.current = true;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDraggingRef.current || mouseStartXRef.current === null) return;
    const diff = mouseStartXRef.current - e.clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    isDraggingRef.current = false;
    mouseStartXRef.current = null;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto py-6 flex flex-col items-center select-none">
      {/* Contenedor del Carrusel 3D */}
      <div
        className="relative w-full h-[320px] sm:h-[360px] flex items-center justify-center perspective-[1000px] cursor-grab active:cursor-grabbing overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {models.map((model, index) => {
          // Calculate offset relative to active index in loop
          let offset = index - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          // 3D positioning parameters
          const translateX = offset * 180;
          const rotateY = offset * -25;
          const scale = isActive ? 1.05 : 0.85 - Math.abs(offset) * 0.12;
          const opacity = isActive ? 1 : 0.6 - Math.abs(offset) * 0.2;
          const zIndex = 20 - Math.abs(offset) * 5;

          const cardContent = (
            <GlassCard
              className={`w-52 h-72 sm:w-60 sm:h-80 p-5 flex flex-col items-center justify-between text-center transition-all duration-500 ease-out border rounded-3xl backdrop-blur-xl relative overflow-hidden group ${
                isActive
                  ? 'border-[#00f2ea] shadow-[0_0_35px_rgba(0,242,234,0.4)] bg-black/80'
                  : 'border-white/10 bg-black/60 shadow-lg'
              }`}
            >
              {/* Slot preparado para Media/Video/Imagen de fondo */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black z-0 pointer-events-none" />

              {!model.isActive && (
                <span className="absolute top-3 right-3 z-10 text-[9px] font-bold uppercase tracking-wider text-pink-400 bg-pink-950/80 border border-pink-500/40 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <FontAwesomeIcon icon={faLock} className="text-[8px]" />
                  Próximamente
                </span>
              )}

              {/* Avatar / Icon Container */}
              <div className="relative z-10 mt-4 flex flex-col items-center">
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
                    model.isActive
                      ? 'bg-gradient-to-tr from-[#00f2ea]/30 to-purple-600/30 border-2 border-[#00f2ea] shadow-[0_0_20px_rgba(0,242,234,0.3)] text-[#00f2ea]'
                      : 'bg-white/5 border border-white/20 text-gray-500'
                  }`}
                >
                  <FontAwesomeIcon icon={faUser} className="text-4xl sm:text-5xl" />
                </div>
              </div>

              {/* Únicamente el Nombre de la chica */}
              <div className="relative z-10 mb-4">
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
                  {model.name}
                </h3>
                {model.isActive && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00f2ea] bg-[#00f2ea]/10 border border-[#00f2ea]/40 px-3 py-1 rounded-full">
                    <FontAwesomeIcon icon={faPlay} className="text-[8px]" />
                    <span>Entrar</span>
                  </div>
                )}
              </div>
            </GlassCard>
          );

          return (
            <div
              key={model.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
              }}
            >
              {model.isActive ? (
                <Link href={`/${model.slug}`} className="block">
                  {cardContent}
                </Link>
              ) : (
                <div className="cursor-not-allowed">{cardContent}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botones de Control Lateral */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:border-[#00f2ea] hover:text-[#00f2ea] transition z-30 backdrop-blur-md"
        aria-label="Anterior Chica"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:border-[#00f2ea] hover:text-[#00f2ea] transition z-30 backdrop-blur-md"
        aria-label="Siguiente Chica"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      {/* Indicadores de Puntos */}
      <div className="flex space-x-2 mt-4 z-30">
        {models.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? 'w-6 bg-[#00f2ea] shadow-[0_0_10px_rgba(0,242,234,0.8)]'
                : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Ir a ${m.name}`}
          />
        ))}
      </div>
    </div>
  );
}
