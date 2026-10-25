import React, { useState } from 'react';
import { Subtitles, Volume2, Settings, Play, Pause, Maximize, RotateCcw, Monitor, Check } from 'lucide-react';

interface AdvancedMediaControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  subtitleTracks?: { id: number; name: string; lang: string }[];
  currentSubtitleTrack?: number;
  onSelectSubtitleTrack: (id: number) => void;
  audioTracks?: { id: number; name: string; lang: string }[];
  currentAudioTrack?: number;
  onSelectAudioTrack: (id: number) => void;
  currentQuality?: string;
  onSelectQuality: (q: string) => void;
}

export const AdvancedMediaControls: React.FC<AdvancedMediaControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  subtitleTracks = [],
  currentSubtitleTrack = -1,
  onSelectSubtitleTrack,
  audioTracks = [],
  currentAudioTrack = 0,
  onSelectAudioTrack,
  currentQuality = 'Auto (1080p)',
  onSelectQuality,
}) => {
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs === Infinity) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const defaultSubtitles =
    subtitleTracks.length > 0
      ? subtitleTracks
      : [
          { id: -1, name: 'Desactivados', lang: 'off' },
          { id: 0, name: 'Español (Latino)', lang: 'es' },
          { id: 1, name: 'Español (España)', lang: 'es-es' },
          { id: 2, name: 'Inglés [CC]', lang: 'en' },
        ];

  const defaultAudio =
    audioTracks.length > 0
      ? audioTracks
      : [
          { id: 0, name: 'Español Latino (Dolby 5.1)', lang: 'es' },
          { id: 1, name: 'Audio Original / Inglés (5.1)', lang: 'en' },
        ];

  const qualityOptions = ['Auto (1080p)', '1080p FHD', '720p HD', '480p SD'];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full bg-[#0A0D1A]/95 border border-[#2A2F45] rounded-2xl p-3 shadow-2xl backdrop-blur-xl space-y-2 select-none"
    >
      {/* Timeline Scrub Bar (If duration is known) */}
      {duration > 0 && duration !== Infinity && (
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#9AA3B5] w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-[#181A22] accent-[#00F0FF] rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-[#9AA3B5] w-12">
            {formatTime(duration)}
          </span>
        </div>
      )}

      {/* Discrete Bottom Options Bar */}
      <div className="flex items-center justify-between gap-4 pt-1">
        {/* Play / Pause */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-lg bg-[#181A22] hover:bg-[#2A2F45] text-white transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
        </div>

        {/* Small Bottom Option Menus: Subtitles, Audio, Quality */}
        <div className="flex items-center gap-2 relative">
          {/* SUBTITLES MENU BUTTON */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSubtitlesMenu(!showSubtitlesMenu);
                setShowAudioMenu(false);
                setShowQualityMenu(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                currentSubtitleTrack !== -1 || showSubtitlesMenu
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]'
                  : 'bg-[#181A22] text-[#9AA3B5] border-[#2A2F45] hover:text-white'
              }`}
            >
              <Subtitles size={13} />
              <span>SUBTÍTULOS</span>
            </button>

            {/* Subtitles Dropdown */}
            {showSubtitlesMenu && (
              <div className="absolute bottom-10 right-0 w-52 bg-[#07080D] border border-[#00F0FF]/50 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in space-y-1">
                <div className="text-[10px] font-mono text-[#9AA3B5] px-2 py-1 uppercase font-bold border-b border-[#2A2F45]">
                  Pistas de Subtítulos (CC)
                </div>
                {defaultSubtitles.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      onSelectSubtitleTrack(sub.id);
                      setShowSubtitlesMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                      currentSubtitleTrack === sub.id
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold'
                        : 'text-[#9AA3B5] hover:bg-[#181A22] hover:text-white'
                    }`}
                  >
                    <span>{sub.name}</span>
                    {currentSubtitleTrack === sub.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AUDIO TRACK MENU BUTTON */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAudioMenu(!showAudioMenu);
                setShowSubtitlesMenu(false);
                setShowQualityMenu(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                showAudioMenu
                  ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]'
                  : 'bg-[#181A22] text-[#9AA3B5] border-[#2A2F45] hover:text-white'
              }`}
            >
              <Volume2 size={13} />
              <span>AUDIO</span>
            </button>

            {/* Audio Dropdown */}
            {showAudioMenu && (
              <div className="absolute bottom-10 right-0 w-56 bg-[#07080D] border border-[#00FF88]/50 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in space-y-1">
                <div className="text-[10px] font-mono text-[#9AA3B5] px-2 py-1 uppercase font-bold border-b border-[#2A2F45]">
                  Idioma de Audio
                </div>
                {defaultAudio.map((aud) => (
                  <button
                    key={aud.id}
                    onClick={() => {
                      onSelectAudioTrack(aud.id);
                      setShowAudioMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                      currentAudioTrack === aud.id
                        ? 'bg-[#00FF88]/20 text-[#00FF88] font-bold'
                        : 'text-[#9AA3B5] hover:bg-[#181A22] hover:text-white'
                    }`}
                  >
                    <span>{aud.name}</span>
                    {currentAudioTrack === aud.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* QUALITY SELECTION */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQualityMenu(!showQualityMenu);
                setShowSubtitlesMenu(false);
                setShowAudioMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181A22] border border-[#2A2F45] text-xs font-mono text-[#9AA3B5] hover:text-white transition-colors cursor-pointer"
            >
              <Settings size={13} />
              <span>{currentQuality}</span>
            </button>

            {showQualityMenu && (
              <div className="absolute bottom-10 right-0 w-44 bg-[#07080D] border border-[#2A2F45] rounded-xl p-2 shadow-2xl z-50 animate-in fade-in space-y-1">
                <div className="text-[10px] font-mono text-[#9AA3B5] px-2 py-1 uppercase font-bold border-b border-[#2A2F45]">
                  Calidad de Transmisión
                </div>
                {qualityOptions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      onSelectQuality(q);
                      setShowQualityMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                      currentQuality === q
                        ? 'bg-white/20 text-white font-bold'
                        : 'text-[#9AA3B5] hover:bg-[#181A22] hover:text-white'
                    }`}
                  >
                    <span>{q}</span>
                    {currentQuality === q && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
