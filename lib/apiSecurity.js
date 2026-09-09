const { createClerkClient } = require("@clerk/backend");

const buckets = new Map();

function getHeader(req, name) {
  const value = req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getOrigin(req) {
  const explicit = getHeader(req, "origin");
  if (explicit) return explicit;
  const proto = getHeader(req, "x-forwarded-proto") || "https";
  const host = getHeader(req, "x-forwarded-host") || getHeader(req, "host");
  return host ? `${proto}://${host}` : "http://localhost";
}

function toWebRequest(req) {
  const origin = getOrigin(req);
  const path = req.url?.startsWith("/") ? req.url : `/${req.url || ""}`;
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
    else if (value != null) headers.set(name, String(value));
  }
  return new Request(new URL(path, origin), { method: req.method || "GET", headers });
}

async function requireClerkSession(req, res) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    res.status(503).json({ error: "Authentication is not configured." });
    return null;
  }

  try {
    const client = createClerkClient({ secretKey, publishableKey });
    const configuredParties = (process.env.AUTHORIZED_PARTIES || "")
      .split(",").map(value => value.trim()).filter(Boolean);
    const authorizedParties = configuredParties.length ? configuredParties : [getOrigin(req)];
    const state = await client.authenticateRequest(toWebRequest(req), {
      acceptsToken: "session_token",
      authorizedParties,
    });
    if (!state.isAuthenticated) {
      res.status(401).json({ error: "Authentication required." });
      return null;
    }
    return state.toAuth();
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
    return null;
  }
}

function requireCronSecret(req, res) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    res.status(503).json({ error: "Cron authentication is not configured." });
    return false;
  }
  const authorization = getHeader(req, "authorization") || "";
  if (authorization !== `Bearer ${expected}`) {
    res.status(401).json({ error: "Unauthorized." });
    return false;
  }
  return true;
}

function enforceRateLimit(req, res, { key, limit = 20, windowMs = 60_000 } = {}) {
  const identity = key || getHeader(req, "x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = buckets.get(identity);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  bucket.count += 1;
  buckets.set(identity, bucket);
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
  if (bucket.count > limit) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return false;
  }
  return true;
}

function withInstitutionalAuth(handler, { methods = ["GET"], limit = 120 } = {}) {
  return async function protectedHandler(req, res) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("Cache-Control", "private, no-store");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (!methods.includes(req.method)) {
      res.setHeader("Allow", methods.join(", "));
      return res.status(405).json({ error: "Method not allowed.", requestId });
    }

    const auth = await requireClerkSession(req, res);
    if (!auth) return;
    const routeKey = String(req.url || "api").split("?", 1)[0];
    if (!enforceRateLimit(req, res, { key: `api:${auth.userId}:${routeKey}`, limit, windowMs: 60_000 })) return;

    const originalSetHeader = res.setHeader.bind(res);
    const originalJson = res.json.bind(res);
    res.setHeader = (name, value) => {
      if (String(name).toLowerCase() === "cache-control") {
        return originalSetHeader(name, "private, no-store");
      }
      return originalSetHeader(name, value);
    };
    res.json = body => {
      if (res.statusCode >= 500) {
        console.error(`[${requestId}] upstream API error`, body?.error || body);
        return originalJson({ error: "Upstream service unavailable.", requestId });
      }
      return originalJson(body);
    };

    try {
      return await handler(req, res, auth);
    } catch (error) {
      console.error(`[${requestId}] unhandled API error`, error);
      if (!res.headersSent) return res.status(500).json({ error: "Internal server error.", requestId });
    }
  };
}

module.exports = { enforceRateLimit, requireClerkSession, requireCronSecret, withInstitutionalAuth };
