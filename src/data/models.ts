export type AccountType = 'XTREAM' | 'M3U';

export interface Account {
  type: AccountType;
  host?: string;
  username?: string;
  password?: string;
  m3uUrl?: string;
  name?: string;
}

export interface Category {
  id: string;
  name: string;
  type?: 'live' | 'movie' | 'series';
  count?: number;
}

export interface Channel {
  id: string;
  name: string;
  logo: string | null;
  categoryId: string;
  url: string;
  altUrl?: string | null;
  type?: 'live';
}

export interface MovieItem {
  id: string;
  title: string;
  poster: string | null;
  backdrop?: string | null;
  categoryId: string;
  streamUrl: string;
  altUrl?: string | null;
  rating?: number;
  year?: number | string;
  genre?: string;
  duration?: string;
  synopsis?: string;
  type?: 'movie';
  added?: number | string;
  isOnTv?: boolean;
  originalFolder?: string;
}

export interface SeriesItem {
  id: string;
  title: string;
  poster: string | null;
  backdrop?: string | null;
  categoryId: string;
  rating?: number;
  year?: number | string;
  genre?: string;
  seasons?: number;
  episodes?: number;
  plot?: string;
  streamUrl?: string;
  type?: 'series';
  added?: number | string;
  isOnTv?: boolean;
  originalFolder?: string;
}

export interface ScanResult {
  id: string;
  title?: string;
  host?: string;
  username?: string;
  input: string;
  type?: 'M3U' | 'XTREAM';
  status: 'active' | 'expired' | 'offline' | 'auth_failed' | 'error';
  statusText?: string;
  expiration?: string;
  maxConnections?: string | number;
  activeConnections?: string | number;
  totalItems?: number;
  channels?: number;
  movies?: number;
  series?: number;
  sizeKb?: number;
  message?: string;
  pingMs?: number;
}
