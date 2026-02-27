import { useMemo, useState } from "react";
import Tooltip from "../components/Tooltip";
import { copyText } from "../utils/copyText";
import { documentReferences } from "../data/documentReferences";
import { addInteractionMemory } from "../utils/interactionMemory";

function normalizeDocNumber(value) {
  return value.trim().toUpperCase();
}

function buildAzdesSearchUrl(value) {
  return `https://des.az.gov/search/node/${encodeURIComponent(value)}`;
}

function DocumentSearchPage() {
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
        doc.title.toUpperCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);

  const searchUrl = normalizedQuery
    ? buildAzdesSearchUrl(normalizedQuery)
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
      addInteractionMemory("Document Search", summary);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <section className="card stack">
      <div className="title-row">
        <div>
          <h2>Document Search</h2>
          <p className="muted section-copy">
            Search AZDES by document number and quickly open known document
            pages.
            <Tooltip text="Use document number format (UIB-xxxx or UB-xxx) for fastest results." />
          </p>
        </div>
        <span className="pill">{matchingDocs.length} matches</span>
      </div>

      <div className="input-row compact-grid">
        <div>
          <label htmlFor="doc-number">Document number</label>
          <input
            id="doc-number"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="UIB-1240A, UB-217C, UIB-1091A"
          />
        </div>
      </div>

      <div className="actions-row">
        <a
          className="button-link"
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Search AZDES
        </a>
        <a
          className="button-secondary button-link"
          href="https://des.az.gov/documents-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Documents Center
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
                Search by number
              </a>
              <span className="muted">
                <Tooltip text="Open source goes to the known official page. Search by number helps when direct source pages move or change." />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DocumentSearchPage;
