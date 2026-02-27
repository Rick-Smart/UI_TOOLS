import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const workspaceRoot = process.cwd();
export const kbDir = path.join(workspaceRoot, "kb");
export const kbDataDir = path.join(kbDir, "data");
export const kbReportsDir = path.join(kbDir, "reports");

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function hashText(text) {
  return crypto
    .createHash("sha256")
    .update(text || "")
    .digest("hex");
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toIsoNow() {
  return new Date().toISOString();
}

export function safeUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

export function stripHtml(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitle(html = "") {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : "Untitled";
}

export function extractLinks(html = "", pageUrl) {
  const links = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html))) {
    const rawHref = match[1]?.trim();
    if (!rawHref || rawHref.startsWith("javascript:")) {
      continue;
    }
    const absolute = safeUrl(rawHref, pageUrl);
    if (!absolute) {
      continue;
    }
    links.push(absolute.split("#")[0]);
  }

  return [...new Set(links)];
}

export function extractLinkDetails(html = "", pageUrl) {
  const details = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(html))) {
    const rawHref = match[1]?.trim();
    if (!rawHref || rawHref.startsWith("javascript:")) {
      continue;
    }

    const absolute = safeUrl(rawHref, pageUrl);
    if (!absolute) {
      continue;
    }

    const text = stripHtml(match[2] || "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    details.push({
      url: absolute.split("#")[0],
      text,
    });
  }

  return details;
}
