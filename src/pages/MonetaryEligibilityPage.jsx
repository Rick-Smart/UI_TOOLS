import { useMemo, useState } from "react";
import { copyText } from "../utils/copyText";

function MonetaryEligibilityPage() {
  const [minimumWage, setMinimumWage] = useState(0);
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [q4, setQ4] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");

  const summary = useMemo(() => {
    const wages = [q1, q2, q3, q4].map(Number);
    const min = Number(minimumWage);

    if (
      wages.some((value) => Number.isNaN(value) || value < 0) ||
      Number.isNaN(min) ||
      min <= 0
    ) {
      return null;
    }

    const total = wages.reduce((sum, value) => sum + value, 0);
    const highestQuarter = Math.max(...wages);
    const otherQuarterTotal = total - highestQuarter;

    const pathwayAThreshold = 390 * min;
    const pathwayA =
      highestQuarter >= pathwayAThreshold &&
      otherQuarterTotal >= highestQuarter / 2;

    const quartersWithWages = wages.filter((value) => value > 0).length;
    const pathwayB =
      total >= 8000 && quartersWithWages >= 2 && highestQuarter >= 7987.5;

    return {
      total,
      highestQuarter,
      otherQuarterTotal,
      pathwayAThreshold,
      pathwayA,
      pathwayB,
      eligible: pathwayA || pathwayB,
    };
  }, [minimumWage, q1, q2, q3, q4]);

  async function handleCopySummary() {
    if (!summary) {
      return;
    }

    const text = [
      "Monetary Eligibility Summary",
      `Eligible: ${summary.eligible ? "Yes" : "No"}`,
      `Pathway A: ${summary.pathwayA ? "Pass" : "Fail"}`,
      `Pathway B: ${summary.pathwayB ? "Pass" : "Fail"}`,
      `Total wages: $${summary.total.toFixed(2)}`,
      `Highest quarter: $${summary.highestQuarter.toFixed(2)}`,
    ].join("\n");

    const copied = await copyText(text);
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <section className="card stack">
      <div>
        <h2>Monetary Eligibility Screener</h2>
        <p className="muted section-copy">
          Screens monetary eligibility using UIB-1240A criteria. Enter current
          Arizona minimum wage and base-period quarter wages.
        </p>
      </div>

      <div className="input-grid">
        <div>
          <label htmlFor="min-wage">Arizona minimum wage</label>
          <input
            id="min-wage"
            type="number"
            min="0"
            step="0.01"
            value={minimumWage}
            onChange={(event) => setMinimumWage(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="wage-q1">Q1 wages</label>
          <input
            id="wage-q1"
            type="number"
            min="0"
            step="0.01"
            value={q1}
            onChange={(event) => setQ1(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="wage-q2">Q2 wages</label>
          <input
            id="wage-q2"
            type="number"
            min="0"
            step="0.01"
            value={q2}
            onChange={(event) => setQ2(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="wage-q3">Q3 wages</label>
          <input
            id="wage-q3"
            type="number"
            min="0"
            step="0.01"
            value={q3}
            onChange={(event) => setQ3(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="wage-q4">Q4 wages</label>
          <input
            id="wage-q4"
            type="number"
            min="0"
            step="0.01"
            value={q4}
            onChange={(event) => setQ4(event.target.value)}
          />
        </div>
      </div>

      {!summary ? (
        <div className="result muted">
          Enter valid wage values and minimum wage.
        </div>
      ) : (
        <div className="result stack" aria-live="polite">
          <h3>Eligibility result</h3>
          <p>
            <strong>
              {summary.eligible
                ? "Potentially monetarily eligible"
                : "Not monetarily eligible by entered values"}
            </strong>
          </p>
          <ul className="list">
            <li>Total base-period wages: ${summary.total.toFixed(2)}</li>
            <li>Highest quarter wages: ${summary.highestQuarter.toFixed(2)}</li>
            <li>
              Other 3-quarter total: ${summary.otherQuarterTotal.toFixed(2)}
            </li>
            <li>
              Pathway A threshold (390 × min wage): $
              {summary.pathwayAThreshold.toFixed(2)}
            </li>
            <li>Pathway A status: {summary.pathwayA ? "Pass" : "Fail"}</li>
            <li>Pathway B status: {summary.pathwayB ? "Pass" : "Fail"}</li>
          </ul>
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
        </div>
      )}
    </section>
  );
}

export default MonetaryEligibilityPage;
