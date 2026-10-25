import React, { useState } from 'react';
import { Cyber3DWorld } from '../components/Cyber3DWorld';
import { SeriesItem } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { cyberSound } from '../components/CyberSound';
import { LayoutGrid, Orbit, Search, Play, Star, Clapperboard, X, Tv } from 'lucide-react';

interface SeriesViewProps {
  onPlaySeries: (title: string, streamUrl: string) => void;
}

export const SeriesView: React.FC<SeriesViewProps> = ({ onPlaySeries }) => {
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');
  const [selectedCategory, setSelectedCategory] = useState<string>('scat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSeries, setActiveSeries] = useState<SeriesItem | null>(null);

  const categories = ChannelRepository.seriesCategories;
  const allSeries = ChannelRepository.seriesIn(selectedCategory);

  const filteredSeries = searchQuery.trim()
    ? allSeries.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : allSeries;

  const handleSelectSeries = (item: any) => {
    cyberSound.click();
    setActiveSeries(item);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#07080D] text-[#F2F4F8] relative overflow-hidden">
      {/* Top Filter Bar */}
      <div className="h-16 px-6 border-b border-[#2A2F45] bg-[#101424]/80 flex items-center justify-between shrink-0 z-30 backdrop-blur-md gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  cyberSound.click();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF0055]/15 text-[#FF0055] border-[#FF0055] shadow-[0_0_12px_rgba(255,0,85,0.3)]'
                    : 'bg-[#181A22] text-[#9AA3B5] border-[#2A2F45] hover:text-white'
                }`}
              >
                {cat.name} {cat.count ? `(${cat.count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Search & Mode Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-48 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B5]" />
            <input
              type="text"
              placeholder="Buscar serie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#07080D] border border-[#2A2F45] focus:border-[#FF0055] focus:outline-none rounded-lg text-xs font-mono text-white placeholder-[#9AA3B5]/50"
            />
          </div>

          <div className="flex items-center p-1 bg-[#07080D] rounded-lg border border-[#2A2F45]">
            <button
              onClick={() => {
                cyberSound.click();
                setViewMode('3d');
              }}
              title="Mundo 3D Orbital"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === '3d' ? 'bg-[#FF0055] text-white' : 'text-[#9AA3B5] hover:text-white'
              }`}
            >
              <Orbit size={16} />
            </button>
            <button
              onClick={() => {
                cyberSound.click();
                setViewMode('grid');
              }}
              title="Cuadrícula Cyberpunk"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#FF0055] text-white' : 'text-[#9AA3B5] hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === '3d' ? (
          <Cyber3DWorld
            items={filteredSeries}
            onSelectItem={handleSelectSeries}
            title="CYBER DECK 3D // SERIES & TEMPORADAS"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 sm:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {filteredSeries.map((series) => (
                <div
                  key={series.id}
                  onClick={() => handleSelectSeries(series)}
                  onMouseEnter={() => cyberSound.hover()}
                  className="group relative bg-[#101424] border border-[#2A2F45] hover:border-[#FF0055] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,85,0.3)] hover:-translate-y-1.5 flex flex-col"
                >
                  <div className="aspect-[2/3] w-full bg-[#07080D] relative overflow-hidden">
                    {series.poster ? (
                      <img
                        src={series.poster}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#FF0055]">
                        <Clapperboard size={32} />
                      </div>
                    )}
                    {series.rating && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 border border-[#FFD700]/40 text-[#FFD700] text-[11px] font-mono font-bold flex items-center gap-1 backdrop-blur-sm">
                        <Star size={11} fill="currentColor" />
                        <span>{series.rating}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#FF0055] text-white flex items-center justify-center shadow-[0_0_15px_#FF0055]">
                        <Play size={22} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#F2F4F8] group-hover:text-[#FF0055] transition-colors truncate">
                        {series.title}
                      </h4>
                      <p className="text-[11px] font-mono text-[#9AA3B5] mt-0.5">
                        {series.year || 2025} {series.seasons ? `· ${series.seasons} Temporadas` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Series Modal / Episode Picker */}
      {activeSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#101424] border-2 border-[#FF0055] rounded-2xl shadow-[0_0_40px_rgba(255,0,85,0.35)] overflow-hidden">
            <button
              onClick={() => setActiveSeries(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-[#FF0055] text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="relative h-60 w-full bg-[#07080D] overflow-hidden">
              <img
                src={activeSeries.backdrop || activeSeries.poster || ''}
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101424] via-[#101424]/60 to-transparent" />

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div className="w-20 h-28 rounded-lg overflow-hidden border-2 border-[#FF0055] shadow-lg shrink-0 bg-[#07080D]">
                  <img
                    src={activeSeries.poster || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#FF0055]/20 text-[#FF0055] font-mono text-xs font-bold border border-[#FF0055]/40">
                      {activeSeries.year || 2025}
                    </span>
                    {activeSeries.rating && (
                      <span className="text-xs font-mono text-[#FFD700] font-bold">
                        ★ {activeSeries.rating}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black font-mono text-white leading-tight">
                    {activeSeries.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 text-xs font-mono text-[#9AA3B5]">
                {activeSeries.genre && <span>Género: <strong className="text-white">{activeSeries.genre}</strong></span>}
                {activeSeries.seasons && <span>Temporadas: <strong className="text-white">{activeSeries.seasons}</strong></span>}
                {activeSeries.episodes && <span>Capítulos: <strong className="text-white">{activeSeries.episodes}</strong></span>}
              </div>

              <p className="text-sm text-[#9AA3B5] leading-relaxed">
                {activeSeries.plot ||
                  'Serie de televisión en alta resolución con temporadas y episodios listos para streaming en directo.'}
              </p>

              {/* Sample Episode List */}
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-mono font-bold text-[#00F0FF] uppercase">
                  TEMPORADA 1 // EPISODIOS DESTACADOS
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((ep) => (
                    <button
                      key={ep}
                      onClick={() => {
                        cyberSound.warp();
                        onPlaySeries(
                          `${activeSeries.title} - T1:E0${ep}`,
                          activeSeries.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
                        );
                        setActiveSeries(null);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#07080D] hover:bg-[#FF0055]/20 border border-[#2A2F45] hover:border-[#FF0055] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Play size={13} className="text-[#FF0055]" fill="currentColor" />
                        <span className="text-xs font-mono font-bold text-white">
                          Episodio {ep}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#9AA3B5]">48 min · HD</span>
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
