import { useMemo, useState } from "react";
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

  return (
    <section className="card stack">
      <div>
        <h2>UI Terms & Acronyms</h2>
        <p className="muted section-copy">
          Search common UI terms and approved shorthand to support clear
          claimant communication.
        </p>
      </div>

      <div className="compact-grid">
        <label htmlFor="term-search">Search terms</label>
        <input
          id="term-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by term, abbreviation, or definition"
        />
      </div>

      <div className="result" aria-live="polite">
        {filtered.length} term(s)
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Term</th>
              <th>Short</th>
              <th>Definition</th>
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
    </section>
  );
}

export default TermsGlossaryPage;
