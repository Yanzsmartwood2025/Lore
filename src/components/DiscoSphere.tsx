'use client';

interface DiscoSphereProps {
  isPlaying?: boolean;
  className?: string;
}

export function DiscoSphere({ isPlaying = false, className = '' }: DiscoSphereProps) {
  return (
    <div className={`disco-stage ${isPlaying ? 'is-playing' : ''} relative flex items-center justify-center pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="disco-beam disco-beam-left" />
      <div className="disco-beam disco-beam-right" />
      {/* Dynamic Pulsing Outer Neon Rays / Glow */}
      <div
        className="disco-aura absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-cyan-500/30 via-purple-600/30 to-pink-500/30 filter blur-3xl"
      />

      <div
        className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-cyan-400/20 filter blur-2xl animate-pulse"
      />

      {/* Rotating Light Beams */}
      <div
        className="disco-ring disco-ring-outer absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-dashed border-cyan-400/30"
      />
      <div
        className="disco-ring disco-ring-inner absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-dashed border-pink-500/30"
      />

      {/* Main 3D Glass Disco Sphere */}
      <div
        className="disco-ball relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-purple-950 via-cyan-950/80 to-black border border-cyan-300/60 shadow-[0_0_50px_rgba(0,242,234,0.6)] flex items-center justify-center overflow-hidden"
      >
        {/* Mirror Grid Pattern Overlay */}
        <div className="disco-grid absolute inset-0 opacity-55 bg-[radial-gradient(#00f2ea_1px,transparent_1px)] [background-size:10px_10px]" />

        {/* Specular Highlight */}
        <div className="absolute top-2 left-4 w-10 h-10 bg-white/40 rounded-full filter blur-sm transform -rotate-45" />

        {/* Inner Disco Core Glow */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00f2ea] to-[#f000b8] filter blur-md animate-ping opacity-80" />
      </div>
    </div>
  );
}
