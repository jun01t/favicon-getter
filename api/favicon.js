import { getFavicon, getFaviconUrl } from "../src/index.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const url = typeof req.query.url === "string" ? req.query.url : undefined;
  const size = Number(
    typeof req.query.size === "string" ? req.query.size : 32
  );

  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }

  try {
    const { buffer, contentType, sourceUrl } = await getFavicon(url, size);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Favicon-Source", sourceUrl);
    res.setHeader("Access-Control-Expose-Headers", "X-Favicon-Source");
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(502).json({
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
