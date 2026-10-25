import React, { useState, useEffect } from 'react';
import { AccountStore } from './data/accountStore';
import { ChannelRepository } from './data/channelRepository';
import { CosmicGateway } from './ui/CosmicGateway';
import { CyberNavbar } from './components/CyberNavbar';
import { PhotoClotheslineView } from './components/PhotoClotheslineView';
import { TiviMateLiveTvView } from './ui/TiviMateLiveTvView';
import { CleanFullscreenPlayer } from './ui/CleanFullscreenPlayer';

type MainSection = 'movies' | 'series' | 'live';

export const App: React.FC = () => {
  // If account is loaded -> 'app', else -> 'gateway'
  const [appState, setAppState] = useState<'gateway' | 'app'>('gateway');
  // Default first section is 'movies' (Películas) as requested!
  const [currentTab, setCurrentTab] = useState<MainSection>('movies');
  const [initializing, setInitializing] = useState<boolean>(true);

  // Fullscreen player state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playerTitle, setPlayerTitle] = useState<string>('');
  const [playerUrl, setPlayerUrl] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | undefined>(undefined);

  // Check saved account on app start
  useEffect(() => {
    const existing = AccountStore.load();
    if (existing) {
      ChannelRepository.load(existing)
        .then(() => {
          setAppState('app');
          setCurrentTab('movies'); // Default to Películas!
        })
        .catch((e) => {
          console.warn('Could not auto-load saved account:', e);
          setAppState('gateway');
        })
        .finally(() => {
          setInitializing(false);
        });
    } else {
      setAppState('gateway');
      setInitializing(false);
    }
  }, []);

  const handleOpenPlayer = (title: string, url: string, index?: number) => {
    setPlayerTitle(title);
    setPlayerUrl(url);
    setPlayerIndex(index);
    setIsFullscreen(true);
  };

  const handleZapChannel = (delta: number) => {
    const channels = ChannelRepository.channels;
    if (channels.length === 0) return;
    const currentIdx = channels.findIndex((c) => c.name === playerTitle);
    const nextIdx = (currentIdx + delta + channels.length) % channels.length;
    const nextCh = channels[nextIdx];
    setPlayerTitle(nextCh.name);
    setPlayerUrl(nextCh.url);
    setPlayerIndex(nextIdx + 1);
  };

  if (initializing) {
    return (
      <div className="h-screen w-screen bg-[#04060E] flex flex-col items-center justify-center text-white font-mono select-none">
        <div className="w-16 h-16 rounded-full border-4 border-t-[#00F0FF] border-r-[#FF0055] border-b-transparent border-l-transparent animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-[0.2em] text-[#00F0FF] uppercase">
          INICIANDO CAOSCORP...
        </h2>
        <p className="text-xs text-[#8592A6] mt-1 font-mono tracking-wider">
          Sincronizando Sistema IPTV Holográfico
        </p>
      </div>
    );
  }

  // Pure Clean Fullscreen Player (Zero navbar, discrete bottom controls with subtitles/audio)
  if (isFullscreen) {
    return (
      <CleanFullscreenPlayer
        title={playerTitle}
        streamUrl={playerUrl}
        channelIndex={playerIndex}
        onBack={() => setIsFullscreen(false)}
        onZap={handleZapChannel}
      />
    );
  }

  // Entrance Gateway / Login to connect IPTV list
  if (appState === 'gateway') {
    return (
      <CosmicGateway
        onSuccess={() => {
          setAppState('app');
          setCurrentTab('movies'); // Opens directly into Películas!
        }}
      />
    );
  }

  // Main App with Exactly 3 Tabs: Películas, Series, IPTV en Vivo
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#04060E] flex flex-col select-none">
      {/* Top Navbar */}
      <CyberNavbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenLogin={() => setAppState('gateway')}
        accountInfo={ChannelRepository.accountInfo}
      />

      {/* Main Section Content */}
      <main className="flex-1 relative overflow-hidden">
        {currentTab === 'movies' && (
          <PhotoClotheslineView
            type="movies"
            items={ChannelRepository.movies}
            categories={ChannelRepository.movieCategories}
            onPlayItem={(title, url) => handleOpenPlayer(title, url)}
          />
        )}

        {currentTab === 'series' && (
          <PhotoClotheslineView
            type="series"
            items={ChannelRepository.series}
            categories={ChannelRepository.seriesCategories}
            onPlayItem={(title, url) => handleOpenPlayer(title, url)}
          />
        )}

        {currentTab === 'live' && (
          <TiviMateLiveTvView
            onFullscreenClean={(channel, idx) =>
              handleOpenPlayer(channel.name, channel.url, idx + 1)
            }
          />
        )}
      </main>
    </div>
  );
};

export default App;

