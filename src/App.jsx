import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import BasePeriodPage from "./pages/BasePeriodPage";
import BenefitAwardPage from "./pages/BenefitAwardPage";
import DateHelperPage from "./pages/DateHelperPage";
import HomePage from "./pages/HomePage";
import LinksPage from "./pages/LinksPage";
import WeeklyPayablePage from "./pages/WeeklyPayablePage";
import MonetaryEligibilityPage from "./pages/MonetaryEligibilityPage";
import AppealsHelperPage from "./pages/AppealsHelperPage";
import WorkSearchLogPage from "./pages/WorkSearchLogPage";
import ProgramTriagePage from "./pages/ProgramTriagePage";
import AgentResponseCardsPage from "./pages/AgentResponseCardsPage";
import TermsGlossaryPage from "./pages/TermsGlossaryPage";
import DocumentSearchPage from "./pages/DocumentSearchPage";
import { documentReferences } from "./data/documentReferences";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/base-period", label: "Base Period" },
  { to: "/weekly-payable", label: "Weekly Payable" },
  { to: "/monetary-eligibility", label: "Monetary Eligibility" },
  { to: "/benefit-award", label: "Benefit Award" },
  { to: "/appeals-helper", label: "Appeals" },
  { to: "/work-search-log", label: "Work Search Log" },
  { to: "/program-triage", label: "Program Triage" },
  { to: "/agent-cards", label: "Agent Cards" },
  { to: "/terms", label: "Terms" },
  { to: "/doc-search", label: "Doc Search" },
  { to: "/links", label: "Quick Links" },
  { to: "/date-helper", label: "Date Helper" },
];

function App() {
  return (
    <main className="page stack">
      <header className="stack header-block">
        <h1>AZDES UI Toolbox</h1>
        <p className="subtitle">
          Multi-page workspace for AZDES UI tools and shared links.
        </p>
      </header>

      <nav className="card nav-row" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/base-period" element={<BasePeriodPage />} />
        <Route path="/weekly-payable" element={<WeeklyPayablePage />} />
        <Route
          path="/monetary-eligibility"
          element={<MonetaryEligibilityPage />}
        />
        <Route path="/benefit-award" element={<BenefitAwardPage />} />
        <Route path="/appeals-helper" element={<AppealsHelperPage />} />
        <Route path="/work-search-log" element={<WorkSearchLogPage />} />
        <Route path="/program-triage" element={<ProgramTriagePage />} />
        <Route path="/agent-cards" element={<AgentResponseCardsPage />} />
        <Route path="/terms" element={<TermsGlossaryPage />} />
        <Route path="/doc-search" element={<DocumentSearchPage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/date-helper" element={<DateHelperPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <section className="card stack" aria-labelledby="doc-reference-heading">
        <div>
          <h2 id="doc-reference-heading">Document references</h2>
          <p className="muted section-copy">
            Tools on this site should align to the public source materials
            listed here. Add all future document numbers to this registry.
          </p>
        </div>
        <div className="docs-grid" aria-live="polite">
          {documentReferences.map((doc) => (
            <article key={doc.number} className="doc-card">
              <div className="doc-header">
                <span className="pill">{doc.number}</span>
                <span className="muted">Rev {doc.revision}</span>
              </div>
              <h3>{doc.title}</h3>
              <p className="muted">{doc.notes}</p>
              <div className="actions-row">
                <a
                  className="button-link"
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open source
                </a>
                <a
                  className="button-secondary button-link"
                  href={doc.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Search number
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer>
        Informational tool only. Validate determinations against current AZDES
        UI policy and system guidance.
      </footer>
    </main>
  );
}

export default App;
