#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getFavicon, getFaviconUrl, parseSize } from "../src/index.js";

function printUsage() {
  console.log(`Usage:
  favicon-getter <url> [size]
  favicon-getter --url <url> --size <size> [--out <file>] [--url-only]

Examples:
  favicon-getter https://github.com 64
  favicon-getter --url https://www.google.com --size 128 --out google.png
  favicon-getter --url example.com --size 32 --url-only

Options:
  --url <url>       Site URL or domain (required)
  --size <number>   Favicon size in pixels (default: 32)
  --out <file>      Output file path (default: favicon-<domain>-<size>.png)
  --url-only        Print Google favicon URL only (do not download)
  -h, --help        Show this help
`);
}

function parseArgs(argv) {
  const args = {
    url: undefined,
    size: 32,
    out: undefined,
    urlOnly: false,
    help: false,
  };

  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "-h" || arg === "--help") {
      args.help = true;
      continue;
    }

    if (arg === "--url-only") {
      args.urlOnly = true;
      continue;
    }

    if (arg === "--url" || arg === "--size" || arg === "--out") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`Missing value for ${arg}`);
      }
      if (arg === "--url") args.url = value;
      if (arg === "--size") args.size = Number(value);
      if (arg === "--out") args.out = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  if (!args.url && positional[0]) {
    args.url = positional[0];
  }
  if (positional[1] !== undefined) {
    args.size = Number(positional[1]);
  }

  return args;
}

function defaultOutPath(url, size) {
  let host = "favicon";
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
      ? url
      : `https://${url}`;
    host = new URL(withProtocol).hostname.replace(/\./g, "_");
  } catch {
    host = String(url).replace(/[^a-z0-9_-]+/gi, "_");
  }
  return `favicon-${host}-${size}.png`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.url) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  parseSize(args.size);

  if (args.urlOnly) {
    console.log(getFaviconUrl(args.url, args.size));
    return;
  }

  const { buffer, contentType, sourceUrl } = await getFavicon(
    args.url,
    args.size
  );
  const outPath = resolve(args.out ?? defaultOutPath(args.url, args.size));
  await writeFile(outPath, buffer);

  console.log(`Saved: ${outPath}`);
  console.log(`Source: ${sourceUrl}`);
  console.log(`Content-Type: ${contentType}`);
  console.log(`Bytes: ${buffer.length}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
