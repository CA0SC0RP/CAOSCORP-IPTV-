const SESSION_TTL_MS = 5 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer"
    }
  });
}

function bearer(request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function readJson(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) throw new Error("too_large");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("too_large");
  return JSON.parse(text);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/session" && request.method === "POST") {
      let body;
      try { body = await readJson(request); } catch { return json({ error: "invalid_request" }, 400); }
      if (!body || !body.publicKeyJwk || body.publicKeyJwk.kty !== "RSA" || body.publicKeyJwk.alg !== "RSA-OAEP-256") {
        return json({ error: "invalid_public_key" }, 400);
      }
      const sessionId = crypto.randomUUID();
      const phoneToken = randomToken();
      const pollToken = randomToken();
      const id = env.PAIRING_SESSIONS.idFromName(sessionId);
      const stub = env.PAIRING_SESSIONS.get(id);
      const created = await stub.fetch("https://session.internal/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          publicKeyJwk: body.publicKeyJwk,
          phoneToken,
          pollToken,
          expiresAt: Date.now() + SESSION_TTL_MS
        })
      });
      if (!created.ok) return json({ error: "session_create_failed" }, 500);
      return json({
        sessionId,
        phoneToken,
        pollToken,
        expiresInSeconds: SESSION_TTL_MS / 1000,
        pairUrl: url.origin + "/pair"
      }, 201);
    }

    const match = url.pathname.match(/^\/api\/session\/([0-9a-f-]+)\/(public-key|submit|poll|cancel)$/i);
    if (match) {
      const [, sessionId, action] = match;
      const id = env.PAIRING_SESSIONS.idFromName(sessionId);
      const stub = env.PAIRING_SESSIONS.get(id);
      if (action === "public-key" && request.method === "GET") {
        return stub.fetch("https://session.internal/public-key");
      }
      if (action === "submit" && request.method === "POST") {
        let body;
        try { body = await readJson(request); } catch { return json({ error: "invalid_request" }, 400); }
        if (!body || typeof body.ciphertext !== "string" || body.ciphertext.length > 12000) {
          return json({ error: "invalid_ciphertext" }, 400);
        }
        return stub.fetch("https://session.internal/submit", {
          method: "POST",
          headers: { authorization: "Bearer " + bearer(request), "content-type": "application/json" },
          body: JSON.stringify(body)
        });
      }
      if (action === "poll" && request.method === "GET") {
        return stub.fetch("https://session.internal/poll", {
          headers: { authorization: "Bearer " + bearer(request) }
        });
      }
      if (action === "cancel" && request.method === "POST") {
        return stub.fetch("https://session.internal/cancel", {
          method: "POST",
          headers: { authorization: "Bearer " + bearer(request) }
        });
      }
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    return env.ASSETS.fetch(request);
  }
};

export class PairingSession {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const session = await this.state.storage.get("session");
    if (url.pathname === "/create" && request.method === "POST") {
      if (session) return json({ error: "already_created" }, 409);
      let body;
      try { body = await request.json(); } catch { return json({ error: "invalid_request" }, 400); }
      await this.state.storage.put("session", {
        publicKeyJwk: body.publicKeyJwk,
        phoneToken: body.phoneToken,
        pollToken: body.pollToken,
        expiresAt: body.expiresAt,
        ciphertext: null,
        consumed: false,
        cancelled: false
      });
      return json({ ok: true }, 201);
    }
    if (!session) return json({ error: "session_not_found" }, 404);
    if (Date.now() > session.expiresAt || session.cancelled) {
      await this.state.storage.delete("session");
      return json({ error: "session_expired" }, 410);
    }
    if (url.pathname === "/public-key" && request.method === "GET") {
      return json({ publicKeyJwk: session.publicKeyJwk, expiresInSeconds: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)) });
    }
    if (url.pathname === "/submit" && request.method === "POST") {
      if (bearer(request) !== session.phoneToken) return json({ error: "unauthorized" }, 401);
      if (session.consumed || session.ciphertext) return json({ error: "already_submitted" }, 409);
      let body;
      try { body = await request.json(); } catch { return json({ error: "invalid_request" }, 400); }
      if (typeof body.ciphertext !== "string" || body.ciphertext.length > 12000) return json({ error: "invalid_ciphertext" }, 400);
      session.ciphertext = body.ciphertext;
      await this.state.storage.put("session", session);
      return json({ accepted: true }, 202);
    }
    if (url.pathname === "/poll" && request.method === "GET") {
      if (bearer(request) !== session.pollToken) return json({ error: "unauthorized" }, 401);
      if (!session.ciphertext) return json({ status: "pending" }, 200);
      const ciphertext = session.ciphertext;
      session.ciphertext = null;
      session.consumed = true;
      await this.state.storage.put("session", session);
      await this.state.storage.delete("session");
      return json({ status: "ready", ciphertext }, 200);
    }
    if (url.pathname === "/cancel" && request.method === "POST") {
      if (bearer(request) !== session.pollToken) return json({ error: "unauthorized" }, 401);
      await this.state.storage.delete("session");
      return json({ cancelled: true }, 200);
    }
    return json({ error: "not_found" }, 404);
  }
}
