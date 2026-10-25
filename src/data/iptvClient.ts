import { Account, ScanResult } from './models';
import { M3uParser } from './m3uParser';

export const IptvClient = {
  USER_AGENT: 'CAOS-TV/0.2 (Cyberpunk Media Edition)',

  normalizeHost(host: string): string {
    let h = host.trim();
    if (!h.startsWith('http://') && !h.startsWith('https://')) {
      h = 'http://' + h;
    }
    return h.replace(/\/+$/, '');
  },

  async loadXtream(account: Account): Promise<any> {
    const res = await fetch('/api/iptv/xtream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: account.host,
        username: account.username,
        password: account.password,
      }),
    });

    if (!res.ok) {
      let msg = `El servidor respondió HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data.error) msg = data.error;
      } catch {
        // fallback
      }
      throw new Error(msg);
    }

    return res.json();
  },

  async loadM3u(url: string): Promise<any> {
    let m3uText = '';
    const proxyUrl = `/api/iptv/m3u?url=${encodeURIComponent(url.trim())}`;
    
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        m3uText = await res.text();
      } else {
        let errMsg = `El servidor respondió HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson.error) errMsg = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }
    } catch (e: any) {
      try {
        const directRes = await fetch(url.trim());
        if (directRes.ok) {
          m3uText = await directRes.text();
        } else {
          throw new Error(e.message || 'Error cargando lista M3U');
        }
      } catch {
        throw new Error(e.message || 'No se pudo conectar al servidor. Revisa la dirección y tu conexión.');
      }
    }

    return M3uParser.parse(m3uText);
  },

  async loadDemo(): Promise<any> {
    const res = await fetch('/api/iptv/demo');
    if (!res.ok) {
      throw new Error('Error al cargar contenido de demostración');
    }
    return res.json();
  },

  async scanLists(lists: any[]): Promise<ScanResult[]> {
    const res = await fetch('/api/iptv/scan-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lists }),
    });

    if (!res.ok) {
      throw new Error('Error al escanear listas');
    }

    const data = await res.json();
    return data.results || [];
  },

  friendlyError(e: any): string {
    if (!e) return 'Ha ocurrido un error inesperado';
    const msg = (e.message || String(e)).toLowerCase();

    if (msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('load failed')) {
      return 'No se pudo conectar al servidor. Revisa la dirección y tu conexión a internet.';
    }
    if (msg.includes('aborted') || msg.includes('timeout')) {
      return 'El servidor tardó demasiado en responder.';
    }
    return e.message || String(e);
  },
};
