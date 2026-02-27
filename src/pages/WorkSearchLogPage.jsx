import { useEffect, useMemo, useState } from "react";
import Tooltip from "../components/Tooltip";
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

  const callReasonSummary = useMemo(() => {
    const counts = new Map();

    entries.forEach((entry) => {
      const key = entry.reasonForCall.trim().toLowerCase();
      if (!key) {
        return;
      }
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));
  }, [entries]);

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
    <section className="card stack">
      <div>
        <h2>Daily Assistance Synopsis Log</h2>
        <p className="muted section-copy">
          This view is auto-populated from Call Handling case-note activity.
          Entries are kept only in active tab memory and clear when tab/browser
          closes.
        </p>
      </div>

      <div className="result stack" aria-live="polite">
        <h3>
          Daily status
          <Tooltip text="This is a quick daily synopsis feed captured from Call Handling. Do not include last names, phone numbers, or email addresses in case notes." />
        </h3>
        <p>People helped (synopses): {entries.length}</p>
        {callReasonSummary.length ? (
          <p>
            Top reasons:{" "}
            {callReasonSummary
              .map((item) => `${item.reason} (${item.count})`)
              .join(", ")}
          </p>
        ) : (
          <p className="muted">No synopses captured yet.</p>
        )}
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={handleCopySummary}
          >
            Copy summary
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={handleClearEntries}
            disabled={!entries.length}
          >
            Clear all
          </button>
          {copyStatus ? <span className="muted">{copyStatus}</span> : null}
        </div>
      </div>

      <div className="result stack" aria-live="polite">
        <h3>
          Interaction score card
          <Tooltip text="Shows checklist completion quality per interaction using a 1-5 star score." />
        </h3>
        {interactionScorecard ? (
          <>
            <p>Scored interactions: {interactionScorecard.interactions}</p>
            <p>
              Steps completed: {interactionScorecard.completed}/
              {interactionScorecard.total}
            </p>
            <p>
              Average rating: {interactionScorecard.averageStarsText} (
              {interactionScorecard.averageStars.toFixed(1)}/5)
            </p>
          </>
        ) : (
          <p className="muted">
            No scored interactions yet. Ratings appear after a case note is
            captured from Call Handling.
          </p>
        )}
      </div>

      {entries.length ? (
        <div className="stack" aria-live="polite">
          {entries.map((entry, index) => (
            <article key={entry.id} className="result stack">
              <div className="title-row">
                <h3>
                  #{index + 1} · {displayValue(entry.firstName, "Unknown")}
                </h3>
                <span className="muted">
                  Logged: {new Date(entry.loggedAt).toLocaleTimeString()}
                </span>
              </div>
              <p>
                <strong>Reason for call:</strong>{" "}
                {displayValue(entry.reasonForCall)}
              </p>
              <p>
                <strong>Actions taken:</strong>{" "}
                {displayValue(entry.actionsTaken)}
              </p>
              <p>
                <strong>Important information:</strong>{" "}
                {displayValue(entry.importantInformation)}
              </p>
              <p>
                <strong>Next steps:</strong> {displayValue(entry.nextSteps)}
              </p>
              <p>
                <strong>Checklist completion:</strong>{" "}
                {entry.checklistCompletedSteps || 0}/
                {entry.checklistTotalSteps || 0}
              </p>
              <p>
                <strong>Field completion:</strong>{" "}
                {entry.synopsisCompletedFields || 0}/
                {entry.synopsisTotalFields || 5}
              </p>
              <p>
                <strong>Step rating:</strong>{" "}
                {renderStars(entry.stepRating || 1)} ({entry.stepRating || 1}/5)
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default WorkSearchLogPage;
