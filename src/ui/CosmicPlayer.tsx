import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Loader2, Play, Pause, Volume2, VolumeX, Maximize2, Tv, Sparkles, ShieldCheck } from 'lucide-react';
import { cyberSound } from '../components/CyberSound';

interface CosmicPlayerProps {
  title: string;
  streamUrl: string;
  channelNumber?: number;
  onBack: () => void;
  onZap?: (delta: number) => void;
}

export const CosmicPlayer: React.FC<CosmicPlayerProps> = ({
  title,
  streamUrl,
  channelNumber,
  onBack,
  onZap,
}) => {
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHUD, setShowHUD] = useState(true);
  const [scanlines, setScanlines] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const triggerHUD = useCallback(() => {
    setShowHUD(true);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setShowHUD(false);
    }, 4500);
  }, []);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);
    triggerHUD();

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = streamUrl.includes('.m3u8') || !streamUrl.includes('.mp4');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError('No se pudo establecer el enlace cuántico de transmisión');
          setLoading(false);
        }
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
      setLoading(false);
    }
  }, [streamUrl, triggerHUD]);

  useEffect(() => {
    startPlayback();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [startPlayback]);

  // Keyboard navigation & remote controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ChannelUp':
        case 'PageUp':
          e.preventDefault();
          if (onZap) onZap(+1);
          break;
        case 'ArrowDown':
        case 'ChannelDown':
        case 'PageDown':
          e.preventDefault();
          if (onZap) onZap(-1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          triggerHUD();
          if (e.key === ' ' && videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onBack();
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
  }, [onZap, onBack, triggerHUD]);

  return (
    <div
      onClick={triggerHUD}
      className="relative h-screen w-screen bg-black overflow-hidden select-none cursor-pointer"
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
      />

      {/* Cyber Scanlines Filter (Toggleable) */}
      {scanlines && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none opacity-30 z-20" />
      )}

      {/* Top Starship HUD Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-30 ${
          showHUD ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            cyberSound.click();
            onBack();
          }}
          className="flex items-center gap-2.5 px-4 py-2 bg-[#0A0D1A]/90 hover:bg-[#181A22] border border-[#2A2F45] text-white rounded-xl transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft size={18} className="text-[#00F0FF]" />
          <span className="font-mono text-xs font-bold">SALIR DE TRANSMISIÓN</span>
        </button>

        {/* Telemetry info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-[#2A2F45] text-xs font-mono text-[#00F0FF]">
            <ShieldCheck size={14} />
            <span>STREAM HLS CUÁNTICO // 4K ACTIVO</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setScanlines(!scanlines);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              scanlines
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]'
                : 'bg-black/60 text-[#9AA3B5] border-[#2A2F45]'
            }`}
          >
            SCANLINES {scanlines ? 'ON' : 'OFF'}
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
            className="p-2 rounded-lg bg-[#0A0D1A]/90 border border-[#2A2F45] text-white hover:text-[#00F0FF] cursor-pointer"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Buffering Indicator */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 pointer-events-none">
          <div className="w-14 h-14 rounded-full border-4 border-t-[#00F0FF] border-r-[#FF0077] border-b-transparent border-l-transparent animate-spin mb-3" />
          <p className="text-xs font-mono text-[#00F0FF] tracking-wider uppercase">
            ESTABLECIENDO ENLACE CON EL COSMOS...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-8 text-center pointer-events-none">
          <p className="text-[#FF0055] text-xl font-mono font-bold max-w-lg mb-4">
            {error}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              startPlayback();
            }}
            className="px-6 py-2.5 bg-[#00F0FF] text-black font-mono font-bold rounded-xl pointer-events-auto cursor-pointer"
          >
            REINTENTAR ENLACE
          </button>
        </div>
      )}

      {/* Bottom Floating Telemetry OSD */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 transform ${
          showHUD ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-5 min-w-0">
            {typeof channelNumber === 'number' && (
              <div className="text-[36px] font-black font-mono text-[#00F0FF] shrink-0 leading-none drop-shadow-[0_0_12px_#00F0FF]">
                {channelNumber < 10 ? `0${channelNumber}` : channelNumber}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-white truncate leading-tight">
                {title}
              </h2>
              <p className="text-xs font-mono text-[#9AA3B5] mt-1">
                ▲▼ Zapping de canal · Espacio / Enter Pausa · Escape Volver
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
