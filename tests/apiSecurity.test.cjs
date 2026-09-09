const assert = require("node:assert/strict");
const test = require("node:test");
const { enforceRateLimit, requireClerkSession, requireCronSecret, withInstitutionalAuth } = require("../lib/apiSecurity");

function response() {
  return {
    body: undefined,
    headers: {},
    headersSent: false,
    statusCode: 200,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; this.headersSent = true; return this; },
    end() { this.headersSent = true; return this; },
  };
}

test("Clerk authentication fails closed when server keys are missing", async () => {
  const previousSecret = process.env.CLERK_SECRET_KEY;
  const previousPublishable = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;
  delete process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const res = response();
  const auth = await requireClerkSession({ method:"GET", url:"/api/test", headers:{ host:"localhost" } }, res);
  assert.equal(auth, null);
  assert.equal(res.statusCode, 503);
  if (previousSecret) process.env.CLERK_SECRET_KEY = previousSecret;
  if (previousPublishable) process.env.VITE_CLERK_PUBLISHABLE_KEY = previousPublishable;
});

test("cron requires an exact bearer secret", () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  const denied = response();
  assert.equal(requireCronSecret({ headers:{ authorization:"Bearer wrong" } }, denied), false);
  assert.equal(denied.statusCode, 401);
  const allowed = response();
  assert.equal(requireCronSecret({ headers:{ authorization:"Bearer test-secret" } }, allowed), true);
  if (previous) process.env.CRON_SECRET = previous; else delete process.env.CRON_SECRET;
});

test("rate limiting returns 429 after the configured allowance", () => {
  const first = response();
  const second = response();
  assert.equal(enforceRateLimit({}, first, { key:"test-rate", limit:1 }), true);
  assert.equal(enforceRateLimit({}, second, { key:"test-rate", limit:1 }), false);
  assert.equal(second.statusCode, 429);
});

test("institutional wrapper rejects unsupported methods before calling a handler", async () => {
  let called = false;
  const wrapped = withInstitutionalAuth(() => { called = true; }, { methods:["GET"] });
  const res = response();
  await wrapped({ method:"POST", url:"/api/test", headers:{} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(called, false);
  assert.equal(res.headers.allow, "GET");
});
