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

  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % total);

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
      <div
        className="relative flex min-h-0 w-full flex-1 cursor-grab items-center justify-center overflow-hidden [perspective:1200px] active:cursor-grabbing touch-pan-y"
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
          let offset = index - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isActive = offset === 0;
          // Solo tres tarjetas vivas a la vez: la activa y una por cada lado.
          // Las demás no consumen blur, composición ni pintura en el teléfono.
          const isVisible = Math.abs(offset) <= 1;
          if (!isVisible) return null;

          const translateX = offset * 185 + dragOffset;
          const translateY = 24 + Math.abs(offset) * 34;
          const translateZ = isActive ? 100 : -120;
          const rotateY = offset * -32;
          const rotateZ = offset * 4;
          const scale = isActive ? 0.98 : 0.78;
          const opacity = isActive ? 1 : 0.58;
          const zIndex = 20 - Math.abs(offset) * 5;

          const cardContent = (
            <GlassCard
              className={`relative flex h-60 w-44 flex-col items-center justify-between overflow-hidden rounded-3xl border p-4 text-center transition-colors duration-300 sm:h-72 sm:w-52 ${
                isActive
                  ? 'border-[#00f2ea] bg-black/82 shadow-[0_0_24px_rgba(0,242,234,0.28)]'
                  : 'border-white/10 bg-black/72 shadow-md'
              }`}
            >
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/35 to-black pointer-events-none" />

              {!model.isActive && (
                <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-pink-500/40 bg-pink-950/80 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-pink-400">
                  <FontAwesomeIcon icon={faLock} className="text-[8px]" /> Próximamente
                </span>
              )}

              <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,242,234,0.08),transparent_42%)]" aria-hidden="true" />

              <div className="relative z-10 mb-3 mt-auto">
                <h3 className="text-lg font-black uppercase tracking-wider text-white drop-shadow-md sm:text-xl">{model.name}</h3>
              </div>
            </GlassCard>
          );

          return (
            <div
              key={model.id}
              className={`absolute ${isDragging ? '' : 'transition-[transform,opacity] duration-450 ease-out'}`}
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                opacity,
                zIndex,
                willChange: isDragging ? 'transform' : undefined,
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

      <div className="z-30 -mt-1 flex space-x-2 pb-0.5">
        {models.map((model, idx) => (
          <button
            key={model.id}
            onClick={() => setActiveIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? 'w-6 bg-[#00f2ea] shadow-[0_0_8px_rgba(0,242,234,0.65)]'
                : 'w-1.5 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Ir a ${model.name}`}
          />
        ))}
      </div>
    </div>
  );
}
