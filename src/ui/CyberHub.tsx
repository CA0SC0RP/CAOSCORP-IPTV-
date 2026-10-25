import React from 'react';
import { Film, Clapperboard, Radio, SearchCheck, Sparkles, Play, ShieldAlert, Cpu } from 'lucide-react';
import { ChannelRepository } from '../data/channelRepository';
import { cyberSound } from '../components/CyberSound';

interface CyberHubProps {
  onNavigate: (tab: 'movies' | 'series' | 'live' | 'scanner') => void;
  onOpenPlayer: (title: string, url: string) => void;
}

export const CyberHub: React.FC<CyberHubProps> = ({ onNavigate, onOpenPlayer }) => {
  const channelCount = ChannelRepository.channels.length;
  const movieCount = ChannelRepository.movies.length;
  const seriesCount = ChannelRepository.series.length;
  const accountInfo = ChannelRepository.accountInfo;

  const portals = [
    {
      id: 'movies',
      title: 'PELÍCULAS & VOD',
      tagline: 'Mundo 3D Holo-Wheel',
      description:
        'Explora el catálogo en un cilindro 3D rotatorio interactivo con efectos de partículas, sinopsis holográfica y streaming instantáneo.',
      badge: `${movieCount || '250+'} TÍTULOS`,
      color: 'from-[#00F0FF] to-[#0066FF]',
      glowColor: 'hover:shadow-[0_0_35px_rgba(0,240,255,0.35)]',
      borderColor: 'hover:border-[#00F0FF]',
      icon: Film,
      actionText: 'ABRIR MUNDO 3D',
    },
    {
      id: 'series',
      title: 'SERIES & TEMPORADAS',
      tagline: 'Cyber Deck Orbital',
      description:
        'Episodios y temporadas completas en carrusel orbital 3D o cuadrícula de alta velocidad con fichas técnicas completas.',
      badge: `${seriesCount || '80+'} SERIES`,
      color: 'from-[#FF0055] to-[#9900FF]',
      glowColor: 'hover:shadow-[0_0_35px_rgba(255,0,85,0.35)]',
      borderColor: 'hover:border-[#FF0055]',
      icon: Clapperboard,
      actionText: 'EXPLORAR SERIES',
    },
    {
      id: 'live',
      title: 'IPTV EN VIVO',
      tagline: 'Matriz de Canales en Directo',
      description:
        'Emisión continua con zapping de canales por teclado o mando a distancia, barra OSD de información y buffering optimizado.',
      badge: `${channelCount || '100+'} CANALES`,
      color: 'from-[#00FF66] to-[#0099FF]',
      glowColor: 'hover:shadow-[0_0_35px_rgba(0,255,102,0.35)]',
      borderColor: 'hover:border-[#00FF66]',
      icon: Radio,
      actionText: 'SINTONIZAR EN DIRECTO',
    },
    {
      id: 'scanner',
      title: 'ESCÁNER DE LISTAS',
      tagline: 'Multi-Checker Masivo (10-20 Listas)',
      description:
        'Pega hasta 20 listas M3U o cuentas Xtream simultáneamente. Analiza estado de conexión, caducidad, canales activos y latencia en segundos.',
      badge: 'PARALLEL SCANNER',
      color: 'from-[#FFB703] to-[#FB8500]',
      glowColor: 'hover:shadow-[0_0_35px_rgba(255,183,3,0.35)]',
      borderColor: 'hover:border-[#FFB703]',
      icon: SearchCheck,
      actionText: 'ANALIZAR LISTAS',
    },
  ] as const;

  return (
    <div className="h-full w-full overflow-y-auto p-8 bg-[#07080D] text-[#F2F4F8] relative">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#101424_1px,transparent_1px),linear-gradient(to_bottom,#101424_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Hero Welcome Banner */}
      <div className="relative z-10 max-w-6xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-[#101424]/90 border border-[#2A2F45] shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                <Cpu size={13} />
                SISTEMA OPERATIVO // ONLINE
              </span>
              {accountInfo && (
                <span className="text-xs font-mono text-[#9AA3B5] px-2.5 py-1 rounded-md bg-[#181A22] border border-[#2A2F45]">
                  USUARIO: <span className="text-[#F2F4F8] font-bold">{accountInfo.username}</span> · EXP: {accountInfo.expDate}
                </span>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              CENTRAL MULTIMEDIA <span className="text-[#00F0FF]">FUTURISTA</span>
            </h2>

            <p className="text-[15px] text-[#9AA3B5] max-w-2xl font-sans leading-relaxed">
              Elige tu portal de transmisión. Navega por el universo 3D de películas y series con rotación orbital, sintoniza canales de TV en vivo con zapping directo o escanea múltiples listas IPTV a la vez.
            </p>
          </div>

          {/* Quick Demo Stream Button */}
          <div className="shrink-0">
            <button
              onClick={() => {
                cyberSound.warp();
                onOpenPlayer(
                  'Tears of Steel (Cyber Revolution 4K)',
                  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8'
                );
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0066FF] hover:from-[#38F9D7] hover:to-[#00F0FF] text-[#07080D] font-mono font-black text-sm tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer group"
            >
              <Play size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              <span>REPRODUCIR DEMO CYBER 4K</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Portales Principales (Recuadros) */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <div
              key={portal.id}
              onClick={() => {
                cyberSound.click();
                onNavigate(portal.id);
              }}
              onMouseEnter={() => cyberSound.hover()}
              className={`relative group bg-[#101424]/85 border-2 border-[#2A2F45] ${portal.borderColor} ${portal.glowColor} rounded-2xl p-7 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[260px]`}
            >
              {/* Corner Glow Accent */}
              <div
                className={`absolute -right-16 -top-16 w-44 h-44 rounded-full bg-gradient-to-br ${portal.color} opacity-15 blur-2xl group-hover:opacity-30 transition-opacity`}
              />

              <div>
                {/* Header of Card */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.color} p-[1.5px] shadow-lg`}
                  >
                    <div className="w-full h-full bg-[#07080D] rounded-[10px] flex items-center justify-center text-white">
                      <Icon size={24} />
                    </div>
                  </div>

                  <span className="text-[12px] font-mono font-bold px-3 py-1 rounded-full bg-[#181A22] border border-[#2A2F45] text-[#F2F4F8]">
                    {portal.badge}
                  </span>
                </div>

                <div className="text-[12px] font-mono text-[#00F0FF] font-semibold tracking-wider uppercase mb-1">
                  {portal.tagline}
                </div>

                <h3 className="text-2xl font-bold font-mono text-[#F2F4F8] group-hover:text-white transition-colors">
                  {portal.title}
                </h3>

                <p className="text-[14px] text-[#9AA3B5] mt-2.5 leading-relaxed font-sans">
                  {portal.description}
                </p>
              </div>

              {/* Bottom Action */}
              <div className="pt-6 border-t border-[#2A2F45]/60 flex items-center justify-between">
                <span className="text-[13px] font-mono font-bold text-white group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                  <span>{portal.actionText}</span>
                  <span className="text-[#00F0FF]">→</span>
                </span>
                <Sparkles size={16} className="text-[#9AA3B5] group-hover:text-[#00F0FF] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
