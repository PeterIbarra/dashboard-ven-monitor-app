const DEFAULT_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = "API_ERROR", url = "", cause } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.url = url;
  }
}

async function clerkAuthorization() {
  if (typeof window === "undefined") return null;
  try {
    const token = await window.Clerk?.session?.getToken?.();
    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
}

function timeoutSignal(timeoutMs, callerSignal) {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!callerSignal) return timeout;
  return typeof AbortSignal.any === "function"
    ? AbortSignal.any([callerSignal, timeout])
    : callerSignal;
}

/** Fetch an internal API route with Clerk auth, timeout and normalized errors. */
export async function apiFetch(url, options = {}) {
  if (typeof url !== "string" || !url.startsWith("/api/")) {
    throw new ApiError("El cliente interno solo admite rutas /api/.", { code: "INVALID_URL", url });
  }

  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, ...fetchOptions } = options;
  const authorization = await clerkAuthorization();
  const requestHeaders = new Headers(headers || {});
  requestHeaders.set("Accept", "application/json");
  if (authorization && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", authorization);
  }

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      signal: timeoutSignal(timeoutMs, signal),
      credentials: "same-origin",
    });
  } catch (cause) {
    const timedOut = cause?.name === "TimeoutError";
    throw new ApiError(
      timedOut ? "La solicitud excedió el tiempo de espera." : "No fue posible conectar con el servicio.",
      { code: timedOut ? "TIMEOUT" : "NETWORK_ERROR", url, cause },
    );
  }

  if (!response.ok) {
    let detail = null;
    try { detail = await response.clone().json(); } catch { /* response is not JSON */ }
    throw new ApiError(detail?.error || `La API respondió ${response.status}.`, {
      status: response.status,
      code: detail?.code || `HTTP_${response.status}`,
      url,
    });
  }
  return response;
}

export async function apiJson(url, options = {}) {
  const response = await apiFetch(url, options);
  try {
    return await response.json();
  } catch (cause) {
    throw new ApiError("La API devolvió una respuesta inválida.", {
      status: response.status,
      code: "INVALID_JSON",
      url,
      cause,
    });
  }
}

const DATE_KEYS = ["updatedAt", "updated_at", "fetchedAt", "fetched_at", "timestamp", "date"];

/** Classify the age of an API payload without inventing a timestamp. */
export function getDataFreshness(payload, { maxAgeMs = 15 * 60 * 1000, now = Date.now() } = {}) {
  const candidate = DATE_KEYS.map(key => payload?.[key]).find(Boolean);
  const numeric = typeof candidate === "number"
    ? (candidate < 1e12 ? candidate * 1000 : candidate)
    : NaN;
  const timestamp = candidate ? (Number.isFinite(numeric) ? numeric : Date.parse(candidate)) : NaN;
  if (!Number.isFinite(timestamp)) return { status: "unknown", ageMs: null, timestamp: null };
  const ageMs = Math.max(0, now - timestamp);
  return { status: ageMs <= maxAgeMs ? "fresh" : "stale", ageMs, timestamp: new Date(timestamp) };
}
