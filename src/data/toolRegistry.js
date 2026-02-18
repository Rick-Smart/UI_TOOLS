import AgentResponseCardsPage from "../pages/AgentResponseCardsPage";
import AppealsHelperPage from "../pages/AppealsHelperPage";
import BasePeriodPage from "../pages/BasePeriodPage";
import BenefitAwardPage from "../pages/BenefitAwardPage";
import DateHelperPage from "../pages/DateHelperPage";
import DocumentSearchPage from "../pages/DocumentSearchPage";
import LinksPage from "../pages/LinksPage";
import MonetaryEligibilityPage from "../pages/MonetaryEligibilityPage";
import ProgramTriagePage from "../pages/ProgramTriagePage";
import TermsGlossaryPage from "../pages/TermsGlossaryPage";
import WeeklyPayablePage from "../pages/WeeklyPayablePage";
import WorkSearchLogPage from "../pages/WorkSearchLogPage";

export const toolRegistry = [
  {
    path: "/base-period",
    navLabel: "Base Period",
    title: "Base Period Calculator",
    description:
      "Calculate base and lag quarters using UIB-1240A calendar-quarter rules.",
    component: BasePeriodPage,
  },
  {
    path: "/weekly-payable",
    navLabel: "Weekly Payable",
    title: "Weekly Payable Estimator",
    description:
      "Estimate weekly payable amount using the $160 earnings disregard and reduction rule.",
    component: WeeklyPayablePage,
  },
  {
    path: "/monetary-eligibility",
    navLabel: "Monetary Eligibility",
    title: "Monetary Eligibility Screener",
    description:
      "Check both monetary qualification pathways using base-period wages.",
    component: MonetaryEligibilityPage,
  },
  {
    path: "/benefit-award",
    navLabel: "Benefit Award",
    title: "Benefit Award Estimator",
    description:
      "Estimate weekly benefit amount and max award with 24x/26x cap logic.",
    component: BenefitAwardPage,
  },
  {
    path: "/appeals-helper",
    navLabel: "Appeals",
    title: "Appeals Deadline Helper",
    description:
      "Calculate appeal windows and filing-date reminders by decision type.",
    component: AppealsHelperPage,
  },
  {
    path: "/work-search-log",
    navLabel: "Work Search Log",
    title: "Work Search Compliance Log",
    description:
      "Capture required work-search contact fields and 4-day minimum status.",
    component: WorkSearchLogPage,
  },
  {
    path: "/program-triage",
    navLabel: "Program Triage",
    title: "Program Triage Wizard",
    description:
      "Route calls across UI, UCFE, UCX, Combined Wages, Shared Work, DUA, TRA, and ABP.",
    component: ProgramTriagePage,
  },
  {
    path: "/agent-cards",
    navLabel: "Agent Cards",
    title: "Agent Response Cards",
    description:
      "Use plain-language, policy-aligned answers for frequent claimant questions.",
    component: AgentResponseCardsPage,
  },
  {
    path: "/terms",
    navLabel: "Terms",
    title: "UI Terms & Acronyms",
    description:
      "Search common terms and approved shorthand used during UI claimant support.",
    component: TermsGlossaryPage,
  },
  {
    path: "/doc-search",
    navLabel: "Doc Search",
    title: "Document Search",
    description:
      "Search AZDES by document number and open official source pages directly.",
    component: DocumentSearchPage,
  },
  {
    path: "/links",
    navLabel: "Quick Links",
    title: "Quick Links",
    description:
      "Keep frequently used AZDES UI links in one managed list saved in your browser.",
    component: LinksPage,
  },
  {
    path: "/date-helper",
    navLabel: "Date Helper",
    title: "Date Offset Helper",
    description:
      "Add or subtract days to quickly find follow-up and deadline dates.",
    component: DateHelperPage,
  },
];

export const navItems = [
  { to: "/", label: "Home", end: true },
  ...toolRegistry.map((tool) => ({ to: tool.path, label: tool.navLabel })),
];

export const homeCards = toolRegistry.map((tool) => ({
  to: tool.path,
  title: tool.title,
  description: tool.description,
}));
