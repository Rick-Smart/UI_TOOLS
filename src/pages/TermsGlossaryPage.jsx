import { useMemo, useState } from "react";
import PageSection from "../components/layout/PageSection";
import Tooltip from "../components/Tooltip";
import AppSearchBar from "../components/ui/AppSearchBar/AppSearchBar";
import CopyButton from "../components/ui/CopyButton/CopyButton";
import { uiTerms } from "../data/uiTerms";

function TermsGlossaryPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return uiTerms;
    }

    return uiTerms.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.short.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q),
    );
  }, [query]);

  function buildSummary() {
    const topTerms = filtered
      .slice(0, 5)
      .map((item) => `- ${item.term} (${item.short}): ${item.definition}`);
    return [
      `Terms query: ${query.trim() || "(none)"}`,
      `Matched terms: ${filtered.length}`,
      "Top terms:",
      ...(topTerms.length ? topTerms : ["- No matching terms"]),
    ].join("\n");
  }

  return (
    <PageSection
      title="UI Terms & Acronyms"
      description={
        <>
          Search common UI terms and approved shorthand to support clear
          claimant communication.
          <Tooltip text="Use this glossary to standardize language across agents and reduce conflicting explanations." />
        </>
      }
    >
      <AppSearchBar
        id="term-search"
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
        <CopyButton getSummary={buildSummary} memoryKey="UI Terms & Acronyms" />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>
                Term
                <Tooltip text="Full UI concept name as used in communication and policy materials." />
              </th>
              <th>
                Short
                <Tooltip text="Approved shorthand/acronym. Avoid inventing new abbreviations in notes." />
              </th>
              <th>
                Definition
                <Tooltip text="Use this plain-language meaning when explaining terms to claimants." />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={`${item.term}-${item.short}`}>
                <td>{item.term}</td>
                <td>{item.short}</td>
                <td>{item.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}

export default TermsGlossaryPage;
