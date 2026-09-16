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

  // Load YouTube API
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

  // Initialize YT Player once
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
          // YT.PlayerState.ENDED === 0
          if (event.data === 0) {
            const category = MUSIC_CATEGORIES[ambientCategoryRef.current];
            if (requestedVideoIdRef.current) {
              loadSource(event.target, category.source);
            } else if (category.source.type === 'video') {
              event.target.seekTo(0, true);
              event.target.playVideo();
            }
          }
          // YT.PlayerState.PLAYING === 1
          if (event.data === 1) {
            setIsPlaying(true);
          }
          // YT.PlayerState.PAUSED === 2
          if (event.data === 2) {
            setIsPlaying(false);
          }
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
    if (isPlaying) {
      pause();
    } else {
      play();
    }
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

  const setVideoSize = (size: VideoSizeMode) => {
    setVideoSizeState(size);
  };

  const toggleVideoSize = () => {
    setVideoSizeState((prev) => (prev === 'micro' ? 'expanded' : 'micro'));
  };

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

  // Expone controles al sistema operativo cuando el navegador/PWA admite la
  // Media Session API. El navegador sigue decidiendo si permite audio en
  // segundo plano (en especial cuando la fuente es un iframe de YouTube).
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
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}
