import { useMemo, useState } from "react";
import PageSection from "../../components/layout/PageSection";
import Tooltip from "../../components/Tooltip";
import { copyText } from "../../utils/copyText";
import { documentReferences } from "../../data/cbc/documentReferences";
import { addInteractionMemory } from "../../utils/interactionMemory";

function normalizeDocNumber(value) {
  return value.trim().toUpperCase();
}

function buildDesDocumentSearchUrl(value) {
  return `https://des.az.gov/search/node/${encodeURIComponent(value)}`;
}

function CBCDocumentSearchPage() {
  const [query, setQuery] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
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

  async function handleCopySummary() {
    const topMatches = matchingDocs
      .slice(0, 5)
      .map((doc) => `- ${doc.number}: ${doc.title}`);
    const summary = [
      `Document search query: ${normalizedQuery || "(none)"}`,
      `Matches: ${matchingDocs.length}`,
      "Top matches:",
      ...(topMatches.length ? topMatches : ["- No matches found"]),
    ].join("\n");

    const copied = await copyText(summary);
    if (copied) {
      addInteractionMemory("CBC Document Search", summary);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
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
      <div className="input-row compact-grid">
        <div>
          <label htmlFor="cbc-doc-number">
            Document number or keyword
            <Tooltip text="Search by form number (e.g. DCS-1083A) or keyword (e.g. central registry, clearance)." />
          </label>
          <input
            id="cbc-doc-number"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="DCS-1083A, CSO-1083C, clearance"
          />
        </div>
      </div>

      <div className="actions-row">
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button-link"
        >
          Search DES Documents Center
        </a>
        <button
          type="button"
          className="button-secondary"
          onClick={handleCopySummary}
        >
          Copy summary
        </button>
        {copyStatus ? <span className="muted">{copyStatus}</span> : null}
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
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-link"
                >
                  Open
                </a>
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
