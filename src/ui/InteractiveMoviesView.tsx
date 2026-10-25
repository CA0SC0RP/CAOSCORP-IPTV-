import React, { useState } from 'react';
import { MovieItem } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { Cyber3DWorld } from '../components/Cyber3DWorld';
import { cyberSound } from '../components/CyberSound';
import { Play, Star, Orbit, LayoutGrid, Search, Film, Calendar, Clock, Sparkles } from 'lucide-react';

interface InteractiveMoviesViewProps {
  onPlayMovie: (title: string, streamUrl: string) => void;
}

export const InteractiveMoviesView: React.FC<InteractiveMoviesViewProps> = ({ onPlayMovie }) => {
  const [selectedCat, setSelectedCat] = useState<string>('mcat_all');
  const [viewMode, setViewMode] = useState<'flow' | '3d'>('flow');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredMovie, setHoveredMovie] = useState<MovieItem | null>(null);

  const categories = ChannelRepository.movieCategories;
  const allMovies = ChannelRepository.moviesIn(selectedCat);

  const filteredMovies = searchQuery.trim()
    ? allMovies.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : allMovies;

  const spotlightMovie = hoveredMovie || filteredMovies[0];

  return (
    <div className="h-full w-full flex flex-col bg-[#05060B] text-[#F2F4F8] relative overflow-hidden select-none">
      {/* Dynamic Ambient Cinematic Backdrop from active/hovered movie */}
      {spotlightMovie && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-700">
          <img
            src={spotlightMovie.backdrop || spotlightMovie.poster || ''}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-110 opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060B] via-[#05060B]/85 to-transparent" />
        </div>
      )}

      {/* Top Filter and Controls Bar */}
      <div className="h-16 px-6 border-b border-[#2A2F45] bg-[#0A0D1A]/85 flex items-center justify-between shrink-0 z-20 backdrop-blur-md gap-4">
        {/* Dynamic IPTV Categories */}
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
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                    : 'bg-[#101424] text-[#9AA3B5] border-[#2A2F45] hover:text-white'
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B5]" />
            <input
              type="text"
              placeholder="Buscar película..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#07080D] border border-[#2A2F45] focus:border-[#00F0FF] focus:outline-none rounded-xl text-xs font-mono text-white placeholder-[#9AA3B5]/50"
            />
          </div>

          <div className="flex items-center p-1 bg-[#07080D] rounded-xl border border-[#2A2F45]">
            <button
              onClick={() => {
                cyberSound.click();
                setViewMode('flow');
              }}
              title="Holographic Kinetic Flow"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'flow' ? 'bg-[#00F0FF] text-[#07080D]' : 'text-[#9AA3B5] hover:text-white'
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
                viewMode === '3d' ? 'bg-[#00F0FF] text-[#07080D]' : 'text-[#9AA3B5] hover:text-white'
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
            items={filteredMovies}
            onSelectItem={(m) => onPlayMovie(m.title, (m as MovieItem).streamUrl)}
            title="MUNDO 3D ORBITAL // PELÍCULAS CAOSCORP"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 sm:p-8 space-y-8">
            {/* Spotlight Banner for active/hovered film */}
            {spotlightMovie && (
              <div className="relative rounded-2xl border border-[#00F0FF]/40 bg-[#0A0D1A]/90 p-6 md:p-8 shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col md:flex-row items-center gap-6 overflow-hidden">
                <div className="w-32 h-44 md:w-36 md:h-52 rounded-xl overflow-hidden border-2 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0 bg-black">
                  <img
                    src={spotlightMovie.poster || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] font-mono text-xs font-bold border border-[#00F0FF]/40">
                      DESTACADA // {spotlightMovie.year || 2025}
                    </span>
                    {spotlightMovie.rating && (
                      <span className="text-xs font-mono text-[#FFD700] font-bold flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        <span>{spotlightMovie.rating}</span>
                      </span>
                    )}
                    {spotlightMovie.genre && (
                      <span className="text-xs font-mono text-[#9AA3B5]">
                        · {spotlightMovie.genre}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black font-mono text-white tracking-wide">
                    {spotlightMovie.title}
                  </h3>

                  <p className="text-sm text-[#9AA3B5] line-clamp-2 max-w-3xl leading-relaxed">
                    {spotlightMovie.synopsis ||
                      'Película transmitida con el motor de decodificación acelerada CAOSCORP en ultra alta definición sin cortes.'}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        cyberSound.warp();
                        onPlayMovie(spotlightMovie.title, spotlightMovie.streamUrl);
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0088FF] hover:from-[#38F9D7] hover:to-[#00F0FF] text-[#07080D] font-mono font-black text-xs tracking-wider shadow-[0_0_20px_#00F0FF] transition-all cursor-pointer hover:scale-105"
                    >
                      <Play size={15} fill="currentColor" />
                      <span>REPRODUCIR AHORA</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Kinetic Floating Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>CATÁLOGO HOLOGRÁFICO ({filteredMovies.length} TÍTULOS)</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => {
                      cyberSound.warp();
                      onPlayMovie(movie.title, movie.streamUrl);
                    }}
                    onMouseEnter={() => {
                      cyberSound.hover();
                      setHoveredMovie(movie);
                    }}
                    className="group relative bg-[#0A0D1A] border border-[#2A2F45] hover:border-[#00F0FF] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] flex flex-col"
                  >
                    {/* Poster */}
                    <div className="aspect-[2/3] w-full bg-[#07080D] relative overflow-hidden">
                      {movie.poster ? (
                        <img
                          src={movie.poster}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#00F0FF]">
                          <Film size={32} />
                        </div>
                      )}

                      {/* Floating Rating Badge */}
                      {movie.rating && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 border border-[#FFD700]/50 text-[#FFD700] text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-md">
                          <Star size={10} fill="currentColor" />
                          <span>{movie.rating}</span>
                        </div>
                      )}

                      {/* Interactive Hover Play Badge */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#00F0FF] text-[#07080D] flex items-center justify-center shadow-[0_0_20px_#00F0FF] scale-75 group-hover:scale-100 transition-transform">
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-t from-[#0A0D1A] to-[#101424]">
                      <div>
                        <h5 className="font-mono font-bold text-xs text-white group-hover:text-[#00F0FF] transition-colors truncate">
                          {movie.title}
                        </h5>
                        <p className="text-[10px] font-mono text-[#9AA3B5] mt-0.5">
                          {movie.year || 2025} {movie.genre ? `· ${movie.genre}` : ''}
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
    </div>
  );
};
