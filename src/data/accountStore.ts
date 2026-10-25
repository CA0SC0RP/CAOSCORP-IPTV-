import { Account, AccountType } from './models';

const STORAGE_KEY = 'caos_tv_prefs_account';

export const AccountStore = {
  load(): Account | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o.type || (o.type !== 'XTREAM' && o.type !== 'M3U')) return null;
      return {
        type: o.type as AccountType,
        host: o.host || '',
        username: o.username || '',
        password: o.password || '',
        m3uUrl: o.m3uUrl || '',
      };
    } catch {
      return null;
    }
  },

  save(account: Account): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    } catch (e) {
      console.error('Failed to save account:', e);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear account:', e);
    }
  },
};
