import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import DocumentReferencesPanel from "./components/DocumentReferencesPanel";
import PageTemplate from "./components/layout/PageTemplate/PageTemplate";
import HomePage from "./pages/HomePage";
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
import { navItems, sidebarSections, toolRegistry } from "./data/toolRegistry";
import { uiTerms } from "./data/uiTerms";
import {
  buildAutoIndexedDataItems,
  buildFocusedDocuments,
  buildSearchResults,
} from "./utils/smartSearch";
import { readManagedLinks, subscribeManagedLinks } from "./utils/linksStore";
import kbArticlesData from "../kb/data/articles.json";

const TOOLTIP_LEGEND_DISMISSED_KEY = "azdes.tooltipLegendDismissed";
const dataModules = import.meta.glob("./data/*.js", { eager: true });
const autoIndexedDataItems = buildAutoIndexedDataItems(dataModules);
const kbEntries = kbArticlesData?.entries ?? [];

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
  const [managedLinks, setManagedLinks] = useState(readManagedLinks);
  const [isTooltipLegendDismissed, setIsTooltipLegendDismissed] = useState(
    getTooltipLegendDismissed,
  );

  useEffect(() => {
    return subscribeManagedLinks(setManagedLinks);
  }, []);

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
      defaultLinks: managedLinks,
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
  }, [managedLinks, searchQuery]);

  const focusedDocuments = useMemo(() => {
    return buildFocusedDocuments({
      documentReferences,
      toolRegistry,
      pathname: location.pathname,
      searchQuery,
    });
  }, [location.pathname, searchQuery]);

  return (
    <PageTemplate
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      isTooltipLegendDismissed={isTooltipLegendDismissed}
      onShowTips={handleShowTooltipLegend}
      onDismissTips={handleDismissTooltipLegend}
      navItems={navItems}
      sidebarSections={sidebarSections}
    >
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
    </PageTemplate>
  );
}

export default App;
