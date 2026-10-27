import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Channel } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { cyberSound } from '../components/CyberSound';
import { Maximize2, Search, Tv, Star, Clock, AlertCircle } from 'lucide-react';

interface TiviMateLiveTvViewProps {
  onFullscreenClean: (channel: Channel, index: number) => void;
}

// No synthetic EPG data: until a real guide is connected, schedule fields stay empty.

export const TiviMateLiveTvView: React.FC<TiviMateLiveTvViewProps> = ({ onFullscreenClean }) => {
  const [channels] = useState<Channel[]>(ChannelRepository.channels);
  const [categories] = useState(ChannelRepository.categories);
  const [selectedCat, setSelectedCat] = useState<string>('__all__');
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Playing channel in the continuous PIP window
  const [playingChannel, setPlayingChannel] = useState<Channel>(() => channels[0]);
  const [videoLoading, setVideoLoading] = useState<boolean>(true);

  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const filteredChannels = channels.filter((c) => {
    const matchesCat = selectedCat === '__all__' || c.categoryId === selectedCat;
    const matchesSearch = !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeFocusChannel = filteredChannels[selectedChannelIndex] || filteredChannels[0] || channels[0];
  const epgSchedule: never[] = [];
  const currentProgram = undefined;

  // Initialize and keep playing channel continuous in PIP box
  useEffect(() => {
    if (!playingChannel) return;
    const video = pipVideoRef.current;
    if (!video) return;

    setVideoLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = playingChannel.url;
    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setVideoLoading(false);
        video.muted = false;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      });
      hls.on(Hls.Events.ERROR, () => {
        setVideoLoading(false);
      });
    } else {
      video.src = streamUrl;
      video.muted = false;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
      setVideoLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playingChannel]);

  // Channel switch: Only switches the stream when you choose a different channel!
  const handleSelectChannel = (ch: Channel, idx: number) => {
    cyberSound.click();
    setSelectedChannelIndex(idx);
    if (ch.id !== playingChannel?.id) {
      setPlayingChannel(ch);
    }
  };

  // Keyboard navigation for TV remote (D-Pad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedChannelIndex((prev) => {
          const next = Math.min(prev + 1, filteredChannels.length - 1);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedChannelIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredChannels[selectedChannelIndex]) {
          const ch = filteredChannels[selectedChannelIndex];
          if (ch.id === playingChannel?.id) {
            // Already playing in PIP -> Maximize!
            onFullscreenClean(ch, selectedChannelIndex);
          } else {
            setPlayingChannel(ch);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredChannels, selectedChannelIndex, playingChannel, onFullscreenClean]);

  return (
    <div className="h-full w-full bg-[#05060B] text-[#F2F4F8] flex flex-col overflow-hidden select-none">
      {/* Category Filter Bar (Straight from user's IPTV provider) */}
      <div className="h-12 px-6 border-b border-[#2A2F45] bg-[#0A0D1A] flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {categories.map((c) => {
            const isSelected = selectedCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  cyberSound.click();
                  setSelectedCat(c.id);
                  setSelectedChannelIndex(0);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                  isSelected
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]'
                    : 'bg-[#101424] text-[#9AA3B5] border-transparent hover:text-white'
                }`}
              >
                {c.name} {c.count ? `(${c.count})` : ''}
              </button>
            );
          })}
        </div>

        <div className="relative w-48 sm:w-60 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B5]" />
          <input
            type="text"
            placeholder="Buscar canal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-[#07080D] border border-[#2A2F45] focus:border-[#00F0FF] focus:outline-none rounded-lg text-xs font-mono text-white placeholder-[#9AA3B5]/50"
          />
        </div>
      </div>

      {/* Main TiviMate Layout: Left Channel List & Right EPG / Continuous PIP Screen */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Channels List with Icons (width 320px) */}
        <div className="w-full md:w-[320px] lg:w-[360px] h-full flex flex-col border-r border-[#2A2F45] bg-[#07080D] shrink-0">
          <div className="p-3 border-b border-[#2A2F45] text-xs font-mono text-[#00F0FF] font-bold flex items-center justify-between">
            <span>CANALES ({filteredChannels.length})</span>
            <span className="text-[#9AA3B5]">OK = Sintonizar</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#181A22]/50">
            {filteredChannels.map((ch, idx) => {
              const isFocused = selectedChannelIndex === idx;
              const isPlayingThis = playingChannel?.id === ch.id;

              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch, idx)}
                  onDoubleClick={() => onFullscreenClean(ch, idx)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all border-l-4 ${
                    isFocused
                      ? 'bg-[#101F2E] border-[#00F0FF] text-white shadow-md'
                      : isPlayingThis
                      ? 'bg-[#101424] border-[#00FF88] text-[#00FF88]'
                      : 'border-transparent text-[#9AA3B5] hover:bg-[#101424] hover:text-white'
                  }`}
                >
                  {/* Dial Number */}
                  <span className="text-xs font-mono font-bold w-7 text-right shrink-0 opacity-70">
                    {idx + 1}
                  </span>

                  {/* Channel Logo */}
                  <div className="w-8 h-8 rounded-lg bg-black border border-[#2A2F45] flex items-center justify-center shrink-0 overflow-hidden">
                    {ch.logo ? (
                      <img src={ch.logo} alt="" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <Tv size={15} className="text-[#00F0FF]" />
                    )}
                  </div>

                  {/* Channel Name */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-mono font-bold truncate">
                      {ch.name}
                    </h4>
                    {isPlayingThis && (
                      <span className="text-[10px] font-mono text-[#00FF88] flex items-center gap-1">
                        ● EN VIVO EN RECUAUDRO
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Top PIP Window + Program Info, and Bottom EPG Timeline Grid */}
        <div className="flex-1 h-full flex flex-col bg-[#0A0D1A] overflow-hidden">
          {/* Top Half: EPG Info Card + Continuous Video PIP Box in Corner */}
          <div className="p-4 sm:p-6 border-b border-[#2A2F45] bg-[#07080D]/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0">
            {/* Active Channel Program Synopsis */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#00F0FF] px-2 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30">
                  {activeFocusChannel?.name || 'CANAL'}
                </span>
                {currentProgram && (
                  <span className="text-xs font-mono text-[#9AA3B5] flex items-center gap-1">
                    <Clock size={12} />
                    <span>{currentProgram.start} - {currentProgram.end}</span>
                  </span>
                )}
              </div>

              {currentProgram ? (
                <>
                  <h3 className="text-xl sm:text-2xl font-black font-mono text-white truncate">
                    {currentProgram.title}
                  </h3>
                  <p className="text-xs text-[#9AA3B5] line-clamp-2 max-w-2xl leading-relaxed">
                    {currentProgram.description || ''}
                  </p>
                  {currentProgram.progress !== undefined && (
                    <div className="w-full max-w-md pt-1">
                      <div className="w-full h-1.5 bg-[#181A22] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full shadow-[0_0_8px_#00F0FF]" style={{ width: `${currentProgram.progress}%` }} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[#9AA3B5] line-clamp-2 max-w-2xl leading-relaxed">
                  Información de programación no disponible.
                </p>
              )}
            </div>

            {/* Continuous Live Video PIP Window (Recuadro pequeño en la esquina superior) */}
            <div className="w-full md:w-72 lg:w-80 aspect-video rounded-xl overflow-hidden border-2 border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.25)] relative bg-black shrink-0 group">
              <video
                ref={pipVideoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
              />

              {videoLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-mono text-[#00F0FF]">
                  Sincronizando señal...
                </div>
              )}

              {/* Live Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 border border-[#00FF88]/40 text-[#00FF88] text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                <span>{playingChannel?.name || 'VIVO'}</span>
              </div>

              {/* Maximize Button Overlay on PIP Window */}
              <button
                onClick={() => onFullscreenClean(playingChannel, selectedChannelIndex)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono font-bold text-xs cursor-pointer"
                title="Maximizar a Pantalla Completa"
              >
                <div className="px-3 py-1.5 rounded-lg bg-[#00F0FF] text-[#07080D] flex items-center gap-1.5 shadow-lg">
                  <Maximize2 size={14} />
                  <span>MAXIMIZAR</span>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Half: Full EPG Program Schedule Grid */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between pb-2 text-xs font-mono text-[#9AA3B5]">
              <span className="text-[#00F0FF] font-bold">GUÍA EPG DE PROGRAMACIÓN HORARIA</span>
              <span>Doble clic o Maximizar para ver a pantalla limpia</span>
            </div>

            {/* Timeline slots for current and upcoming shows */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {epgSchedule.length === 0 ? (
                <div className="p-4 rounded-xl border border-[#2A2F45] bg-[#07080D] text-sm font-mono text-[#9AA3B5]">
                  Información de programación no disponible.
                </div>
              ) : (
                epgSchedule.map((slot, i) => (
                  <div key={i} className="p-3.5 rounded-xl border bg-[#07080D] border-[#2A2F45] text-[#9AA3B5]">
                    {/* Render only real guide records supplied by the EPG data layer. */}
                    {JSON.stringify(slot)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
