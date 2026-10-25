import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Channel } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { cyberSound } from '../components/CyberSound';
import { Radio, Search, Play, Volume2, VolumeX, Maximize2, Tv, Sparkles, Activity } from 'lucide-react';

interface CosmicLiveTvViewProps {
  onFullscreenPlayer: (channel: Channel, index: number) => void;
  onBack: () => void;
}

export const CosmicLiveTvView: React.FC<CosmicLiveTvViewProps> = ({
  onFullscreenPlayer,
  onBack,
}) => {
  const [channels] = useState<Channel[]>(ChannelRepository.channels);
  const [categories] = useState(ChannelRepository.categories);
  const [selectedCat, setSelectedCat] = useState<string>('__all__');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const filteredChannels = channels.filter((c) => {
    const matchesCat = selectedCat === '__all__' || c.categoryId === selectedCat;
    const matchesSearch = !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeChannel = filteredChannels[currentIndex] || filteredChannels[0] || channels[0];

  // Play preview video when activeChannel changes
  useEffect(() => {
    if (!activeChannel) return;
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = activeChannel.url;
    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.muted = isMuted;
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, () => {
        setLoading(false);
      });
    } else {
      video.src = streamUrl;
      video.muted = isMuted;
      video.play().catch(() => {});
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, isMuted]);

  return (
    <div className="h-full w-full bg-[#05060B] text-[#F2F4F8] flex flex-col overflow-hidden relative">
      {/* Top Cosmic Header */}
      <div className="h-16 px-6 border-b border-[#2A2F45] bg-[#0A0D1A]/90 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              cyberSound.click();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181A22] border border-[#2A2F45] text-xs font-mono text-[#00FF88] hover:border-[#00FF88] transition-colors cursor-pointer"
          >
            <span>◄ VOLVER AL LAUNCHER</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] shadow-[0_0_10px_#00FF88] animate-pulse" />
            <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              PÚLSAR CUÁNTICO // SEÑALES EN VIVO
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B5]" />
          <input
            type="text"
            placeholder="Buscar canal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#07080D] border border-[#2A2F45] focus:border-[#00FF88] focus:outline-none rounded-lg text-xs font-mono text-white placeholder-[#9AA3B5]/50"
          />
        </div>
      </div>

      {/* Main 2-Column Space: Channel Browser & Live Monitor HUD */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
        {/* Left: Categories & Channel List */}
        <div className="w-full lg:w-[420px] h-full flex flex-col bg-[#0A0D1A]/90 border border-[#2A2F45] rounded-2xl overflow-hidden shrink-0 shadow-2xl">
          {/* Categories Horizontal Pills */}
          <div className="p-3 border-b border-[#2A2F45] flex items-center gap-1.5 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  cyberSound.click();
                  setSelectedCat(c.id);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedCat === c.id
                    ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]'
                    : 'bg-[#101424] text-[#9AA3B5] border-transparent hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Channels Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredChannels.map((ch, idx) => {
              const isSelected = activeChannel?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    cyberSound.click();
                    setCurrentIndex(idx);
                  }}
                  onDoubleClick={() => onFullscreenPlayer(ch, idx)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#101F18] border-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.25)]'
                      : 'bg-[#101424] border-transparent hover:bg-[#181A22]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-black border border-[#2A2F45] flex items-center justify-center shrink-0 overflow-hidden">
                    {ch.logo ? (
                      <img src={ch.logo} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Tv size={16} className="text-[#00FF88]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-mono font-bold text-white truncate">
                      {ch.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[#00FF88]">
                      DIAL 0{idx + 1} · SEÑAL DIGITAL ESTABLE
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFullscreenPlayer(ch, idx);
                    }}
                    title="Pantalla Completa"
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-[#00FF88] hover:text-black text-[#9AA3B5] transition-colors"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Telemetry Screen & Video Preview */}
        <div className="flex-1 h-full flex flex-col bg-[#0A0D1A]/90 border border-[#2A2F45] rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Top Video Preview Header */}
          <div className="p-4 border-b border-[#2A2F45] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#00FF88] animate-pulse" />
              <span className="text-xs font-mono font-bold text-white uppercase">
                MONITOR CUÁNTICO // {activeChannel?.name || 'CANAL'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-[#181A22] border border-[#2A2F45] text-white hover:text-[#00FF88] transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <button
                onClick={() => {
                  if (activeChannel) {
                    onFullscreenPlayer(activeChannel, currentIndex);
                  }
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#00FF88] text-[#07080D] font-mono font-bold text-xs shadow-[0_0_15px_#00FF88] transition-all cursor-pointer hover:brightness-110"
              >
                <Maximize2 size={14} />
                <span>PANTALLA COMPLETA</span>
              </button>
            </div>
          </div>

          {/* Video Player Display */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
            />

            {/* Futuristic Scanlines Filter */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40" />

            {/* Channel Info Overlay Banner */}
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#0A0D1A]/90 border border-[#00FF88]/40 backdrop-blur-md flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black font-mono text-white">
                  {activeChannel?.name}
                </h3>
                <p className="text-xs font-mono text-[#00FF88]">
                  TRANSMISIÓN EN TIEMPO REAL · LATENCIA ULTRA BAJA
                </p>
              </div>

              <button
                onClick={() => onFullscreenPlayer(activeChannel, currentIndex)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00FF88] text-[#07080D] font-mono font-black text-xs cursor-pointer shadow-[0_0_15px_#00FF88]"
              >
                <Play size={14} fill="currentColor" />
                <span>EXPANDIR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
