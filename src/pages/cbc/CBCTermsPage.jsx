import { useMemo, useState } from "react";
import PageSection from "../../components/layout/PageSection";
import Tooltip from "../../components/Tooltip";
import AppSearchBar from "../../components/ui/AppSearchBar/AppSearchBar";
import CopyButton from "../../components/ui/CopyButton/CopyButton";
import { cbcTerms } from "../../data/cbc/cbcTerms";

function CBCTermsPage() {
  const [query, setQuery] = useState("");

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

  function buildSummary() {
    const topTerms = filtered
      .slice(0, 5)
      .map((item) =>
        item.short
          ? `- ${item.term} (${item.short}): ${item.definition}`
          : `- ${item.term}: ${item.definition}`,
      );
    return [
      `Terms query: ${query.trim() || "(none)"}`,
      `Matched terms: ${filtered.length}`,
      "Top terms:",
      ...(topTerms.length ? topTerms : ["- No matching terms"]),
    ].join("\n");
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
      <AppSearchBar
        id="cbc-term-search"
        label="Search terms"
        tooltip="Search by full term, abbreviation, or a keyword from the definition."
        value={query}
        onChange={setQuery}
        placeholder="Search by term, abbreviation, or definition"
      />

      <div className="result" aria-live="polite">
        {filtered.length} term(s)
      </div>

      <div className="actions-row">
        <CopyButton
          getSummary={buildSummary}
          memoryKey="CBC Terms & Acronyms"
        />
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
