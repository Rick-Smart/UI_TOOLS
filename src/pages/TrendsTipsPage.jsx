import { useMemo } from "react";
import PageSection from "../components/layout/PageSection";
import CopyButton from "../components/ui/CopyButton/CopyButton";
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

  function buildSummary() {
    const summaryLines = activeItems
      .slice(0, 5)
      .map(
        (item) =>
          `- ${item.title} (${item.priority}) | ${item.type} | ${item.message}`,
      );
    return [
      `Active trends/tips: ${activeItems.length}`,
      "Top active items:",
      ...(summaryLines.length ? summaryLines : ["- No active items"]),
    ].join("\n");
  }

  return (
    <PageSection
      title="Trends, Tips & Suggestions"
      description={
        <>
          Leader-updated campaign guidance. Edit data in
          <strong> src/data/trendsTips.js</strong> and redeploy to publish
          updates.
        </>
      }
      headerContent={
        <span className="pill">{activeItems.length} active items</span>
      }
    >
      <div className="stack" aria-live="polite">
        <div className="actions-row">
          <CopyButton
            getSummary={buildSummary}
            memoryKey="Trends, Tips & Suggestions"
          />
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
    </PageSection>
  );
}

export default TrendsTipsPage;
