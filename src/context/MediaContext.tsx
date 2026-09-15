'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export const PLAYLIST_IDS = [
  'PLwNo4uUuFgooEMV9ctJGaKJ_T6S6IbHOu',
  'PLuMEcroxcdXF0e_u7gMvbV3OfJ3NE9qDd',
];

export type VideoSizeMode = 'hero' | 'micro' | 'expanded';

interface MediaContextType {
  isPlaying: boolean;
  isMuted: boolean;
  currentPlaylistIndex: number;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [videoSize, setVideoSizeState] = useState<VideoSizeMode>('hero');
  const [hasEntered, setHasEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<'music' | 'content'>('music');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayerRef = useRef<any>(null);
  const currentPlaylistIndexRef = useRef(currentPlaylistIndex);
  const isPlayingRef = useRef(isPlaying);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    currentPlaylistIndexRef.current = currentPlaylistIndex;
    isPlayingRef.current = isPlaying;
    isMutedRef.current = isMuted;
  }, [currentPlaylistIndex, isPlaying, isMuted]);

  // Load YouTube API
  const [ytApiReady, setYtApiReady] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.YT && window.YT.Player);
  });

  useEffect(() => {
    if (ytApiReady) return;

    if (window.YT && window.YT.Player) {
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

    const player = new window.YT.Player(containerId, {
      playerVars: {
        listType: 'playlist',
        list: PLAYLIST_IDS[0],
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event: { target: any }) => {
          ytPlayerRef.current = event.target;
          if (isMutedRef.current) {
            event.target.mute();
          } else {
            event.target.unMute();
          }
          if (isPlayingRef.current) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: { data: number; target: any }) => {
          // YT.PlayerState.ENDED === 0
          if (event.data === 0) {
            const nextIdx = (currentPlaylistIndexRef.current + 1) % PLAYLIST_IDS.length;
            setCurrentPlaylistIndex(nextIdx);
            currentPlaylistIndexRef.current = nextIdx;
            event.target.loadPlaylist({
              listType: 'playlist',
              list: PLAYLIST_IDS[nextIdx],
              index: 0,
            });
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

  const enterLobby = () => {
    setHasEntered(true);
    play();
  };

  return (
    <MediaContext.Provider
      value={{
        isPlaying,
        isMuted,
        currentPlaylistIndex,
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
