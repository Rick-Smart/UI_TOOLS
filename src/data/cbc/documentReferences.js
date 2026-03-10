/**
 * CBC document references.
 *
 * Includes current CBC portal user guides and quick setup flyers,
 * plus legacy forms (DCS-1083A, CSO-1083C, CSO-1058A, CSO-2040)
 * that have been replaced by the Arizona CBC web portal at cbc.az.gov.
 */

export const documentReferences = [
  // ── Current CBC documents ────────────────────────────────────────────────
  {
    number: "CBC-1000A",
    title: "Arizona Centralized Background Checks (CBC) Individual User Guide",
    revision: "03/25",
    notes:
      "Full guide for individuals: account creation, employment/caregiver/personal requests, dashboard, FCC status, and message center.",
    tags: [
      "individual",
      "user guide",
      "account",
      "employment",
      "caregiver",
      "personal",
      "FCC",
      "fingerprint",
      "dashboard",
      "setup",
    ],
    sourceUrl: "https://des.az.gov/cbc",
    searchUrl: "https://des.az.gov/search/node/CBC-1000A",
  },
  {
    number: "CBC-1000A-S",
    title:
      "Comprobación de antecedentes centralizada (CBC) del estado de Arizona — Guía de usuario individual (Spanish)",
    revision: "03/25",
    notes:
      "Spanish-language version of the CBC Individual User Guide (CBC-1000A).",
    tags: [
      "individual",
      "spanish",
      "español",
      "user guide",
      "account",
      "setup",
      "caregiver",
      "employment",
    ],
    sourceUrl: "https://des.az.gov/cbc",
    searchUrl: "https://des.az.gov/search/node/CBC-1000A-S",
  },
  {
    number: "CBC-1001A",
    title: "CBC Quick Setup — Individual",
    revision: "06/25",
    notes:
      "One-page quick setup guide for individual callers: account creation, 3-step process (create account, submit request, get results).",
    tags: [
      "individual",
      "quick setup",
      "flyer",
      "account",
      "employment",
      "caregiver",
      "personal",
      "FCC",
      "fingerprint",
    ],
    sourceUrl: "https://des.az.gov/cbc",
    searchUrl: "https://des.az.gov/search/node/CBC-1001A",
  },
  {
    number: "CBC-1001A-S",
    title:
      "Configuración rápida de la Comprobación de antecedentes centralizada (CBC) — Para personas naturales (Spanish)",
    revision: "06/25",
    notes:
      "Spanish-language version of the Individual Quick Setup flyer (CBC-1001A).",
    tags: ["individual", "quick setup", "spanish", "español", "flyer", "setup"],
    sourceUrl: "https://des.az.gov/cbc",
    searchUrl: "https://des.az.gov/search/node/CBC-1001A-S",
  },
  {
    number: "CBC-1002A",
    title: "CBC Employer and Agency User Guide",
    revision: "03/25",
    notes:
      "Full guide for employers and agencies: account creation, employee management, caregiver requests, dashboard, recheck confirmations, and DPS PSP account setup.",
    tags: [
      "employer",
      "agency",
      "user guide",
      "account",
      "employee",
      "caregiver",
      "dashboard",
      "recheck",
      "FCC",
      "DPS PSP",
      "setup",
    ],
    sourceUrl: "https://des.az.gov/cbc",
    searchUrl: "https://des.az.gov/search/node/CBC-1002A",
  },
  {
    number: "CBC-1003A",
    title: "CBC Quick Setup Guide — Employer and Agency Account",
    revision: "01/25",
    notes:
      "One-page quick setup flyer for employer/agency callers: create account, communicate with employees, add agency connections, get results.",
    tags: [
      "employer",
      "agency",
      "quick setup",
      "flyer",
      "account",
      "employee",
      "setup",
    ],
    sourceUrl: "https://des.az.gov/cbc",
    searchUrl: "https://des.az.gov/search/node/CBC-1003A",
  },
  {
    number: "CBC-1009A",
    title: "CBC Recheck Process",
    revision: "05/25",
    notes:
      "One-page guide explaining the automated recheck process: employers must confirm or remove employee relationships within 5 calendar days or the background check auto-expires.",
    tags: [
      "recheck",
      "employer",
      "annual",
      "expiration",
      "confirm",
      "remove",
      "dashboard",
    ],
    sourceUrl: "https://des.az.gov/cbc",
    searchUrl: "https://des.az.gov/search/node/CBC-1009A",
  },
  // ── Legacy forms replaced by the CBC portal ──────────────────────────────
  {
    number: "DCS-1083A",
    title:
      "Central Registry Background Check Request — DCS (Replaced by CBC portal)",
    revision: "Legacy",
    notes:
      "Replaced by the CBC web portal at cbc.az.gov. Direct callers to create a portal account and submit online.",
    tags: ["central registry", "DCS", "background check", "legacy", "replaced"],
    sourceUrl: "https://cbc.az.gov/",
    searchUrl: "https://des.az.gov/documents-center",
  },
  {
    number: "CSO-1083C",
    title:
      "Central Registry Background Check Request — CSO (Replaced by CBC portal)",
    revision: "Legacy",
    notes: "Replaced by the CBC web portal at cbc.az.gov.",
    tags: ["central registry", "CSO", "background check", "legacy", "replaced"],
    sourceUrl: "https://cbc.az.gov/",
    searchUrl: "https://des.az.gov/documents-center",
  },
  {
    number: "CSO-1058A",
    title: "Clearance Request — CSO (Replaced by CBC portal)",
    revision: "Legacy",
    notes: "Replaced by the CBC web portal at cbc.az.gov.",
    tags: ["clearance", "CSO", "background check", "legacy", "replaced"],
    sourceUrl: "https://cbc.az.gov/",
    searchUrl: "https://des.az.gov/documents-center",
  },
  {
    number: "CSO-2040",
    title: "Background Check Request — CSO (Replaced by CBC portal)",
    revision: "Legacy",
    notes: "Replaced by the CBC web portal at cbc.az.gov.",
    tags: ["background check", "CSO", "legacy", "replaced"],
    sourceUrl: "https://cbc.az.gov/",
    searchUrl: "https://des.az.gov/documents-center",
  },
];
