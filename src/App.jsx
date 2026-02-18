import { useMemo, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { defaultLinks } from "./data/defaultLinks";
import { documentReferences } from "./data/documentReferences";
import { trendsTips } from "./data/trendsTips";
import { navItems, toolRegistry } from "./data/toolRegistry";

function ToolScreen({ tool }) {
  const Component = tool.component;
  const componentProps =
    tool.path === "/quick-reference"
      ? {
          tools: toolRegistry.filter(
            (item) => item.path !== "/quick-reference",
          ),
        }
      : {};

  return (
    <>
      <section className="card guide-card">
        <h3>Quick guide</h3>
        <p className="muted">{tool.microGuide || tool.description}</p>
      </section>
      <Component {...componentProps} />
    </>
  );
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const toolMatches = toolRegistry
      .filter(
        (tool) =>
          tool.title.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.navLabel.toLowerCase().includes(query),
      )
      .map((tool) => ({
        id: `tool-${tool.path}`,
        type: "Tool",
        title: tool.title,
        detail: tool.description,
        to: tool.path,
      }));

    const docMatches = documentReferences
      .filter(
        (doc) =>
          doc.number.toLowerCase().includes(query) ||
          doc.title.toLowerCase().includes(query),
      )
      .map((doc) => ({
        id: `doc-${doc.number}`,
        type: "Document",
        title: `${doc.number} — ${doc.title}`,
        detail: "Open official source",
        href: doc.sourceUrl,
      }));

    const linkMatches = defaultLinks
      .filter(
        (link) =>
          link.name.toLowerCase().includes(query) ||
          link.group.toLowerCase().includes(query),
      )
      .map((link) => ({
        id: `link-${link.name}`,
        type: "Link",
        title: link.name,
        detail: link.group,
        href: link.url,
      }));

    const tipMatches = trendsTips
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.message.toLowerCase().includes(query),
      )
      .map((item) => ({
        id: item.id,
        type: "Trend",
        title: item.title,
        detail: item.priority,
        to: "/trends-tips",
      }));

    return [...toolMatches, ...docMatches, ...linkMatches, ...tipMatches].slice(
      0,
      12,
    );
  }, [searchQuery]);

  return (
    <main className="page stack">
      <header className="stack header-block">
        <h1>AZDES UI Toolbox</h1>
        <p className="subtitle">
          Multi-page workspace for AZDES UI tools and shared links.
        </p>
        <div className="compact-grid">
          <label htmlFor="global-search">Smart search</label>
          <input
            id="global-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tools, document numbers, links, or trends"
          />
        </div>
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

      {searchQuery.trim() ? (
        <section className="card stack" aria-live="polite">
          <div className="title-row">
            <h2>Search results</h2>
            <span className="pill">{searchResults.length} matches</span>
          </div>
          {searchResults.length ? (
            <div className="stack">
              {searchResults.map((result) => (
                <article key={result.id} className="result search-item">
                  <div>
                    <p>
                      <strong>{result.title}</strong>
                    </p>
                    <p className="muted">
                      {result.type} · {result.detail}
                    </p>
                  </div>
                  {result.to ? (
                    <Link
                      className="button-link"
                      to={result.to}
                      onClick={() => setSearchQuery("")}
                    >
                      Open
                    </Link>
                  ) : (
                    <a
                      className="button-link"
                      href={result.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No results found.</p>
          )}
        </section>
      ) : null}

      <Routes>
        <Route path="/" element={<HomePage />} />
        {toolRegistry.map((tool) => (
          <Route
            key={tool.path}
            path={tool.path}
            element={<ToolScreen tool={tool} />}
          />
        ))}
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
