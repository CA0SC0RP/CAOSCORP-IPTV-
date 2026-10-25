import React, { useState, useMemo, useRef } from 'react';
import {
  Play,
  Info,
  Folder,
  Calendar,
  Sparkles,
  Tv,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Clapperboard,
  X,
  Gauge,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MovieItem, SeriesItem, Category } from '../data/models';
import { cyberSound } from './CyberSound';

interface PhotoClotheslineViewProps {
  type: 'movies' | 'series';
  items: (MovieItem | SeriesItem)[];
  categories: Category[];
  onPlayItem: (title: string, streamUrl: string, item?: any) => void;
}

type SmartFilter = 'recent' | 'added' | 'tv' | 'all' | 'folder';
type DriftSpeed = 'slow' | 'normal' | 'paused';

export const PhotoClotheslineView: React.FC<PhotoClotheslineViewProps> = ({
  type,
  items,
  categories,
  onPlayItem,
}) => {
  // Navigation & Filtering
  const [smartFilter, setSmartFilter] = useState<SmartFilter>('recent');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState<boolean>(false);

  // Clothesline presentation controls
  const [lineCount, setLineCount] = useState<3 | 4>(3);
  const [driftSpeed, setDriftSpeed] = useState<DriftSpeed>('slow');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Lightbox / Diapositiva close-up modal
  const [activeItem, setActiveItem] = useState<MovieItem | SeriesItem | null>(null);

  // Manual scroll offsets for each line when using nudge arrows
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter items based on smart filters and search query
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        (item.genre && item.genre.toLowerCase().includes(q)) ||
        (item.originalFolder && item.originalFolder.toLowerCase().includes(q))
      );
    }

    // Specific folder filter
    if (selectedFolderId && selectedFolderId !== '__all__') {
      result = result.filter(
        (item) => item.categoryId === selectedFolderId || item.originalFolder === selectedFolderId
      );
    } else {
      // Smart filter tabs
      switch (smartFilter) {
        case 'recent':
          // Sort by year descending (2026, 2025, 2024...)
          result.sort((a, b) => {
            const yA = parseInt(String(a.year || '0'), 10) || 0;
            const yB = parseInt(String(b.year || '0'), 10) || 0;
            if (yB !== yA) return yB - yA;
            return (b.rating || 0) - (a.rating || 0);
          });
          break;
        case 'added':
          // Sort by newest addition / timestamp
          result.sort((a, b) => {
            const addA = Number(a.added || 0);
            const addB = Number(b.added || 0);
            if (addB !== addA) return addB - addA;
            const yA = parseInt(String(a.year || '0'), 10) || 0;
            const yB = parseInt(String(b.year || '0'), 10) || 0;
            return yB - yA;
          });
          break;
        case 'tv':
          // Items tagged with isOnTv or from TV/featured category, or top rated
          result = result.filter(
            (item) => item.isOnTv || (item.rating && item.rating >= 9.0) || item.categoryId.includes('tv')
          );
          if (result.length === 0) {
            result = [...items].slice(0, 10);
          }
          break;
        case 'all':
        default:
          break;
      }
    }

    return result;
  }, [items, smartFilter, selectedFolderId, searchQuery]);

  // Distribute items across the 3 or 4 clothesline rows
  const clotheslineRows = useMemo(() => {
    const rows: (MovieItem | SeriesItem)[][] = Array.from({ length: lineCount }, () => []);

    if (filteredItems.length === 0) {
      return rows;
    }

    filteredItems.forEach((item, index) => {
      rows[index % lineCount].push(item);
    });

    // Make sure each row has enough repeated items to create a seamless infinite clothesline
    return rows.map((row) => {
      if (row.length === 0) return [];
      let expanded = [...row];
      while (expanded.length < 12) {
        expanded = [...expanded, ...row];
      }
      // Duplicate once more for continuous seamless wrap
      return [...expanded, ...expanded];
    });
  }, [filteredItems, lineCount]);

  // Manual nudge handler for a specific row
  const handleNudgeRow = (rowIndex: number, direction: 'left' | 'right') => {
    cyberSound.click();
    const el = rowRefs.current[rowIndex];
    if (el) {
      const shift = direction === 'left' ? -350 : 350;
      el.scrollBy({ left: shift, behavior: 'smooth' });
    }
  };

  // Natural tilt for photographs hanging on a string
  const getTiltClass = (index: number) => {
    const tilts = [
      '-rotate-[2.2deg]',
      'rotate-[1.8deg]',
      '-rotate-[1.2deg]',
      'rotate-[2.5deg]',
      '-rotate-[1.9deg]',
      'rotate-[1.1deg]',
      '-rotate-[2.8deg]',
      'rotate-[2.0deg]',
    ];
    return tilts[index % tilts.length];
  };

  const getAnimationClass = (rowIndex: number) => {
    if (driftSpeed === 'paused') return 'pause-animation';

    // Line 0: Right, Line 1: Left, Line 2: Right, Line 3: Left
    const isEven = rowIndex % 2 === 0;

    if (driftSpeed === 'slow') {
      return isEven ? 'animate-drift-right-slow' : 'animate-drift-left-slow';
    }
    return isEven ? 'animate-drift-right' : 'animate-drift-left';
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070913] select-none overflow-hidden">
      {/* Background Darkroom / Studio Ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,240,255,0.12),rgba(4,6,14,0.98))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,0,119,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* TOP CONTROLS & SMART FOLDER BAR */}
      <div className="relative z-30 shrink-0 px-6 py-3.5 bg-[#080C1B]/90 border-b border-[#1A233D] backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: Smart Filter Tabs (Más Recientes, Recién Agregadas, En TV, Carpetas) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-[#0E152E] rounded-xl border border-[#1E294B] shadow-inner">
            <button
              onClick={() => {
                cyberSound.click();
                setSmartFilter('recent');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
                smartFilter === 'recent' && !selectedFolderId
                  ? 'bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'text-[#8EA0BE] hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles size={14} />
              <span>MÁS RECIENTES</span>
            </button>

            <button
              onClick={() => {
                cyberSound.click();
                setSmartFilter('added');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
                smartFilter === 'added' && !selectedFolderId
                  ? 'bg-gradient-to-r from-[#FF0077] to-[#FF0055] text-white shadow-[0_0_15px_rgba(255,0,119,0.4)]'
                  : 'text-[#8EA0BE] hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar size={14} />
              <span>RECIÉN AGREGADAS</span>
            </button>

            <button
              onClick={() => {
                cyberSound.click();
                setSmartFilter('tv');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
                smartFilter === 'tv' && !selectedFolderId
                  ? 'bg-gradient-to-r from-[#00FF88] to-[#00CC66] text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                  : 'text-[#8EA0BE] hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv size={14} />
              <span>EN TELEVISIÓN</span>
            </button>
          </div>

          {/* Folder Categories Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                cyberSound.click();
                setIsFolderDropdownOpen(!isFolderDropdownOpen);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer border ${
                selectedFolderId
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'bg-[#0E152E] border-[#1E294B] text-[#8EA0BE] hover:text-white hover:border-[#00F0FF]/40'
              }`}
            >
              <Folder size={14} className={selectedFolderId ? 'text-[#00F0FF]' : 'text-[#8EA0BE]'} />
              <span>
                {selectedFolderId
                  ? categories.find((c) => c.id === selectedFolderId)?.name || 'Carpeta Seleccionada'
                  : 'CARPETAS DEL SERVIDOR'}
              </span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                {categories.length}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isFolderDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFolderDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto z-50 bg-[#0C1226] border border-[#253359] rounded-2xl p-2 shadow-2xl backdrop-blur-2xl">
                  <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#6B7C9E] border-b border-[#1A2440] flex items-center justify-between">
                    <span>SELECCIONAR CARPETA IPTV</span>
                    <Folder size={12} />
                  </div>
                  <button
                    onClick={() => {
                      cyberSound.click();
                      setSelectedFolderId(null);
                      setSmartFilter('all');
                      setIsFolderDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-white hover:bg-[#151E3D] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>📁 Todas las Carpetas</span>
                    <span className="text-[10px] text-[#00F0FF] font-mono">{items.length} títulos</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        cyberSound.click();
                        setSelectedFolderId(cat.id);
                        setSmartFilter('folder');
                        setIsFolderDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                        selectedFolderId === cat.id
                          ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-black border border-[#00F0FF]/40'
                          : 'text-[#C4D0E5] hover:bg-[#151E3D] hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">📁 {cat.name}</span>
                      {cat.count !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#8EA0BE]">
                          {cat.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Active Folder Tag Clearer */}
          {selectedFolderId && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-mono">
              <span>{categories.find((c) => c.id === selectedFolderId)?.name || 'Carpeta'}</span>
              <button
                onClick={() => {
                  cyberSound.click();
                  setSelectedFolderId(null);
                  setSmartFilter('recent');
                }}
                className="hover:text-white ml-1 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Search, Lines Count Toggle (3 / 4) and Speed Selector */}
        <div className="flex items-center gap-3">
          {/* Live Search */}
          <div className="relative w-44 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar ${type === 'movies' ? 'película' : 'serie'}...`}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0E152E] border border-[#1E294B] focus:border-[#00F0FF] rounded-xl text-xs font-mono text-white placeholder-[#64748B] focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Toggle 3 or 4 Lines */}
          <div className="hidden md:flex items-center gap-1 bg-[#0E152E] p-1 rounded-xl border border-[#1E294B]">
            <button
              onClick={() => {
                cyberSound.click();
                setLineCount(3);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                lineCount === 3
                  ? 'bg-[#1E294B] text-[#00F0FF] border border-[#00F0FF]/40'
                  : 'text-[#64748B] hover:text-[#C4D0E5]'
              }`}
              title="Mostrar 3 tendederos de fotografías"
            >
              3 LÍNEAS
            </button>
            <button
              onClick={() => {
                cyberSound.click();
                setLineCount(4);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                lineCount === 4
                  ? 'bg-[#1E294B] text-[#00F0FF] border border-[#00F0FF]/40'
                  : 'text-[#64748B] hover:text-[#C4D0E5]'
              }`}
              title="Mostrar 4 tendederos de fotografías"
            >
              4 LÍNEAS
            </button>
          </div>

          {/* Speed Toggle (Lento / Normal / Pausa) */}
          <div className="flex items-center gap-1 bg-[#0E152E] p-1 rounded-xl border border-[#1E294B]">
            <button
              onClick={() => {
                cyberSound.click();
                setDriftSpeed((s) => (s === 'slow' ? 'normal' : s === 'normal' ? 'paused' : 'slow'));
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-[#8EA0BE] hover:text-white cursor-pointer"
              title="Velocidad del movimiento del tendedero"
            >
              <Gauge size={13} className={driftSpeed === 'paused' ? 'text-[#FF0055]' : 'text-[#00FF88]'} />
              <span>
                {driftSpeed === 'slow' && 'LENTO'}
                {driftSpeed === 'normal' && 'NORMAL'}
                {driftSpeed === 'paused' && 'PAUSADO'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* CLOTHESLINE CANVAS: 3 OR 4 HORIZONTAL HANGING WIRES */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-around py-2">
        {filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#6B7C9E]">
            <Film size={48} className="text-[#1E294B] mb-3 animate-pulse" />
            <p className="font-mono text-sm uppercase tracking-wider text-white">
              No hay fotos en este tendedero
            </p>
            <p className="font-mono text-xs text-[#8EA0BE] mt-1">
              Prueba cambiando la carpeta o limpiando el filtro de búsqueda
            </p>
            <button
              onClick={() => {
                setSelectedFolderId(null);
                setSmartFilter('recent');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold cursor-pointer"
            >
              VER TODAS LAS FOTOS
            </button>
          </div>
        ) : (
          clotheslineRows.map((rowItems, rowIndex) => {
            const isRowHovered = hoveredRow === rowIndex;
            const isDriftingRight = rowIndex % 2 === 0;

            return (
              <div
                key={`row_${rowIndex}`}
                className="relative w-full flex flex-col justify-center my-auto group/row"
                onMouseEnter={() => setHoveredRow(rowIndex)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Authentic Stretched Wire / Cord Line */}
                <div className="relative w-full h-[3px] bg-gradient-to-r from-[#202945] via-[#4F6399] to-[#202945] shadow-[0_1px_3px_rgba(0,0,0,0.8),0_0_8px_rgba(0,240,255,0.15)] z-10 flex items-center justify-between">
                  {/* Left & Right Metallic Tension Pegs */}
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#1E2742] to-[#7182AB] border border-[#A0AEC0] shadow-md -ml-2" />
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#1E2742] to-[#7182AB] border border-[#A0AEC0] shadow-md -mr-2" />
                </div>

                {/* Manual Nudge Buttons for Each Row */}
                <button
                  onClick={() => handleNudgeRow(rowIndex, 'left')}
                  className="absolute left-2 z-30 w-10 h-10 rounded-full bg-[#050711]/90 border border-[#232F52] text-white opacity-0 group-hover/row:opacity-100 hover:scale-110 hover:border-[#00F0FF] hover:text-[#00F0FF] shadow-2xl transition-all flex items-center justify-center cursor-pointer"
                  title="Deslizar hacia la izquierda"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handleNudgeRow(rowIndex, 'right')}
                  className="absolute right-2 z-30 w-10 h-10 rounded-full bg-[#050711]/90 border border-[#232F52] text-white opacity-0 group-hover/row:opacity-100 hover:scale-110 hover:border-[#00F0FF] hover:text-[#00F0FF] shadow-2xl transition-all flex items-center justify-center cursor-pointer"
                  title="Deslizar hacia la derecha"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Scrolling Track Container */}
                <div
                  ref={(el) => {
                    rowRefs.current[rowIndex] = el;
                  }}
                  className="w-full overflow-hidden flex items-start pt-1 pb-4"
                >
                  <div
                    className={`flex items-start gap-7 sm:gap-9 shrink-0 ${getAnimationClass(
                      rowIndex
                    )} ${isRowHovered ? 'pause-animation' : ''}`}
                    style={{
                      transformOrigin: 'top center',
                    }}
                  >
                    {rowItems.map((item, itemIdx) => {
                      const tiltClass = getTiltClass(itemIdx);
                      const isMovie = 'synopsis' in item || item.type === 'movie';
                      const streamUrl = item.streamUrl || '';

                      return (
                        <div
                          key={`row_${rowIndex}_item_${item.id}_${itemIdx}`}
                          className={`relative group shrink-0 transition-all duration-300 transform-gpu ${tiltClass} hover:rotate-0 hover:scale-110 hover:z-40`}
                          style={{
                            transformOrigin: 'top center',
                          }}
                        >
                          {/* WOODEN CLOTHESPIN (Pinza de madera vintage con resorte) */}
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none drop-shadow-md">
                            {/* Wooden Peg Top */}
                            <div className="w-3.5 h-6 rounded-t-sm bg-gradient-to-b from-[#C89666] via-[#DEB887] to-[#B37E4C] border border-[#8C5D30]/60 relative shadow-sm">
                              {/* Metal Spring Coil */}
                              <div className="absolute top-2 left-0 right-0 h-1.5 bg-gradient-to-r from-[#718096] via-[#CBD5E1] to-[#718096] rounded-xs" />
                            </div>
                            {/* Wooden Peg Clamping Tip onto photo */}
                            <div className="w-3 h-2 bg-[#A07040] rounded-b-xs -mt-0.5 shadow-inner" />
                          </div>

                          {/* KODAK / POLAROID PHOTO FRAME */}
                          <div
                            onClick={() => {
                              cyberSound.click();
                              setActiveItem(item);
                            }}
                            className={`w-40 sm:w-48 lg:w-52 bg-[#F9F7F1] text-[#1A1D20] rounded-md p-2 sm:p-2.5 pb-3 sm:pb-4 shadow-[0_12px_30px_rgba(0,0,0,0.7),0_2px_4px_rgba(0,0,0,0.4)] border border-[#E2DDD3] group-hover:shadow-[0_20px_45px_rgba(0,240,255,0.45),0_0_15px_rgba(0,240,255,0.2)] transition-all cursor-pointer flex flex-col relative overflow-hidden`}
                          >
                            {/* Vintage Kodak Slide Marking on Top */}
                            <div className="w-full flex items-center justify-between text-[8px] font-mono tracking-widest text-[#8C827A] px-0.5 pb-1 uppercase font-bold border-b border-[#EFEBE3] mb-1.5">
                              <span>KODAK SAFETY 35mm</span>
                              <span>#{itemIdx + 1}A</span>
                            </div>

                            {/* Film Poster Image Area */}
                            <div className="relative w-full aspect-[2/3] bg-[#0E1322] rounded overflow-hidden shadow-inner group/poster">
                              {item.poster ? (
                                <img
                                  src={item.poster}
                                  alt={item.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#4A5568] p-3 text-center">
                                  <Film size={28} className="mb-2" />
                                  <span className="text-[10px] font-mono uppercase">
                                    {item.title}
                                  </span>
                                </div>
                              )}

                              {/* Glossy Photo Sheen Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 pointer-events-none" />

                              {/* On-Hover Action Overlays: PLAY & INFO */}
                              <div className="absolute inset-0 bg-[#04060E]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cyberSound.click();
                                    if (streamUrl) {
                                      onPlayItem(item.title, streamUrl, item);
                                    } else {
                                      setActiveItem(item);
                                    }
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black text-xs font-mono font-black tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.7)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                                >
                                  <Play size={14} className="fill-black" />
                                  <span>REPRODUCIR</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cyberSound.click();
                                    setActiveItem(item);
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono font-semibold tracking-wider transition-colors cursor-pointer"
                                >
                                  <Info size={13} />
                                  <span>DETALLES</span>
                                </button>
                              </div>

                              {/* Rating badge on top right of poster */}
                              {item.rating && (
                                <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#FFD700] flex items-center gap-1 border border-white/20">
                                  <Star size={10} className="fill-[#FFD700]" />
                                  <span>{typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}</span>
                                </div>
                              )}
                            </div>

                            {/* Handwritten / Polaroid Bottom Label Area */}
                            <div className="mt-2 flex flex-col justify-between">
                              <h3
                                className="font-bold text-[12px] sm:text-[13px] text-[#1E232A] leading-tight line-clamp-1 font-sans"
                                title={item.title}
                              >
                                {item.title}
                              </h3>

                              <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-[#5C6473]">
                                <span className="font-bold text-[#323946]">{item.year || '2025'}</span>
                                {item.originalFolder && (
                                  <span
                                    className="truncate max-w-[90px] text-[9px] bg-[#EAE6DC] px-1 py-0.5 rounded text-[#4B5262]"
                                    title={`Carpeta: ${item.originalFolder}`}
                                  >
                                    📁 {item.originalFolder}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER BAR: SUMMARY & TENDEDERO INDICATOR */}
      <div className="relative z-20 shrink-0 px-6 py-2.5 bg-[#060814] border-t border-[#161D33] flex items-center justify-between text-xs font-mono text-[#718096]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            TENDEDERO DE FOTOGRAFÍAS KODAK
          </span>
          <span className="text-[#3A4560]">•</span>
          <span>
            {lineCount} líneas en movimiento continuo alternado (derecha / izquierda)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#A0AEC0]">
            Mostrando <strong className="text-white">{filteredItems.length}</strong> diapositivas
          </span>
          {selectedFolderId && (
            <span className="text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/30">
              Filtro: {categories.find((c) => c.id === selectedFolderId)?.name}
            </span>
          )}
        </div>
      </div>

      {/* ENLARGED DIAPOSITIVA / LIGHTBOX MODAL */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setActiveItem(null)}
          />

          <div className="relative w-full max-w-3xl bg-[#0B1020] border border-[#233159] rounded-3xl shadow-[0_0_60px_rgba(0,240,255,0.25)] overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-[#FF0055] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
            >
              <X size={18} />
            </button>

            {/* Left: Poster with Kodak slide border */}
            <div className="w-full md:w-5/12 bg-[#060814] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#1C2748]">
              <div className="w-56 bg-[#F9F7F1] rounded-lg p-2.5 shadow-2xl border border-[#DCD5C8] rotate-[-1.5deg]">
                <div className="flex justify-between text-[8px] font-mono tracking-widest text-[#7D736A] font-bold pb-1 uppercase">
                  <span>KODAK ARCHIVE</span>
                  <span>{activeItem.year || '2025'}</span>
                </div>
                <div className="relative aspect-[2/3] w-full rounded overflow-hidden bg-black">
                  <img
                    src={
                      activeItem.poster ||
                      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80'
                    }
                    alt={activeItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="pt-2 text-center">
                  <span className="text-[11px] font-mono font-bold text-[#20252D] line-clamp-1">
                    {activeItem.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Info, Synopsis & Direct Play */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Folder and Type Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-mono font-bold uppercase">
                    {type === 'movies' ? 'Película VOD' : 'Serie de TV'}
                  </span>
                  {activeItem.originalFolder && (
                    <span className="px-2.5 py-1 rounded-md bg-[#182344] text-[#A0AEC0] text-[11px] font-mono border border-[#283866]">
                      📁 Carpeta: {activeItem.originalFolder}
                    </span>
                  )}
                  {activeItem.isOnTv && (
                    <span className="px-2.5 py-1 rounded-md bg-[#00FF88]/15 border border-[#00FF88]/40 text-[#00FF88] text-[11px] font-mono font-bold flex items-center gap-1">
                      <Tv size={12} />
                      En Emisión TV
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
                  {activeItem.title}
                </h2>

                {/* Metadata Row */}
                <div className="flex items-center gap-4 mt-3 text-xs font-mono text-[#8EA0BE] flex-wrap">
                  {activeItem.year && (
                    <span className="flex items-center gap-1 text-white font-bold">
                      <Calendar size={13} className="text-[#00F0FF]" />
                      {activeItem.year}
                    </span>
                  )}
                  {activeItem.rating && (
                    <span className="flex items-center gap-1 text-[#FFD700] font-bold">
                      <Star size={13} className="fill-[#FFD700]" />
                      {typeof activeItem.rating === 'number'
                        ? activeItem.rating.toFixed(1)
                        : activeItem.rating}
                    </span>
                  )}
                  {'duration' in activeItem && activeItem.duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {activeItem.duration}
                    </span>
                  )}
                  {'seasons' in activeItem && activeItem.seasons && (
                    <span className="flex items-center gap-1 text-[#FF0077]">
                      <Clapperboard size={13} />
                      {activeItem.seasons} Temporadas ({activeItem.episodes || 12} Episodios)
                    </span>
                  )}
                  {activeItem.genre && (
                    <span className="text-[#C4D0E5] bg-[#141C36] px-2 py-0.5 rounded">
                      {activeItem.genre}
                    </span>
                  )}
                </div>

                {/* Synopsis / Plot */}
                <div className="mt-5">
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7C9E] mb-2">
                    Sinopsis & Detalles
                  </h4>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed font-sans">
                    {'synopsis' in activeItem && activeItem.synopsis
                      ? activeItem.synopsis
                      : 'plot' in activeItem && activeItem.plot
                      ? activeItem.plot
                      : 'Una producción cinematográfica de alta fidelidad disponible en el sistema IPTV con soporte de audio multicanal y subtítulos integrados.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-[#1C2748] flex items-center gap-3">
                <button
                  onClick={() => {
                    cyberSound.click();
                    const url = activeItem.streamUrl || '';
                    if (url) {
                      onPlayItem(activeItem.title, url, activeItem);
                      setActiveItem(null);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#00B4D8] to-[#0077B6] hover:from-[#38E8FF] hover:to-[#0096C7] text-black font-mono font-black text-sm tracking-widest shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_40px_rgba(0,240,255,0.7)] transition-all cursor-pointer"
                >
                  <Play size={18} className="fill-black" />
                  <span>REPRODUCIR AHORA</span>
                </button>

                <button
                  onClick={() => setActiveItem(null)}
                  className="px-5 py-3.5 rounded-2xl bg-[#141C36] hover:bg-[#1C2748] text-[#8EA0BE] hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
