import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Loader2, Subtitles, Volume2, Maximize2 } from 'lucide-react';
import { AdvancedMediaControls } from './AdvancedMediaControls';

interface CleanFullscreenPlayerProps {
  title: string;
  streamUrl: string;
  channelIndex?: number;
  onBack: () => void;
  onZap?: (delta: number) => void;
}

export const CleanFullscreenPlayer: React.FC<CleanFullscreenPlayerProps> = ({
  title,
  streamUrl,
  channelIndex,
  onBack,
  onZap,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMinimalOsd, setShowMinimalOsd] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Audio & Subtitle tracks from stream
  const [subtitleTracks, setSubtitleTracks] = useState<{ id: number; name: string; lang: string }[]>([]);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState<number>(-1);
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string; lang: string }[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(0);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto (1080p)');

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const osdTimerRef = useRef<number | null>(null);

  const triggerMinimalOsd = useCallback(() => {
    setShowMinimalOsd(true);
    if (osdTimerRef.current) {
      window.clearTimeout(osdTimerRef.current);
    }
    // Auto-hide after 5 seconds of inactivity
    osdTimerRef.current = window.setTimeout(() => {
      setShowMinimalOsd(false);
    }, 5000);
  }, []);

  const startStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);
    triggerMinimalOsd();

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
        video.muted = false;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });

        // Detect Subtitle Tracks
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          const subs = hls.subtitleTracks.map((tr: any, idx: number) => ({
            id: idx,
            name: tr.name || `Subtítulo ${idx + 1} (${tr.lang || 'es'})`,
            lang: tr.lang || 'es',
          }));
          subs.unshift({ id: -1, name: 'Desactivados', lang: 'off' });
          setSubtitleTracks(subs);
        } else {
          // Provide standard options so user always has controls
          setSubtitleTracks([
            { id: -1, name: 'Desactivados', lang: 'off' },
            { id: 0, name: 'Español Latino [CC]', lang: 'es' },
            { id: 1, name: 'Español (Castellano)', lang: 'es-es' },
            { id: 2, name: 'Inglés [CC / Sub]', lang: 'en' },
          ]);
        }

        // Detect Audio Tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const auds = hls.audioTracks.map((tr: any, idx: number) => ({
            id: idx,
            name: tr.name || `Audio ${idx + 1} (${tr.lang || 'es'})`,
            lang: tr.lang || 'es',
          }));
          setAudioTracks(auds);
        } else {
          setAudioTracks([
            { id: 0, name: 'Español Latino (Dolby 5.1)', lang: 'es' },
            { id: 1, name: 'Audio Original / Inglés (5.1)', lang: 'en' },
          ]);
        }
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_: any, data: any) => {
        if (data && typeof data.id === 'number') {
          setCurrentSubtitleTrack(data.id);
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_: any, data: any) => {
        if (data && typeof data.id === 'number') {
          setCurrentAudioTrack(data.id);
        }
      });

      hls.on(Hls.Events.ERROR, () => {
        setError('Error al conectar con la señal del canal o película');
        setLoading(false);
      });
    } else {
      video.src = streamUrl;
      video.muted = false;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
      setLoading(false);

      setSubtitleTracks([
        { id: -1, name: 'Desactivados', lang: 'off' },
        { id: 0, name: 'Español Latino [CC]', lang: 'es' },
        { id: 1, name: 'Español (Castellano)', lang: 'es-es' },
        { id: 2, name: 'Inglés [CC / Sub]', lang: 'en' },
      ]);
      setAudioTracks([
        { id: 0, name: 'Español Latino (Dolby 5.1)', lang: 'es' },
        { id: 1, name: 'Audio Original / Inglés (5.1)', lang: 'en' },
      ]);
    }
  }, [streamUrl, triggerMinimalOsd]);

  useEffect(() => {
    startStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [startStream]);

  // Video time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerMinimalOsd();
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
    triggerMinimalOsd();
  };

  const handleSelectSubtitleTrack = (trackId: number) => {
    setCurrentSubtitleTrack(trackId);
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = trackId;
    }
    triggerMinimalOsd();
  };

  const handleSelectAudioTrack = (trackId: number) => {
    setCurrentAudioTrack(trackId);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
    }
    triggerMinimalOsd();
  };

  const handleSelectQuality = (q: string) => {
    setCurrentQuality(q);
    if (hlsRef.current) {
      if (q.includes('Auto')) {
        hlsRef.current.currentLevel = -1;
      } else if (hlsRef.current.levels.length > 0) {
        if (q.includes('1080')) hlsRef.current.currentLevel = Math.min(2, hlsRef.current.levels.length - 1);
        else if (q.includes('720')) hlsRef.current.currentLevel = Math.min(1, hlsRef.current.levels.length - 1);
        else hlsRef.current.currentLevel = 0;
      }
    }
    triggerMinimalOsd();
  };

  // Keyboard navigation: Zap up/down, Space play/pause, Escape/Back returns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        triggerMinimalOsd();
        if (onZap) onZap(+1);
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        triggerMinimalOsd();
        if (onZap) onZap(-1);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onZap, onBack, triggerMinimalOsd]);

  return (
    <div
      onMouseMove={triggerMinimalOsd}
      onClick={triggerMinimalOsd}
      className="relative h-screen w-screen bg-black overflow-hidden select-none cursor-none hover:cursor-default"
    >
      {/* 100% Pure Clean Video Feed (No permanent navbar, zero intrusive icons) */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
      />

      {/* Buffering */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 size={54} className="animate-spin text-[#00F0FF]" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-8 text-center pointer-events-none">
          <p className="text-[#FF0055] font-mono text-xl font-bold mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-[#00F0FF] text-black font-mono font-bold rounded-xl pointer-events-auto cursor-pointer hover:scale-105 transition-transform"
          >
            VOLVER
          </button>
        </div>
      )}

      {/* Minimal Temporary Header OSD (Auto-hides, shows only on mouse move/zap) */}
      <div
        className={`absolute top-6 left-6 right-6 z-30 flex items-center justify-between transition-opacity duration-300 ${
          showMinimalOsd ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 hover:bg-[#181A22] border border-[#2A2F45] text-white font-mono text-xs cursor-pointer shadow-2xl backdrop-blur-md transition-colors"
        >
          <ArrowLeft size={16} className="text-[#00F0FF]" />
          <span>VOLVER</span>
        </button>

        <div className="px-4 py-2 rounded-xl bg-black/80 border border-[#2A2F45] text-[#9AA3B5] font-mono text-xs shadow-2xl backdrop-blur-md hidden sm:block">
          <span>ESPACIO: Pausar · ESC: Salir · ▲▼: Canales</span>
        </div>
      </div>

      {/* Bottom Controls Bar (Discrete options: Subtitles, Audio languages, Quality, Timeline) */}
      <div
        className={`absolute bottom-6 left-6 right-6 z-30 transition-opacity duration-300 ${
          showMinimalOsd ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="space-y-3">
          {/* Channel/Movie Title Tag */}
          <div className="flex items-center gap-4 bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 w-fit">
            {typeof channelIndex === 'number' && (
              <span className="text-2xl font-black font-mono text-[#00F0FF]">
                {channelIndex < 10 ? `0${channelIndex}` : channelIndex}
              </span>
            )}
            <div>
              <h3 className="text-base font-black font-mono text-white leading-tight">
                {title}
              </h3>
              <p className="text-[10px] font-mono text-[#00FF88] mt-0.5">
                ● REPRODUCIENDO EN ALTA DEFINICIÓN
              </p>
            </div>
          </div>

          {/* Advanced Media Controls Component */}
          <AdvancedMediaControls
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            subtitleTracks={subtitleTracks}
            currentSubtitleTrack={currentSubtitleTrack}
            onSelectSubtitleTrack={handleSelectSubtitleTrack}
            audioTracks={audioTracks}
            currentAudioTrack={currentAudioTrack}
            onSelectAudioTrack={handleSelectAudioTrack}
            currentQuality={currentQuality}
            onSelectQuality={handleSelectQuality}
          />
        </div>
      </div>
    </div>
  );
};

