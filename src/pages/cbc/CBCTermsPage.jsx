import { useMemo, useState } from "react";
import PageSection from "../../components/layout/PageSection";
import Tooltip from "../../components/Tooltip";
import { cbcTerms } from "../../data/cbc/cbcTerms";
import { copyText } from "../../utils/copyText";
import { addInteractionMemory } from "../../utils/interactionMemory";

function CBCTermsPage() {
  const [query, setQuery] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return cbcTerms;
    }

    return cbcTerms.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.short.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q),
    );
  }, [query]);

  async function handleCopySummary() {
    const topTerms = filtered
      .slice(0, 5)
      .map((item) =>
        item.short
          ? `- ${item.term} (${item.short}): ${item.definition}`
          : `- ${item.term}: ${item.definition}`,
      );
    const summary = [
      `Terms query: ${query.trim() || "(none)"}`,
      `Matched terms: ${filtered.length}`,
      "Top terms:",
      ...(topTerms.length ? topTerms : ["- No matching terms"]),
    ].join("\n");

    const copied = await copyText(summary);
    if (copied) {
      addInteractionMemory("CBC Terms & Acronyms", summary);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <PageSection
      title="CBC Terms & Acronyms"
      description={
        <>
          Search common CBC terms and acronyms to support clear, consistent
          caller communication.
          <Tooltip text="Search by full term, abbreviation, or a keyword from the definition." />
        </>
      }
    >
      <div className="compact-grid">
        <label htmlFor="cbc-term-search">
          Search terms
          <Tooltip text="Search by full term, abbreviation, or a keyword from the definition." />
        </label>
        <input
          id="cbc-term-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by term, abbreviation, or definition"
        />
      </div>

      <div className="result" aria-live="polite">
        {filtered.length} term(s)
      </div>

      <div className="actions-row">
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
        {filtered.length ? (
          filtered.map((item) => (
            <article key={item.term} className="result">
              <div>
                <p>
                  <strong>
                    {item.term}
                    {item.short ? ` (${item.short})` : ""}
                  </strong>
                </p>
                <p className="muted">{item.definition}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="muted">No matching terms found.</p>
        )}
      </div>
    </PageSection>
  );
}

export default CBCTermsPage;
