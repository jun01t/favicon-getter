const GOOGLE_FAVICON_ENDPOINT = "https://www.google.com/s2/favicons";

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
 * Build a Google favicon service URL.
 * @param {string} url - Site URL or domain
 * @param {number} [size=32] - Preferred icon size in pixels
 * @returns {string}
 */
export function getFaviconUrl(url, size = 32) {
  const domain = normalizeDomain(url);
  const sz = Number(size);

  if (!Number.isFinite(sz) || sz <= 0) {
    throw new TypeError("size must be a positive number");
  }

  const params = new URLSearchParams({
    domain,
    sz: String(Math.round(sz)),
  });

  return `${GOOGLE_FAVICON_ENDPOINT}?${params.toString()}`;
}

/**
 * Fetch a favicon image via Google's favicon service.
 * @param {string} url - Site URL or domain
 * @param {number} [size=32] - Preferred icon size in pixels
 * @returns {Promise<{ buffer: Buffer, contentType: string, sourceUrl: string }>}
 */
export async function getFavicon(url, size = 32) {
  const sourceUrl = getFaviconUrl(url, size);
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch favicon (${response.status} ${response.statusText}): ${sourceUrl}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    sourceUrl,
  };
}

export default {
  getFaviconUrl,
  getFavicon,
  normalizeDomain,
};
