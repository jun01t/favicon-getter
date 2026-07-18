import { getFaviconUrl, parseSize } from "../src/index.js";

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

  try {
    const size = parseSize(rawSize === undefined ? 32 : rawSize);
    return res.status(200).json({ url: getFaviconUrl(url, size) });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
