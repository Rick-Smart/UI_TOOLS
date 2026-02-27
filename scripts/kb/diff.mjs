import path from "node:path";
import { kbDataDir, readJson, toIsoNow, writeJson } from "./utils.mjs";

const latest = readJson(path.join(kbDataDir, "crawl-latest.json"), null);
const previous = readJson(path.join(kbDataDir, "crawl-previous.json"), {
  pages: [],
});

if (!latest) {
  throw new Error(
    "Missing kb/data/crawl-latest.json. Run npm run kb:crawl first.",
  );
}

const prevMap = new Map(previous.pages.map((page) => [page.url, page.hash]));
const nextMap = new Map(latest.pages.map((page) => [page.url, page.hash]));

const added = [];
const removed = [];
const changed = [];
const unchanged = [];

for (const page of latest.pages) {
  if (!prevMap.has(page.url)) {
    added.push(page.url);
    continue;
  }

  if (prevMap.get(page.url) !== page.hash) {
    changed.push(page.url);
  } else {
    unchanged.push(page.url);
  }
}

for (const url of prevMap.keys()) {
  if (!nextMap.has(url)) {
    removed.push(url);
  }
}

writeJson(path.join(kbDataDir, "diff-latest.json"), {
  generatedAt: toIsoNow(),
  added,
  removed,
  changed,
  unchanged,
  counts: {
    added: added.length,
    removed: removed.length,
    changed: changed.length,
    unchanged: unchanged.length,
  },
});

console.log(
  `KB diff complete: +${added.length} / ~${changed.length} / -${removed.length}`,
);
