'use client';

import { useState, useRef, type PointerEvent } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/components/GlassCard';
import { ModelPersona } from '@/data/models';

interface Model3DCarouselProps {
  models: ModelPersona[];
}

export function Model3DCarousel({ models }: Model3DCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartXRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  const total = models.length;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartXRef.current = event.clientX;
    draggedRef.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current === null) return;
    const diff = event.clientX - pointerStartXRef.current;
    setDragOffset(Math.max(-90, Math.min(90, diff)));
    if (Math.abs(diff) > 8) draggedRef.current = true;
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current !== null) {
      const diff = pointerStartXRef.current - event.clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) handleNext();
        else handlePrev();
      }
    }
    pointerStartXRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col items-center select-none">
      {/* Contenedor del Carrusel 3D */}
      <div
        className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden [perspective:1200px] cursor-grab active:cursor-grabbing touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') handlePrev();
          if (event.key === 'ArrowRight') handleNext();
        }}
        tabIndex={0}
        role="region"
        aria-label="Carrusel de perfiles. Desliza o arrastra para explorar."
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
          const translateX = offset * 205 + dragOffset;
          const translateY = 65 + Math.abs(offset) * 52;
          const translateZ = isActive ? 110 : -Math.abs(offset) * 130;
          const rotateY = offset * -32;
          const rotateZ = offset * 5;
          const scale = isActive ? 0.94 : 0.78 - Math.abs(offset) * 0.1;
          const opacity = isActive ? 1 : 0.7 - Math.abs(offset) * 0.2;
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

              {/* Superficie libre para montar el video vertical de cada perfil. */}
              <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,242,234,0.10),transparent_42%)]" aria-hidden="true" />

              {/* Únicamente el Nombre de la chica */}
              <div className="relative z-10 mt-auto mb-5">
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
                  {model.name}
                </h3>
              </div>
            </GlassCard>
          );

          return (
            <div
              key={model.id}
              className={`absolute ${isDragging ? '' : 'transition-all duration-500 ease-out'}`}
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                opacity,
                zIndex,
              }}
            >
              {model.isActive ? (
                <Link
                  href={`/${model.slug}`}
                  className="block"
                  draggable={false}
                  onClick={(event) => {
                    if (draggedRef.current) event.preventDefault();
                  }}
                >
                  {cardContent}
                </Link>
              ) : (
                <div className="cursor-not-allowed">{cardContent}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Indicadores de Puntos */}
      <div className="flex space-x-2 -mt-1 z-30">
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
