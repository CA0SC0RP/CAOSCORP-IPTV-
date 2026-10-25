import { Account, Category, Channel, MovieItem, SeriesItem } from './models';
import { IptvClient } from './iptvClient';
import { DEFAULT_GROUP } from './m3uParser';

export const ALL_CATEGORY_ID = '__all__';
export const UNCATEGORIZED_ID = '__none__';

class ChannelRepositorySingleton {
  readonly ALL = ALL_CATEGORY_ID;
  readonly UNCATEGORIZED = UNCATEGORIZED_ID;

  // Live TV
  categories: Category[] = [];
  channels: Channel[] = [];
  private byCategory: Map<string, Channel[]> = new Map();

  // VOD Movies
  movieCategories: Category[] = [];
  movies: MovieItem[] = [];
  private moviesByCategory: Map<string, MovieItem[]> = new Map();

  // Series
  seriesCategories: Category[] = [];
  series: SeriesItem[] = [];
  private seriesByCategory: Map<string, SeriesItem[]> = new Map();

  loaded: boolean = false;
  accountInfo: any = null;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  async load(account: Account): Promise<void> {
    let result: any;
    if (account.host === '__DEMO__') {
      result = await IptvClient.loadDemo();
    } else if (account.type === 'XTREAM') {
      result = await IptvClient.loadXtream(account);
    } else {
      result = await IptvClient.loadM3u(account.m3uUrl || '');
    }

    this.accountInfo = result.userInfo || null;

    // Process Live Channels
    const cats: Category[] = result.categories || [];
    const rawChannels: Channel[] = result.channels || [];

    const knownCats = new Set(cats.map((c) => c.id));
    const normalizedChannels = rawChannels.map((ch) => {
      if (knownCats.has(ch.categoryId)) return ch;
      return { ...ch, categoryId: this.UNCATEGORIZED };
    });

    const liveGrouped = new Map<string, Channel[]>();
    for (const ch of normalizedChannels) {
      const list = liveGrouped.get(ch.categoryId) || [];
      list.push(ch);
      liveGrouped.set(ch.categoryId, list);
    }

    const liveCatList: Category[] = [];
    for (const c of cats) {
      const n = (liveGrouped.get(c.id) || []).length;
      if (n > 0) {
        liveCatList.push({ ...c, count: n, type: 'live' });
      }
    }

    const uncatChannels = liveGrouped.get(this.UNCATEGORIZED);
    if (uncatChannels && uncatChannels.length > 0) {
      liveCatList.push({
        id: this.UNCATEGORIZED,
        name: DEFAULT_GROUP,
        count: uncatChannels.length,
        type: 'live',
      });
    }

    this.byCategory = liveGrouped;
    this.channels = normalizedChannels;
    this.categories = [
      { id: this.ALL, name: 'Todos los canales', count: normalizedChannels.length, type: 'live' },
      ...liveCatList,
    ];

    // Helper to extract numeric year for sorting newest first
    const extractYear = (item: any): number => {
      if (typeof item.year === 'number') return item.year;
      if (item.year) {
        const match = String(item.year).match(/\b(19\d\d|20\d\d)\b/);
        if (match) return parseInt(match[1], 10);
      }
      if (item.releaseDate) {
        const match = String(item.releaseDate).match(/\b(19\d\d|20\d\d)\b/);
        if (match) return parseInt(match[1], 10);
      }
      return 0;
    };

    // Process Movies (VOD) - Always sort newest/most recent first
    const rawMovies: MovieItem[] = (result.movies || []).sort((a: any, b: any) => {
      const yA = extractYear(a);
      const yB = extractYear(b);
      if (yB !== yA) return yB - yA;
      return (b.rating || 0) - (a.rating || 0);
    });

    const rawMovieCats: Category[] = result.movieCategories || [];
    const movieCatMap = new Map<string, string>(rawMovieCats.map((c) => [c.id, c.name]));
    const moviesGrouped = new Map<string, MovieItem[]>();

    for (const m of rawMovies) {
      if (!m.originalFolder) {
        m.originalFolder = movieCatMap.get(m.categoryId) || 'Películas';
      }
      const list = moviesGrouped.get(m.categoryId) || [];
      list.push(m);
      moviesGrouped.set(m.categoryId, list);
    }

    const movieCatList: Category[] = [];
    for (const mc of rawMovieCats) {
      const n = (moviesGrouped.get(mc.id) || []).length;
      if (n > 0 || mc.id === 'mcat_all') {
        movieCatList.push({ ...mc, count: n || rawMovies.length, type: 'movie' });
      }
    }

    this.moviesByCategory = moviesGrouped;
    this.movies = rawMovies;
    this.movieCategories = [
      { id: this.ALL, name: '⚡ Todas las Películas', count: rawMovies.length, type: 'movie' },
      ...movieCatList.filter((c) => c.id !== 'mcat_all'),
    ];

    // Process Series - Always sort newest/most recent first
    const rawSeries: SeriesItem[] = (result.series || []).sort((a: any, b: any) => {
      const yA = extractYear(a);
      const yB = extractYear(b);
      if (yB !== yA) return yB - yA;
      return (b.rating || 0) - (a.rating || 0);
    });

    const rawSeriesCats: Category[] = result.seriesCategories || [];
    const seriesCatMap = new Map<string, string>(rawSeriesCats.map((c) => [c.id, c.name]));
    const seriesGrouped = new Map<string, SeriesItem[]>();

    for (const s of rawSeries) {
      if (!s.originalFolder) {
        s.originalFolder = seriesCatMap.get(s.categoryId) || 'Series';
      }
      const list = seriesGrouped.get(s.categoryId) || [];
      list.push(s);
      seriesGrouped.set(s.categoryId, list);
    }

    const seriesCatList: Category[] = [];
    for (const sc of rawSeriesCats) {
      const n = (seriesGrouped.get(sc.id) || []).length;
      if (n > 0 || sc.id === 'scat_all') {
        seriesCatList.push({ ...sc, count: n || rawSeries.length, type: 'series' });
      }
    }

    this.seriesByCategory = seriesGrouped;
    this.series = rawSeries;
    this.seriesCategories = [
      { id: this.ALL, name: '⚡ Todas las Series', count: rawSeries.length, type: 'series' },
      ...seriesCatList.filter((c) => c.id !== 'scat_all'),
    ];

    this.loaded = true;
    this.notify();
  }

  channelsIn(categoryId: string): Channel[] {
    if (categoryId === this.ALL || categoryId === 'cat_all') {
      return this.channels;
    }
    return this.byCategory.get(categoryId) || [];
  }

  moviesIn(categoryId: string): MovieItem[] {
    if (categoryId === this.ALL || categoryId === 'mcat_all') {
      return this.movies;
    }
    return this.moviesByCategory.get(categoryId) || [];
  }

  seriesIn(categoryId: string): SeriesItem[] {
    if (categoryId === this.ALL || categoryId === 'scat_all') {
      return this.series;
    }
    return this.seriesByCategory.get(categoryId) || [];
  }
}

export const ChannelRepository = new ChannelRepositorySingleton();
