import path from "node:path";
import {
  ensureDir,
  extractLinkDetails,
  extractLinks,
  extractTitle,
  hashText,
  kbDataDir,
  readJson,
  sleep,
  stripHtml,
  toIsoNow,
  writeJson,
} from "./utils.mjs";

const configPath = path.join(process.cwd(), "kb", "config.json");
const config = readJson(configPath);

if (!config) {
  throw new Error("Missing kb/config.json");
}

const {
  seedUrls,
  allowPrefixes,
  excludePatterns,
  crawlDelayMs,
  maxPages,
  includePdfLinks,
} = config;

const visited = new Set();
const queue = [...seedUrls];
const pages = [];
const linkLabelMap = {};
const startedAt = toIsoNow();
const fetchUserAgents = [
  "azui-kb-bot/1.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
];

async function fetchWithFallbackUserAgent(url) {
  let lastResponse = null;

  for (const userAgent of fetchUserAgents) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    lastResponse = response;

    if (response.ok || response.status !== 403) {
      return response;
    }
  }

  return lastResponse;
}

function isAllowed(url) {
  if (!allowPrefixes.some((prefix) => url.startsWith(prefix))) {
    return false;
  }
  return !excludePatterns.some((pattern) => url.includes(pattern));
}

function registerLinkLabel(url, label) {
  const trimmed = String(label || "").trim();
  if (!trimmed || trimmed.length < 3) {
    return;
  }

  if (!linkLabelMap[url] || linkLabelMap[url].length < trimmed.length) {
    linkLabelMap[url] = trimmed;
  }
}

while (queue.length > 0 && pages.length < maxPages) {
  const url = queue.shift();

  if (!url || visited.has(url) || !isAllowed(url)) {
    continue;
  }

  visited.add(url);

  try {
    const response = await fetchWithFallbackUserAgent(url);

    const contentType = response.headers.get("content-type") || "";
    const fetchedAt = toIsoNow();

    if (!response.ok) {
      pages.push({
        url,
        fetchedAt,
        statusCode: response.status,
        contentType,
        title: "Fetch Failed",
        text: "",
        hash: hashText(String(response.status)),
        links: [],
        pdfLinks: [],
      });
      await sleep(crawlDelayMs);
      continue;
    }

    if (!contentType.includes("text/html")) {
      pages.push({
        url,
        fetchedAt,
        statusCode: response.status,
        contentType,
        title: url,
        text: "",
        hash: hashText(url),
        links: [],
        pdfLinks: [],
      });
      await sleep(crawlDelayMs);
      continue;
    }

    const html = await response.text();
    const linkDetails = extractLinkDetails(html, url);
    for (const detail of linkDetails) {
      registerLinkLabel(detail.url, detail.text);
    }

    const links = extractLinks(html, url);
    const pdfLinks = includePdfLinks
      ? links.filter((link) => link.toLowerCase().includes(".pdf"))
      : [];

    for (const link of links) {
      if (visited.has(link)) {
        continue;
      }

      if (
        isAllowed(link) ||
        (includePdfLinks && link.toLowerCase().includes(".pdf"))
      ) {
        queue.push(link);
      }
    }

    const text = stripHtml(html).slice(0, 50000);

    pages.push({
      url,
      fetchedAt,
      statusCode: response.status,
      contentType,
      title: extractTitle(html),
      text,
      hash: hashText(text),
      links: links.filter((link) => isAllowed(link)),
      pdfLinks,
    });

    await sleep(crawlDelayMs);
  } catch (error) {
    pages.push({
      url,
      fetchedAt: toIsoNow(),
      statusCode: 0,
      contentType: "",
      title: "Fetch Error",
      text: "",
      hash: hashText(String(error?.message || "error")),
      links: [],
      pdfLinks: [],
      error: String(error?.message || error),
    });
    await sleep(crawlDelayMs);
  }
}

ensureDir(kbDataDir);

const latestPath = path.join(kbDataDir, "crawl-latest.json");
const previousPath = path.join(kbDataDir, "crawl-previous.json");
const existingLatest = readJson(latestPath, null);

if (existingLatest) {
  writeJson(previousPath, existingLatest);
}

writeJson(latestPath, {
  startedAt,
  completedAt: toIsoNow(),
  pageCount: pages.length,
  linkLabelMap,
  pages,
});

console.log(`KB crawl complete: ${pages.length} pages saved.`);
