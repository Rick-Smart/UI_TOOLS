import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { documentReferences } from "./data/documentReferences";
import { navItems, toolRegistry } from "./data/toolRegistry";

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
        {toolRegistry.map((tool) => {
          const Component = tool.component;
          return (
            <Route key={tool.path} path={tool.path} element={<Component />} />
          );
        })}
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
