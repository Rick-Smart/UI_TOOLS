import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import DocumentReferencesPanel from "./components/DocumentReferencesPanel";
import PageTemplate from "./components/layout/PageTemplate/PageTemplate";
import CBCHomePage from "./pages/cbc/CBCHomePage";
import {
  callGuideMeta,
  contactInfo,
  managingCallSteps,
  noteRequirements,
  orderedCallChecklist,
  supportResources,
} from "./data/cbc/callHandlingGuideData";
import { topActions } from "./data/cbc/topActions";
import {
  buildCBCHomeCards,
  buildCBCNavItems,
  cbcSidebarSections,
  cbcToolRegistry,
} from "./data/cbc/toolRegistry";
import {
  buildAutoIndexedDataItems,
  buildFocusedDocuments,
  buildSearchResults,
} from "./utils/smartSearch";
import { readManagedLinks, subscribeManagedLinks } from "./utils/cbcLinksStore";
import { documentReferences } from "./data/cbc/documentReferences";
import { cbcTerms } from "./data/cbc/cbcTerms";
import { trendsTips } from "./data/cbc/trendsTips";
import { cbcKBEntries } from "./data/cbc/cbcKBEntries";

const BASE_PATH = "/cbc-kb";
const TOOLTIP_LEGEND_DISMISSED_KEY = "azdes.cbc.tooltipLegendDismissed";

// Auto-index only CBC-scoped data files
const dataModules = import.meta.glob("./data/cbc/*.js", { eager: true });
const autoIndexedDataItems = buildAutoIndexedDataItems(dataModules);

const kbEntries = cbcKBEntries;

function getTooltipLegendDismissed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TOOLTIP_LEGEND_DISMISSED_KEY) === "true";
}

function ToolScreen({ tool }) {
  const Component = tool.component;
  return (
    <>
      <section className="card guide-card">
        <h3>Quick guide</h3>
        <p className="muted">{tool.microGuide || tool.description}</p>
      </section>
      <Component />
    </>
  );
}

function CBCApp() {
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

  // Strip the /cbc-kb prefix so smartSearch path matching works
  const strippedPathname = location.pathname.startsWith(BASE_PATH)
    ? location.pathname.slice(BASE_PATH.length) || "/"
    : location.pathname;

  // Prefix topAction routes with basePath for correct navigation
  const prefixedTopActions = topActions.map((action) => ({
    ...action,
    to: `${BASE_PATH}${action.to}`,
  }));

  const navItems = useMemo(() => buildCBCNavItems(BASE_PATH), []);
  const homeCards = useMemo(() => buildCBCHomeCards(BASE_PATH), []);

  const searchResults = useMemo(() => {
    return buildSearchResults({
      query: searchQuery,
      maxResults: 24,
      toolRegistry: cbcToolRegistry.map((tool) => ({
        ...tool,
        path: `${BASE_PATH}${tool.path}`,
      })),
      documentReferences,
      defaultLinks: managedLinks,
      trendsTips,
      uiTerms: cbcTerms,
      topActions: prefixedTopActions,
      kbEntries,
      autoIndexedDataItems,
      callGuideMeta,
      managingCallSteps,
      orderedCallChecklist,
      noteRequirements,
      supportResources,
      contactInfo,
    });
  }, [managedLinks, searchQuery, prefixedTopActions]);

  const focusedDocuments = useMemo(() => {
    return buildFocusedDocuments({
      documentReferences,
      toolRegistry: cbcToolRegistry,
      pathname: strippedPathname,
      searchQuery,
    });
  }, [strippedPathname, searchQuery]);

  return (
    <PageTemplate
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      isTooltipLegendDismissed={isTooltipLegendDismissed}
      onShowTips={handleShowTooltipLegend}
      onDismissTips={handleDismissTooltipLegend}
      navItems={navItems}
      sidebarSections={cbcSidebarSections}
      brandName="AZDES CBC Knowledge Base"
      brandSubtitle="Centralized Background Checks agent workspace"
      showPetSystem={false}
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
        <Route
          path="/"
          element={
            <CBCHomePage
              homeCards={homeCards}
              topActionsItems={prefixedTopActions}
            />
          }
        />
        {cbcToolRegistry.map((tool) => (
          <Route
            key={tool.path}
            path={tool.path}
            element={<ToolScreen tool={tool} />}
          />
        ))}
        <Route path="*" element={<Navigate to={`${BASE_PATH}/`} replace />} />
      </Routes>

      <DocumentReferencesPanel
        focusedDocuments={focusedDocuments}
        documentReferences={documentReferences}
      />

      <footer>
        Informational tool only. Validate actions against current AZDES CBC
        policy and system guidance.
      </footer>
    </PageTemplate>
  );
}

export default CBCApp;
