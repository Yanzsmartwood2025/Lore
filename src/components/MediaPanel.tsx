'use client';

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMusic,
  faVideo,
  faPlay,
  faPause,
  faForward,
  faVolumeHigh,
  faVolumeMute,
} from '@fortawesome/free-solid-svg-icons';

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  getCurrentTime(): number;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data?: number;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Sample royalty-free/public music playlist (YouTube Video IDs)
const DEFAULT_MUSIC_PLAYLIST = [
  '3JZ_D3ELwOQ', // Sample Video 1
  'kJQP7kiw5Fk', // Sample Video 2
  'dQw4w9WgXcQ', // Sample Video 3
];

// Sample public MP4 video for Content mode
const DEFAULT_CONTENT_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

interface MediaPanelProps {
  playlist?: string[];
  contentVideoUrl?: string;
}

export function MediaPanel({
  playlist = DEFAULT_MUSIC_PLAYLIST,
  contentVideoUrl = DEFAULT_CONTENT_VIDEO_URL,
}: MediaPanelProps) {
  const [activeTab, setActiveTab] = useState<'music' | 'content'>('music');

  // Music state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicSavedTime, setMusicSavedTime] = useState(0);

  // Content state
  const [contentPlaying, setContentPlaying] = useState(false);
  const [contentMuted, setContentMuted] = useState(false);
  const [contentSavedTime, setContentSavedTime] = useState(0);

  // YT player ref
  const ytPlayerRef = useRef<YTPlayer | null>(null);

  // HTML5 Video ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // First user interaction tracking
  const [hasInteracted, setHasInteracted] = useState(false);

  // 1. Handle global first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // 2. Load YouTube IFrame API once
  const [ytApiReady, setYtApiReady] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.YT && window.YT.Player);
  });

  useEffect(() => {
    if (ytApiReady) return;

    if (window.YT && window.YT.Player) {
      const timer = setTimeout(() => setYtApiReady(true), 0);
      return () => clearTimeout(timer);
    }

    // Load YT script if not present
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

  // Sync state with refs inside useEffect
  const musicPlayingRef = useRef(musicPlaying);
  const musicMutedRef = useRef(musicMuted);
  const hasInteractedRef = useRef(hasInteracted);
  const musicSavedTimeRef = useRef(musicSavedTime);

  useEffect(() => {
    musicPlayingRef.current = musicPlaying;
    musicMutedRef.current = musicMuted;
    hasInteractedRef.current = hasInteracted;
    musicSavedTimeRef.current = musicSavedTime;
  }, [musicPlaying, musicMuted, hasInteracted, musicSavedTime]);

  // 3. Initialize YT Player when Music tab is active and API is ready
  useEffect(() => {
    if (activeTab !== 'music' || !ytApiReady) return;

    const containerId = 'yt-player-element';
    const container = document.getElementById(containerId);
    if (!container) return;

    const initialStartTime = Math.floor(musicSavedTimeRef.current);

    new window.YT.Player(containerId, {
      videoId: playlist[currentTrackIndex],
      playerVars: {
        autoplay: musicPlayingRef.current ? 1 : 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        start: initialStartTime,
      },
      events: {
        onReady: (event: YTPlayerEvent) => {
          ytPlayerRef.current = event.target;
          if (musicMutedRef.current) {
            event.target.mute();
          } else {
            event.target.unMute();
          }

          if (musicPlayingRef.current && hasInteractedRef.current) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: YTPlayerEvent) => {
          // YT.PlayerState.ENDED === 0
          if (event.data === 0) {
            setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
            setMusicSavedTime(0);
          }
          // YT.PlayerState.PLAYING === 1
          if (event.data === 1) {
            setMusicPlaying(true);
          }
          // YT.PlayerState.PAUSED === 2
          if (event.data === 2) {
            setMusicPlaying(false);
          }
        },
      },
    });

    return () => {
      if (ytPlayerRef.current) {
        try {
          const currentTime = ytPlayerRef.current.getCurrentTime() || 0;
          setMusicSavedTime(currentTime);
          ytPlayerRef.current.destroy();
        } catch {
          // Ignore destruction errors
        }
        ytPlayerRef.current = null;
      }
    };
  }, [activeTab, ytApiReady, currentTrackIndex, playlist]);

  // 4. Handle Music Controls
  const toggleMusicPlay = () => {
    if (!ytPlayerRef.current) return;
    if (musicPlaying) {
      ytPlayerRef.current.pauseVideo();
      setMusicPlaying(false);
    } else {
      ytPlayerRef.current.playVideo();
      setMusicPlaying(true);
    }
  };

  const toggleMusicMute = () => {
    if (!ytPlayerRef.current) return;
    if (musicMuted) {
      ytPlayerRef.current.unMute();
      setMusicMuted(false);
    } else {
      ytPlayerRef.current.mute();
      setMusicMuted(true);
    }
  };

  const skipMusicTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setMusicSavedTime(0);
    setCurrentTrackIndex(nextIndex);
  };

  // 5. Handle Content Controls & Restoration
  const contentSavedTimeRef = useRef(contentSavedTime);
  const contentPlayingRef = useRef(contentPlaying);

  useEffect(() => {
    contentSavedTimeRef.current = contentSavedTime;
    contentPlayingRef.current = contentPlaying;
  }, [contentSavedTime, contentPlaying]);

  useEffect(() => {
    if (activeTab === 'content' && videoRef.current) {
      if (contentSavedTimeRef.current > 0) {
        videoRef.current.currentTime = contentSavedTimeRef.current;
      }
      if (contentPlayingRef.current && hasInteractedRef.current) {
        videoRef.current.play().catch(() => setContentPlaying(false));
      }
    }
  }, [activeTab]);

  const toggleContentPlay = () => {
    if (!videoRef.current) return;
    if (contentPlaying) {
      videoRef.current.pause();
      setContentPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setContentPlaying(true))
        .catch(() => setContentPlaying(false));
    }
  };

  const toggleContentMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !contentMuted;
    setContentMuted(!contentMuted);
  };

  // 6. Handle Tab Switch (Pause & Save state)
  const handleTabChange = (newTab: 'music' | 'content') => {
    if (newTab === activeTab) return;

    if (activeTab === 'music') {
      if (ytPlayerRef.current) {
        try {
          const time = ytPlayerRef.current.getCurrentTime() || 0;
          setMusicSavedTime(time);
          ytPlayerRef.current.pauseVideo();
        } catch {
          // Ignore
        }
      }
      setMusicPlaying(false);
    } else {
      if (videoRef.current) {
        setContentSavedTime(videoRef.current.currentTime);
        videoRef.current.pause();
      }
      setContentPlaying(false);
    }

    setActiveTab(newTab);
  };

  const isMusic = activeTab === 'music';

  return (
    <div className="fixed top-0 left-0 right-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Toggle Pestañas */}
        <div className="flex items-center space-x-2 bg-black/50 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => handleTabChange('music')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              isMusic
                ? 'bg-[#00f2ea]/20 text-[#00f2ea] border border-[#00f2ea]/50 shadow-[0_0_10px_rgba(0,242,234,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={faMusic} />
            <span>Música</span>
          </button>

          <button
            onClick={() => handleTabChange('content')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              !isMusic
                ? 'bg-[#f000b8]/20 text-[#f000b8] border border-[#f000b8]/50 shadow-[0_0_10px_rgba(240,0,184,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FontAwesomeIcon icon={faVideo} />
            <span>Contenido</span>
          </button>
        </div>

        {/* Display principal de video/reproductor */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* MODO MÚSICA */}
          {isMusic && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Contenedor del IFrame de YouTube (Visible para cumplir TOS) */}
              <div
                className="relative w-28 h-16 rounded-lg overflow-hidden border border-[#00f2ea]/30 shadow-[0_0_8px_rgba(0,242,234,0.2)] bg-black shrink-0"
              >
                <div id="yt-player-element" className="w-full h-full" />
              </div>

              {/* Info y Controles Música */}
              <div className="flex flex-col justify-center flex-grow sm:flex-grow-0 min-w-[120px]">
                <span className="text-[10px] text-[#00f2ea] uppercase tracking-widest font-semibold">
                  Pista {currentTrackIndex + 1} / {playlist.length}
                </span>

                <div className="flex items-center space-x-3 mt-1">
                  <button
                    onClick={toggleMusicPlay}
                    className="w-8 h-8 rounded-full border border-[#00f2ea] text-[#00f2ea] flex items-center justify-center hover:bg-[#00f2ea]/20 transition-all active:scale-90"
                    title={musicPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    <FontAwesomeIcon icon={musicPlaying ? faPause : faPlay} className="text-xs" />
                  </button>

                  <button
                    onClick={toggleMusicMute}
                    className="text-gray-400 hover:text-[#00f2ea] transition-colors"
                    title={musicMuted ? 'Dessilenciar' : 'Silenciar'}
                  >
                    <FontAwesomeIcon icon={musicMuted ? faVolumeMute : faVolumeHigh} className="text-sm" />
                  </button>

                  <button
                    onClick={skipMusicTrack}
                    className="text-gray-400 hover:text-[#00f2ea] transition-colors"
                    title="Siguiente pista"
                  >
                    <FontAwesomeIcon icon={faForward} className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODO CONTENIDO */}
          {!isMusic && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Contenedor HTML5 Video */}
              <div className="relative w-28 h-16 rounded-lg overflow-hidden border border-[#f000b8]/30 shadow-[0_0_8px_rgba(240,0,184,0.2)] bg-black shrink-0">
                <video
                  ref={videoRef}
                  src={contentVideoUrl}
                  className="w-full h-full object-cover"
                  onEnded={() => setContentPlaying(false)}
                  onPlay={() => setContentPlaying(true)}
                  onPause={() => setContentPlaying(false)}
                  playsInline
                />
              </div>

              {/* Info y Controles Contenido */}
              <div className="flex flex-col justify-center flex-grow sm:flex-grow-0 min-w-[120px]">
                <span className="text-[10px] text-[#f000b8] uppercase tracking-widest font-semibold">
                  Video Promocional
                </span>

                <div className="flex items-center space-x-3 mt-1">
                  <button
                    onClick={toggleContentPlay}
                    className="w-8 h-8 rounded-full border border-[#f000b8] text-[#f000b8] flex items-center justify-center hover:bg-[#f000b8]/20 transition-all active:scale-90"
                    title={contentPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    <FontAwesomeIcon icon={contentPlaying ? faPause : faPlay} className="text-xs" />
                  </button>

                  <button
                    onClick={toggleContentMute}
                    className="text-gray-400 hover:text-[#f000b8] transition-colors"
                    title={contentMuted ? 'Dessilenciar' : 'Silenciar'}
                  >
                    <FontAwesomeIcon icon={contentMuted ? faVolumeMute : faVolumeHigh} className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
