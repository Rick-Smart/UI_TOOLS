import { useMemo } from "react";
import { trendsTips } from "../data/trendsTips";

const priorityRank = {
  high: 0,
  medium: 1,
  low: 2,
};

function isActive(item) {
  if (!item.expiresOn) {
    return true;
  }

  const expires = new Date(`${item.expiresOn}T23:59:59`);
  return expires >= new Date();
}

function TrendsTipsPage() {
  const activeItems = useMemo(() => {
    return [...trendsTips].filter(isActive).sort((a, b) => {
      const priorityCompare =
        priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityCompare !== 0) {
        return priorityCompare;
      }

      return new Date(b.effectiveDate) - new Date(a.effectiveDate);
    });
  }, []);

  return (
    <section className="card stack">
      <div className="title-row">
        <div>
          <h2>Trends, Tips & Suggestions</h2>
          <p className="muted section-copy">
            Leader-updated campaign guidance. Edit data in
            <strong> src/data/trendsTips.js</strong> and redeploy to publish
            updates.
          </p>
        </div>
        <span className="pill">{activeItems.length} active items</span>
      </div>

      <div className="stack" aria-live="polite">
        {activeItems.map((item) => (
          <article key={item.id} className="result stack">
            <div className="title-row">
              <h3>{item.title}</h3>
              <span className="pill">{item.priority.toUpperCase()}</span>
            </div>
            <p>{item.message}</p>
            <p className="muted">
              Type: {item.type} | Owner: {item.owner} | Effective:{" "}
              {item.effectiveDate}
              {item.expiresOn ? ` | Expires: ${item.expiresOn}` : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TrendsTipsPage;
