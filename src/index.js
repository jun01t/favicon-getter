const GOOGLE_FAVICON_ENDPOINT = "https://www.google.com/s2/favicons";
export const MIN_SIZE = 16;
export const MAX_SIZE = 512;
export const DEFAULT_SIZE = 32;
export const FETCH_TIMEOUT_MS = 8_000;
export const MAX_RESPONSE_BYTES = 512 * 1024;

/**
 * Normalize a site URL or domain into a value Google's API accepts as `domain`.
 * @param {string} url
 * @returns {string}
 */
export function normalizeDomain(url) {
  if (typeof url !== "string" || !url.trim()) {
    throw new TypeError("url must be a non-empty string");
  }

  const trimmed = url.trim();

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProtocol).hostname;
  } catch {
    return trimmed.replace(/^\/+/, "").split("/")[0];
  }
}

/**
 * Validate and normalize favicon size.
 * @param {unknown} size
 * @returns {number}
 */
export function parseSize(size = DEFAULT_SIZE) {
  if (typeof size === "string" && size.trim() === "") {
    throw new TypeError(
      `size must be an integer between ${MIN_SIZE} and ${MAX_SIZE}`
    );
  }

  const sz = Number(size);

  if (!Number.isInteger(sz) || sz < MIN_SIZE || sz > MAX_SIZE) {
    throw new TypeError(
      `size must be an integer between ${MIN_SIZE} and ${MAX_SIZE}`
    );
  }

  return sz;
}

/**
 * Build a Google favicon service URL.
 * @param {string} url - Site URL or domain
 * @param {number} [size=32] - Preferred icon size in pixels
 * @returns {string}
 */
export function getFaviconUrl(url, size = DEFAULT_SIZE) {
  const domain = normalizeDomain(url);
  const sz = parseSize(size);

  const params = new URLSearchParams({
    domain,
    sz: String(sz),
  });

  return `${GOOGLE_FAVICON_ENDPOINT}?${params.toString()}`;
}

/**
 * Fetch a favicon image via Google's favicon service.
 * @param {string} url - Site URL or domain
 * @param {number} [size=32] - Preferred icon size in pixels
 * @param {{ fetch?: typeof fetch, timeoutMs?: number }} [options]
 * @returns {Promise<{ buffer: Buffer, contentType: string, sourceUrl: string }>}
 */
export async function getFavicon(url, size = DEFAULT_SIZE, options = {}) {
  const sourceUrl = getFaviconUrl(url, size);
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
  const fetchImpl = options.fetch ?? globalThis.fetch;

  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(sourceUrl, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch favicon (${response.status} ${response.statusText}): ${sourceUrl}`
      );
    }

    const contentType = response.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error(
        `Favicon response too large (${arrayBuffer.byteLength} bytes)`
      );
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
      sourceUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Favicon fetch timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export default {
  getFaviconUrl,
  getFavicon,
  normalizeDomain,
  parseSize,
  MIN_SIZE,
  MAX_SIZE,
  DEFAULT_SIZE,
};
