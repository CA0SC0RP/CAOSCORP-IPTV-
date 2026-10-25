import React, { useState, useEffect, useRef } from 'react';
import { Category, Channel } from '../data/models';
import { ChannelRepository, ALL_CATEGORY_ID } from '../data/channelRepository';
import { AccountStore } from '../data/accountStore';
import { IptvClient } from '../data/iptvClient';
import { RefreshCw, UserCheck, Tv, Search, AlertCircle, Loader2 } from 'lucide-react';

interface ChannelsActivityProps {
  onSelectChannel: (categoryId: string, index: number) => void;
  onOpenLogin: () => void;
  initialCategory?: string;
  initialChannelIndex?: number;
}

export const ChannelsActivity: React.FC<ChannelsActivityProps> = ({
  onSelectChannel,
  onOpenLogin,
  initialCategory,
  initialChannelIndex = 0,
}) => {
  const [categories, setCategories] = useState<Category[]>(ChannelRepository.categories);
  const [currentCategory, setCurrentCategory] = useState<string>(
    initialCategory || ALL_CATEGORY_ID
  );
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active panel focus: 'categories' | 'channels'
  const [activePanel, setActivePanel] = useState<'categories' | 'channels'>('categories');
  const [focusedCategoryIdx, setFocusedCategoryIdx] = useState<number>(0);
  const [focusedChannelIdx, setFocusedChannelIdx] = useState<number>(initialChannelIndex);

  const categoryListRef = useRef<HTMLDivElement>(null);
  const channelListRef = useRef<HTMLDivElement>(null);

  // Subscribe to ChannelRepository changes
  useEffect(() => {
    const unsubscribe = ChannelRepository.subscribe(() => {
      setCategories([...ChannelRepository.categories]);
    });
    return () => unsubscribe();
  }, []);

  // Update channel list when category changes
  useEffect(() => {
    const list = ChannelRepository.channelsIn(currentCategory);
    setChannels(list);
    setError(list.length === 0 ? 'La lista no tiene canales.' : null);

    // Scroll to top of channel list on category switch
    if (channelListRef.current) {
      channelListRef.current.scrollTop = 0;
    }
  }, [currentCategory]);

  // Handle reload
  const handleReload = async (force: boolean = false) => {
    const account = AccountStore.load();
    if (!account) {
      onOpenLogin();
      return;
    }

    if (ChannelRepository.loaded && !force) {
      setCategories(ChannelRepository.categories);
      setChannels(ChannelRepository.channelsIn(currentCategory));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await ChannelRepository.load(account);
      const cats = ChannelRepository.categories;
      setCategories(cats);
      const catExists = cats.some((c) => c.id === currentCategory);
      const targetCat = catExists ? currentCategory : ALL_CATEGORY_ID;
      setCurrentCategory(targetCat);
      setChannels(ChannelRepository.channelsIn(targetCat));
    } catch (e: any) {
      setError(IptvClient.friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation for TV remote compatibility (D-Pad, Arrow keys, Enter, Back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when searching input is focused
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'ArrowRight' && activePanel === 'categories') {
        e.preventDefault();
        setActivePanel('channels');
        setFocusedChannelIdx(0);
      } else if (e.key === 'ArrowLeft' && activePanel === 'channels') {
        e.preventDefault();
        setActivePanel('categories');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activePanel === 'categories') {
          setFocusedCategoryIdx((prev) => {
            const next = Math.min(prev + 1, categories.length - 1);
            if (categories[next]) {
              setCurrentCategory(categories[next].id);
            }
            return next;
          });
        } else {
          setFocusedChannelIdx((prev) => Math.min(prev + 1, filteredChannels.length - 1));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activePanel === 'categories') {
          setFocusedCategoryIdx((prev) => {
            const next = Math.max(prev - 1, 0);
            if (categories[next]) {
              setCurrentCategory(categories[next].id);
            }
            return next;
          });
        } else {
          setFocusedChannelIdx((prev) => Math.max(prev - 1, 0));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activePanel === 'categories') {
          if (categories[focusedCategoryIdx]) {
            setCurrentCategory(categories[focusedCategoryIdx].id);
            setActivePanel('channels');
            setFocusedChannelIdx(0);
          }
        } else {
          if (filteredChannels[focusedChannelIdx]) {
            // Find absolute index in current category
            const rawIdx = channels.findIndex(
              (c) => c.id === filteredChannels[focusedChannelIdx].id
            );
            onSelectChannel(currentCategory, rawIdx !== -1 ? rawIdx : focusedChannelIdx);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel, categories, focusedCategoryIdx, focusedChannelIdx, channels]);

  // Filter channels by search if user typed anything
  const filteredChannels = searchQuery.trim()
    ? channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : channels;

  const currentCategoryName =
    categories.find((c) => c.id === currentCategory)?.name || 'Todos los canales';

  return (
    <div className="flex h-screen w-screen bg-[#0E0F14] text-[#F2F4F8] overflow-hidden p-6 gap-6">
      {/* Left Sidebar: 300px width as in Android layout */}
      <div className="w-[300px] h-full flex flex-col shrink-0">
        {/* App Title */}
        <div className="flex items-center gap-2.5 pb-4">
          <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 flex items-center justify-center text-[#4F8CFF]">
            <Tv size={20} />
          </div>
          <h1 className="text-[28px] font-bold text-[#4F8CFF] leading-none tracking-wide">
            CAOS TV
          </h1>
        </div>

        {/* Categories List */}
        <div
          ref={categoryListRef}
          className="flex-1 overflow-y-auto space-y-1 pr-1.5 focus:outline-none"
        >
          {categories.map((cat, idx) => {
            const isSelected = cat.id === currentCategory;
            const isFocused = activePanel === 'categories' && focusedCategoryIdx === idx;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setCurrentCategory(cat.id);
                  setFocusedCategoryIdx(idx);
                  setActivePanel('categories');
                }}
                className={`flex items-center justify-between min-h-[48px] px-3.5 py-2 rounded-lg cursor-pointer transition-all text-left ${
                  isFocused
                    ? 'bg-[#2A2F45] border-2 border-[#4F8CFF] shadow-md'
                    : isSelected
                    ? 'bg-[#1F2433] border-2 border-transparent'
                    : 'bg-[#181A22] border-2 border-transparent hover:bg-[#1F2433]'
                }`}
              >
                <span className="text-[18px] text-[#F2F4F8] truncate font-medium flex-1">
                  {cat.name}
                </span>
                {typeof cat.count === 'number' && (
                  <span className="text-[14px] text-[#9AA3B5] pl-2 font-mono shrink-0">
                    {cat.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 space-y-2 shrink-0">
          <button
            onClick={() => handleReload(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#181A22] hover:bg-[#2A2F45] border border-[#2A2F45] text-[#F2F4F8] rounded-lg font-medium text-[15px] transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Recargar lista</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#181A22] hover:bg-[#2A2F45] border border-[#2A2F45] text-[#F2F4F8] rounded-lg font-medium text-[15px] transition-colors cursor-pointer"
          >
            <UserCheck size={16} />
            <span>Cambiar cuenta</span>
          </button>
        </div>
      </div>

      {/* Right Column: Channels Area */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {/* Header with Title and Search */}
        <div className="flex items-center justify-between pb-3 gap-4 shrink-0">
          <div className="text-[18px] text-[#9AA3B5] font-medium truncate">
            {currentCategoryName} · {filteredChannels.length} canales
          </div>

          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B5]"
            />
            <input
              type="text"
              placeholder="Buscar canal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#181A22] border border-[#2A2F45] focus:border-[#4F8CFF] focus:outline-none rounded-lg text-sm text-[#F2F4F8] placeholder-[#9AA3B5]/60"
            />
          </div>
        </div>

        {/* Channels List / State Container */}
        <div className="flex-1 relative bg-[#0E0F14] overflow-hidden rounded-xl">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0E0F14]/80 z-20">
              <Loader2 size={40} className="animate-spin text-[#4F8CFF] mb-3" />
              <p className="text-[16px] text-[#9AA3B5]">Cargando canales...</p>
            </div>
          )}

          {error ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#FF8A80]">
              <AlertCircle size={44} className="mb-3 opacity-90" />
              <p className="text-[20px] font-medium max-w-lg">{error}</p>
            </div>
          ) : (
            <div
              ref={channelListRef}
              className="h-full overflow-y-auto space-y-1.5 pr-1 focus:outline-none"
            >
              {filteredChannels.map((channel, idx) => {
                const isFocused = activePanel === 'channels' && focusedChannelIdx === idx;

                return (
                  <div
                    key={`${channel.id}-${idx}`}
                    onClick={() => {
                      setFocusedChannelIdx(idx);
                      setActivePanel('channels');
                      const rawIdx = channels.findIndex((c) => c.id === channel.id);
                      onSelectChannel(currentCategory, rawIdx !== -1 ? rawIdx : idx);
                    }}
                    className={`flex items-center min-h-[64px] p-2 rounded-lg cursor-pointer transition-all ${
                      isFocused
                        ? 'bg-[#2A2F45] border-2 border-[#4F8CFF] shadow-lg'
                        : 'bg-[#181A22] border-2 border-transparent hover:bg-[#1F2433]'
                    }`}
                  >
                    {/* Channel Number (56px width) */}
                    <div className="w-[56px] text-center text-[#9AA3B5] text-[16px] font-mono shrink-0">
                      {idx + 1}
                    </div>

                    {/* Channel Logo (48x48) */}
                    <div className="w-12 h-12 mr-3.5 bg-[#0E0F14] rounded-md overflow-hidden flex items-center justify-center shrink-0 border border-[#2A2F45]">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt=""
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                            if (sibling) sibling.style.display = 'flex';
                          }}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center text-[#9AA3B5]/60 ${
                          channel.logo ? 'hidden' : 'flex'
                        }`}
                      >
                        <Tv size={22} />
                      </div>
                    </div>

                    {/* Channel Name */}
                    <div className="text-[20px] text-[#F2F4F8] truncate font-medium flex-1">
                      {channel.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
