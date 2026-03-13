import { useEffect, useMemo, useState } from "react";
import PageSection from "../components/layout/PageSection";
import CopyButton from "../components/ui/CopyButton/CopyButton";
import { trendsTips } from "../data/trendsTips";
import { subscribeManagerContent } from "../utils/managerStore";

const TREND_SECTIONS = ["trend", "tip", "suggestion"];

/**
 * Editable section metadata for the Manager Portal.
 * Update sections here when the page's editable regions change.
 */
export const pageMeta = {
  id: "trends-tips",
  label: "Trends & Tips",
  description:
    "Broadcast trends, tips, and suggestions to agents. Entries appear inline with static content, sorted by priority.",
  campaigns: ["ui-kb"],
  wireframe: "single-col",
  sections: [
    { key: "trend", label: "Trend", region: "main" },
    { key: "tip", label: "Tip", region: "main" },
    { key: "suggestion", label: "Suggestion", region: "main" },
  ],
};

const priorityRank = {
  high: 0,
  medium: 1,
  low: 2,
};

function isActive(item) {
  if (!item.expiresOn && !item.expires_on) {
    return true;
  }

  const expiry = item.expiresOn || item.expires_on;
  const expires = new Date(`${expiry}T23:59:59`);
  return expires >= new Date();
}

/** Normalize a Supabase manager_content row to match the static shape. */
function normalizeManagerEntry(entry) {
  return {
    id: `mgr-${entry.id}`,
    title: entry.title,
    type: entry.section,
    priority: entry.priority || "medium",
    message: entry.body,
    owner: "Manager Portal",
    effectiveDate: entry.published_at?.slice(0, 10) ?? "",
    expiresOn: entry.expires_on ?? "",
    isManagerEntry: true,
  };
}

function TrendsTipsPage() {
  const [managerEntries, setManagerEntries] = useState([]);

  useEffect(() => {
    return subscribeManagerContent(
      (entries) =>
        setManagerEntries(
          entries
            .filter((e) => TREND_SECTIONS.includes(e.section))
            .map(normalizeManagerEntry),
        ),
      "ui-kb",
    );
  }, []);

  const activeItems = useMemo(() => {
    const combined = [...managerEntries, ...trendsTips].filter(isActive);
    return combined.sort((a, b) => {
      const priorityCompare =
        priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityCompare !== 0) {
        return priorityCompare;
      }

      return new Date(b.effectiveDate) - new Date(a.effectiveDate);
    });
  }, [managerEntries]);

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
      description="Leader-updated campaign guidance, published in real time by your management team."
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
              {item.isManagerEntry && (
                <span className="badge badge--info">New</span>
              )}
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
