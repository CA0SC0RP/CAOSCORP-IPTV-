import React, { useState } from 'react';
import { Cyber3DWorld } from '../components/Cyber3DWorld';
import { MovieItem } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { cyberSound } from '../components/CyberSound';
import { LayoutGrid, Orbit, Search, Play, Star, Calendar, Clock, Film, X } from 'lucide-react';

interface MoviesViewProps {
  onPlayMovie: (title: string, streamUrl: string) => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({ onPlayMovie }) => {
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');
  const [selectedCategory, setSelectedCategory] = useState<string>('mcat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalItem, setActiveModalItem] = useState<MovieItem | null>(null);

  const categories = ChannelRepository.movieCategories;
  const allMovies = ChannelRepository.moviesIn(selectedCategory);

  const filteredMovies = searchQuery.trim()
    ? allMovies.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : allMovies;

  const handleSelectMovie = (item: any) => {
    cyberSound.click();
    setActiveModalItem(item);
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
                    ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
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
              placeholder="Buscar película..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#07080D] border border-[#2A2F45] focus:border-[#00F0FF] focus:outline-none rounded-lg text-xs font-mono text-white placeholder-[#9AA3B5]/50"
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
                viewMode === '3d' ? 'bg-[#00F0FF] text-[#07080D]' : 'text-[#9AA3B5] hover:text-white'
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
                viewMode === 'grid' ? 'bg-[#00F0FF] text-[#07080D]' : 'text-[#9AA3B5] hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: 3D World or Grid */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === '3d' ? (
          <Cyber3DWorld
            items={filteredMovies}
            onSelectItem={handleSelectMovie}
            title="MUNDO 3D DE PELÍCULAS // ORBITAL WHEEL"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 sm:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleSelectMovie(movie)}
                  onMouseEnter={() => cyberSound.hover()}
                  className="group relative bg-[#101424] border border-[#2A2F45] hover:border-[#00F0FF] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:-translate-y-1.5 flex flex-col"
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] w-full bg-[#07080D] relative overflow-hidden">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#00F0FF]">
                        <Film size={32} />
                      </div>
                    )}
                    {/* Rating Badge */}
                    {movie.rating && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 border border-[#FFD700]/40 text-[#FFD700] text-[11px] font-mono font-bold flex items-center gap-1 backdrop-blur-sm">
                        <Star size={11} fill="currentColor" />
                        <span>{movie.rating}</span>
                      </div>
                    )}
                    {/* Hover Play Icon Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#00F0FF] text-[#07080D] flex items-center justify-center shadow-[0_0_15px_#00F0FF]">
                        <Play size={22} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title & info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#F2F4F8] group-hover:text-[#00F0FF] transition-colors truncate">
                        {movie.title}
                      </h4>
                      <p className="text-[11px] font-mono text-[#9AA3B5] mt-0.5">
                        {movie.year || 2025} {movie.genre ? `· ${movie.genre}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Movie Modal / Drawer */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#101424] border-2 border-[#00F0FF] rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.35)] overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-[#FF0055] text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Backdrop Banner if available */}
            <div className="relative h-60 w-full bg-[#07080D] overflow-hidden">
              <img
                src={activeModalItem.backdrop || activeModalItem.poster || ''}
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101424] via-[#101424]/60 to-transparent" />

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div className="w-20 h-28 rounded-lg overflow-hidden border-2 border-[#00F0FF] shadow-lg shrink-0 bg-[#07080D]">
                  <img
                    src={activeModalItem.poster || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] font-mono text-xs font-bold border border-[#00F0FF]/40">
                      {activeModalItem.year || 2025}
                    </span>
                    {activeModalItem.rating && (
                      <span className="text-xs font-mono text-[#FFD700] font-bold">
                        ★ {activeModalItem.rating}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black font-mono text-white leading-tight">
                    {activeModalItem.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Details Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 text-xs font-mono text-[#9AA3B5]">
                {activeModalItem.genre && <span>Género: <strong className="text-white">{activeModalItem.genre}</strong></span>}
                {activeModalItem.duration && <span>Duración: <strong className="text-white">{activeModalItem.duration}</strong></span>}
                <span>Transmisión: <strong className="text-[#00F0FF]">STREAM HLS 4K</strong></span>
              </div>

              <p className="text-sm text-[#9AA3B5] leading-relaxed">
                {activeModalItem.synopsis ||
                  'Película transmitida directamente a través del motor de streaming CAOS CORP en ultra alta resolución.'}
              </p>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-4 py-2.5 rounded-lg bg-[#181A22] text-[#9AA3B5] hover:text-white font-mono text-xs transition-colors cursor-pointer"
                >
                  CERRAR
                </button>

                <button
                  onClick={() => {
                    cyberSound.warp();
                    onPlayMovie(activeModalItem.title, activeModalItem.streamUrl);
                    setActiveModalItem(null);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00F0FF] to-[#0066FF] text-[#07080D] font-mono font-black text-sm tracking-wide shadow-[0_0_20px_#00F0FF] transition-all cursor-pointer hover:brightness-110"
                >
                  <Play size={16} fill="currentColor" />
                  <span>REPRODUCIR AHORA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
