import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const USER_AGENT = 'CAOS-TV/0.2 (Cyberpunk Media Edition)';

app.use(express.json({ limit: '10mb' }));

// Normalize host helper
function normalizeHost(host: string): string {
  let h = host.trim();
  if (!h.startsWith('http://') && !h.startsWith('https://')) {
    h = 'http://' + h;
  }
  return h.replace(/\/+$/, '');
}

// Xtream Codes Full Loader (Live, VOD/Movies, Series)
app.post('/api/iptv/xtream', async (req: Request, res: Response) => {
  try {
    const { host, username, password } = req.body;
    if (!host || !username || !password) {
      res.status(400).json({ error: 'Completa servidor, usuario y contraseña' });
      return;
    }

    const base = normalizeHost(host);
    const user = encodeURIComponent(username);
    const pass = encodeURIComponent(password);
    const api = `${base}/player_api.php?username=${user}&password=${pass}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const authResp = await fetch(api, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!authResp.ok) {
      res.status(authResp.status).json({
        error: `El servidor respondió HTTP ${authResp.status}`,
      });
      return;
    }

    const authText = await authResp.text();
    let auth: any;
    try {
      auth = JSON.parse(authText);
    } catch {
      res.status(502).json({
        error: 'El servidor respondió algo inesperado. ¿La dirección es correcta?',
      });
      return;
    }

    const info = auth?.user_info;
    if (!info || info.auth !== 1) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    const status = (info.status || '').toString();
    if (status && status.toLowerCase() !== 'active') {
      res.status(403).json({
        error: `La cuenta no está activa (estado: ${status})`,
      });
      return;
    }

    // Load live categories & streams, plus VOD (movies) & Series categories/streams
    const [liveCatResp, liveStreamResp, vodCatResp, vodStreamResp, seriesCatResp, seriesStreamResp] =
      await Promise.allSettled([
        fetch(`${api}&action=get_live_categories`, { headers: { 'User-Agent': USER_AGENT } }),
        fetch(`${api}&action=get_live_streams`, { headers: { 'User-Agent': USER_AGENT } }),
        fetch(`${api}&action=get_vod_categories`, { headers: { 'User-Agent': USER_AGENT } }),
        fetch(`${api}&action=get_vod_streams`, { headers: { 'User-Agent': USER_AGENT } }),
        fetch(`${api}&action=get_series_categories`, { headers: { 'User-Agent': USER_AGENT } }),
        fetch(`${api}&action=get_series`, { headers: { 'User-Agent': USER_AGENT } }),
      ]);

    // Live Channels
    const liveCats = liveCatResp.status === 'fulfilled' && liveCatResp.value.ok ? await liveCatResp.value.json() : [];
    const liveStreams = liveStreamResp.status === 'fulfilled' && liveStreamResp.value.ok ? await liveStreamResp.value.json() : [];

    const categories = Array.isArray(liveCats)
      ? liveCats.map((c: any) => ({
          id: String(c.category_id || ''),
          name: (c.category_name || '').trim() || 'Sin nombre',
          type: 'live',
        }))
      : [];

    const channels = Array.isArray(liveStreams)
      ? liveStreams
          .filter((s: any) => s && s.stream_id)
          .map((s: any) => {
            const streamId = String(s.stream_id);
            const streamBase = `${base}/live/${user}/${pass}/${streamId}`;
            return {
              id: streamId,
              name: (s.name || '').trim() || `Canal ${streamId}`,
              logo: (s.stream_icon || '').trim() || null,
              categoryId: String(s.category_id || ''),
              url: `${streamBase}.m3u8`,
              altUrl: `${streamBase}.ts`,
              type: 'live',
            };
          })
      : [];

    // VOD (Movies) - Sorted with most recent releases first
    const vodCats = vodCatResp.status === 'fulfilled' && vodCatResp.value.ok ? await vodCatResp.value.json() : [];
    const vodStreams = vodStreamResp.status === 'fulfilled' && vodStreamResp.value.ok ? await vodStreamResp.value.json() : [];

    const movieCategories = Array.isArray(vodCats)
      ? vodCats.map((c: any) => ({
          id: `movie_${c.category_id}`,
          name: (c.category_name || '').trim() || 'Películas',
          type: 'movie',
        }))
      : [];

    const movies = (Array.isArray(vodStreams) ? vodStreams : [])
      .map((m: any) => {
        const streamId = String(m.stream_id);
        const ext = m.container_extension || 'mp4';
        const rawYear = m.year || (m.release_date ? m.release_date.substring(0, 4) : '') || (m.added ? new Date(parseInt(m.added) * 1000).getFullYear() : 2024);
        const numYear = parseInt(String(rawYear), 10) || 2024;
        return {
          id: `m_${streamId}`,
          title: (m.name || '').trim() || `Película ${streamId}`,
          poster: (m.stream_icon || '').trim() || null,
          categoryId: `movie_${m.category_id}`,
          streamUrl: `${base}/movie/${user}/${pass}/${streamId}.${ext}`,
          rating: m.rating || 7.5,
          year: numYear,
          added: m.added || 0,
          type: 'movie',
        };
      })
      .sort((a: any, b: any) => (b.year || 0) - (a.year || 0) || (b.added || 0) - (a.added || 0));

    // Series - Sorted with most recent releases first
    const seriesCats = seriesCatResp.status === 'fulfilled' && seriesCatResp.value.ok ? await seriesCatResp.value.json() : [];
    const seriesStreams = seriesStreamResp.status === 'fulfilled' && seriesStreamResp.value.ok ? await seriesStreamResp.value.json() : [];

    const seriesCategories = Array.isArray(seriesCats)
      ? seriesCats.map((c: any) => ({
          id: `series_${c.category_id}`,
          name: (c.category_name || '').trim() || 'Series',
          type: 'series',
        }))
      : [];

    const series = (Array.isArray(seriesStreams) ? seriesStreams : [])
      .map((s: any) => {
        const seriesId = String(s.series_id);
        const rawYear = (s.releaseDate ? s.releaseDate.substring(0, 4) : '') || s.year || (s.last_modified ? new Date(parseInt(s.last_modified) * 1000).getFullYear() : 2024);
        const numYear = parseInt(String(rawYear), 10) || 2024;
        return {
          id: `s_${seriesId}`,
          title: (s.name || '').trim() || `Serie ${seriesId}`,
          poster: (s.cover || s.stream_icon || '').trim() || null,
          categoryId: `series_${s.category_id}`,
          rating: s.rating || 8.0,
          year: numYear,
          type: 'series',
          plot: s.plot || '',
        };
      })
      .sort((a: any, b: any) => (b.year || 0) - (a.year || 0));

    res.json({
      userInfo: {
        username: info.username,
        expDate: info.exp_date ? new Date(parseInt(info.exp_date) * 1000).toLocaleDateString() : 'Ilimitada',
        status: info.status,
        maxConnections: info.max_connections,
      },
      categories,
      channels,
      movieCategories,
      movies,
      seriesCategories,
      series,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'El servidor tardó demasiado en responder.' });
      return;
    }
    res.status(500).json({
      error: err.message || 'No se pudo conectar al servidor. Revisa la dirección y el puerto.',
    });
  }
});

// M3U Playlist Fetcher Proxy
app.get('/api/iptv/m3u', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.status(400).json({ error: 'URL requerida' });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(url.trim(), {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      res.status(response.status).json({
        error: `El servidor respondió HTTP ${response.status}`,
      });
      return;
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(text);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'El servidor tardó demasiado en responder.' });
      return;
    }
    res.status(500).json({
      error: err.message || 'No se pudo conectar al servidor.',
    });
  }
});

// Multi-List Scanner & Checker Endpoint (Scan 1 to 20 lists in parallel!)
app.post('/api/iptv/scan-list', async (req: Request, res: Response) => {
  const { lists } = req.body;
  if (!Array.isArray(lists) || lists.length === 0) {
    res.status(400).json({ error: 'Lista requerida' });
    return;
  }

  const results = await Promise.all(
    lists.map(async (rawItem: any, index: number) => {
      const itemStr = typeof rawItem === 'string' ? rawItem.trim() : (rawItem.url || rawItem.host || '').trim();
      const startTime = Date.now();

      if (!itemStr) {
        return {
          id: `scan_${index}`,
          input: itemStr,
          status: 'error',
          message: 'URL o datos vacíos',
          pingMs: 0,
        };
      }

      // Check if it is an Xtream Codes format (contains username & password or host/user/pass)
      const isXtream =
        itemStr.includes('player_api.php') ||
        (rawItem.type === 'XTREAM') ||
        (rawItem.username && rawItem.password);

      if (isXtream) {
        try {
          let host = rawItem.host || '';
          let user = rawItem.username || '';
          let pass = rawItem.password || '';

          if (!host && itemStr.includes('username=') && itemStr.includes('password=')) {
            const urlObj = new URL(itemStr);
            host = `${urlObj.protocol}//${urlObj.host}`;
            user = urlObj.searchParams.get('username') || '';
            pass = urlObj.searchParams.get('password') || '';
          }

          const base = normalizeHost(host);
          const api = `${base}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 8000);

          const resp = await fetch(api, {
            headers: { 'User-Agent': USER_AGENT },
            signal: controller.signal,
          });
          clearTimeout(tid);
          const pingMs = Date.now() - startTime;

          if (!resp.ok) {
            return {
              id: `scan_${index}`,
              title: host,
              input: itemStr,
              type: 'XTREAM',
              status: 'offline',
              message: `HTTP ${resp.status}`,
              pingMs,
            };
          }

          const data = await resp.json();
          const info = data?.user_info;
          const serverInfo = data?.server_info;

          if (!info || info.auth !== 1) {
            return {
              id: `scan_${index}`,
              title: host,
              input: itemStr,
              type: 'XTREAM',
              status: 'auth_failed',
              message: 'Credenciales inválidas',
              pingMs,
            };
          }

          const expFormatted = info.exp_date ? new Date(parseInt(info.exp_date) * 1000).toLocaleDateString() : 'Ilimitada';

          return {
            id: `scan_${index}`,
            title: serverInfo?.server_name || host,
            host,
            username: user,
            type: 'XTREAM',
            status: info.status?.toLowerCase() === 'active' ? 'active' : 'expired',
            statusText: info.status || 'Active',
            expiration: expFormatted,
            maxConnections: info.max_connections || '1',
            activeConnections: info.active_cons || '0',
            message: 'Conexión verificada',
            pingMs,
          };
        } catch (e: any) {
          return {
            id: `scan_${index}`,
            input: itemStr,
            type: 'XTREAM',
            status: 'error',
            message: e.name === 'AbortError' ? 'Tiempo de espera agotado' : 'No responde',
            pingMs: Date.now() - startTime,
          };
        }
      } else {
        // Standard M3U URL scan
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 12000);

          const resp = await fetch(itemStr, {
            headers: { 'User-Agent': USER_AGENT },
            signal: controller.signal,
          });
          clearTimeout(tid);
          const pingMs = Date.now() - startTime;

          if (!resp.ok) {
            return {
              id: `scan_${index}`,
              title: itemStr.split('/').pop() || itemStr,
              input: itemStr,
              type: 'M3U',
              status: 'offline',
              message: `HTTP ${resp.status}`,
              pingMs,
            };
          }

          const text = await resp.text();
          const lines = text.split(/\r?\n/);
          let countChannels = 0;
          let countMovies = 0;
          let countSeries = 0;

          for (const line of lines) {
            if (line.startsWith('#EXTINF')) {
              const lower = line.toLowerCase();
              if (lower.includes('vod') || lower.includes('pelicula') || lower.includes('movie')) {
                countMovies++;
              } else if (lower.includes('serie') || lower.includes('series')) {
                countSeries++;
              } else {
                countChannels++;
              }
            }
          }

          return {
            id: `scan_${index}`,
            title: itemStr.split('/').pop()?.split('?')[0] || 'Lista M3U',
            input: itemStr,
            type: 'M3U',
            status: 'active',
            totalItems: countChannels + countMovies + countSeries,
            channels: countChannels,
            movies: countMovies,
            series: countSeries,
            sizeKb: Math.round(text.length / 1024),
            message: 'Lista válida y activa',
            pingMs,
          };
        } catch (e: any) {
          return {
            id: `scan_${index}`,
            input: itemStr,
            type: 'M3U',
            status: 'error',
            message: e.name === 'AbortError' ? 'Tiempo de espera agotado' : 'Error de conexión',
            pingMs: Date.now() - startTime,
          };
        }
      }
    })
  );

  res.json({ results });
});

// Direct Media Stream Proxy
app.get('/api/proxy/stream', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send('URL is required');
    return;
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const resp = await fetch(targetUrl, { headers });
    res.status(resp.status);

    const ct = resp.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    const cr = resp.headers.get('content-range');
    if (cr) res.setHeader('content-range', cr);
    const cl = resp.headers.get('content-length');
    if (cl) res.setHeader('content-length', cl);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!resp.body) {
      res.end();
      return;
    }

    const reader = resp.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };
    await pump();
  } catch (e: any) {
    res.status(502).send(e.message || 'Proxy streaming error');
  }
});

// Rich Cyberpunk Demo Data with 3D Carousel Movie Posters & Live Channels
app.get('/api/iptv/demo', (_req: Request, res: Response) => {
  res.json({
    categories: [
      { id: 'cat_all', name: 'Todos los Canales' },
      { id: 'cat_news', name: 'Noticias Cyber' },
      { id: 'cat_sci', name: 'Ciencia & Espacio' },
      { id: 'cat_action', name: 'Acción & Anime' },
      { id: 'cat_music', name: 'Synthwave & Música' },
    ],
    channels: [
      {
        id: '1',
        name: 'NASA TV 4K Ultra Sci-Fi',
        logo: 'https://images.nasa.gov/images/nasa_logo-large.ee5daa0f.png',
        categoryId: 'cat_sci',
        url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
      },
      {
        id: '2',
        name: 'France 24 Cyber Stream',
        logo: 'https://s.france24.com/assets/f24/apple-touch-icon.png',
        categoryId: 'cat_news',
        url: 'https://static.france24.com/live/F24_ES_LO_HLS/live_es.m3u8',
      },
      {
        id: '3',
        name: 'Deutsche Welle Live Matrix',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_logo.svg/240px-Deutsche_Welle_logo.svg.png',
        categoryId: 'cat_news',
        url: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8',
      },
      {
        id: '4',
        name: 'Red Bull Extreme Pulse',
        logo: 'https://images.redbull.com/image/upload/c_fill,w_360,h_360/q_auto,f_auto/redbullcom/2020/6/17/i9p8e21wyl0u4sftz7ev/red-bull-tv-logo',
        categoryId: 'cat_music',
        url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
      },
      {
        id: '5',
        name: 'Cyber Test Feed 60FPS',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/220px-Big_buck_bunny_poster_big.jpg',
        categoryId: 'cat_action',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      },
    ],
    movieCategories: [
      { id: 'mcat_all', name: 'Todo el Cine' },
      { id: 'mcat_cyber', name: 'Cyberpunk & Sci-Fi' },
      { id: 'mcat_action', name: 'Acción Extrema' },
      { id: 'mcat_synth', name: 'Futurista & Espacial' },
    ],
    movies: [
      {
        id: 'mov_1',
        title: 'Tears of Steel (Cyber Revolution)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tears_of_Steel_poster.jpg/440px-Tears_of_Steel_poster.jpg',
        backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_cyber',
        streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        rating: 9.2,
        year: 2025,
        genre: 'Cyberpunk / Sci-Fi',
        duration: '1h 52m',
        synopsis: 'En una Ámsterdam distópica reconstruida con implantes neuronales y robótica de guerra, un grupo de hackers y científicos intentan reescribir la memoria de una inteligencia artificial suprema antes del colapso total.',
      },
      {
        id: 'mov_2',
        title: 'Sintel: The Dragon Hunter',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/440px-Sintel_poster.jpg',
        backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_action',
        streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
        rating: 8.8,
        year: 2024,
        genre: 'Fantasía / Aventura Épica',
        duration: '1h 35m',
        synopsis: 'Una solitaria guerrera recorre desiertos cyberpunk y ruinas glaciares para rescatar a su dragón fénix de las garras de los señores mecánicos.',
      },
      {
        id: 'mov_3',
        title: 'Neo-Tokyo Overdrive (Akira Tribute)',
        poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_cyber',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        rating: 9.6,
        year: 2026,
        genre: 'Anime / Cyberpunk',
        duration: '2h 10m',
        synopsis: 'Motos con luces de neón en autopistas subterráneas, poderes telequinéticos desatados y la conspiración del Proyecto CAOS en las profundidades de la megaciudad.',
      },
      {
        id: 'mov_4',
        title: 'Matrix Redux: Protocol Zero',
        poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_cyber',
        streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
        rating: 9.4,
        year: 2025,
        genre: 'Acción / Cyber Thriller',
        duration: '2h 05m',
        synopsis: 'La realidad es solo un holograma proyectado en los nervios ópticos de la humanidad. Un operador rebelde encuentra la frecuencia para despertar a los cautivos.',
      },
      {
        id: 'mov_5',
        title: 'Blade Protocol: 2099',
        poster: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_synth',
        streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        rating: 8.9,
        year: 2024,
        genre: 'Neo-Noir / Sci-Fi',
        duration: '1h 58m',
        synopsis: 'Bajo la lluvia ácida perpetua y los carteles holográficos gigantescos, un detective mejorado con implantes cibernéticos busca a los replicantes descarriados.',
      },
      {
        id: 'mov_6',
        title: 'Big Buck Bunny (Cyber Forest Edition)',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/440px-Big_buck_bunny_poster_big.jpg',
        backdrop: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_action',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        rating: 8.5,
        year: 2023,
        genre: 'Animación 4K',
        duration: '1h 20m',
        synopsis: 'El clásico animado remasterizado con máxima fidelidad de color y sonido envolvente multicanal.',
      },
      {
        id: 'mov_7',
        title: 'Cosmic Odyssey: Deep Space Horizon',
        poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_synth',
        streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
        rating: 9.7,
        year: 2026,
        genre: 'Espacial / Documental Sci-Fi',
        duration: '2h 15m',
        synopsis: 'Un viaje más allá de la nube de Oort explorando agujeros de gusano y estaciones orbitales de energía antimateria.',
      },
      {
        id: 'mov_8',
        title: 'Ghost In The Circuit',
        poster: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'mcat_cyber',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        rating: 9.1,
        year: 2025,
        genre: 'Cyberpunk / Espionaje',
        duration: '1h 48m',
        synopsis: 'La comandante de la brigada de seguridad pública cibernética investiga a un hacker espectral conocido como El Marionetista.',
      },
    ],
    seriesCategories: [
      { id: 'scat_all', name: 'Todas las Series' },
      { id: 'scat_cyber', name: 'Cyberpunk & Distopías' },
      { id: 'scat_synth', name: 'Space Operas' },
    ],
    series: [
      {
        id: 'ser_1',
        title: 'Cyberpunk: Edgerunners Universe',
        poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'scat_cyber',
        rating: 9.8,
        year: 2025,
        seasons: 2,
        episodes: 20,
        genre: 'Anime / Acción Cyberpunk',
        plot: 'Un chico de la calle intentando sobrevivir en una ciudad obsesionada con la tecnología y la modificación corporal. Lo pierde todo y elige convertirse en un Edgerunner mercenario.',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      },
      {
        id: 'ser_2',
        title: 'Altered Minds: Neomalla',
        poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'scat_cyber',
        rating: 9.1,
        year: 2024,
        seasons: 3,
        episodes: 28,
        genre: 'Cyberpunk / Misterio',
        plot: 'En un futuro donde la conciencia humana puede digitalizarse y transferirse a nuevos cuerpos, un ex-soldado de élite es contratado para resolver un asesinato casi imposible.',
        streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      },
      {
        id: 'ser_3',
        title: 'Chronos Station: Alpha',
        poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
        categoryId: 'scat_synth',
        rating: 8.9,
        year: 2026,
        seasons: 1,
        episodes: 12,
        genre: 'Space Opera',
        plot: 'La tripulación de la estación Chronos descubre una anomalía cuántica en el borde del sistema solar que comienza a distorsionar las líneas temporales.',
        streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      },
    ],
  });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CAOS TV running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
