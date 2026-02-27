import fs from "node:fs";
import path from "node:path";
import {
  ensureDir,
  kbDataDir,
  kbReportsDir,
  readJson,
  toIsoNow,
} from "./utils.mjs";

const diff = readJson(path.join(kbDataDir, "diff-latest.json"), null);
const kb = readJson(path.join(kbDataDir, "articles.json"), { entries: [] });

if (!diff) {
  throw new Error(
    "Missing kb/data/diff-latest.json. Run npm run kb:diff first.",
  );
}

ensureDir(kbReportsDir);

const reportDate = new Date().toISOString().replace(/[:.]/g, "-");
const reportName = `kb-update-${reportDate}.md`;
const reportPath = path.join(kbReportsDir, reportName);
const latestPath = path.join(kbReportsDir, "latest.md");

const body = `# KB Update Report\n\n- Generated: ${toIsoNow()}\n- Entries: ${kb.entries.length}\n- Added: ${diff.counts.added}\n- Changed: ${diff.counts.changed}\n- Removed: ${diff.counts.removed}\n\n## Added URLs\n${
  diff.added.length ? diff.added.map((url) => `- ${url}`).join("\n") : "- None"
}\n\n## Changed URLs\n${
  diff.changed.length
    ? diff.changed.map((url) => `- ${url}`).join("\n")
    : "- None"
}\n\n## Removed URLs\n${
  diff.removed.length
    ? diff.removed.map((url) => `- ${url}`).join("\n")
    : "- None"
}\n`;

fs.writeFileSync(reportPath, body, "utf8");
fs.writeFileSync(latestPath, body, "utf8");

console.log(`KB report written: ${reportPath}`);
