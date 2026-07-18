import assert from "node:assert/strict";
import { test } from "node:test";
import faviconHandler from "../api/favicon.js";
import urlHandler from "../api/url.js";

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("GET /api/url returns 200 with favicon URL", async () => {
  const res = createMockRes();
  await urlHandler(
    { method: "GET", query: { url: "https://github.com", size: "64" } },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(
    res.body.url,
    "https://www.google.com/s2/favicons?domain=github.com&sz=64"
  );
});

test("GET /api/url returns 400 when url is missing", async () => {
  const res = createMockRes();
  await urlHandler({ method: "GET", query: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "url is required");
});

test("GET /api/url returns 400 for invalid size", async () => {
  const res = createMockRes();
  await urlHandler(
    { method: "GET", query: { url: "example.com", size: "9999" } },
    res
  );
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /size must be an integer/);
});

test("GET /api/url returns 405 for non-GET", async () => {
  const res = createMockRes();
  await urlHandler({ method: "POST", query: { url: "example.com" } }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, "GET");
});

test("GET /api/favicon returns 400 when url is missing", async () => {
  const res = createMockRes();
  await faviconHandler({ method: "GET", query: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "url is required");
});

test("GET /api/favicon returns 400 for invalid size", async () => {
  const res = createMockRes();
  await faviconHandler(
    { method: "GET", query: { url: "example.com", size: "0" } },
    res
  );
  assert.equal(res.statusCode, 400);
});

test("GET /api/favicon returns 405 for non-GET", async () => {
  const res = createMockRes();
  await faviconHandler({ method: "POST", query: { url: "example.com" } }, res);
  assert.equal(res.statusCode, 405);
});

test("GET /api/favicon returns 502 when upstream fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    headers: { get: () => null },
    async arrayBuffer() {
      return new ArrayBuffer(0);
    },
  });

  try {
    const res = createMockRes();
    await faviconHandler(
      { method: "GET", query: { url: "example.com", size: "32" } },
      res
    );
    assert.equal(res.statusCode, 502);
    assert.match(res.body.error, /Failed to fetch favicon/);
    assert.equal(
      res.body.sourceUrl,
      "https://www.google.com/s2/favicons?domain=example.com&sz=32"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
