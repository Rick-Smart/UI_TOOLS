import { useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
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
import kbArticlesData from "../kb/data/articles.json";

const TOOLTIP_LEGEND_DISMISSED_KEY = "azdes.tooltipLegendDismissed";
const dataModules = import.meta.glob("./data/*.js", { eager: true });

function collectSearchValues(value, bucket = []) {
  if (value == null) {
    return bucket;
  }

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (text) {
      bucket.push(text);
    }
    return bucket;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSearchValues(item, bucket);
    }
    return bucket;
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectSearchValues(nested, bucket);
    }
  }

  return bucket;
}

function buildAutoIndexedDataItems() {
  const entries = [];

  for (const [modulePath, moduleExports] of Object.entries(dataModules)) {
    const moduleName =
      modulePath.split("/").pop()?.replace(".js", "") || "data";

    for (const [exportName, exportedValue] of Object.entries(moduleExports)) {
      if (typeof exportedValue === "function") {
        continue;
      }

      const rows = Array.isArray(exportedValue)
        ? exportedValue
        : [exportedValue];

      rows.forEach((row, index) => {
        const haystack = [...new Set(collectSearchValues(row, []))];
        if (!haystack.length) {
          return;
        }

        const isObjectRow =
          row && typeof row === "object" && !Array.isArray(row);
        const title =
          (isObjectRow &&
            (row.title || row.name || row.term || row.number || row.path)) ||
          `${moduleName} ${exportName} ${index + 1}`;
        const detail =
          (isObjectRow &&
            (row.description ||
              row.definition ||
              row.message ||
              row.notes ||
              row.short ||
              exportName)) ||
          exportName;
        const to =
          isObjectRow && typeof row.to === "string"
            ? row.to
            : isObjectRow &&
                typeof row.path === "string" &&
                row.path.startsWith("/")
              ? row.path
              : undefined;
        const href =
          isObjectRow &&
          (typeof row.href === "string"
            ? row.href
            : typeof row.url === "string"
              ? row.url
              : typeof row.sourceUrl === "string"
                ? row.sourceUrl
                : undefined);

        entries.push({
          id: `auto-${moduleName}-${exportName}-${index}`,
          type: "Data",
          title: String(title),
          detail: String(detail),
          to,
          href,
          haystack,
        });
      });
    }
  }

  return entries;
}

const autoIndexedDataItems = buildAutoIndexedDataItems();

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
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const includesQuery = (...values) =>
      values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );

    const toolMatches = toolRegistry
      .filter((tool) =>
        includesQuery(
          tool.title,
          tool.description,
          tool.navLabel,
          tool.microGuide,
        ),
      )
      .map((tool) => ({
        id: `tool-${tool.path}`,
        type: "Tool",
        title: tool.title,
        detail: tool.description,
        to: tool.path,
      }));

    const docMatches = documentReferences
      .filter((doc) =>
        includesQuery(
          doc.number,
          doc.title,
          doc.notes,
          (doc.tags || []).join(" "),
        ),
      )
      .map((doc) => ({
        id: `doc-${doc.number}`,
        type: "Document",
        title: `${doc.number} — ${doc.title}`,
        detail: "Open official source",
        href: doc.sourceUrl,
      }));

    const linkMatches = defaultLinks
      .filter((link) => includesQuery(link.name, link.group))
      .map((link) => ({
        id: `link-${link.name}`,
        type: "Link",
        title: link.name,
        detail: link.group,
        href: link.url,
      }));

    const tipMatches = trendsTips
      .filter((item) => includesQuery(item.title, item.message, item.priority))
      .map((item) => ({
        id: item.id,
        type: "Trend",
        title: item.title,
        detail: item.priority,
        to: "/trends-tips",
      }));

    const termMatches = uiTerms
      .filter((item) => includesQuery(item.term, item.short, item.definition))
      .map((item) => ({
        id: `term-${item.short}`,
        type: "Term",
        title: `${item.term} (${item.short})`,
        detail: item.definition,
        to: "/terms",
      }));

    const topActionMatches = topActions
      .filter((item) => includesQuery(item.title, item.description))
      .map((item) => ({
        id: `action-${item.to}`,
        type: "Action",
        title: item.title,
        detail: item.description,
        to: item.to,
      }));

    const callHandlingMatches = [
      {
        id: "call-guide-meta",
        type: "Guide",
        title: `${callGuideMeta.title} (${callGuideMeta.version})`,
        detail: `Program ${callGuideMeta.program}`,
        to: "/call-handling",
        haystack: [
          callGuideMeta.title,
          callGuideMeta.version,
          callGuideMeta.program,
        ],
      },
      ...managingCallSteps.map((step, index) => ({
        id: `call-step-${index}`,
        type: "Call Step",
        title: `Call step: ${step}`,
        detail: "Call handling workflow",
        to: "/call-handling",
        haystack: [step],
      })),
      ...orderedCallChecklist.map((step, index) => ({
        id: `call-check-${index}`,
        type: "Checklist",
        title: `Checklist: ${step}`,
        detail: "Ordered call checklist item",
        to: "/call-handling",
        haystack: [step],
      })),
      ...noteRequirements.map((item, index) => ({
        id: `call-note-${index}`,
        type: "Case Note",
        title: `Case note requirement: ${item}`,
        detail: "Required notation standard",
        to: "/call-handling",
        haystack: [item],
      })),
      ...supportResources.map((resource, index) => ({
        id: `call-resource-${index}`,
        type: "Resource",
        title: resource.name,
        detail: resource.phone || resource.url,
        href: resource.url,
        haystack: [resource.name, resource.phone, resource.url],
      })),
      ...contactInfo.unemploymentPhones.map((item, index) => ({
        id: `call-phone-${index}`,
        type: "Contact",
        title: `UI Contact: ${item}`,
        detail: "Unemployment phone",
        to: "/call-handling",
        haystack: [item],
      })),
      ...contactInfo.emails.map((item, index) => ({
        id: `call-email-${index}`,
        type: "Contact",
        title: `UI Email: ${item}`,
        detail: "Unemployment email",
        to: "/call-handling",
        haystack: [item],
      })),
      {
        id: "call-website",
        type: "Contact",
        title: `UI Website: ${contactInfo.website}`,
        detail: "Unemployment website",
        href: contactInfo.website,
        haystack: [contactInfo.website],
      },
    ].filter((item) =>
      includesQuery(...(item.haystack || [item.title, item.detail])),
    );

    const kbMatches = kbEntries
      .filter(
        (entry) =>
          entry?.status !== "failed" &&
          !String(entry?.title || "")
            .toLowerCase()
            .includes("fetch failed") &&
          Boolean(entry?.sourceUrl),
      )
      .filter((entry) =>
        includesQuery(
          entry.title,
          entry.summary,
          entry.topic,
          (entry.steps || []).join(" "),
          (entry.requiredDocuments || []).join(" "),
          (entry.contacts || []).join(" "),
          (entry.deadlines || []).join(" "),
          (entry.relatedLinks || []).join(" "),
          entry.sourceUrl,
        ),
      )
      .map((entry) => ({
        id: `kb-${entry.id}`,
        type: "KB",
        title: entry.title,
        detail: entry.topic || "Knowledge base article",
        href: entry.sourceUrl,
      }));

    const autoDataMatches = autoIndexedDataItems
      .filter((item) =>
        includesQuery(...(item.haystack || [item.title, item.detail])),
      )
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        detail: item.detail,
        to: item.to,
        href: item.href,
      }));

    const mergedResults = [
      ...toolMatches,
      ...docMatches,
      ...linkMatches,
      ...tipMatches,
      ...termMatches,
      ...topActionMatches,
      ...callHandlingMatches,
      ...kbMatches,
      ...autoDataMatches,
    ];

    const dedupedResults = [];
    const seen = new Set();

    for (const result of mergedResults) {
      const target = result.to || result.href || "";
      const dedupeKey = `${result.type}|${result.title}|${target}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      dedupedResults.push(result);
    }

    return dedupedResults.slice(0, 24);
  }, [kbEntries, searchQuery]);

  const focusedDocuments = useMemo(() => {
    const currentTool = toolRegistry.find(
      (tool) => tool.path === location.pathname,
    );
    const toolContext = currentTool
      ? `${currentTool.title} ${currentTool.description} ${currentTool.microGuide || ""}`.toLowerCase()
      : "";

    const queryTokens = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const scored = documentReferences.map((doc) => {
      const tags = (doc.tags || []).map((tag) => String(tag).toLowerCase());
      const haystack =
        `${doc.number} ${doc.title} ${doc.notes} ${tags.join(" ")}`.toLowerCase();

      let score = 0;

      for (const tag of tags) {
        if (toolContext.includes(tag)) {
          score += 3;
        }
      }

      for (const token of queryTokens) {
        if (haystack.includes(token)) {
          score += 2;
        }
      }

      if (
        toolContext &&
        haystack.includes(currentTool?.navLabel?.toLowerCase() || "")
      ) {
        score += 1;
      }

      return { doc, score };
    });

    const ordered = scored.sort((a, b) => b.score - a.score);
    const relevant = ordered
      .filter((item) => item.score > 0)
      .map((item) => item.doc);

    if (relevant.length) {
      const relevantNumbers = new Set(relevant.map((doc) => doc.number));
      const other = documentReferences.filter(
        (doc) => !relevantNumbers.has(doc.number),
      );
      return {
        relevant,
        other,
        contextLabel: currentTool?.title || "Current task",
      };
    }

    return {
      relevant: documentReferences.slice(0, 2),
      other: documentReferences.slice(2),
      contextLabel: currentTool?.title || "General",
    };
  }, [location.pathname, searchQuery]);

  const displayedDocuments = [
    ...focusedDocuments.relevant,
    ...focusedDocuments.other,
  ];

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

      <section className="card stack" aria-labelledby="doc-reference-heading">
        <div>
          <h2 id="doc-reference-heading">Document references</h2>
          <p className="muted section-copy">
            Focused for {focusedDocuments.contextLabel}. Most relevant
            references are shown first, followed by additional registry items.
          </p>
        </div>
        <div className="title-row">
          <span className="pill">
            Focused: {focusedDocuments.relevant.length}
          </span>
          <span className="muted">
            Total references: {documentReferences.length}
          </span>
        </div>
        <div className="docs-grid" aria-live="polite">
          {displayedDocuments.map((doc, index) => (
            <article key={doc.number} className="doc-card">
              <div className="doc-header">
                <span className="pill">{doc.number}</span>
                <span className="muted">Rev {doc.revision}</span>
              </div>
              <h3>{doc.title}</h3>
              <p className="muted">{doc.notes}</p>
              {index < focusedDocuments.relevant.length ? (
                <span className="pill">Relevant now</span>
              ) : null}
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
