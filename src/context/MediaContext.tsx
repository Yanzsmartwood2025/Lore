'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  DEFAULT_MUSIC_CATEGORY,
  MUSIC_CATEGORIES,
  REQUESTED_SONG_START_SECONDS,
  type MusicCategory,
  type MusicSource,
} from '@/lib/music';
import { getYouTubeLightingFrame, getYouTubeLightingProfile } from '@/lib/youtubeLighting';

export type VideoSizeMode = 'hero' | 'micro' | 'expanded';

interface YouTubePlayer {
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  cuePlaylist: (options: { listType: 'playlist'; list: string; index: number; startSeconds: number }) => void;
  loadPlaylist: (options: { listType: 'playlist'; list: string; index: number; startSeconds: number }) => void;
  setLoop?: (loop: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
  setVolume: (volume: number) => void;
  getCurrentTime?: () => number;
  getVideoData?: () => { video_id?: string };
}

interface MediaContextType {
  isPlaying: boolean;
  isMuted: boolean;
  ambientCategory: MusicCategory;
  videoSize: VideoSizeMode;
  hasEntered: boolean;
  activeTab: 'music' | 'content';
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekBy: (seconds: number) => void;
  toggleMute: () => void;
  setVideoSize: (size: VideoSizeMode) => void;
  toggleVideoSize: () => void;
  enterLobby: () => void;
  setActiveTab: (tab: 'music' | 'content') => void;
  setAmbientCategory: (category: MusicCategory) => void;
  playRequestedVideo: (videoId: string) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const targetVolume = pathname === '/' ? 65 : 22;
  const targetVolumeRef = useRef(targetVolume);
  const volumeRef = useRef(targetVolume);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [ambientCategory, setAmbientCategoryState] = useState<MusicCategory>(DEFAULT_MUSIC_CATEGORY);
  const [videoSize, setVideoSizeState] = useState<VideoSizeMode>('hero');
  const [hasEntered, setHasEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<'music' | 'content'>('music');

  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const ambientCategoryRef = useRef(ambientCategory);
  const isPlayingRef = useRef(isPlaying);
  const isMutedRef = useRef(isMuted);
  const requestedVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    targetVolumeRef.current = targetVolume;
    const start = volumeRef.current;
    const began = performance.now();
    let frame = 0;
    const fade = (now: number) => {
      const progress = Math.min(1, (now - began) / 1200);
      const eased = progress * progress * (3 - 2 * progress);
      volumeRef.current = start + (targetVolume - start) * eased;
      ytPlayerRef.current?.setVolume(Math.round(volumeRef.current));
      if (progress < 1) frame = requestAnimationFrame(fade);
    };
    frame = requestAnimationFrame(fade);
    return () => cancelAnimationFrame(frame);
  }, [targetVolume]);

  useEffect(() => {
    ambientCategoryRef.current = ambientCategory;
    isPlayingRef.current = isPlaying;
    isMutedRef.current = isMuted;
  }, [ambientCategory, isPlaying, isMuted]);

  const loadSource = (player: YouTubePlayer, source: MusicSource, autoplay = true) => {
    requestedVideoIdRef.current = null;
    if (source.type === 'video') {
      const options = { videoId: source.id, startSeconds: 0 };
      if (autoplay) player.loadVideoById(options);
      else player.cueVideoById(options);
    } else {
      const options = { listType: 'playlist' as const, list: source.id, index: 0, startSeconds: 0 };
      if (autoplay) player.loadPlaylist(options);
      else player.cuePlaylist(options);
      player.setLoop?.(true);
    }
  };

  const [ytApiReady, setYtApiReady] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.YT && window.YT.Player);
  });

  useEffect(() => {
    if (ytApiReady) return;

    if (window.YT && window.YT.Player) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- readiness comes from an external script
      setYtApiReady(true);
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      setYtApiReady(true);
    };
  }, [ytApiReady]);

  useEffect(() => {
    if (!ytApiReady) return;

    const containerId = 'yt-player-element';
    const container = document.getElementById(containerId);
    if (!container) return;

    if (ytPlayerRef.current) return;

    new window.YT.Player(containerId, {
      videoId: MUSIC_CATEGORIES[DEFAULT_MUSIC_CATEGORY].source.id,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event: { target: YouTubePlayer }) => {
          ytPlayerRef.current = event.target;
          event.target.setVolume(targetVolumeRef.current);
          if (isMutedRef.current) {
            event.target.mute();
          } else {
            event.target.unMute();
          }
          if (requestedVideoIdRef.current) {
            event.target.loadVideoById({
              videoId: requestedVideoIdRef.current,
              startSeconds: REQUESTED_SONG_START_SECONDS,
            });
          } else if (isPlayingRef.current) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: { data: number; target: YouTubePlayer }) => {
          if (event.data === 0) {
            const category = MUSIC_CATEGORIES[ambientCategoryRef.current];
            if (requestedVideoIdRef.current) {
              loadSource(event.target, category.source);
            } else if (category.source.type === 'video') {
              event.target.seekTo(0, true);
              event.target.playVideo();
            }
          }
          if (event.data === 1) setIsPlaying(true);
          if (event.data === 2) setIsPlaying(false);
        },
        onError: (event: { target: YouTubePlayer }) => {
          const category = MUSIC_CATEGORIES[ambientCategoryRef.current];
          if ('fallback' in category) loadSource(event.target, category.fallback);
        },
      },
    });

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [ytApiReady]);

  // Reloj visual exclusivo de YouTube. Trabaja a 12.5 Hz, no provoca renders
  // de React y se apaga al pausar o mandar la app a segundo plano.
  useEffect(() => {
    const root = document.documentElement;
    let timer = 0;
    let lastBeatIndex = -1;

    const resetLighting = () => {
      root.style.setProperty('--lore-card-glow', '0.05');
      root.style.setProperty('--lore-card-side-glow', '0.025');
      root.style.setProperty('--lore-sweep-x', '18%');
      root.style.setProperty('--lore-warmth', '0.18');
      root.style.setProperty('--lore-beat-pulse', '0');
    };

    const tick = () => {
      const player = ytPlayerRef.current;
      if (!isPlaying || !player || document.hidden) {
        resetLighting();
        return;
      }

      const seconds = player.getCurrentTime?.();
      if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return;

      const videoId = player.getVideoData?.().video_id;
      const profile = getYouTubeLightingProfile(videoId, ambientCategoryRef.current);
      const light = getYouTubeLightingFrame(seconds, profile);

      root.style.setProperty('--lore-card-glow', light.cardGlow.toFixed(3));
      root.style.setProperty('--lore-card-side-glow', (light.cardGlow * 0.52).toFixed(3));
      root.style.setProperty('--lore-sweep-x', `${light.sweep.toFixed(1)}%`);
      root.style.setProperty('--lore-warmth', light.warmth.toFixed(3));
      root.style.setProperty('--lore-beat-pulse', light.pulse.toFixed(3));

      if (light.beatIndex !== lastBeatIndex) {
        lastBeatIndex = light.beatIndex;
        window.dispatchEvent(new CustomEvent('lore:youtube-beat', {
          detail: {
            strength: light.barBeat === 0 ? 1 : 0.72,
            warmth: light.warmth,
            beatIndex: light.beatIndex,
            barBeat: light.barBeat,
            barIndex: light.barIndex,
          },
        }));
      }
    };

    resetLighting();
    if (isPlaying) {
      tick();
      timer = window.setInterval(tick, 80);
    }

    const handleVisibility = () => {
      if (document.hidden) resetLighting();
      else if (isPlaying) tick();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      resetLighting();
    };
  }, [isPlaying]);

  const setAmbientCategory = (category: MusicCategory) => {
    ambientCategoryRef.current = category;
    setAmbientCategoryState(category);
    setActiveTab('music');
    if (ytPlayerRef.current) {
      try {
        loadSource(ytPlayerRef.current, MUSIC_CATEGORIES[category].source);
        setIsPlaying(true);
      } catch {
        const selectedCategory = MUSIC_CATEGORIES[category];
        if ('fallback' in selectedCategory) loadSource(ytPlayerRef.current, selectedCategory.fallback);
      }
    }
  };

  const play = () => {
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch {
        // ignore
      }
    }
  };

  const pause = () => {
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } catch {
        // ignore
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const nextTrack = () => {
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.nextVideo();
      } catch {
        // ignore
      }
    }
  };

  const prevTrack = () => {
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.previousVideo();
      } catch {
        // ignore
      }
    }
  };

  const seekBy = (seconds: number) => {
    const player = ytPlayerRef.current;
    if (!player) return;
    try {
      const currentTime = player.getCurrentTime?.();
      if (typeof currentTime !== 'number' || !Number.isFinite(currentTime)) return;
      player.seekTo(Math.max(0, currentTime + seconds), true);
    } catch {
      // ignore
    }
  };

  const toggleMute = () => {
    if (ytPlayerRef.current) {
      try {
        if (isMuted) {
          ytPlayerRef.current.unMute();
          setIsMuted(false);
        } else {
          ytPlayerRef.current.mute();
          setIsMuted(true);
        }
      } catch {
        // ignore
      }
    }
  };

  const setVideoSize = (size: VideoSizeMode) => setVideoSizeState(size);
  const toggleVideoSize = () => setVideoSizeState((prev) => (prev === 'micro' ? 'expanded' : 'micro'));

  const playRequestedVideo = (videoId: string) => {
    requestedVideoIdRef.current = videoId;
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.loadVideoById({
          videoId,
          startSeconds: REQUESTED_SONG_START_SECONDS,
        });
        setIsPlaying(true);
      } catch {
        // ignore
      }
    }
  };

  const enterLobby = () => {
    setHasEntered(true);
    play();
  };

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Música en vivo',
      artist: 'Protocolo VIP',
      album: 'El Club de Lore',
      artwork: [
        { src: '/images/Lore-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/images/Lore-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', nextTrack);

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  });

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  return (
    <MediaContext.Provider
      value={{
        isPlaying,
        isMuted,
        ambientCategory,
        videoSize,
        hasEntered,
        activeTab,
        play,
        pause,
        togglePlay,
        nextTrack,
        prevTrack,
        seekBy,
        toggleMute,
        setVideoSize,
        toggleVideoSize,
        enterLobby,
        setActiveTab,
        setAmbientCategory,
        playRequestedVideo,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) throw new Error('useMedia must be used within a MediaProvider');
  return context;
}
