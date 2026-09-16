'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMedia } from '@/context/MediaContext';
import { models } from '@/data/models';
import { MUSIC_CATEGORIES, type MusicCategory } from '@/lib/music';
import { DiscoSphere } from './DiscoSphere';

export function MediaPanel() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { isPlaying, isMuted, togglePlay, toggleMute, nextTrack, prevTrack, ambientCategory, setAmbientCategory } = useMedia();
  const [musicLarge, setMusicLarge] = useState(false);
  const [selected, setSelected] = useState('lore');
  const [controls, setControls] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const persona = models.find(m => m.slug === (isHome ? selected : pathname.split('/')[1])) ?? models[0];
  function reveal() {
    setControls(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!toolbar.current?.querySelector(':focus-visible')) setControls(false);
    }, 5000);
  }
  useEffect(() => {
    timer.current = setTimeout(() => { if (!toolbar.current?.querySelector(':focus-visible')) setControls(false); }, 5000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  return (
    <section className={`lore-media ${!isHome ? 'lore-media-room' : ''}`} aria-label="Escenario y música">
      <div className={`lore-media-grid ${musicLarge ? 'music-large' : ''}`}>
        <div className="lore-stage" hidden={!isHome}>
          {persona.danceVideoSrc ? <DanceVideo key={persona.danceVideoSrc} src={persona.danceVideoSrc} playing={isPlaying && isHome} /> : <DiscoSphere isPlaying={isPlaying && isHome} />}
          <div className="lore-stage-caption"><span>EL CLUB DE LORE</span><strong>{persona.name}</strong></div>
        </div>
        {/* Keep the same iframe host mounted across route and layout changes. */}
        <div className="lore-youtube"><div id="yt-player-element" /></div>
      </div>
      <div className="lore-media-actions">
        <button type="button" onClick={() => { if (controls) setControls(false); else reveal(); }} aria-expanded={controls} aria-controls="lore-player-controls">{controls ? 'Ocultar controles' : 'Controles de música'}</button>
        {isHome && <button type="button" onClick={() => { setMusicLarge(v => !v); reveal(); }}>{musicLarge ? 'Ver a la chica' : 'Ampliar YouTube'} ⇄</button>}
      </div>
      <div ref={toolbar} id="lore-player-controls" className="lore-controls" hidden={!controls} onPointerDown={reveal} onKeyDown={reveal} onBlur={reveal}>
        <div className="lore-transport">
          <button type="button" onClick={prevTrack} aria-label="Canción anterior">⏮</button>
          <button type="button" onClick={togglePlay}>{isPlaying ? 'Pausar' : 'Reproducir'}</button>
          <button type="button" onClick={nextTrack} aria-label="Siguiente canción">⏭</button>
          <button type="button" onClick={toggleMute}>{isMuted ? 'Activar sonido' : 'Silenciar'}</button>
        </div>
        <div className="lore-categories">
          {(Object.entries(MUSIC_CATEGORIES) as [MusicCategory, (typeof MUSIC_CATEGORIES)[MusicCategory]][]).map(([key, category]) => <button type="button" key={key} aria-pressed={ambientCategory === key} onClick={() => setAmbientCategory(key)}>{category.name}</button>)}
        </div>
        {isHome && <label className="lore-persona-picker">En escena <select value={selected} onChange={e => setSelected(e.target.value)}>{models.filter(m => m.isActive).map(m => <option key={m.slug} value={m.slug}>{m.name}</option>)}</select></label>}
        {!isHome && <p className="text-xs text-slate-400">Música suave para conversar</p>}
      </div>
    </section>
  );
}

function DanceVideo({ src, playing }: { src: string; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const update = () => {
      if (playing && !document.hidden) void video.play().catch(() => setFailed(true));
      else video.pause();
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => { video.pause(); document.removeEventListener('visibilitychange', update); };
  }, [playing]);
  if (failed) return <DiscoSphere isPlaying={playing} />;
  return <video ref={ref} src={src} muted loop playsInline preload="metadata" onError={() => setFailed(true)} aria-label="Video del personaje" />;
}
