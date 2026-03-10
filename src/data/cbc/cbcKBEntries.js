/**
 * CBC KB search entries — assembled from all structured CBC data files.
 *
 * These are consumed by smartSearch.js the same way the AZDES KB uses
 * kb/data/articles.json.  Each entry must have at minimum:
 *   id, title, summary, topic, sourceUrl, status: "active"
 */

import { cbcFAQ } from "./cbcFAQ";
import {
  cbcTroubleshooting,
  cbcTroubleshootingCategories,
} from "./cbcTroubleshooting";
import {
  portalNotes,
  userGuides,
  quickShareLinks,
  individualSetupSteps,
  employerSetupSteps,
} from "./cbcResources";

// ── Base paths (SPA routes) ───────────────────────────────────────────────────
const BASE = "/cbc-kb";
const FAQ_URL = `${BASE}/faq`;
const TROUBLESHOOT_URL = `${BASE}/troubleshooting`;
const RESOURCES_URL = `${BASE}/resources`;
const DES_CBC_URL = "https://des.az.gov/cbc";
const CBC_PORTAL_URL = "https://cbc.az.gov/";

// ── 1. FAQ entries ────────────────────────────────────────────────────────────
const faqEntries = cbcFAQ.map((item) => ({
  id: `cbc-faq-${item.id}`,
  title: item.question,
  summary: item.answer,
  topic: `FAQ – ${item.category}`,
  steps: [],
  requiredDocuments: [],
  contacts: [],
  deadlines: [],
  relatedLinks: [],
  sourceUrl: FAQ_URL,
  status: "active",
}));

// ── 2. Troubleshooting entries ────────────────────────────────────────────────
const troubleshootingEntries = cbcTroubleshooting.map((item) => ({
  id: `cbc-ts-${item.id}`,
  title: item.issue,
  summary: item.steps.join(" "),
  topic: `Troubleshooting – ${item.category}`,
  steps: item.steps,
  requiredDocuments: [],
  contacts: [],
  deadlines: [],
  relatedLinks: [],
  sourceUrl: TROUBLESHOOT_URL,
  status: "active",
}));

// ── 3. Troubleshooting category overview entries ──────────────────────────────
// One broad entry per category so a search for "account linking" still surfaces
// the troubleshooting page even if no single issue description matches.
const troubleshootingCategoryEntries = cbcTroubleshootingCategories.map(
  (cat) => {
    const items = cbcTroubleshooting.filter((i) => i.category === cat);
    return {
      id: `cbc-ts-cat-${cat.toLowerCase().replace(/\s+/g, "-")}`,
      title: `CBC Troubleshooting: ${cat}`,
      summary: items.map((i) => i.issue).join(". "),
      topic: "Troubleshooting",
      steps: items.flatMap((i) => i.steps),
      requiredDocuments: [],
      contacts: [],
      deadlines: [],
      relatedLinks: [],
      sourceUrl: TROUBLESHOOT_URL,
      status: "active",
    };
  },
);

// ── 4. Portal notes (account + portal reference) ──────────────────────────────
const portalNoteEntries = portalNotes.map((note, i) => ({
  id: `cbc-note-${i}`,
  title: note.title,
  summary: note.detail,
  topic: "Portal Reference",
  steps: [],
  requiredDocuments: [],
  contacts: [],
  deadlines: [],
  relatedLinks: [RESOURCES_URL],
  sourceUrl: RESOURCES_URL,
  status: "active",
}));

// ── 5. User guides ────────────────────────────────────────────────────────────
const userGuideEntries = userGuides.map((guide) => ({
  id: `cbc-guide-${guide.id}`,
  title: `${guide.number} – ${guide.title}`,
  summary: guide.description,
  topic: `User Guide – ${guide.role}`,
  steps: [],
  requiredDocuments: [],
  contacts: [],
  deadlines: [],
  relatedLinks: [DES_CBC_URL],
  sourceUrl: DES_CBC_URL,
  status: "active",
}));

// ── 6. Setup process entries (Individual + Employer) ──────────────────────────
const individualSetupEntry = {
  id: "cbc-setup-individual",
  title: "Individual Account Setup – Step-by-Step (CBC-1001A)",
  summary: individualSetupSteps
    .map((s) => `Step ${s.step}: ${s.title}. ${s.details.join(" ")}`)
    .join(" "),
  topic: "Setup – Individual",
  steps: individualSetupSteps.flatMap((s) => s.details),
  requiredDocuments: [],
  contacts: [],
  deadlines: [],
  relatedLinks: [DES_CBC_URL, CBC_PORTAL_URL],
  sourceUrl: RESOURCES_URL,
  status: "active",
};

const employerSetupEntry = {
  id: "cbc-setup-employer",
  title: "Employer / Agency Account Setup – Step-by-Step (CBC-1003A)",
  summary: employerSetupSteps
    .map((s) => `Step ${s.step}: ${s.title}. ${s.details.join(" ")}`)
    .join(" "),
  topic: "Setup – Employer / Agency",
  steps: employerSetupSteps.flatMap((s) => s.details),
  requiredDocuments: [],
  contacts: [],
  deadlines: [],
  relatedLinks: [DES_CBC_URL, CBC_PORTAL_URL],
  sourceUrl: RESOURCES_URL,
  status: "active",
};

// ── 7. Quick share / external links as searchable entries ─────────────────────
const quickLinkEntries = quickShareLinks.map((link, i) => ({
  id: `cbc-link-${i}`,
  title: link.label,
  summary: `Quick link for ${link.topic}: ${link.url}`,
  topic: `Resources – ${link.topic}`,
  steps: [],
  requiredDocuments: [],
  contacts: [],
  deadlines: [],
  relatedLinks: [link.url],
  sourceUrl: link.url,
  status: "active",
}));

// ── Combined export ───────────────────────────────────────────────────────────
export const cbcKBEntries = [
  ...faqEntries,
  ...troubleshootingEntries,
  ...troubleshootingCategoryEntries,
  ...portalNoteEntries,
  ...userGuideEntries,
  individualSetupEntry,
  employerSetupEntry,
  ...quickLinkEntries,
];
