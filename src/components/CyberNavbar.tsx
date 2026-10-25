import React from 'react';
import { Film, Clapperboard, Radio, LogOut, Tv, Sparkles, Orbit, Disc } from 'lucide-react';
import { cyberSound } from './CyberSound';

interface CyberNavbarProps {
  currentTab: 'movies' | 'series' | 'live';
  onSelectTab: (tab: 'movies' | 'series' | 'live') => void;
  onOpenLogin: () => void;
  accountInfo?: any;
  viewMode?: 'disco' | 'planet';
  onToggleViewMode?: () => void;
}

export const CyberNavbar: React.FC<CyberNavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogin,
  accountInfo,
  viewMode,
  onToggleViewMode,
}) => {
  const navItems = [
    {
      id: 'movies',
      label: 'PELÍCULAS',
      code: 'VOD·01',
      icon: Film,
      glow: 'shadow-[0_0_20px_rgba(0,240,255,0.5)]',
      borderActive: 'border-[#00F0FF]',
      textColor: 'text-[#00F0FF]',
    },
    {
      id: 'series',
      label: 'SERIES',
      code: 'VOD·02',
      icon: Clapperboard,
      glow: 'shadow-[0_0_20px_rgba(255,0,119,0.5)]',
      borderActive: 'border-[#FF0077]',
      textColor: 'text-[#FF0077]',
    },
    {
      id: 'live',
      label: 'IPTV EN VIVO',
      code: 'EPG·LIVE',
      icon: Radio,
      glow: 'shadow-[0_0_20px_rgba(0,255,136,0.5)]',
      borderActive: 'border-[#00FF88]',
      textColor: 'text-[#00FF88]',
    },
  ] as const;

  return (
    <header className="relative h-20 px-6 sm:px-8 bg-[#04060E]/95 border-b border-[#1A2238] flex items-center justify-between shrink-0 z-40 backdrop-blur-2xl">
      {/* Top Laser Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] via-50% to-transparent opacity-80" />

      {/* Brand CAOSCORP (Strictly together, ultra-modern typography) */}
      <div
        onClick={() => {
          cyberSound.click();
          onSelectTab('movies');
        }}
        className="flex items-center gap-3.5 cursor-pointer group"
      >
        <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00F0FF] via-[#7B2CBF] to-[#FF0055] p-[1.5px] shadow-[0_0_25px_rgba(0,240,255,0.45)] group-hover:shadow-[0_0_35px_rgba(255,0,85,0.7)] transition-all duration-300">
          <div className="w-full h-full bg-[#050711] rounded-[10px] flex items-center justify-center text-[#00F0FF]">
            <Tv size={22} className="group-hover:rotate-6 transition-transform" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00FF88] rounded-full border-2 border-[#050711] animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#00F0FF] to-[#00E5FF] font-mono leading-none drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]">
              CAOSCORP
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black font-mono bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 tracking-wider">
              PRO 3D
            </span>
          </div>
          <p className="text-[10px] font-mono font-medium text-[#7E8B9F] tracking-[0.2em] mt-1 uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
            SISTEMA HOLOGRÁFICO IPTV
          </p>
        </div>
      </div>

      {/* Exactly 3 Ultra-Modern Navigation Tabs: Películas, Series, IPTV en Vivo */}
      <nav className="flex items-center gap-2 bg-[#090D1C]/90 p-1.5 rounded-2xl border border-[#1E2744] shadow-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                cyberSound.click();
                onSelectTab(item.id);
              }}
              onMouseEnter={() => cyberSound.hover()}
              className={`relative flex items-center gap-3 px-5 py-2.5 rounded-xl font-mono transition-all duration-200 cursor-pointer ${
                isActive
                  ? `bg-[#0F162E] text-white border ${item.borderActive} ${item.glow}`
                  : 'text-[#8592A6] hover:text-[#E2E8F0] hover:bg-[#111833] border border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? `bg-white/10 ${item.textColor}` : 'text-[#8592A6]'
                }`}
              >
                <Icon size={17} />
              </div>
              <div className="text-left">
                <div
                  className={`text-[12px] font-black tracking-widest ${
                    isActive ? 'text-white' : 'text-[#A0AEC0]'
                  }`}
                >
                  {item.label}
                </div>
                <div className="text-[9px] tracking-wider text-[#64748B] font-mono leading-none">
                  {item.code}
                </div>
              </div>
              {isActive && (
                <div
                  className={`w-1.5 h-1.5 rounded-full animate-ping ml-1 ${
                    item.id === 'movies'
                      ? 'bg-[#00F0FF]'
                      : item.id === 'series'
                      ? 'bg-[#FF0077]'
                      : 'bg-[#00FF88]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right controls: 3D Universe Mode Toggle & Change List */}
      <div className="flex items-center gap-3">
        {/* Toggle between Disco Globe 3D and Planetary Orbit 3D if on movies or series */}
        {currentTab !== 'live' && onToggleViewMode && (
          <button
            onClick={() => {
              cyberSound.click();
              onToggleViewMode();
            }}
            className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#090D1C] border border-[#1E2744] hover:border-[#00F0FF]/50 text-[#00F0FF] text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer shadow-md hover:scale-105"
            title="Alternar entre Bola de Disco 3D y Planeta Orbital 3D"
          >
            {viewMode === 'disco' ? (
              <>
                <Disc size={15} className="animate-spin text-[#00F0FF]" />
                <span>BOLA DE DISCO 3D</span>
              </>
            ) : (
              <>
                <Orbit size={15} className="text-[#FF0077]" />
                <span>PLANETA 3D</span>
              </>
            )}
          </button>
        )}

        {accountInfo && (
          <span className="hidden xl:inline-block text-[11px] font-mono text-[#8592A6] px-3 py-1.5 rounded-xl bg-[#090D1C] border border-[#1E2744]">
            {accountInfo.username || 'USUARIO CONECTADO'}
          </span>
        )}

        <button
          onClick={() => {
            cyberSound.click();
            onOpenLogin();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1324] border border-[#232D4E] hover:border-[#FF0055]/60 text-[#8592A6] hover:text-[#FF0055] text-[12px] font-mono font-bold tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(255,0,85,0.3)]"
        >
          <LogOut size={14} />
          <span>CAMBIAR LISTA</span>
        </button>
      </div>
    </header>
  );
};

