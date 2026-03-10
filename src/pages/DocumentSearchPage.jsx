import { useMemo, useState } from "react";
import PageSection from "../components/layout/PageSection";
import Tooltip from "../components/Tooltip";
import AppButton from "../components/ui/AppButton/AppButton";
import AppSearchBar from "../components/ui/AppSearchBar/AppSearchBar";
import CopyButton from "../components/ui/CopyButton/CopyButton";
import { documentReferences } from "../data/documentReferences";

function normalizeDocNumber(value) {
  return value.trim().toUpperCase();
}

function buildAzdesSearchUrl(value) {
  return `https://des.az.gov/search/node/${encodeURIComponent(value)}`;
}

function DocumentSearchPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeDocNumber(query);

  const matchingDocs = useMemo(() => {
    if (!normalizedQuery) {
      return documentReferences;
    }

    return documentReferences.filter((doc) => {
      return (
        doc.number.includes(normalizedQuery) ||
        doc.title.toUpperCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);

  const searchUrl = normalizedQuery
    ? buildAzdesSearchUrl(normalizedQuery)
    : "https://des.az.gov/documents-center";

  function buildSummary() {
    const topMatches = matchingDocs
      .slice(0, 5)
      .map((doc) => `- ${doc.number}: ${doc.title}`);
    return [
      `Document search query: ${normalizedQuery || "(none)"}`,
      `Matches: ${matchingDocs.length}`,
      "Top matches:",
      ...(topMatches.length ? topMatches : ["- No matches found"]),
    ].join("\n");
  }

  return (
    <PageSection
      title="Document Search"
      description={
        <>
          Search AZDES by document number and quickly open known document pages.
          <Tooltip text="Use document number format (UIB-xxxx or UB-xxx) for fastest results." />
        </>
      }
      headerContent={
        <span className="pill">{matchingDocs.length} matches</span>
      }
    >
      <AppSearchBar
        id="doc-number"
        label="Document number"
        value={query}
        onChange={setQuery}
        placeholder="UIB-1240A, UB-217C, UIB-1091A"
      />

      <div className="actions-row">
        <AppButton href={searchUrl} target="_blank" rel="noopener noreferrer">
          Search AZDES
        </AppButton>
        <AppButton
          href="https://des.az.gov/documents-center"
          variant="secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Documents Center
        </AppButton>
        <CopyButton getSummary={buildSummary} memoryKey="Document Search" />
      </div>

      <div className="docs-grid" aria-live="polite">
        {matchingDocs.map((doc) => (
          <article key={doc.number} className="doc-card stack">
            <div className="doc-header">
              <span className="pill">{doc.number}</span>
              <span className="muted">Rev {doc.revision}</span>
            </div>
            <div>
              <h3>{doc.title}</h3>
              <p className="muted">{doc.notes}</p>
            </div>
            <div className="actions-row">
              <AppButton
                href={doc.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source
              </AppButton>
              <AppButton
                href={doc.searchUrl}
                variant="secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Search by number
              </AppButton>
              <span className="muted">
                <Tooltip text="Open source goes to the known official page. Search by number helps when direct source pages move or change." />
              </span>
            </div>
          </article>
        ))}
      </div>
    </PageSection>
  );
}

export default DocumentSearchPage;
