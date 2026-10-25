export interface ParsedXtream {
  host: string;
  username: string;
  password: string;
  isFullUrl: boolean;
}

/**
 * Intelligent parser for Xtream Codes IPTV links and text snippets.
 * Supports:
 * - Full get.php URLs (e.g. http://server.com:8080/get.php?username=abc&password=123)
 * - player_api.php URLs (e.g. http://server.com:8080/player_api.php?username=abc&password=123)
 * - Stream URLs (e.g. http://server.com:8080/live/user/pass/123.ts)
 * - Basic auth URLs (e.g. http://user:pass@server.com:8080)
 * - Text blocks from WhatsApp/Telegram with Host:, User:, Pass: labels
 * - Standard server host (e.g. http://server.com:8080)
 */
export function parseXtreamCredentials(rawInput: string): ParsedXtream {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { host: '', username: '', password: '', isFullUrl: false };
  }

  let extractedHost = '';
  let extractedUser = '';
  let extractedPass = '';
  let isFull = false;

  // 1. Check if multiline text block (common WhatsApp / Telegram / Email format)
  if (trimmed.includes('\n') || trimmed.toLowerCase().includes('usuario:') || trimmed.toLowerCase().includes('user:')) {
    const lines = trimmed.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const hostMatch = line.match(/(?:host|url|servidor|server|dns|enlace)\s*[:=]\s*(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+:\d+)/i);
      if (hostMatch && !extractedHost) {
        extractedHost = hostMatch[1].trim();
      }

      const userMatch = line.match(/(?:usuario|user|username|m3u_user|cuenta|login)\s*[:=]\s*([^\s]+)/i);
      if (userMatch && !extractedUser) {
        extractedUser = userMatch[1].trim();
      }

      const passMatch = line.match(/(?:contrase[ñn]a|pass|password|clave|pin)\s*[:=]\s*([^\s]+)/i);
      if (passMatch && !extractedPass) {
        extractedPass = passMatch[1].trim();
      }
    }
  }

  // 2. Parse URL patterns (query parameters, path parts, or basic auth)
  try {
    // If it's a domain:port without protocol, prepend http:// so URL can parse it
    let candidate = trimmed;
    // Extract first URL if inside text
    const urlInText = trimmed.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (urlInText) {
      candidate = urlInText[1];
    } else if (/^[a-zA-Z0-9.-]+:\d+/i.test(trimmed)) {
      candidate = `http://${trimmed}`;
    }

    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
      const parsed = new URL(candidate);

      // Check Basic Auth (http://user:pass@host:port)
      if (parsed.username && !extractedUser) {
        extractedUser = decodeURIComponent(parsed.username);
      }
      if (parsed.password && !extractedPass) {
        extractedPass = decodeURIComponent(parsed.password);
      }

      // Check Query Params (?username=...&password=...)
      const qUser =
        parsed.searchParams.get('username') ||
        parsed.searchParams.get('user') ||
        parsed.searchParams.get('u');
      const qPass =
        parsed.searchParams.get('password') ||
        parsed.searchParams.get('pass') ||
        parsed.searchParams.get('p');

      if (qUser && !extractedUser) {
        extractedUser = qUser;
      }
      if (qPass && !extractedPass) {
        extractedPass = qPass;
      }

      // Check Xtream Stream Path (/live/user/pass/... or /movie/user/pass/... or /series/user/pass/...)
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (
        (parts[0] === 'live' || parts[0] === 'movie' || parts[0] === 'series') &&
        parts.length >= 3
      ) {
        if (!extractedUser) extractedUser = parts[1];
        if (!extractedPass) extractedPass = parts[2];
      }

      // Extract clean host (http://domain.com:port)
      if (!extractedHost) {
        extractedHost = `${parsed.protocol}//${parsed.host}`;
      }
    }
  } catch {
    // Non-fatal, fallback to regex / string cleanup
  }

  // 3. Fallback regex search if query params were in a non-standard URL string
  if (!extractedUser) {
    const uMatch = trimmed.match(/[?&]username=([^&\s]+)/i) || trimmed.match(/[?&]user=([^&\s]+)/i);
    if (uMatch) extractedUser = decodeURIComponent(uMatch[1]);
  }
  if (!extractedPass) {
    const pMatch = trimmed.match(/[?&]password=([^&\s]+)/i) || trimmed.match(/[?&]pass=([^&\s]+)/i);
    if (pMatch) extractedPass = decodeURIComponent(pMatch[1]);
  }

  // 4. Clean host string (strip path, query parameters, trailing slashes)
  if (!extractedHost && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    extractedHost = trimmed.split('?')[0].split('#')[0];
  }

  // Normalize host: keep only protocol + domain:port
  if (extractedHost) {
    try {
      const u = new URL(extractedHost.startsWith('http') ? extractedHost : `http://${extractedHost}`);
      extractedHost = `${u.protocol}//${u.host}`;
    } catch {
      extractedHost = extractedHost.replace(/\/+$/, '');
    }
  }

  isFull = Boolean(extractedHost && extractedUser && extractedPass);

  return {
    host: extractedHost.replace(/\/+$/, ''),
    username: extractedUser,
    password: extractedPass,
    isFullUrl: isFull,
  };
}
