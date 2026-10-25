import React, { useState } from 'react';
import { SeriesItem } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { Cyber3DWorld } from '../components/Cyber3DWorld';
import { cyberSound } from '../components/CyberSound';
import { Play, Star, Orbit, LayoutGrid, Search, Clapperboard, X, Sparkles, Layers } from 'lucide-react';

interface InteractiveSeriesViewProps {
  onPlaySeries: (title: string, streamUrl: string) => void;
}

export const InteractiveSeriesView: React.FC<InteractiveSeriesViewProps> = ({ onPlaySeries }) => {
  const [selectedCat, setSelectedCat] = useState<string>('scat_all');
  const [viewMode, setViewMode] = useState<'flow' | '3d'>('flow');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSeries, setActiveSeries] = useState<SeriesItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const categories = ChannelRepository.seriesCategories;
  const allSeries = ChannelRepository.seriesIn(selectedCat);

  const filteredSeries = searchQuery.trim()
    ? allSeries.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : allSeries;

  return (
    <div className="h-full w-full flex flex-col bg-[#08020E] text-[#F2F4F8] relative overflow-hidden select-none">
      {/* Distinct Purple / Magenta Cosmic Nebula Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,0,85,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(153,0,255,0.2),transparent_50%)] pointer-events-none" />

      {/* Top Filter Bar */}
      <div className="h-16 px-6 border-b border-[#3D144A] bg-[#120520]/85 flex items-center justify-between shrink-0 z-20 backdrop-blur-md gap-4">
        {/* Dynamic Categories */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {categories.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  cyberSound.click();
                  setSelectedCat(cat.id);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055] shadow-[0_0_15px_rgba(255,0,85,0.35)]'
                    : 'bg-[#1D0833] text-[#C0A5D6] border-[#3D144A] hover:text-white'
                }`}
              >
                {cat.name} {cat.count ? `(${cat.count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Search and View Mode Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-48 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C0A5D6]" />
            <input
              type="text"
              placeholder="Buscar serie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#08020E] border border-[#3D144A] focus:border-[#FF0055] focus:outline-none rounded-xl text-xs font-mono text-white placeholder-[#C0A5D6]/50"
            />
          </div>

          <div className="flex items-center p-1 bg-[#08020E] rounded-xl border border-[#3D144A]">
            <button
              onClick={() => {
                cyberSound.click();
                setViewMode('flow');
              }}
              title="Galería Holográfica"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'flow' ? 'bg-[#FF0055] text-white' : 'text-[#C0A5D6] hover:text-white'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => {
                cyberSound.click();
                setViewMode('3d');
              }}
              title="Mundo 3D Orbital"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === '3d' ? 'bg-[#FF0055] text-white' : 'text-[#C0A5D6] hover:text-white'
              }`}
            >
              <Orbit size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden z-10">
        {viewMode === '3d' ? (
          <Cyber3DWorld
            items={filteredSeries}
            onSelectItem={(s) => setActiveSeries(s as SeriesItem)}
            title="ESTACIÓN ORBITAL 3D // SERIES & TEMPORADAS"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-[#FF0055] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>SERIES & UNIVERSOS COMPLETOS ({filteredSeries.length} SERIES)</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {filteredSeries.map((series) => (
                  <div
                    key={series.id}
                    onClick={() => {
                      cyberSound.click();
                      setActiveSeries(series);
                    }}
                    onMouseEnter={() => cyberSound.hover()}
                    className="group relative bg-[#150726] border border-[#3D144A] hover:border-[#FF0055] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(255,0,85,0.4)] flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full bg-[#08020E] relative overflow-hidden">
                      {series.poster ? (
                        <img
                          src={series.poster}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#FF0055]">
                          <Clapperboard size={32} />
                        </div>
                      )}

                      {series.rating && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 border border-[#FFD700]/50 text-[#FFD700] text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-md">
                          <Star size={10} fill="currentColor" />
                          <span>{series.rating}</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#FF0055] text-white flex items-center justify-center shadow-[0_0_20px_#FF0055] scale-75 group-hover:scale-100 transition-transform">
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-t from-[#150726] to-[#250C42]">
                      <div>
                        <h5 className="font-mono font-bold text-xs text-white group-hover:text-[#FF0055] transition-colors truncate">
                          {series.title}
                        </h5>
                        <p className="text-[10px] font-mono text-[#C0A5D6] mt-0.5">
                          {series.year || 2025} {series.seasons ? `· ${series.seasons} Temporadas` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Episode Picker Deck Modal */}
      {activeSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#150726] border-2 border-[#FF0055] rounded-3xl shadow-[0_0_50px_rgba(255,0,85,0.4)] overflow-hidden">
            <button
              onClick={() => setActiveSeries(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-[#FF0055] text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Series Banner */}
            <div className="relative h-56 w-full bg-[#08020E] overflow-hidden">
              <img
                src={activeSeries.backdrop || activeSeries.poster || ''}
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#150726] via-[#150726]/60 to-transparent" />

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div className="w-20 h-28 rounded-xl overflow-hidden border-2 border-[#FF0055] shadow-lg shrink-0 bg-black">
                  <img
                    src={activeSeries.poster || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded bg-[#FF0055]/20 text-[#FF0055] font-mono text-xs font-bold border border-[#FF0055]/40">
                      {activeSeries.year || 2025}
                    </span>
                    {activeSeries.rating && (
                      <span className="text-xs font-mono text-[#FFD700] font-bold flex items-center gap-1">
                        <Star size={11} fill="currentColor" />
                        <span>{activeSeries.rating}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black font-mono text-white leading-tight">
                    {activeSeries.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Episode Deck Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#C0A5D6] leading-relaxed line-clamp-2">
                {activeSeries.plot ||
                  'Serie completa lista para transmitir en alta definición sin interrupciones con CAOSCORP.'}
              </p>

              {/* Seasons Selector */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#3D144A]">
                <Layers size={14} className="text-[#FF0055]" />
                <span className="text-xs font-mono font-bold text-white uppercase">TEMPORADAS:</span>
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      cyberSound.click();
                      setSelectedSeason(s);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-colors ${
                      selectedSeason === s
                        ? 'bg-[#FF0055] text-white border-[#FF0055]'
                        : 'bg-[#08020E] text-[#C0A5D6] border-[#3D144A] hover:text-white'
                    }`}
                  >
                    T{s}
                  </button>
                ))}
              </div>

              {/* Episode Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {[1, 2, 3, 4, 5, 6].map((ep) => (
                    <button
                      key={ep}
                      onClick={() => {
                        cyberSound.warp();
                        onPlaySeries(
                          `${activeSeries.title} - T${selectedSeason}:E0${ep}`,
                          activeSeries.streamUrl ||
                            'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8'
                        );
                        setActiveSeries(null);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#08020E] hover:bg-[#FF0055]/20 border border-[#3D144A] hover:border-[#FF0055] text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#FF0055]/15 flex items-center justify-center text-[#FF0055] group-hover:bg-[#FF0055] group-hover:text-white transition-colors">
                          <Play size={12} fill="currentColor" />
                        </div>
                        <span className="text-xs font-mono font-bold text-white">
                          Episodio {ep}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#C0A5D6]">45 min · HD</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
