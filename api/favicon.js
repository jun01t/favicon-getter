import { getFavicon, getFaviconUrl, parseSize } from "../src/index.js";

function isClientError(error) {
  return error instanceof TypeError;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const url = typeof req.query.url === "string" ? req.query.url : undefined;
  const rawSize =
    typeof req.query.size === "string" ? req.query.size : undefined;

  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }

  let size;
  try {
    size = parseSize(rawSize === undefined ? 32 : rawSize);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const { buffer, contentType, sourceUrl } = await getFavicon(url, size);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Favicon-Source", sourceUrl);
    res.setHeader("Access-Control-Expose-Headers", "X-Favicon-Source");
    return res.status(200).send(buffer);
  } catch (error) {
    const status = isClientError(error) ? 400 : 502;
    return res.status(status).json({
      error: error instanceof Error ? error.message : String(error),
      sourceUrl: (() => {
        try {
          return getFaviconUrl(url, size);
        } catch {
          return undefined;
        }
      })(),
    });
  }
}
