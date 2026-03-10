import { useState, useMemo } from "react";
import PageSection from "../../components/layout/PageSection";
import AppButton from "../../components/ui/AppButton/AppButton";
import AppSearchBar from "../../components/ui/AppSearchBar/AppSearchBar";
import {
  cbcTroubleshooting,
  cbcTroubleshootingCategories,
} from "../../data/cbc/cbcTroubleshooting";

function CBCTroubleshootingPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cbcTroubleshooting.filter((item) => {
      const categoryMatch =
        activeCategory === "All" || item.category === activeCategory;
      const textMatch =
        !q ||
        item.issue.toLowerCase().includes(q) ||
        item.steps.some((step) => step.toLowerCase().includes(q));
      return categoryMatch && textMatch;
    });
  }, [activeCategory, query]);

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <PageSection
      title="CBC Help Desk Troubleshooting Guide"
      description="Step-by-step troubleshooting for common CBC caller issues. If steps do not resolve the issue, assign ticket to Accenture."
    >
      <section className="card stack">
        <AppSearchBar
          id="troubleshooting-search"
          label="Search issues and steps"
          value={query}
          onChange={(value) => {
            setQuery(value);
            setOpenId(null);
          }}
          placeholder="Search issues and steps…"
        />

        <div
          className="type-chip-row"
          role="tablist"
          aria-label="Troubleshooting categories"
        >
          {["All", ...cbcTroubleshootingCategories].map((cat) => (
            <AppButton
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              className={`type-chip${activeCategory === cat ? " type-chip-active" : ""}`}
              onClick={() => {
                setActiveCategory(cat);
                setOpenId(null);
              }}
            >
              {cat}
            </AppButton>
          ))}
        </div>

        <p className="muted">
          {filtered.length} issue{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          {query ? ` matching "${query}"` : ""}
        </p>
      </section>

      <section className="card stack">
        {filtered.length === 0 && (
          <p className="muted">No matching issues found.</p>
        )}
        {filtered.map((item) => {
          const isOpen = openId === item.id;
          return (
            <article key={item.id} className="result">
              <AppButton
                type="button"
                className="accordion-trigger"
                aria-expanded={isOpen}
                onClick={() => toggle(item.id)}
              >
                <span>
                  <span className="pill">{item.category}</span> {item.issue}
                </span>
                <span aria-hidden>{isOpen ? "▲" : "▼"}</span>
              </AppButton>
              {isOpen && (
                <ol
                  style={{
                    paddingTop: "10px",
                    paddingLeft: "20px",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  {item.steps.map((step, i) => (
                    <li key={i} className="muted">
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </article>
          );
        })}
      </section>

      <section className="card stack">
        <p className="muted">
          Source: Updated CBC Help Desk Troubleshooting Tips (2026). For
          unresolved issues, assign ticket to Accenture with: (1) email
          associated with the account, (2) request number if applicable, (3)
          employee/employer/agency email if account linking is involved.
        </p>
        <p className="muted">
          DPS PSP:{" "}
          <a
            href="https://psp.azdps.gov"
            target="_blank"
            rel="noopener noreferrer"
          >
            psp.azdps.gov
          </a>{" "}
          · CBC User Guides:{" "}
          <a
            href="https://des.az.gov/cbc"
            target="_blank"
            rel="noopener noreferrer"
          >
            des.az.gov/cbc
          </a>
        </p>
      </section>
    </PageSection>
  );
}

export default CBCTroubleshootingPage;
