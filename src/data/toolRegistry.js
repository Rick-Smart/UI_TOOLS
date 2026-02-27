import AgentResponseCardsPage from "../pages/AgentResponseCardsPage";
import AppealsHelperPage from "../pages/AppealsHelperPage";
import BasePeriodPage from "../pages/BasePeriodPage";
import BenefitAwardPage from "../pages/BenefitAwardPage";
import CallHandlingPage from "../pages/CallHandlingPage";
import DateHelperPage from "../pages/DateHelperPage";
import DocumentSearchPage from "../pages/DocumentSearchPage";
import LinksPage from "../pages/LinksPage";
import MonetaryEligibilityPage from "../pages/MonetaryEligibilityPage";
import ProgramTriagePage from "../pages/ProgramTriagePage";
import QuickReferencePage from "../pages/QuickReferencePage";
import SelfHelpGuidePage from "../pages/SelfHelpGuidePage";
import TermsGlossaryPage from "../pages/TermsGlossaryPage";
import TrendsTipsPage from "../pages/TrendsTipsPage";
import WeeklyPayablePage from "../pages/WeeklyPayablePage";
import WorkSearchLogPage from "../pages/WorkSearchLogPage";

export const toolRegistry = [
  {
    path: "/call-handling",
    navLabel: "Call Handling",
    title: "Call Handling Guide",
    description:
      "Scripts, verification flow, RFC prompts, case notation, customer service reminders, contacts, and ordered checklist support.",
    microGuide:
      "Use this page during live calls for scripts, note standards, and step-by-step checklist completion.",
    component: CallHandlingPage,
    audience: "agent",
  },
  {
    path: "/work-search-log",
    navLabel: "Work Search Log",
    title: "Daily Assistance Synopsis Log",
    description:
      "Log a privacy-safe synopsis of claimants helped during the day.",
    microGuide:
      "Capture first name, reason, actions, important info, and next steps for each call.",
    component: WorkSearchLogPage,
    audience: "agent",
  },
  {
    path: "/program-triage",
    navLabel: "Program Triage",
    title: "Program Triage Wizard",
    description:
      "Route calls across UI, UCFE, UCX, Combined Wages, Shared Work, DUA, TRA, and ABP.",
    microGuide:
      "Check all applicable conditions and review the suggested program path list.",
    component: ProgramTriagePage,
    audience: "agent",
  },
  {
    path: "/agent-cards",
    navLabel: "Agent Cards",
    title: "Agent Response Cards",
    description:
      "Use plain-language, policy-aligned answers for frequent claimant questions.",
    microGuide:
      "Search by topic and use the matching card language for consistent communication.",
    component: AgentResponseCardsPage,
    audience: "agent",
  },
  {
    path: "/self-help",
    navLabel: "Self Help",
    title: "AZDES Self-Help Guide",
    description:
      "Step-by-step login and profile guidance, including EIN lookup location and troubleshooting notes.",
    microGuide:
      "Follow login steps, use profile navigation guidance, and reference the EIN location screenshots.",
    component: SelfHelpGuidePage,
    audience: "agent",
  },
  {
    path: "/base-period",
    navLabel: "Base Period",
    title: "Base Period Calculator",
    description:
      "Calculate base and lag quarters using UIB-1240A calendar-quarter rules.",
    microGuide:
      "Enter filing date, then read the base period and lag quarter results in order.",
    component: BasePeriodPage,
    audience: "claimant",
  },
  {
    path: "/monetary-eligibility",
    navLabel: "Monetary Eligibility",
    title: "Monetary Eligibility Screener",
    description:
      "Check both monetary qualification pathways using base-period wages.",
    microGuide:
      "Enter minimum wage and quarter wages to see pass/fail across both pathways.",
    component: MonetaryEligibilityPage,
    audience: "claimant",
  },
  {
    path: "/benefit-award",
    navLabel: "Benefit Award",
    title: "Benefit Award Estimator",
    description:
      "Estimate weekly benefit amount and max award with 24x/26x cap logic.",
    microGuide:
      "Enter quarter wages and unemployment-rate toggle to estimate WBA and max award.",
    component: BenefitAwardPage,
    audience: "claimant",
  },
  {
    path: "/weekly-payable",
    navLabel: "Weekly Payable",
    title: "Weekly Payable Estimator",
    description:
      "Estimate weekly payable amount using the $160 earnings disregard and reduction rule.",
    microGuide:
      "Enter WBA and weekly earnings to get estimated payable amount for that week.",
    component: WeeklyPayablePage,
    audience: "claimant",
  },
  {
    path: "/appeals-helper",
    navLabel: "Appeals",
    title: "Appeals Deadline Helper",
    description:
      "Calculate appeal windows and filing-date reminders by decision type.",
    microGuide:
      "Select decision type and date to calculate the estimated appeal deadline.",
    component: AppealsHelperPage,
    audience: "claimant",
  },
  {
    path: "/date-helper",
    navLabel: "Date Helper",
    title: "Date Offset Helper",
    description:
      "Add or subtract days to quickly find follow-up and deadline dates.",
    microGuide:
      "Enter start date and offset days to calculate a target date instantly.",
    component: DateHelperPage,
    audience: "claimant",
  },
  {
    path: "/doc-search",
    navLabel: "Doc Search",
    title: "Document Search",
    description:
      "Search AZDES by document number and open official source pages directly.",
    microGuide:
      "Enter document number, then use source/search links to open official references.",
    component: DocumentSearchPage,
    audience: "claimant",
  },
  {
    path: "/terms",
    navLabel: "Terms",
    title: "UI Terms & Acronyms",
    description:
      "Search common terms and approved shorthand used during UI claimant support.",
    microGuide:
      "Search by term or abbreviation to quickly confirm definitions.",
    component: TermsGlossaryPage,
    audience: "agent",
  },
  {
    path: "/links",
    navLabel: "Quick Links",
    title: "Quick Links",
    description:
      "Keep frequently used AZDES UI links in one managed list saved in your browser.",
    microGuide:
      "Use defaults or add your own links; updates are saved in local browser storage.",
    component: LinksPage,
    audience: "claimant",
  },
  {
    path: "/trends-tips",
    navLabel: "Trends Tips",
    title: "Trends, Tips & Suggestions",
    description:
      "Leader-updated campaign trends and operational suggestions for current call patterns.",
    microGuide:
      "Review active guidance items sorted by priority and effective date.",
    component: TrendsTipsPage,
    audience: "agent",
  },
  {
    path: "/quick-reference",
    navLabel: "Quick Ref",
    title: "Printable Quick Reference",
    description:
      "Print-ready summary of top actions, tools, document references, and active tips.",
    microGuide: "Use print view for supervisor huddles and team floor support.",
    component: QuickReferencePage,
    audience: "agent",
  },
];

export const navItems = [
  { to: "/", label: "Home", end: true },
  ...toolRegistry.map((tool) => ({
    to: tool.path,
    label: tool.navLabel,
    audience: tool.audience,
  })),
];

export const homeCards = toolRegistry.map((tool) => ({
  to: tool.path,
  title: tool.title,
  description: tool.description,
  audience: tool.audience,
}));
