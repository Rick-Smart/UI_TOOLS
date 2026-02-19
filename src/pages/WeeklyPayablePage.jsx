import { useMemo, useState } from "react";
import { copyText } from "../utils/copyText";
import { addInteractionMemory } from "../utils/interactionMemory";

function WeeklyPayablePage() {
  const [weeklyBenefitAmount, setWeeklyBenefitAmount] = useState(320);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");

  const calculation = useMemo(() => {
    const wba = Number(weeklyBenefitAmount);
    const earnings = Number(weeklyEarnings);

    if (
      Number.isNaN(wba) ||
      Number.isNaN(earnings) ||
      wba < 0 ||
      earnings < 0
    ) {
      return null;
    }

    const earningsDisregard = 160;
    const reduction = Math.max(0, earnings - earningsDisregard);
    const adjustedBeforeRounding = Math.max(0, wba - reduction);
    const payable = Math.round(adjustedBeforeRounding);

    return {
      wba,
      earnings,
      earningsDisregard,
      reduction,
      adjustedBeforeRounding,
      payable,
      noPayment: earnings >= wba,
    };
  }, [weeklyBenefitAmount, weeklyEarnings]);

  async function handleCopySummary() {
    if (!calculation) {
      return;
    }

    const summary = [
      "Weekly Payable Summary",
      `WBA: $${calculation.wba.toFixed(2)}`,
      `Weekly earnings: $${calculation.earnings.toFixed(2)}`,
      `Reduction: $${calculation.reduction.toFixed(2)}`,
      `Estimated payable: $${calculation.payable.toFixed(0)}`,
    ].join("\n");

    const copied = await copyText(summary);
    if (copied) {
      addInteractionMemory("Weekly Payable Estimator", summary);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <section className="card stack">
      <div>
        <h2>Weekly Payable Estimator</h2>
        <p className="muted section-copy">
          Uses UIB-1240A weekly earnings treatment: first $160 is excluded, and
          each dollar above $160 reduces weekly payable benefits.
        </p>
      </div>

      <div className="input-grid compact-grid">
        <div>
          <label htmlFor="wba">Weekly benefit amount (WBA)</label>
          <input
            id="wba"
            type="number"
            min="0"
            value={weeklyBenefitAmount}
            onChange={(event) => setWeeklyBenefitAmount(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="earnings">Weekly earnings (gross)</label>
          <input
            id="earnings"
            type="number"
            min="0"
            step="0.01"
            value={weeklyEarnings}
            onChange={(event) => setWeeklyEarnings(event.target.value)}
          />
        </div>
      </div>

      {!calculation ? (
        <div className="result muted">
          Enter valid values to estimate payable benefits.
        </div>
      ) : (
        <div className="result stack" aria-live="polite">
          <h3>Calculation</h3>
          <table className="table">
            <tbody>
              <tr>
                <td>Weekly benefit amount</td>
                <td>${calculation.wba.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Weekly earnings reported</td>
                <td>${calculation.earnings.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Earnings disregard</td>
                <td>${calculation.earningsDisregard.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Reduction amount</td>
                <td>${calculation.reduction.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Adjusted amount before rounding</td>
                <td>${calculation.adjustedBeforeRounding.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Estimated payable amount</td>
                <td>
                  <strong>${calculation.payable.toFixed(0)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
          {calculation.noPayment ? (
            <p className="muted">
              Note: when earnings are equal to or greater than WBA, no payment
              is due for that week.
            </p>
          ) : null}
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

export default WeeklyPayablePage;
