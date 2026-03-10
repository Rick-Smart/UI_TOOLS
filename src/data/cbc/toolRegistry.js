import CBCCallHandlingPage from "../../pages/cbc/CBCCallHandlingPage";
import CBCDocumentSearchPage from "../../pages/cbc/CBCDocumentSearchPage";
import CBCFAQPage from "../../pages/cbc/CBCFAQPage";
import CBCLinksPage from "../../pages/cbc/CBCLinksPage";
import CBCMillisPage from "../../pages/cbc/CBCMillisPage";
import CBCResourcesPage from "../../pages/cbc/CBCResourcesPage";
import CBCTermsPage from "../../pages/cbc/CBCTermsPage";
import CBCTrendsTipsPage from "../../pages/cbc/CBCTrendsTipsPage";
import CBCTroubleshootingPage from "../../pages/cbc/CBCTroubleshootingPage";

export const cbcToolRegistry = [
  {
    path: "/call-handling",
    navLabel: "Call Handling",
    title: "CBC Call Handling Guide",
    description:
      "Scripts, verification flow, case notation, and call workflow support for CBC agents.",
    microGuide:
      "Use this page during live calls for scripts, note standards, and checklist completion.",
    component: CBCCallHandlingPage,
    audience: "agent",
  },
  {
    path: "/troubleshooting",
    navLabel: "Troubleshooting",
    title: "CBC Help Desk Troubleshooting Guide",
    description:
      "Step-by-step troubleshooting for common CBC caller issues: account creation, login, linking, background check submission, and more.",
    microGuide:
      "Use this page during calls to quickly find troubleshooting steps by category or keyword search.",
    component: CBCTroubleshootingPage,
    audience: "agent",
  },
  {
    path: "/trends-tips",
    navLabel: "Trends & Tips",
    title: "CBC Trends, Tips & Suggestions",
    description:
      "Leader-updated guidance, tips, and active campaign notes for CBC agents.",
    microGuide:
      "Check here for current guidance from leadership before or during calls.",
    component: CBCTrendsTipsPage,
    audience: "agent",
  },
  {
    path: "/resources",
    navLabel: "CBC Resources",
    title: "CBC Portal Resources",
    description:
      "Setup guides by account role and quick-share links for the Arizona CBC portal.",
    microGuide:
      "Use this page to find setup guides and links to share with callers.",
    component: CBCResourcesPage,
    audience: "reference",
  },
  {
    path: "/faq",
    navLabel: "FAQ",
    title: "CBC Frequently Asked Questions",
    description:
      "Searchable FAQ from the CBC portal, organized by category: General, Individual, Employer, Agency, and DES.",
    microGuide:
      "Search or filter by category to quickly find answers to common caller questions.",
    component: CBCFAQPage,
    audience: "reference",
  },
  {
    path: "/document-search",
    navLabel: "Document Search",
    title: "CBC Document Search",
    description:
      "Search known CBC-related forms and legacy documents replaced by the CBC portal.",
    microGuide:
      "Search by form number (e.g. DCS-1083A) or keyword. Legacy forms are now handled via cbc.az.gov.",
    component: CBCDocumentSearchPage,
    audience: "reference",
  },
  {
    path: "/terms",
    navLabel: "Terms & Acronyms",
    title: "CBC Terms & Acronyms",
    description:
      "Searchable glossary of CBC-specific terminology, acronyms, and program definitions.",
    microGuide:
      "Search terms to support clear, consistent communication with callers.",
    component: CBCTermsPage,
    audience: "reference",
  },
  {
    path: "/links",
    navLabel: "Quick Links",
    title: "CBC Quick Links",
    description:
      "Save and manage frequently used CBC links in your local browser storage.",
    microGuide:
      "Add and organize links to CBC portal, DES pages, and other resources you use regularly.",
    component: CBCLinksPage,
    audience: "reference",
  },
  {
    path: "/millis",
    navLabel: "Timestamp Tool",
    title: "Milliseconds / Timestamp Tool",
    description:
      "Convert between human-readable dates and Unix timestamps in milliseconds. Use when setting or verifying backend password expiry values.",
    microGuide:
      "Paste a milliseconds value to see the date, or pick a date to get its milliseconds — no need to leave the tool.",
    component: CBCMillisPage,
    audience: "reference",
  },
];

export const cbcSidebarSections = [
  { key: "agent", title: "Agent Tools", audience: "agent" },
  { key: "reference", title: "Reference", audience: "reference" },
];

export function buildCBCNavItems(basePath) {
  return [
    { to: `${basePath}/`, label: "Home", end: true, home: true },
    ...cbcToolRegistry.map((tool) => ({
      to: `${basePath}${tool.path}`,
      label: tool.navLabel,
      audience: tool.audience,
    })),
  ];
}

export function buildCBCHomeCards(basePath) {
  return cbcToolRegistry.map((tool) => ({
    to: `${basePath}${tool.path}`,
    title: tool.title,
    description: tool.description,
    audience: tool.audience,
  }));
}
