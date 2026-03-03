import { useEffect, useMemo, useState } from "react";
import PageSection from "../components/layout/PageSection";
import WorkSearchStatusPanel from "../components/workSearchLog/WorkSearchStatusPanel/WorkSearchStatusPanel";
import WorkSearchScorecardPanel from "../components/workSearchLog/WorkSearchScorecardPanel/WorkSearchScorecardPanel";
import WorkSearchEntryCard from "../components/workSearchLog/WorkSearchEntryCard/WorkSearchEntryCard";
import { copyText } from "../utils/copyText";
import {
  clearDailySynopsis,
  getDailySynopsisEntries,
  subscribeDailySynopsis,
} from "../utils/dailySynopsisMemory";

function renderStars(rating) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 1));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
}

function displayValue(value, fallback = "Not provided") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function WorkSearchLogPage() {
  const [entries, setEntries] = useState(getDailySynopsisEntries);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeDailySynopsis((nextEntries) => {
      setEntries(nextEntries);
      if (copyStatus) {
        setCopyStatus("");
      }
    });

    return unsubscribe;
  }, [copyStatus]);

  const interactionScorecard = useMemo(() => {
    const scoredEntries = entries.filter((entry) =>
      Number.isFinite(Number(entry?.checklistTotalSteps)),
    );

    if (!scoredEntries.length) {
      return null;
    }

    const totals = scoredEntries.reduce(
      (accumulator, entry) => {
        accumulator.completed += Number(entry.checklistCompletedSteps || 0);
        accumulator.total += Number(entry.checklistTotalSteps || 0);
        accumulator.stars += Number(entry.stepRating || 1);
        return accumulator;
      },
      { completed: 0, total: 0, stars: 0 },
    );

    const averageStars = totals.stars / scoredEntries.length;

    return {
      interactions: scoredEntries.length,
      completed: totals.completed,
      total: totals.total,
      averageStars,
      averageStarsText: renderStars(Math.round(averageStars)),
    };
  }, [entries]);

  const redactedCount = useMemo(() => {
    return entries.filter((entry) => entry.redacted).length;
  }, [entries]);

  function handleClearEntries() {
    clearDailySynopsis();
    setCopyStatus("");
  }

  async function handleCopySummary() {
    if (!entries.length) {
      setCopyStatus("No entries to copy yet.");
      return;
    }

    const lines = [
      "Daily Assistance Synopsis",
      `Entries logged: ${entries.length}`,
      ...(interactionScorecard
        ? [
            `Scorecard interactions: ${interactionScorecard.interactions}`,
            `Scorecard completion: ${interactionScorecard.completed}/${interactionScorecard.total}`,
            `Scorecard average rating: ${interactionScorecard.averageStars.toFixed(1)}/5`,
          ]
        : []),
      "",
      ...entries.flatMap((entry, index) => [
        `#${index + 1}`,
        `First name: ${displayValue(entry.firstName, "Unknown")}`,
        `Redaction applied: ${entry.redacted ? "Yes" : "No"}`,
        `Reason for call: ${displayValue(entry.reasonForCall)}`,
        `Actions taken: ${displayValue(entry.actionsTaken)}`,
        `Important information: ${displayValue(entry.importantInformation)}`,
        `Next steps: ${displayValue(entry.nextSteps)}`,
        `Field completion: ${entry.synopsisCompletedFields || 0}/${entry.synopsisTotalFields || 5}`,
        `Checklist completion: ${entry.checklistCompletedSteps || 0}/${entry.checklistTotalSteps || 0}`,
        `Step rating: ${renderStars(entry.stepRating || 1)} (${entry.stepRating || 1}/5)`,
        "",
      ]),
    ];

    const copied = await copyText(lines.join("\n"));
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <PageSection
      title="Daily Assistance Synopsis Log"
      description="This view is auto-populated from Call Handling case-note activity. Entries are kept only in active tab memory and clear when tab/browser closes."
    >
      <WorkSearchStatusPanel
        entriesCount={entries.length}
        redactedCount={redactedCount}
        copyStatus={copyStatus}
        onCopySummary={handleCopySummary}
        onClearEntries={handleClearEntries}
      />

      <WorkSearchScorecardPanel interactionScorecard={interactionScorecard} />

      {entries.length ? (
        <div className="stack" aria-live="polite">
          {entries.map((entry, index) => (
            <WorkSearchEntryCard
              key={entry.id}
              entry={entry}
              index={index}
              displayValue={displayValue}
              renderStars={renderStars}
            />
          ))}
        </div>
      ) : null}
    </PageSection>
  );
}

export default WorkSearchLogPage;
