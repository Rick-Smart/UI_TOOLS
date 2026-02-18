import { useMemo, useState } from "react";

function BenefitAwardPage() {
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [q4, setQ4] = useState(0);
  const [highUnemploymentRate, setHighUnemploymentRate] = useState(false);

  const result = useMemo(() => {
    const wages = [q1, q2, q3, q4].map(Number);
    if (wages.some((value) => Number.isNaN(value) || value < 0)) {
      return null;
    }

    const totalWages = wages.reduce((sum, value) => sum + value, 0);
    const highQuarter = Math.max(...wages);
    const weeklyBenefitAmount = Math.min(320, highQuarter * 0.04);
    const oneThirdCap = totalWages / 3;
    const weekCapMultiplier = highUnemploymentRate ? 26 : 24;
    const weekCapAmount = weeklyBenefitAmount * weekCapMultiplier;
    const maxAward = Math.min(oneThirdCap, weekCapAmount);

    return {
      totalWages,
      highQuarter,
      weeklyBenefitAmount,
      oneThirdCap,
      weekCapMultiplier,
      weekCapAmount,
      maxAward,
    };
  }, [q1, q2, q3, q4, highUnemploymentRate]);

  return (
    <section className="card stack">
      <div>
        <h2>Benefit Award Estimator</h2>
        <p className="muted section-copy">
          Estimates weekly benefit amount and maximum award using guide
          formulas.
        </p>
      </div>

      <div className="input-grid">
        <div>
          <label htmlFor="benefit-q1">Q1 wages</label>
          <input
            id="benefit-q1"
            type="number"
            min="0"
            step="0.01"
            value={q1}
            onChange={(event) => setQ1(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="benefit-q2">Q2 wages</label>
          <input
            id="benefit-q2"
            type="number"
            min="0"
            step="0.01"
            value={q2}
            onChange={(event) => setQ2(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="benefit-q3">Q3 wages</label>
          <input
            id="benefit-q3"
            type="number"
            min="0"
            step="0.01"
            value={q3}
            onChange={(event) => setQ3(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="benefit-q4">Q4 wages</label>
          <input
            id="benefit-q4"
            type="number"
            min="0"
            step="0.01"
            value={q4}
            onChange={(event) => setQ4(event.target.value)}
          />
        </div>
      </div>

      <label className="checkbox-row" htmlFor="rate-toggle">
        <input
          id="rate-toggle"
          type="checkbox"
          checked={highUnemploymentRate}
          onChange={(event) => setHighUnemploymentRate(event.target.checked)}
        />
        <span>
          Average unemployment rate in prior quarter is 5% or more (26x cap)
        </span>
      </label>

      {!result ? (
        <div className="result muted">
          Enter valid wage values to estimate benefits.
        </div>
      ) : (
        <div className="result stack" aria-live="polite">
          <h3>Estimated amounts</h3>
          <ul className="list">
            <li>Total base-period wages: ${result.totalWages.toFixed(2)}</li>
            <li>Highest quarter wages: ${result.highQuarter.toFixed(2)}</li>
            <li>
              Weekly benefit amount estimate (4% high quarter, max $320): $
              {result.weeklyBenefitAmount.toFixed(2)}
            </li>
            <li>One-third wage cap: ${result.oneThirdCap.toFixed(2)}</li>
            <li>
              {result.weekCapMultiplier}x weekly benefit cap: $
              {result.weekCapAmount.toFixed(2)}
            </li>
            <li>
              <strong>
                Estimated max benefit award: ${result.maxAward.toFixed(2)}
              </strong>
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}

export default BenefitAwardPage;
