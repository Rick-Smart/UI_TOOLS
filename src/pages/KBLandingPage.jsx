import { Link } from "react-router-dom";
import { kbRegistry } from "../data/kbRegistry";
import "./KBLandingPage.css";

function KBLandingPage() {
  return (
    <div className="kb-landing">
      <header className="kb-landing-header">
        <h1 className="kb-landing-eyebrow">Knowledge Base Management</h1>
        <p className="kb-landing-title">Select Your Workspace</p>
        <p className="kb-landing-subtitle">
          Choose the department workspace below to open its tools and resources
        </p>
      </header>

      <main className="kb-landing-grid">
        {kbRegistry.map((kb) => (
          <Link
            key={kb.id}
            to={`${kb.basePath}/`}
            className="kb-card"
            style={{
              "--kb-accent": kb.accentColor,
              "--kb-accent-bg": kb.accentBg,
            }}
            aria-label={`Open ${kb.name} — ${kb.department}`}
          >
            <div className="kb-card-hero">
              <span className="kb-card-code" aria-hidden="true">
                {kb.code}
              </span>
              <h2 className="kb-card-dept">{kb.department}</h2>
              <p className="kb-card-for">{kb.forLine}</p>
            </div>

            <div className="kb-card-body">
              <p className="kb-card-name">{kb.name}</p>
              <p className="kb-card-description">{kb.description}</p>
            </div>

            <div className="kb-card-cta">
              <span className="kb-card-cta-btn">Open Workspace</span>
            </div>
          </Link>
        ))}
      </main>

      <footer className="kb-landing-footer">
        Informational tool only &middot; Validate all actions against current
        policy and system guidance
      </footer>
    </div>
  );
}

export default KBLandingPage;
