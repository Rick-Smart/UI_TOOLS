import { Link } from "react-router-dom";
import { kbRegistry } from "../data/kbRegistry";
import "./KBLandingPage.css";

function KBLandingPage() {
  return (
    <div className="kb-landing">
      <header className="kb-landing-header">
        <h1 className="kb-landing-title">AZDES Knowledge Base Portal</h1>
        <p className="kb-landing-subtitle">
          Arizona Department of Economic Security · Select your workspace below
        </p>
      </header>

      <main className="kb-landing-grid">
        {kbRegistry.map((kb) => (
          <article key={kb.id} className="kb-card">
            <div className="kb-card-body">
              <span className="kb-card-dept">{kb.department}</span>
              <h2 className="kb-card-name">{kb.name}</h2>
              <p className="kb-card-description">{kb.description}</p>
            </div>
            <div className="kb-card-footer">
              <Link to={`${kb.basePath}/`} className="kb-card-link">
                Open workspace
              </Link>
            </div>
          </article>
        ))}
      </main>

      <footer className="kb-landing-footer">
        Informational tool only. Validate actions against current AZDES policy
        and system guidance.
      </footer>
    </div>
  );
}

export default KBLandingPage;
