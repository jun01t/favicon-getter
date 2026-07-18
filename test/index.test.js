import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getFavicon,
  getFaviconUrl,
  normalizeDomain,
  parseSize,
  MAX_SIZE,
  MIN_SIZE,
} from "../src/index.js";

test("normalizeDomain extracts hostname from https URL", () => {
  assert.equal(normalizeDomain("https://github.com/path"), "github.com");
});

test("normalizeDomain extracts hostname from http URL", () => {
  assert.equal(normalizeDomain("http://www.example.com/a"), "www.example.com");
});

test("normalizeDomain adds https when protocol is missing", () => {
  assert.equal(normalizeDomain("github.com"), "github.com");
});

test("normalizeDomain trims whitespace", () => {
  assert.equal(normalizeDomain("  example.com  "), "example.com");
});

test("normalizeDomain rejects empty string", () => {
  assert.throws(() => normalizeDomain(""), TypeError);
});

test("normalizeDomain rejects non-string", () => {
  assert.throws(() => normalizeDomain(null), TypeError);
  assert.throws(() => normalizeDomain(undefined), TypeError);
  assert.throws(() => normalizeDomain(123), TypeError);
});

test("parseSize accepts integers in range", () => {
  assert.equal(parseSize(16), 16);
  assert.equal(parseSize(48), 48);
  assert.equal(parseSize(512), 512);
  assert.equal(parseSize("64"), 64);
});

test("parseSize defaults to 32", () => {
  assert.equal(parseSize(), 32);
});

test("parseSize rejects decimals", () => {
  assert.throws(() => parseSize(32.5), TypeError);
});

test("parseSize rejects zero and negatives", () => {
  assert.throws(() => parseSize(0), TypeError);
  assert.throws(() => parseSize(-1), TypeError);
});

test("parseSize rejects out of range", () => {
  assert.throws(() => parseSize(MIN_SIZE - 1), TypeError);
  assert.throws(() => parseSize(MAX_SIZE + 1), TypeError);
});

test("parseSize rejects non-numeric strings", () => {
  assert.throws(() => parseSize("large"), TypeError);
  assert.throws(() => parseSize(""), TypeError);
});

test("parseSize rejects NaN and Infinity", () => {
  assert.throws(() => parseSize(NaN), TypeError);
  assert.throws(() => parseSize(Infinity), TypeError);
});

test("getFaviconUrl builds Google s2 favicons URL", () => {
  assert.equal(
    getFaviconUrl("https://github.com", 64),
    "https://www.google.com/s2/favicons?domain=github.com&sz=64"
  );
});

test("getFavicon returns buffer from mocked Google API", async () => {
  const png = Buffer.from([137, 80, 78, 71]);
  const result = await getFavicon("https://github.com", 32, {
    fetch: async (input) => {
      assert.match(String(input), /google\.com\/s2\/favicons/);
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get(name) {
            return name.toLowerCase() === "content-type" ? "image/png" : null;
          },
        },
        async arrayBuffer() {
          return png.buffer.slice(
            png.byteOffset,
            png.byteOffset + png.byteLength
          );
        },
      };
    },
  });

  assert.equal(result.contentType, "image/png");
  assert.equal(
    result.sourceUrl,
    "https://www.google.com/s2/favicons?domain=github.com&sz=32"
  );
  assert.deepEqual(result.buffer, png);
});

test("getFavicon throws when Google API returns non-OK", async () => {
  await assert.rejects(
    () =>
      getFavicon("example.com", 32, {
        fetch: async () => ({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
          headers: { get: () => null },
          async arrayBuffer() {
            return new ArrayBuffer(0);
          },
        }),
      }),
    /Failed to fetch favicon \(503/
  );
});

test("getFavicon throws when response is too large", async () => {
  const huge = new ArrayBuffer(513 * 1024);
  await assert.rejects(
    () =>
      getFavicon("example.com", 32, {
        fetch: async () => ({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: { get: () => "image/png" },
          async arrayBuffer() {
            return huge;
          },
        }),
      }),
    /too large/
  );
});
