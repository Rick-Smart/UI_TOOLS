import { useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import DocumentReferencesPanel from "./components/DocumentReferencesPanel";
import Tooltip from "./components/Tooltip";
import HomePage from "./pages/HomePage";
import { defaultLinks } from "./data/defaultLinks";
import { documentReferences } from "./data/documentReferences";
import {
  callGuideMeta,
  contactInfo,
  managingCallSteps,
  noteRequirements,
  orderedCallChecklist,
  supportResources,
} from "./data/callHandlingGuideData";
import { trendsTips } from "./data/trendsTips";
import { topActions } from "./data/topActions";
import { navItems, toolRegistry } from "./data/toolRegistry";
import { uiTerms } from "./data/uiTerms";
import {
  buildAutoIndexedDataItems,
  buildFocusedDocuments,
  buildSearchResults,
} from "./utils/smartSearch";
import kbArticlesData from "../kb/data/articles.json";

const TOOLTIP_LEGEND_DISMISSED_KEY = "azdes.tooltipLegendDismissed";
const dataModules = import.meta.glob("./data/*.js", { eager: true });
const autoIndexedDataItems = buildAutoIndexedDataItems(dataModules);

function getTooltipLegendDismissed() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(TOOLTIP_LEGEND_DISMISSED_KEY) === "true";
}

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
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isTooltipLegendDismissed, setIsTooltipLegendDismissed] = useState(
    getTooltipLegendDismissed,
  );

  const kbEntries = kbArticlesData?.entries || [];

  const handleDismissTooltipLegend = () => {
    setIsTooltipLegendDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOOLTIP_LEGEND_DISMISSED_KEY, "true");
    }
  };

  const handleShowTooltipLegend = () => {
    setIsTooltipLegendDismissed(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOOLTIP_LEGEND_DISMISSED_KEY, "false");
    }
  };

  const searchResults = useMemo(() => {
    return buildSearchResults({
      query: searchQuery,
      maxResults: 24,
      toolRegistry,
      documentReferences,
      defaultLinks,
      trendsTips,
      uiTerms,
      topActions,
      kbEntries,
      autoIndexedDataItems,
      callGuideMeta,
      managingCallSteps,
      orderedCallChecklist,
      noteRequirements,
      supportResources,
      contactInfo,
    });
  }, [kbEntries, searchQuery]);

  const focusedDocuments = useMemo(() => {
    return buildFocusedDocuments({
      documentReferences,
      toolRegistry,
      pathname: location.pathname,
      searchQuery,
    });
  }, [location.pathname, searchQuery]);

  return (
    <main className="page stack">
      <header className="stack header-block">
        <h1>AZDES UI Toolbox</h1>
        <p className="subtitle">
          Multi-page workspace for AZDES UI tools and shared links.
        </p>
        <div className="compact-grid">
          <label htmlFor="global-search">
            Smart search
            <Tooltip text="Searches all toolbox data (tools, KB, call handling guidance, terms, documents, links, top actions, trends, and other src/data entries). Results are capped for speed." />
          </label>
          <input
            id="global-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search anything in the toolbox (tools, KB, terms, docs, links, guidance)"
          />
        </div>
        {isTooltipLegendDismissed ? (
          <button
            type="button"
            className="tooltip-legend-restore"
            onClick={handleShowTooltipLegend}
          >
            Show tooltip help
          </button>
        ) : (
          <div
            className="tooltip-legend muted"
            role="note"
            aria-label="Tooltip help legend"
          >
            <span className="tooltip-badge" aria-hidden="true">
              ?
            </span>
            Select any <strong>?</strong> icon for quick field guidance. Press
            <strong> Esc</strong> to close open tips.
            <button
              type="button"
              className="tooltip-legend-close"
              onClick={handleDismissTooltipLegend}
              aria-label="Dismiss tooltip help legend"
            >
              Dismiss
            </button>
          </div>
        )}
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

      <DocumentReferencesPanel
        focusedDocuments={focusedDocuments}
        documentReferences={documentReferences}
      />

      <footer>
        Informational tool only. Validate determinations against current AZDES
        UI policy and system guidance.
      </footer>
    </main>
  );
}

export default App;
