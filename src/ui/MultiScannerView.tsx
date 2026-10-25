import React, { useState } from 'react';
import { SearchCheck, Loader2, Play, CheckCircle2, XCircle, AlertTriangle, Sparkles, Copy, Trash2, Globe } from 'lucide-react';
import { IptvClient } from '../data/iptvClient';
import { ScanResult, Account } from '../data/models';
import { ChannelRepository } from '../data/channelRepository';
import { AccountStore } from '../data/accountStore';
import { cyberSound } from '../components/CyberSound';

interface MultiScannerViewProps {
  onLoadListIntoPlayer: () => void;
}

export const MultiScannerView: React.FC<MultiScannerViewProps> = ({ onLoadListIntoPlayer }) => {
  const [inputText, setInputText] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Preload 10 sample lists/servers for instant test
  const handleLoadSamples = () => {
    cyberSound.click();
    const samples = [
      'https://iptv-org.github.io/iptv/index.m3u',
      'https://iptv-org.github.io/iptv/countries/es.m3u',
      'https://iptv-org.github.io/iptv/countries/mx.m3u',
      'https://iptv-org.github.io/iptv/categories/news.m3u',
      'https://iptv-org.github.io/iptv/categories/movies.m3u',
      'https://iptv-org.github.io/iptv/categories/animation.m3u',
      'http://demo-server.iptv.tv:8080/player_api.php?username=demouser&password=demopassword',
      'https://iptv-org.github.io/iptv/categories/documentary.m3u',
      'https://iptv-org.github.io/iptv/categories/music.m3u',
      'http://test-expired.stream.net:80/player_api.php?username=testuser&password=expiredpass',
    ].join('\n');
    setInputText(samples);
  };

  const handleScan = async () => {
    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) {
      setError('Pega al menos una URL o lista para escanear');
      return;
    }

    setError(null);
    setScanning(true);
    cyberSound.warp();

    try {
      const scanResults = await IptvClient.scanLists(lines);
      setResults(scanResults);
      cyberSound.click();
    } catch (err: any) {
      setError(err.message || 'Error durante el escaneo');
    } finally {
      setScanning(false);
    }
  };

  const handleActivateList = async (res: ScanResult) => {
    cyberSound.click();
    try {
      if (res.type === 'XTREAM' && res.host && res.username) {
        const acc: Account = {
          type: 'XTREAM',
          host: res.host,
          username: res.username,
          password: 'demopassword',
        };
        await ChannelRepository.load(acc);
        AccountStore.save(acc);
      } else {
        const acc: Account = {
          type: 'M3U',
          m3uUrl: res.input,
        };
        await ChannelRepository.load(acc);
        AccountStore.save(acc);
      }
      onLoadListIntoPlayer();
    } catch (e: any) {
      alert(`No se pudo cargar la lista: ${e.message}`);
    }
  };

  // Stats calculation
  const totalScanned = results.length;
  const activeCount = results.filter((r) => r.status === 'active').length;
  const inactiveCount = results.filter((r) => r.status !== 'active').length;
  const avgPing = totalScanned > 0
    ? Math.round(results.reduce((acc, cur) => acc + (cur.pingMs || 0), 0) / totalScanned)
    : 0;

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-8 bg-[#07080D] text-[#F2F4F8] relative">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2F45]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB703] shadow-[0_0_10px_#FFB703]" />
              <h2 className="text-2xl font-black font-mono tracking-wide text-white uppercase">
                ESCÁNER DE LISTAS IPTV // MULTI-CHECKER
              </h2>
            </div>
            <p className="text-sm text-[#9AA3B5]">
              Pega 10, 15 o más listas M3U o servidores Xtream simultáneamente para escanear su disponibilidad en paralelo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSamples}
              disabled={scanning}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#181A22] hover:bg-[#2A2F45] border border-[#2A2F45] text-xs font-mono text-[#00F0FF] transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              <span>CARGAR 10 LISTAS DE EJEMPLO</span>
            </button>

            {inputText && (
              <button
                onClick={() => setInputText('')}
                className="p-2 rounded-lg bg-[#181A22] hover:bg-[#2A2F45] border border-[#2A2F45] text-[#9AA3B5] hover:text-[#FF0055] transition-colors cursor-pointer"
                title="Limpiar texto"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Input Box */}
        <div className="bg-[#101424] border border-[#2A2F45] rounded-xl p-4 shadow-xl">
          <label className="block text-xs font-mono text-[#9AA3B5] uppercase mb-2 font-bold flex justify-between items-center">
            <span>PEGA TUS LISTAS (UNA POR LÍNEA)</span>
            <span className="text-[#00F0FF]">
              {inputText.split('\n').filter((l) => l.trim().length > 0).length} LISTAS DETECTADAS
            </span>
          </label>
          <textarea
            rows={5}
            placeholder={`https://servidor.com/lista1.m3u\nhttp://ip-tv.live:8080/player_api.php?username=usuario&password=clave\nhttps://servidor2.com/playlist.m3u8\n...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={scanning}
            className="w-full bg-[#07080D] border border-[#2A2F45] focus:border-[#FFB703] focus:outline-none rounded-lg p-3 text-sm font-mono text-[#F2F4F8] placeholder-[#9AA3B5]/40 resize-y"
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-[#9AA3B5]">
              Soporta listas remotas M3U, M3U8 y endpoints API de Xtream Codes.
            </div>

            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#FFAA00] hover:to-[#E67300] text-[#07080D] font-mono font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(255,183,3,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>ESCANEANDO EN PARALELO...</span>
                </>
              ) : (
                <>
                  <SearchCheck size={16} />
                  <span>ESCANEAR TODAS LAS LISTAS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-[#FF0055]/15 border border-[#FF0055]/40 rounded-xl text-[#FF0055] text-sm font-mono">
            {error}
          </div>
        )}

        {/* Stats Dashboard (when results exist) */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#101424] border border-[#2A2F45] rounded-xl p-4">
              <div className="text-xs font-mono text-[#9AA3B5]">TOTAL ANALIZADAS</div>
              <div className="text-2xl font-black font-mono text-white mt-1">{totalScanned}</div>
            </div>

            <div className="bg-[#101424] border border-[#00FF66]/30 rounded-xl p-4">
              <div className="text-xs font-mono text-[#00FF66]">ACTIVAS / EN LÍNEA</div>
              <div className="text-2xl font-black font-mono text-[#00FF66] mt-1">{activeCount}</div>
            </div>

            <div className="bg-[#101424] border border-[#FF0055]/30 rounded-xl p-4">
              <div className="text-xs font-mono text-[#FF0055]">EXPIRADAS / OFFLINE</div>
              <div className="text-2xl font-black font-mono text-[#FF0055] mt-1">{inactiveCount}</div>
            </div>

            <div className="bg-[#101424] border border-[#00F0FF]/30 rounded-xl p-4">
              <div className="text-xs font-mono text-[#00F0FF]">LATENCIA PROMEDIO</div>
              <div className="text-2xl font-black font-mono text-[#00F0FF] mt-1">{avgPing} ms</div>
            </div>
          </div>
        )}

        {/* Scan Results Table */}
        {results.length > 0 && (
          <div className="bg-[#101424] border border-[#2A2F45] rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#2A2F45] flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm tracking-wide text-white">
                RESULTADOS DEL ESCANEO ({results.length})
              </h3>
            </div>

            <div className="divide-y divide-[#2A2F45]/60 overflow-x-auto">
              {results.map((res, i) => {
                const isActive = res.status === 'active';
                return (
                  <div
                    key={res.id || i}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#181A22]/60 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-1">
                        {isActive ? (
                          <CheckCircle2 size={18} className="text-[#00FF66]" />
                        ) : res.status === 'auth_failed' ? (
                          <AlertTriangle size={18} className="text-[#FFB703]" />
                        ) : (
                          <XCircle size={18} className="text-[#FF0055]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-[#F2F4F8] truncate">
                            {res.title || `Lista #${i + 1}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isActive
                                ? 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/30'
                                : 'bg-[#FF0055]/15 text-[#FF0055] border-[#FF0055]/30'
                            }`}
                          >
                            {isActive ? 'ACTIVA' : res.status.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181A22] text-[#9AA3B5] border border-[#2A2F45]">
                            {res.type || 'M3U'}
                          </span>
                          {typeof res.pingMs === 'number' && (
                            <span className="text-[11px] font-mono text-[#9AA3B5]">
                              {res.pingMs}ms
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-mono text-[#9AA3B5] truncate mt-1">
                          {res.input}
                        </div>

                        {/* Extra Details */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#9AA3B5] flex-wrap font-mono">
                          {typeof res.channels === 'number' && (
                            <span>Canales: <strong className="text-white">{res.channels}</strong></span>
                          )}
                          {typeof res.movies === 'number' && (
                            <span>VOD Películas: <strong className="text-white">{res.movies}</strong></span>
                          )}
                          {typeof res.series === 'number' && (
                            <span>Series: <strong className="text-white">{res.series}</strong></span>
                          )}
                          {res.expiration && (
                            <span>Caducidad: <strong className="text-[#00F0FF]">{res.expiration}</strong></span>
                          )}
                          {res.maxConnections && (
                            <span>Conexiones: {res.activeConnections || 0}/{res.maxConnections}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    {isActive && (
                      <button
                        onClick={() => handleActivateList(res)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#07080D] border border-[#00F0FF]/30 font-mono text-xs font-bold transition-all shrink-0 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                      >
                        <Play size={14} fill="currentColor" />
                        <span>CARGAR EN REPRODUCTOR</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
