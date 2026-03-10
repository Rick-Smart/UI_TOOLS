import { useMemo, useState } from "react";
import PageSection from "../../components/layout/PageSection";
import Tooltip from "../../components/Tooltip";
import AppButton from "../../components/ui/AppButton/AppButton";
import AppSearchBar from "../../components/ui/AppSearchBar/AppSearchBar";
import CopyButton from "../../components/ui/CopyButton/CopyButton";
import { documentReferences } from "../../data/cbc/documentReferences";

function normalizeDocNumber(value) {
  return value.trim().toUpperCase();
}

function buildDesDocumentSearchUrl(value) {
  return `https://des.az.gov/search/node/${encodeURIComponent(value)}`;
}

function CBCDocumentSearchPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeDocNumber(query);

  const matchingDocs = useMemo(() => {
    if (!normalizedQuery) {
      return documentReferences;
    }

    return documentReferences.filter((doc) => {
      return (
        doc.number.includes(normalizedQuery) ||
        doc.title.toUpperCase().includes(normalizedQuery) ||
        doc.tags.some((tag) => tag.toUpperCase().includes(normalizedQuery))
      );
    });
  }, [normalizedQuery]);

  const searchUrl = normalizedQuery
    ? buildDesDocumentSearchUrl(normalizedQuery)
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
          Search known CBC-related documents and legacy forms by number or
          keyword.
          <Tooltip text="Legacy forms DCS-1083A, CSO-1083C, CSO-1058A, and CSO-2040 have been replaced by the CBC portal at cbc.az.gov." />
        </>
      }
      headerContent={
        <span className="pill">{matchingDocs.length} matches</span>
      }
    >
      <AppSearchBar
        id="cbc-doc-number"
        label="Document number or keyword"
        tooltip="Search by form number (e.g. DCS-1083A) or keyword (e.g. central registry, clearance)."
        value={query}
        onChange={setQuery}
        placeholder="DCS-1083A, CSO-1083C, clearance"
      />

      <div className="actions-row">
        <AppButton href={searchUrl} target="_blank" rel="noopener noreferrer">
          Search DES Documents Center
        </AppButton>
        <CopyButton getSummary={buildSummary} memoryKey="CBC Document Search" />
      </div>

      <div className="stack" aria-live="polite">
        {matchingDocs.length ? (
          matchingDocs.map((doc) => (
            <article key={doc.number} className="result search-item">
              <div>
                <p>
                  <strong>
                    {doc.number}
                    {doc.revision && doc.revision !== "N/A"
                      ? ` · ${doc.revision}`
                      : ""}
                  </strong>
                </p>
                <p>{doc.title}</p>
                {doc.notes ? <p className="muted">{doc.notes}</p> : null}
              </div>
              <div className="actions-row">
                <AppButton
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open
                </AppButton>
              </div>
            </article>
          ))
        ) : (
          <p className="muted">No matching documents found.</p>
        )}
      </div>
    </PageSection>
  );
}

export default CBCDocumentSearchPage;
