import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '../data/models';
import { AccountStore } from '../data/accountStore';
import { ChannelRepository } from '../data/channelRepository';
import { IptvClient } from '../data/iptvClient';
import { Tv, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

interface LoginActivityProps {
  onLoginSuccess: () => void;
}

export const LoginActivity: React.FC<LoginActivityProps> = ({ onLoginSuccess }) => {
  const [accountType, setAccountType] = useState<AccountType>('XTREAM');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [m3uUrl, setM3uUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill existing account if available
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
        setError('Escribe la URL de la lista M3U');
        return;
      }
      account = { type: 'M3U', m3uUrl: url };
    } else {
      const h = host.trim();
      const u = username.trim();
      const p = password.trim();

      if (!h || !u || !p) {
        setError('Completa servidor, usuario y contraseña');
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
    try {
      await ChannelRepository.load(account);
      AccountStore.save(account);
      onLoginSuccess();
    } catch (err: any) {
      setError(IptvClient.friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setError(null);
    setLoading(true);
    const demoAccount: Account = {
      type: 'M3U',
      host: '__DEMO__',
      m3uUrl: 'https://demo.caos.tv/live.m3u',
    };
    try {
      await ChannelRepository.load(demoAccount);
      AccountStore.save(demoAccount);
      onLoginSuccess();
    } catch (err: any) {
      setError(IptvClient.friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0E0F14] text-[#F2F4F8] p-6">
      <div className="w-full max-w-[520px] bg-[#181A22] border border-[#2A2F45] rounded-xl p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-[#4F8CFF]/15 flex items-center justify-center text-[#4F8CFF]">
            <Tv size={26} />
          </div>
          <h1 className="text-[34px] font-bold text-[#4F8CFF] leading-none tracking-wide">
            CAOS TV
          </h1>
        </div>

        <p className="text-[16px] text-[#9AA3B5] mb-6">
          Conecta tu servicio IPTV
        </p>

        {/* Radio selector */}
        <div className="flex gap-6 mb-6 border-b border-[#2A2F45] pb-4">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[15px] select-none">
            <input
              type="radio"
              name="accountType"
              value="XTREAM"
              checked={accountType === 'XTREAM'}
              onChange={() => {
                setAccountType('XTREAM');
                setError(null);
              }}
              className="w-4 h-4 text-[#4F8CFF] accent-[#4F8CFF] cursor-pointer"
            />
            <span className={accountType === 'XTREAM' ? 'text-[#F2F4F8]' : 'text-[#9AA3B5]'}>
              Xtream Codes
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-[15px] select-none">
            <input
              type="radio"
              name="accountType"
              value="M3U"
              checked={accountType === 'M3U'}
              onChange={() => {
                setAccountType('M3U');
                setError(null);
              }}
              className="w-4 h-4 text-[#4F8CFF] accent-[#4F8CFF] cursor-pointer"
            />
            <span className={accountType === 'M3U' ? 'text-[#F2F4F8]' : 'text-[#9AA3B5]'}>
              Lista M3U (URL)
            </span>
          </label>
        </div>

        {/* Form fields */}
        <form onSubmit={handleConnect} className="space-y-4">
          {accountType === 'XTREAM' ? (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Servidor (http://dominio:puerto)"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-[#0E0F14] border border-[#2A2F45] focus:border-[#4F8CFF] focus:outline-none rounded-lg text-[#F2F4F8] placeholder-[#9AA3B5]/60 text-[16px] transition-colors"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-[#0E0F14] border border-[#2A2F45] focus:border-[#4F8CFF] focus:outline-none rounded-lg text-[#F2F4F8] placeholder-[#9AA3B5]/60 text-[16px] transition-colors"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  className="w-full pl-4 pr-11 py-3 bg-[#0E0F14] border border-[#2A2F45] focus:border-[#4F8CFF] focus:outline-none rounded-lg text-[#F2F4F8] placeholder-[#9AA3B5]/60 text-[16px] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B5] hover:text-[#F2F4F8] p-1 rounded transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </>
          ) : (
            <div>
              <input
                type="text"
                placeholder="URL de la lista M3U"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                disabled={loading}
                autoComplete="off"
                className="w-full px-4 py-3 bg-[#0E0F14] border border-[#2A2F45] focus:border-[#4F8CFF] focus:outline-none rounded-lg text-[#F2F4F8] placeholder-[#9AA3B5]/60 text-[16px] transition-colors"
              />
            </div>
          )}

          {/* Connect button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 bg-[#4F8CFF] hover:bg-[#3D78EB] active:bg-[#2F65CE] text-white font-semibold text-[18px] rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4F8CFF]/20 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              'Conectar'
            )}
          </button>
        </form>

        {/* Demo channel quick access button */}
        <div className="mt-5 pt-4 border-t border-[#2A2F45]/60 text-center">
          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[14px] text-[#4F8CFF] hover:text-[#78A8FF] transition-colors font-medium cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Probar con canales de demostración libres (NASA, DW, France 24...)</span>
          </button>
        </div>

        {/* Status Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-[#FF8A80]/10 border border-[#FF8A80]/30 rounded-lg text-[#FF8A80] text-[15px] text-center font-medium leading-relaxed animate-in fade-in">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
