import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { Channel } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { ArrowLeft, Loader2, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface PlayerActivityProps {
  categoryId: string;
  initialIndex: number;
  onBack: (lastIndex: number) => void;
}

export const PlayerActivity: React.FC<PlayerActivityProps> = ({
  categoryId,
  initialIndex,
  onBack,
}) => {
  const [channels] = useState<Channel[]>(() => ChannelRepository.channelsIn(categoryId));
  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    Math.max(0, Math.min(initialIndex, (ChannelRepository.channelsIn(categoryId).length || 1) - 1))
  );

  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideInfoTimerRef = useRef<number | null>(null);
  const networkRetriesRef = useRef<number>(0);
  const attemptIndexRef = useRef<number>(0);

  const currentChannel = channels[currentIndex];

  // Helper to trigger info bar display with 4s auto-hide
  const triggerInfoBar = useCallback(() => {
    setShowInfo(true);
    if (hideInfoTimerRef.current) {
      window.clearTimeout(hideInfoTimerRef.current);
    }
    hideInfoTimerRef.current = window.setTimeout(() => {
      setShowInfo(false);
    }, 4000);
  }, []);

  // Channel zapping (+1, -1) with wrap around
  const zap = useCallback(
    (delta: number) => {
      if (channels.length === 0) return;
      const nextIndex = (currentIndex + delta + channels.length) % channels.length;
      setCurrentIndex(nextIndex);
    },
    [channels.length, currentIndex]
  );

  // Build stream attempts
  const buildAttempts = useCallback((channel: Channel): string[] => {
    const urls: string[] = [];
    if (channel.url) urls.push(channel.url);
    if (channel.altUrl && channel.altUrl !== channel.url) urls.push(channel.altUrl);
    // Add proxy URL attempt as ultimate fallback for CORS or mixed content
    if (channel.url) {
      urls.push(`/api/proxy/stream?url=${encodeURIComponent(channel.url)}`);
    }
    return urls;
  }, []);

  // Play attempt for current channel
  const startPlayback = useCallback(
    (channel: Channel) => {
      const video = videoRef.current;
      if (!video) return;

      setLoading(true);
      setError(null);
      triggerInfoBar();

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const attempts = buildAttempts(channel);
      const targetUrl = attempts[attemptIndexRef.current] || channel.url;

      const isHls =
        targetUrl.includes('.m3u8') ||
        targetUrl.includes('live') ||
        !targetUrl.includes('.mp4');

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
        });
        hlsRef.current = hls;

        hls.loadSource(targetUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {
            // Autoplay with sound might require user gesture
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (networkRetriesRef.current < 3) {
                  networkRetriesRef.current++;
                  hls.startLoad();
                } else if (attemptIndexRef.current + 1 < attempts.length) {
                  attemptIndexRef.current++;
                  networkRetriesRef.current = 0;
                  startPlayback(channel);
                } else {
                  setError('No se pudo reproducir este canal\n(Error de red)');
                  setLoading(false);
                  triggerInfoBar();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                if (attemptIndexRef.current + 1 < attempts.length) {
                  attemptIndexRef.current++;
                  startPlayback(channel);
                } else {
                  setError('No se pudo reproducir este canal\n(Error fatal)');
                  setLoading(false);
                  triggerInfoBar();
                }
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari/iOS)
        video.src = targetUrl;
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      } else {
        // Direct media element fallback
        video.src = targetUrl;
        video.play().catch(() => {});
      }
    },
    [buildAttempts, triggerInfoBar]
  );

  // Play current channel on index change
  useEffect(() => {
    if (!currentChannel) return;
    attemptIndexRef.current = 0;
    networkRetriesRef.current = 0;
    startPlayback(currentChannel);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentIndex, currentChannel, startPlayback]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWaiting = () => setLoading(true);
    const handlePlaying = () => {
      setLoading(false);
      setIsPlaying(true);
      setError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      if (!error) {
        setError('No se pudo reproducir este canal');
        setLoading(false);
        triggerInfoBar();
      }
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [error, triggerInfoBar]);

  // Keyboard navigation matching Android TV PlayerActivity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ChannelUp':
        case 'PageUp':
          e.preventDefault();
          zap(+1);
          break;
        case 'ArrowDown':
        case 'ChannelDown':
        case 'PageDown':
          e.preventDefault();
          zap(-1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          triggerInfoBar();
          if (e.key === ' ') {
            const video = videoRef.current;
            if (video) {
              if (video.paused) video.play();
              else video.pause();
            }
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onBack(currentIndex);
          break;
        case 'm':
        case 'M':
          setIsMuted((prev) => {
            if (videoRef.current) videoRef.current.muted = !prev;
            return !prev;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zap, triggerInfoBar, onBack, currentIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!currentChannel) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <p>Canal no disponible</p>
      </div>
    );
  }

  return (
    <div
      onClick={triggerInfoBar}
      className="relative h-screen w-screen bg-black overflow-hidden select-none cursor-pointer"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
      />

      {/* Top Controls Overlay (Header) */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-30 ${
          showInfo ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack(currentIndex);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#181A22]/90 hover:bg-[#2A2F45] border border-[#2A2F45] text-[#F2F4F8] rounded-lg transition-colors cursor-pointer shadow-lg"
        >
          <ArrowLeft size={20} />
          <span className="font-medium text-[16px]">Lista de canales</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const video = videoRef.current;
              if (video) {
                if (isPlaying) video.pause();
                else video.play();
              }
            }}
            className="p-2.5 bg-[#181A22]/90 hover:bg-[#2A2F45] border border-[#2A2F45] text-[#F2F4F8] rounded-lg transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted((prev) => {
                const next = !prev;
                if (videoRef.current) videoRef.current.muted = next;
                return next;
              });
            }}
            className="p-2.5 bg-[#181A22]/90 hover:bg-[#2A2F45] border border-[#2A2F45] text-[#F2F4F8] rounded-lg transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2.5 bg-[#181A22]/90 hover:bg-[#2A2F45] border border-[#2A2F45] text-[#F2F4F8] rounded-lg transition-colors cursor-pointer"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {/* Buffering Indicator */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20 pointer-events-none">
          <Loader2 size={54} className="animate-spin text-[#4F8CFF] mb-2" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-8 text-center pointer-events-none">
          <div className="text-[#FF8A80] text-[24px] font-semibold whitespace-pre-line leading-relaxed max-w-xl">
            {error}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              startPlayback(currentChannel);
            }}
            className="mt-6 px-6 py-2.5 bg-[#4F8CFF] hover:bg-[#3D78EB] text-white rounded-lg font-medium text-[16px] pointer-events-auto cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Floating Info Bar at Bottom matching bg_info_bar.xml from Android */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 transform ${
          showInfo ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 sm:p-8 flex items-center">
          {/* Channel Number (40sp, text-[#4F8CFF], bold) */}
          <div className="text-[40px] font-bold text-[#4F8CFF] pr-6 font-mono shrink-0 leading-none">
            {currentIndex + 1}
          </div>

          {/* Channel Name & Remote instructions */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[28px] text-[#F2F4F8] font-bold truncate leading-tight">
              {currentChannel.name}
            </h2>
            <p className="text-[14px] text-[#9AA3B5] mt-1 font-medium">
              ▲▼ cambiar canal · OK info · Atrás lista
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
