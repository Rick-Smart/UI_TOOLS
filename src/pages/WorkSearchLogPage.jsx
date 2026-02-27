import { useEffect, useMemo, useState } from "react";
import Tooltip from "../components/Tooltip";
import { copyText } from "../utils/copyText";
import {
  clearDailySynopsis,
  getDailySynopsisEntries,
  subscribeDailySynopsis,
} from "../utils/dailySynopsisMemory";

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
      "",
      ...entries.flatMap((entry, index) => [
        `#${index + 1}`,
        `First name: ${entry.firstName}`,
        `Reason for call: ${entry.reasonForCall}`,
        `Actions taken: ${entry.actionsTaken}`,
        `Important information: ${entry.importantInformation}`,
        `Next steps: ${entry.nextSteps}`,
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

      {entries.length ? (
        <div className="stack" aria-live="polite">
          {entries.map((entry, index) => (
            <article key={entry.id} className="result stack">
              <div className="title-row">
                <h3>
                  #{index + 1} · {entry.firstName}
                </h3>
                <span className="muted">
                  Logged: {new Date(entry.loggedAt).toLocaleTimeString()}
                </span>
              </div>
              <p>
                <strong>Reason for call:</strong> {entry.reasonForCall}
              </p>
              <p>
                <strong>Actions taken:</strong> {entry.actionsTaken}
              </p>
              <p>
                <strong>Important information:</strong>{" "}
                {entry.importantInformation}
              </p>
              <p>
                <strong>Next steps:</strong> {entry.nextSteps}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default WorkSearchLogPage;
