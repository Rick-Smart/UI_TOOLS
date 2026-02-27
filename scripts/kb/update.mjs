import path from "node:path";
import {
  hashText,
  kbDataDir,
  readJson,
  toIsoNow,
  writeJson,
} from "./utils.mjs";

const crawl = readJson(path.join(kbDataDir, "crawl-latest.json"), null);
const existingKb = readJson(path.join(kbDataDir, "articles.json"), {
  entries: [],
});

if (!crawl) {
  throw new Error(
    "Missing kb/data/crawl-latest.json. Run npm run kb:crawl first.",
  );
}

function makeId(url) {
  return `kb_${hashText(url).slice(0, 12)}`;
}

function inferTopic(url, title) {
  const normalized = `${url} ${title}`.toLowerCase();
  if (normalized.includes("overpayment")) return "Overpayments";
  if (normalized.includes("appeal")) return "Appeals";
  if (normalized.includes("weekly") || normalized.includes("claim"))
    return "Weekly Claims";
  if (normalized.includes("id.me") || normalized.includes("identity"))
    return "Identity Verification";
  if (normalized.includes("fraud")) return "Fraud";
  if (normalized.includes("tax") || normalized.includes("1099")) return "Tax";
  if (normalized.includes("eligibility")) return "Eligibility";
  return "General UI Benefits";
}

function toSummary(text = "") {
  if (!text) {
    return "Source imported. Summary pending review.";
  }
  const trimmed = text.slice(0, 260).trim();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}...`;
}

function inferTitleFromUrl(url) {
  const noQuery = String(url || "").split("?")[0];
  const segment = noQuery.split("/").filter(Boolean).pop() || "resource";
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasUsableTitle(title) {
  const normalized = String(title || "")
    .trim()
    .toLowerCase();
  return (
    Boolean(normalized) &&
    normalized !== "fetch failed" &&
    normalized !== "fetch error"
  );
}

function isValidPage(page) {
  return (
    page &&
    page.statusCode === 200 &&
    String(page.title || "").toLowerCase() !== "fetch failed" &&
    Boolean(page.text)
  );
}

const bySource = new Map(
  existingKb.entries.map((entry) => [entry.sourceUrl, entry]),
);
const nextEntries = [];
const now = toIsoNow();
const linkLabelMap = crawl.linkLabelMap || {};

for (const page of crawl.pages) {
  if (
    !page.url.includes("des.az.gov/services/employment/unemployment-individual")
  ) {
    continue;
  }

  const existing = bySource.get(page.url);

  if (!isValidPage(page)) {
    const label =
      linkLabelMap[page.url] ||
      (hasUsableTitle(existing?.title) ? existing.title : "") ||
      inferTitleFromUrl(page.url) ||
      "Cataloged Link";

    nextEntries.push({
      id: existing?.id || makeId(page.url),
      title: label,
      summary: `Cataloged URL only (crawl returned HTTP ${page.statusCode || "error"}).`,
      topic: inferTopic(page.url, label),
      steps: existing?.steps || [],
      requiredDocuments: existing?.requiredDocuments || [],
      contacts: existing?.contacts || [],
      deadlines: existing?.deadlines || [],
      relatedLinks: existing?.relatedLinks || [],
      sourceUrl: page.url,
      sourceLastSeen: now,
      sourceHash: page.hash,
      status: "link-only",
      changeNotes:
        "Page content could not be crawled; entry retained as a searchable link.",
    });
    continue;
  }

  nextEntries.push({
    id: existing?.id || makeId(page.url),
    title: page.title || existing?.title || "Untitled",
    summary: toSummary(page.text),
    topic: inferTopic(page.url, page.title || ""),
    steps: existing?.steps || [],
    requiredDocuments: existing?.requiredDocuments || [],
    contacts: existing?.contacts || [],
    deadlines: existing?.deadlines || [],
    relatedLinks: [
      ...new Set([...(page.links || []), ...(page.pdfLinks || [])]),
    ].slice(0, 40),
    sourceUrl: page.url,
    sourceLastSeen: now,
    sourceHash: page.hash,
    status: "active",
    changeNotes:
      existing && existing.sourceHash !== page.hash
        ? "Content changed during latest crawl."
        : existing?.changeNotes || "",
  });
}

writeJson(path.join(kbDataDir, "articles.json"), {
  generatedAt: now,
  entryCount: nextEntries.length,
  entries: nextEntries,
});

console.log(`KB update complete: ${nextEntries.length} entries written.`);
