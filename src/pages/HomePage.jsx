import { Link } from "react-router-dom";

const cards = [
  {
    title: "Base Period Calculator",
    description:
      "Calculate base and lag quarters using UIB-1240A calendar-quarter rules.",
    to: "/base-period",
  },
  {
    title: "Weekly Payable Estimator",
    description:
      "Estimate weekly payable amount using the $160 earnings disregard and reduction rule.",
    to: "/weekly-payable",
  },
  {
    title: "Monetary Eligibility Screener",
    description:
      "Check both monetary qualification pathways using base-period wages.",
    to: "/monetary-eligibility",
  },
  {
    title: "Benefit Award Estimator",
    description:
      "Estimate weekly benefit amount and max award with 24x/26x cap logic.",
    to: "/benefit-award",
  },
  {
    title: "Appeals Deadline Helper",
    description:
      "Calculate appeal windows and filing-date reminders by decision type.",
    to: "/appeals-helper",
  },
  {
    title: "Work Search Compliance Log",
    description:
      "Capture required work-search contact fields and 4-day minimum status.",
    to: "/work-search-log",
  },
  {
    title: "Program Triage Wizard",
    description:
      "Route calls across UI, UCFE, UCX, Combined Wages, Shared Work, DUA, TRA, and ABP.",
    to: "/program-triage",
  },
  {
    title: "Agent Response Cards",
    description:
      "Use plain-language, policy-aligned answers for frequent claimant questions.",
    to: "/agent-cards",
  },
  {
    title: "UI Terms & Acronyms",
    description:
      "Search common terms and approved shorthand used during UI claimant support.",
    to: "/terms",
  },
  {
    title: "Document Search",
    description:
      "Search AZDES by document number and open official source pages directly.",
    to: "/doc-search",
  },
  {
    title: "Quick Links",
    description:
      "Keep frequently used AZDES UI links in one managed list saved in your browser.",
    to: "/links",
  },
  {
    title: "Date Offset Helper",
    description:
      "Add or subtract days to quickly find follow-up and deadline dates.",
    to: "/date-helper",
  },
];

function HomePage() {
  return (
    <section className="card stack">
      <div>
        <h2>AZDES UI Tools</h2>
        <p className="muted section-copy">
          Choose a tool below. Use the Document references section to confirm
          source pamphlet/form numbers as additional guidance is added.
        </p>
      </div>

      <div className="tools-grid">
        {cards.map((card) => (
          <article key={card.to} className="tool-card">
            <h3>{card.title}</h3>
            <p className="muted">{card.description}</p>
            <Link className="button-link" to={card.to}>
              Open tool
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomePage;
