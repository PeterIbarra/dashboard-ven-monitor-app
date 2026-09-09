import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/apiClient.js", import.meta.url), "utf8");
const { ApiError, apiFetch, getDataFreshness } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("apiFetch adds the active Clerk bearer token", async () => {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  globalThis.window = { Clerk:{ session:{ getToken:async () => "session-token" } } };
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get("Authorization"), "Bearer session-token");
    assert.equal(options.credentials, "same-origin");
    return new Response("{}", { status:200, headers:{ "Content-Type":"application/json" } });
  };
  await apiFetch("/api/example");
  globalThis.window = previousWindow;
  globalThis.fetch = previousFetch;
});

test("apiFetch normalizes unsuccessful HTTP responses", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error:"No autorizado", code:"AUTH" }), {
    status:401,
    headers:{ "Content-Type":"application/json" },
  });
  await assert.rejects(apiFetch("/api/example"), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.code, "AUTH");
    return true;
  });
  globalThis.fetch = previousFetch;
});

test("getDataFreshness distinguishes fresh, stale and unknown data", () => {
  const now = Date.parse("2026-09-08T12:00:00Z");
  assert.equal(getDataFreshness({ updatedAt:"2026-09-08T11:55:00Z" }, { now, maxAgeMs:600000 }).status, "fresh");
  assert.equal(getDataFreshness({ updated_at:"2026-09-08T10:00:00Z" }, { now, maxAgeMs:600000 }).status, "stale");
  assert.equal(getDataFreshness({}, { now }).status, "unknown");
  assert.equal(getDataFreshness({ timestamp:Math.floor((now - 60000) / 1000) }, { now }).status, "fresh");
});
