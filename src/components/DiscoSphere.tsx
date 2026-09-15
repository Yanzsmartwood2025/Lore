'use client';

import { useState, useEffect } from 'react';

interface DiscoSphereProps {
  isPlaying?: boolean;
  className?: string;
}

export function DiscoSphere({ isPlaying = false, className = '' }: DiscoSphereProps) {
  const [pulseFactor, setPulseFactor] = useState(1);

  // Ready hook/logic for future Web Audio API integration
  useEffect(() => {
    let animationFrameId: number;
    let angle = 0;

    const animate = () => {
      angle += 0.05;
      // Simulated subtle pulse rhythm; ready to swap with audio analyzer data
      const basePulse = Math.sin(angle) * 0.15 + 1;
      setPulseFactor(isPlaying ? basePulse * 1.15 : basePulse);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
      {/* Dynamic Pulsing Outer Neon Rays / Glow */}
      <div
        className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-cyan-500/30 via-purple-600/30 to-pink-500/30 filter blur-3xl transition-transform duration-300"
        style={{ transform: `scale(${pulseFactor * 1.2})` }}
      />

      <div
        className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-cyan-400/20 filter blur-2xl animate-pulse"
        style={{ transform: `scale(${pulseFactor})` }}
      />

      {/* Rotating Light Beams */}
      <div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-dashed border-cyan-400/30 animate-[spin_12s_linear_infinite]"
        style={{ transform: `scale(${pulseFactor * 0.95})` }}
      />
      <div
        className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-dashed border-pink-500/30 animate-[spin_8s_linear_infinite_reverse]"
        style={{ transform: `scale(${pulseFactor * 0.9})` }}
      />

      {/* Main 3D Glass Disco Sphere */}
      <div
        className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-purple-950 via-cyan-950/80 to-black border border-cyan-300/60 shadow-[0_0_50px_rgba(0,242,234,0.6)] flex items-center justify-center overflow-hidden transition-transform duration-200"
        style={{ transform: `scale(${pulseFactor * 0.98})` }}
      >
        {/* Mirror Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#00f2ea_1px,transparent_1px)] [background-size:10px_10px] animate-[spin_20s_linear_infinite]" />

        {/* Specular Highlight */}
        <div className="absolute top-2 left-4 w-10 h-10 bg-white/40 rounded-full filter blur-sm transform -rotate-45" />

        {/* Inner Disco Core Glow */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00f2ea] to-[#f000b8] filter blur-md animate-ping opacity-80" />
      </div>
    </div>
  );
}
