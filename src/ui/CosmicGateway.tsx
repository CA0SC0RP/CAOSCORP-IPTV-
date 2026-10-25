import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '../data/models';
import { AccountStore } from '../data/accountStore';
import { ChannelRepository } from '../data/channelRepository';
import { IptvClient } from '../data/iptvClient';
import { cyberSound } from '../components/CyberSound';
import { Tv, Play, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface CosmicGatewayProps {
  onSuccess: () => void;
}

export const CosmicGateway: React.FC<CosmicGatewayProps> = ({ onSuccess }) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [accountType, setAccountType] = useState<AccountType>('XTREAM');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [m3uUrl, setM3uUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = AccountStore.load();
    if (existing) {
      setAccountType(existing.type);
      setHost(existing.host || '');
      setUsername(existing.username || '');
      setPassword(existing.password || '');
      setM3uUrl(existing.m3uUrl || '');
    }
  }, []);

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    let account: Account;

    if (accountType === 'M3U') {
      const url = m3uUrl.trim();
      if (!url) {
        setError('Escribe la URL de tu lista M3U');
        return;
      }
      account = { type: 'M3U', m3uUrl: url };
    } else {
      const h = host.trim();
      const u = username.trim();
      const p = password.trim();

      if (!h || !u || !p) {
        setError('Completa Servidor, Usuario y Contraseña');
        return;
      }
      account = {
        type: 'XTREAM',
        host: IptvClient.normalizeHost(h),
        username: u,
        password: p,
      };
    }

    setLoading(true);
    cyberSound.warp();
    try {
      await ChannelRepository.load(account);
      AccountStore.save(account);
      onSuccess();
    } catch (err: any) {
      setError(IptvClient.friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    cyberSound.warp();
    const demoAccount: Account = {
      type: 'M3U',
      host: '__DEMO__',
      m3uUrl: 'https://demo.caos.tv/live.m3u',
    };
    try {
      await ChannelRepository.load(demoAccount);
      AccountStore.save(demoAccount);
      onSuccess();
    } catch (err: any) {
      setError(IptvClient.friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-[#05060B] text-[#F2F4F8] flex items-center justify-center p-6 select-none overflow-hidden">
      {/* Background Cosmic Starfield Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(0,240,255,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(255,0,85,0.08),transparent_70%)] pointer-events-none" />

      {/* Futuristic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {!showForm ? (
        /* STEP 1: Cosmic Click to Enter World */
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-[#00F0FF] via-[#7B2CBF] to-[#FF0055] p-[2px] shadow-[0_0_50px_rgba(0,240,255,0.4)] animate-pulse">
              <div className="w-full h-full bg-[#07080D] rounded-[22px] flex items-center justify-center text-[#00F0FF]">
                <Tv size={56} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF0055] leading-none uppercase">
            CAOSCORP
          </h1>
          <p className="text-sm font-mono text-[#00F0FF] tracking-widest mt-2 uppercase font-bold">
            SISTEMA IPTV // VOD NEXT-GEN
          </p>

          <p className="text-[15px] text-[#9AA3B5] mt-4 leading-relaxed font-sans max-w-md">
            Bienvenido al reproductor multimedia fuera de lo común. Películas, series interactivas y canales en vivo con guía EPG completa.
          </p>

          <button
            onClick={() => {
              cyberSound.click();
              setShowForm(true);
            }}
            className="mt-8 flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-[#07080D] font-mono font-black text-base tracking-wider shadow-[0_0_30px_rgba(0,240,255,0.5)] hover:shadow-[0_0_45px_rgba(0,240,255,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>INGRESAR // CONECTAR LISTA</span>
            <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        /* STEP 2: Input IPTV Credentials / M3U List */
        <div className="relative z-10 w-full max-w-[540px] bg-[#0A0D1A]/95 border-2 border-[#00F0FF]/60 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,240,255,0.25)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2F45] mb-6">
            <div>
              <h2 className="text-2xl font-black font-mono text-white tracking-wide">
                CAOSCORP
              </h2>
              <p className="text-xs font-mono text-[#00F0FF] mt-0.5 uppercase">
                CONEXIÓN DE SERVICIO IPTV
              </p>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                <input
                  type="radio"
                  name="type"
                  checked={accountType === 'XTREAM'}
                  onChange={() => setAccountType('XTREAM')}
                  className="accent-[#00F0FF]"
                />
                <span className={accountType === 'XTREAM' ? 'text-white font-bold' : 'text-[#9AA3B5]'}>
                  Xtream Codes
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                <input
                  type="radio"
                  name="type"
                  checked={accountType === 'M3U'}
                  onChange={() => setAccountType('M3U')}
                  className="accent-[#00F0FF]"
                />
                <span className={accountType === 'M3U' ? 'text-white font-bold' : 'text-[#9AA3B5]'}>
                  Lista M3U
                </span>
              </label>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            {accountType === 'XTREAM' ? (
              <>
                <div>
                  <label className="block text-[11px] font-mono text-[#9AA3B5] uppercase mb-1">
                    Servidor (http://dominio:puerto)
                  </label>
                  <input
                    type="text"
                    placeholder="http://servidor-iptv.com:8080"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#07080D] border border-[#2A2F45] focus:border-[#00F0FF] focus:outline-none rounded-xl text-white font-mono text-sm placeholder-[#9AA3B5]/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#9AA3B5] uppercase mb-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    placeholder="Usuario IPTV"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#07080D] border border-[#2A2F45] focus:border-[#00F0FF] focus:outline-none rounded-xl text-white font-mono text-sm placeholder-[#9AA3B5]/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#9AA3B5] uppercase mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-4 pr-12 py-3 bg-[#07080D] border border-[#2A2F45] focus:border-[#00F0FF] focus:outline-none rounded-xl text-white font-mono text-sm placeholder-[#9AA3B5]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B5] hover:text-white p-1 cursor-pointer"
                      title={showPassword ? 'Ocultar' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] font-mono text-[#9AA3B5] uppercase mb-1">
                  URL de la lista M3U / M3U8
                </label>
                <input
                  type="text"
                  placeholder="https://servidor.com/playlist.m3u"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#07080D] border border-[#2A2F45] focus:border-[#00F0FF] focus:outline-none rounded-xl text-white font-mono text-sm placeholder-[#9AA3B5]/40"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-[#00F0FF] to-[#0088FF] hover:from-[#38F9D7] hover:to-[#00F0FF] text-[#07080D] font-mono font-black text-sm tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>SINCRONIZANDO LISTA...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>CONECTAR Y ACCEDER A PELÍCULAS</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test */}
          <div className="mt-5 pt-4 border-t border-[#2A2F45] text-center">
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#00F0FF] hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              <span>INICIO RÁPIDO CON CONTENIDO LIBRE (NASA, CINE 4K, DW...)</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-[#FF0055]/15 border border-[#FF0055]/40 rounded-xl text-[#FF0055] text-xs font-mono text-center">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
