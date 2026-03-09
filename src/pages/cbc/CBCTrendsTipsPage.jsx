import { useMemo } from "react";
import PageSection from "../../components/layout/PageSection";
import CopyButton from "../../components/ui/CopyButton/CopyButton";
import { trendsTips } from "../../data/cbc/trendsTips";

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

function CBCTrendsTipsPage() {
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
          Leader-updated campaign guidance for CBC agents. Edit data in{" "}
          <strong>src/data/cbc/trendsTips.js</strong> and redeploy to publish
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
            memoryKey="CBC Trends, Tips & Suggestions"
          />
        </div>

        {activeItems.length ? (
          activeItems.map((item) => (
            <article key={item.id} className="result search-item">
              <div>
                <p>
                  <strong>{item.title}</strong>
                  <span className="pill" style={{ marginLeft: "0.5rem" }}>
                    {item.priority}
                  </span>
                  <span className="pill" style={{ marginLeft: "0.25rem" }}>
                    {item.type}
                  </span>
                </p>
                <p className="muted">{item.message}</p>
                {item.owner ? (
                  <p className="muted">
                    {item.owner} · {item.effectiveDate}
                  </p>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className="muted">
            No active items. Add entries to{" "}
            <strong>src/data/cbc/trendsTips.js</strong> to populate this page.
          </p>
        )}
      </div>
    </PageSection>
  );
}

export default CBCTrendsTipsPage;
