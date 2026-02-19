import { useMemo, useState } from "react";
import { copyText } from "../utils/copyText";
import { addInteractionMemory } from "../utils/interactionMemory";
import { dateFormatter } from "../utils/quarterUtils";

function toIsoLocalDate(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().split("T")[0];
}

function DateHelperPage() {
  const todayIso = useMemo(() => toIsoLocalDate(new Date()), []);
  const [startDate, setStartDate] = useState(todayIso);
  const [days, setDays] = useState(7);
  const [copyStatus, setCopyStatus] = useState("");

  const resultText = useMemo(() => {
    if (!startDate || Number.isNaN(Number(days))) {
      return "Enter a start date and a valid day count.";
    }

    const start = new Date(`${startDate}T12:00:00`);
    const result = new Date(start);
    result.setDate(result.getDate() + Number(days));

    return `${dateFormatter.format(start)} + ${days} day(s) = ${dateFormatter.format(result)}`;
  }, [startDate, days]);

  async function handleCopySummary() {
    const copied = await copyText(resultText);
    if (copied) {
      addInteractionMemory("Date Offset Helper", resultText);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <section className="card stack">
      <div>
        <h2>Date Offset Helper</h2>
        <p className="muted section-copy">
          Add positive or negative day offsets to get due dates quickly.
        </p>
      </div>

      <div className="input-grid compact-grid">
        <div>
          <label htmlFor="offset-start">Start date</label>
          <input
            id="offset-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="offset-days">Add days</label>
          <input
            id="offset-days"
            type="number"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </div>
      </div>

      <div className="result" aria-live="polite">
        {resultText}
      </div>

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
    </section>
  );
}

export default DateHelperPage;
