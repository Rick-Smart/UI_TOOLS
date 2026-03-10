import { useState, useMemo } from "react";
import PageSection from "../../components/layout/PageSection";
import AppButton from "../../components/ui/AppButton/AppButton";
import AppSearchBar from "../../components/ui/AppSearchBar/AppSearchBar";
import { cbcFAQ, cbcFAQCategories } from "../../data/cbc/cbcFAQ";

function CBCFAQPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cbcFAQ.filter((item) => {
      const categoryMatch =
        activeCategory === "All" || item.category === activeCategory;
      const textMatch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return categoryMatch && textMatch;
    });
  }, [activeCategory, query]);

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <PageSection
      title="CBC Frequently Asked Questions"
      description="Common questions and answers sourced from the CBC portal at cbc.az.gov."
    >
      <section className="card stack">
        <AppSearchBar
          id="faq-search"
          label="Search questions and answers"
          value={query}
          onChange={(value) => {
            setQuery(value);
            setOpenId(null);
          }}
          placeholder="Search questions and answers…"
        />

        <div
          className="type-chip-row"
          role="tablist"
          aria-label="FAQ categories"
        >
          {["All", ...cbcFAQCategories].map((cat) => (
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
          {filtered.length} question{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          {query ? ` matching "${query}"` : ""}
        </p>
      </section>

      <section className="card stack">
        {filtered.length === 0 && (
          <p className="muted">No matching questions found.</p>
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
                  <span className="pill">{item.category}</span> {item.question}
                </span>
                <span aria-hidden>{isOpen ? "▲" : "▼"}</span>
              </AppButton>
              {isOpen && (
                <div
                  style={{ paddingTop: "10px", display: "grid", gap: "6px" }}
                >
                  {item.answer.split("\n").map((line, i) =>
                    line.trim() === "" ? (
                      <br key={i} />
                    ) : (
                      <p key={i} className="muted">
                        {line}
                      </p>
                    ),
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="card stack">
        <p className="muted">
          Source:{" "}
          <a
            href="https://cbc.az.gov/#homepagefaq"
            target="_blank"
            rel="noopener noreferrer"
          >
            CBC Portal — Frequently Asked Questions
          </a>
        </p>
      </section>
    </PageSection>
  );
}

export default CBCFAQPage;
