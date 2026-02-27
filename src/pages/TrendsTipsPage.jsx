import { useMemo, useState } from "react";
import { trendsTips } from "../data/trendsTips";
import { copyText } from "../utils/copyText";
import { addInteractionMemory } from "../utils/interactionMemory";

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
  const [copyStatus, setCopyStatus] = useState("");

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

  async function handleCopySummary() {
    const summaryLines = activeItems
      .slice(0, 5)
      .map(
        (item) =>
          `- ${item.title} (${item.priority}) | ${item.type} | ${item.message}`,
      );
    const summary = [
      `Active trends/tips: ${activeItems.length}`,
      "Top active items:",
      ...(summaryLines.length ? summaryLines : ["- No active items"]),
    ].join("\n");

    const copied = await copyText(summary);
    if (copied) {
      addInteractionMemory("Trends, Tips & Suggestions", summary);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

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
