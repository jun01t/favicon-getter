#!/usr/bin/env node

import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getFavicon, getFaviconUrl, parseSize } from "../src/index.js";

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "../public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function serveStatic(pathname, res) {
  const relative =
    pathname === "/" ? "/index.html" : pathname.replace(/\.\./g, "");
  const filePath = join(PUBLIC_DIR, relative);

  try {
    const data = await readFile(filePath);
    const type = MIME[extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "GET" && requestUrl.pathname === "/api/favicon") {
    const url = requestUrl.searchParams.get("url");
    const rawSize = requestUrl.searchParams.get("size");

    if (!url) {
      sendJson(res, 400, { error: "url is required" });
      return;
    }

    let size;
    try {
      size = parseSize(rawSize ?? 32);
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    try {
      const { buffer, contentType, sourceUrl } = await getFavicon(url, size);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Favicon-Source": sourceUrl,
        "Access-Control-Expose-Headers": "X-Favicon-Source",
      });
      res.end(buffer);
    } catch (error) {
      const status = error instanceof TypeError ? 400 : 502;
      let sourceUrl;
      try {
        sourceUrl = getFaviconUrl(url, size);
      } catch {
        sourceUrl = undefined;
      }
      sendJson(res, status, {
        error: error instanceof Error ? error.message : String(error),
        sourceUrl,
      });
    }
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/url") {
    const url = requestUrl.searchParams.get("url");
    const rawSize = requestUrl.searchParams.get("size");

    if (!url) {
      sendJson(res, 400, { error: "url is required" });
      return;
    }

    try {
      const size = parseSize(rawSize ?? 32);
      sendJson(res, 200, { url: getFaviconUrl(url, size) });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (req.method === "GET") {
    const served = await serveStatic(requestUrl.pathname, res);
    if (served) return;
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`favicon-getter running at http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/favicon?url=https://github.com&size=64`);
});
