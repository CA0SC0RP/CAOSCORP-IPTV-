import React, { useState, useEffect } from 'react';
import { Account } from '../data/models';
import { AccountStore } from '../data/accountStore';
import { ChannelRepository } from '../data/channelRepository';
import { IptvClient } from '../data/iptvClient';
import { parseXtreamCredentials } from '../data/xtreamParser';
import { cyberSound } from '../components/CyberSound';
import {
  Tv,
  Play,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  CheckCircle2,
  Trash2,
  Server,
  User,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

interface CosmicGatewayProps {
  onSuccess: () => void;
}

export const CosmicGateway: React.FC<CosmicGatewayProps> = ({ onSuccess }) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoFilled, setAutoFilled] = useState<boolean>(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = AccountStore.load();
    if (existing && existing.type === 'XTREAM') {
      setHost(existing.host || '');
      setUsername(existing.username || '');
      setPassword(existing.password || '');
    }
  }, []);

  // Intelligent parser handler when pasting or typing into the server input
  const processXtreamInput = (inputVal: string) => {
    const parsed = parseXtreamCredentials(inputVal);

    if (parsed.username || parsed.password) {
      setHost(parsed.host || inputVal);
      if (parsed.username) setUsername(parsed.username);
      if (parsed.password) setPassword(parsed.password);
      setAutoFilled(true);
      setPasteNotice('¡Enlace detectado! Servidor, usuario y contraseña copiados automáticamente.');
      cyberSound.warp();
      setTimeout(() => {
        setAutoFilled(false);
        setPasteNotice(null);
      }, 7000);
    } else {
      setHost(inputVal);
    }
  };

  const handlePasteAll = async () => {
    cyberSound.click();
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          processXtreamInput(text);
          return;
        }
      }
    } catch {
      // If clipboard permission is restricted, prompt or focus
    }

    const userInput = window.prompt(
      'Pega aquí el enlace completo de tu IPTV (get.php, player_api.php) o el mensaje de tu proveedor:'
    );
    if (userInput && userInput.trim()) {
      processXtreamInput(userInput);
    }
  };

  const handleClearAll = () => {
    cyberSound.click();
    setHost('');
    setUsername('');
    setPassword('');
    setAutoFilled(false);
    setPasteNotice(null);
    setError(null);
  };

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const h = host.trim();
    const u = username.trim();
    const p = password.trim();

    if (!h || !u || !p) {
      setError('Completa Servidor, Usuario y Contraseña (o pega el enlace completo arriba)');
      return;
    }

    const account: Account = {
      type: 'XTREAM',
      host: IptvClient.normalizeHost(h),
      username: u,
      password: p,
    };

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
    <div className="relative h-screen w-screen bg-[#04060E] text-[#F2F4F8] flex items-center justify-center p-6 select-none overflow-hidden">
      {/* Background Cosmic Starfield Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(0,240,255,0.14),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(255,0,85,0.1),transparent_70%)] pointer-events-none" />

      {/* Futuristic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {!showForm ? (
        /* STEP 1: Cosmic Click to Enter World */
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-[#00F0FF] via-[#7B2CBF] to-[#FF0055] p-[2px] shadow-[0_0_50px_rgba(0,240,255,0.45)] animate-pulse">
              <div className="w-full h-full bg-[#07080D] rounded-[22px] flex items-center justify-center text-[#00F0FF]">
                <Tv size={56} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF0055] leading-none uppercase">
            CAOSCORP
          </h1>
          <p className="text-sm font-mono text-[#00F0FF] tracking-widest mt-2 uppercase font-bold">
            SISTEMA IPTV // XTREAM CODES
          </p>

          <p className="text-[15px] text-[#9AA3B5] mt-4 leading-relaxed font-sans max-w-md">
            Reproductor con tendedero de fotografías Kodak para películas y series, organizador por carpetas del servidor y televisión en vivo con EPG.
          </p>

          <button
            onClick={() => {
              cyberSound.click();
              setShowForm(true);
            }}
            className="mt-8 flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-[#07080D] font-mono font-black text-base tracking-wider shadow-[0_0_30px_rgba(0,240,255,0.5)] hover:shadow-[0_0_45px_rgba(0,240,255,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>INGRESAR // XTREAM CODES</span>
            <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        /* STEP 2: Xtream Codes Input with Intelligent Auto-Copy */
        <div className="relative z-10 w-full max-w-[560px] bg-[#0A0D1A]/95 border-2 border-[#00F0FF]/60 rounded-3xl p-7 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.25)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Header without M3U radio options - strictly Xtream Codes */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1E294B] mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black font-mono text-white tracking-wide">
                  CAOSCORP
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-mono font-black tracking-wider">
                  XTREAM CODES
                </span>
              </div>
              <p className="text-xs font-mono text-[#8EA0BE] mt-1">
                Conexión directa por API Xtream Codes
              </p>
            </div>

            {(host || username || password) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141C36] hover:bg-[#FF0055]/20 hover:text-[#FF0055] text-[#8EA0BE] text-xs font-mono transition-colors cursor-pointer"
                title="Limpiar todos los campos"
              >
                <Trash2 size={13} />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Quick Paste All Button (Todo en uno) */}
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-[#00F0FF]/10 via-[#0099FF]/10 to-[#7B2CBF]/10 border border-[#00F0FF]/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                  <ClipboardPaste size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                    TODO EN UNO AUTOMÁTICO
                  </h4>
                  <p className="text-[11px] text-[#8EA0BE] font-sans">
                    Pega tu enlace IPTV completo y se copian servidor, usuario y contraseña de un solo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasteAll}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#38F9D7] text-black text-xs font-mono font-black tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <ClipboardPaste size={14} />
                <span>PEGAR TODO</span>
              </button>
            </div>
          </div>

          {/* Auto-fill Success Badge */}
          {pasteNotice && (
            <div className="mb-4 p-3 bg-[#00FF88]/15 border border-[#00FF88]/40 rounded-xl text-[#00FF88] text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{pasteNotice}</span>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            {/* Host / Server Input with Auto-Copy on change/paste */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono font-bold text-[#8EA0BE] uppercase flex items-center gap-1.5">
                  <Server size={13} className="text-[#00F0FF]" />
                  <span>Dirección del Servidor (URL o Enlace Completo)</span>
                </label>
                <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20">
                  Auto-detección activa
                </span>
              </div>
              <input
                type="text"
                placeholder="http://servidor-iptv.com:8080 (o pega aquí tu enlace completo)"
                value={host}
                onChange={(e) => processXtreamInput(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-[#07080D] border border-[#232F52] focus:border-[#00F0FF] focus:outline-none rounded-xl text-white font-mono text-sm placeholder-[#64748B] shadow-inner transition-colors"
              />
              <p className="text-[10px] text-[#64748B] font-mono mt-1">
                Tip: Si pegas aquí un enlace tipo <code>get.php?username=...&password=...</code>, se completan el usuario y la contraseña automáticamente.
              </p>
            </div>

            {/* Username Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono font-bold text-[#8EA0BE] uppercase flex items-center gap-1.5">
                  <User size={13} className="text-[#00F0FF]" />
                  <span>Usuario</span>
                </label>
                {username && (
                  <span className="text-[10px] font-mono text-[#00FF88] flex items-center gap-1">
                    <CheckCircle2 size={10} /> Copiado
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Usuario IPTV"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-[#07080D] border border-[#232F52] focus:border-[#00F0FF] focus:outline-none rounded-xl text-white font-mono text-sm placeholder-[#64748B] shadow-inner transition-colors"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono font-bold text-[#8EA0BE] uppercase flex items-center gap-1.5">
                  <KeyRound size={13} className="text-[#00F0FF]" />
                  <span>Contraseña</span>
                </label>
                {password && (
                  <span className="text-[10px] font-mono text-[#00FF88] flex items-center gap-1">
                    <CheckCircle2 size={10} /> Copiada
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-4 pr-12 py-3 bg-[#07080D] border border-[#232F52] focus:border-[#00F0FF] focus:outline-none rounded-xl text-white font-mono text-sm placeholder-[#64748B] shadow-inner transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8EA0BE] hover:text-white p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-4 bg-gradient-to-r from-[#00F0FF] via-[#0099FF] to-[#0066FF] hover:from-[#38F9D7] hover:to-[#00F0FF] text-[#07080D] font-mono font-black text-sm tracking-wider rounded-2xl transition-all shadow-[0_0_25px_rgba(0,240,255,0.45)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-black" />
                  <span>CONECTANDO SERVIDOR XTREAM...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>CONECTAR Y ACCEDER AL CATÁLOGO</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Option */}
          <div className="mt-5 pt-4 border-t border-[#1E294B] text-center">
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#00F0FF] hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              <span>PROBAR CON CONTENIDO DEMO (CINE, SERIES Y CANALES EN VIVO)</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3.5 bg-[#FF0055]/15 border border-[#FF0055]/40 rounded-xl text-[#FF0055] text-xs font-mono text-center animate-in fade-in">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
