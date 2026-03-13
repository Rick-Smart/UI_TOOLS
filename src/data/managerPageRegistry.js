/**
 * Manager Portal — Page Registry
 *
 * Single source of truth for which pages are editable and how they are
 * structured. Each editable page exports a `pageMeta` constant that is
 * imported here. When a page's editable sections change, update the
 * `pageMeta` export in that page file — the portal reflects it automatically.
 *
 * pageMeta shape:
 *   id          — unique page identifier
 *   label       — display name shown in the portal page picker
 *   description — short description shown on the page card
 *   campaigns   — which campaign keys this page belongs to
 *   wireframe   — layout template key (see WIREFRAME_LAYOUTS in ManagerPortalPage)
 *   sections[]  — editable section descriptors
 *     key       — section type string (matches DB section column)
 *     label     — display name for the section
 *     region    — which wireframe zone this section lives in
 */

import { pageMeta as trendsTipsMeta } from "../pages/TrendsTipsPage";
import { pageMeta as agentCardsMeta } from "../pages/AgentResponseCardsPage";
import { pageMeta as homePageMeta } from "../pages/HomePage";
import { pageMeta as callHandlingMeta } from "../pages/CallHandlingPage";
import { pageMeta as cbcTrendsTipsMeta } from "../pages/cbc/CBCTrendsTipsPage";
import { pageMeta as cbcHomeMeta } from "../pages/cbc/CBCHomePage";

export const PAGE_REGISTRY = {
  "ui-kb": [trendsTipsMeta, agentCardsMeta, homePageMeta, callHandlingMeta],
  "cbc-kb": [cbcTrendsTipsMeta, cbcHomeMeta],
};
