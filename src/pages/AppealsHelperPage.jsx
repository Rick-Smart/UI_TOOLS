import { useMemo, useState } from "react";
import { dateFormatter } from "../utils/quarterUtils";

const appealTypes = {
  eligibility: { label: "Determination of Eligibility", days: 15 },
  tribunal: { label: "Decision of Appeal Tribunal", days: 30 },
  board: { label: "Decision of Appeals Board", days: 30 },
};

function addCalendarDays(isoDate, daysToAdd) {
  const base = new Date(`${isoDate}T12:00:00`);
  base.setDate(base.getDate() + daysToAdd);
  return base;
}

function AppealsHelperPage() {
  const [determinationDate, setDeterminationDate] = useState("");
  const [appealType, setAppealType] = useState("eligibility");
  const [filingMethod, setFilingMethod] = useState("other");

  const output = useMemo(() => {
    if (!determinationDate) {
      return null;
    }

    const selected = appealTypes[appealType] ?? appealTypes.eligibility;
    const deadline = addCalendarDays(determinationDate, selected.days);

    return {
      selected,
      deadline,
      methodNote:
        filingMethod === "mail"
          ? "If mailed, postmark date is used."
          : "If not mailed, received date is used.",
    };
  }, [determinationDate, appealType, filingMethod]);

  return (
    <section className="card stack">
      <div>
        <h2>Appeals Deadline Helper</h2>
        <p className="muted section-copy">
          Calculates appeal timing windows from UIB-1240A timelines.
        </p>
      </div>

      <div className="input-grid compact-grid">
        <div>
          <label htmlFor="determination-date">
            Determination/decision date
          </label>
          <input
            id="determination-date"
            type="date"
            value={determinationDate}
            onChange={(event) => setDeterminationDate(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="appeal-type">Appeal type</label>
          <select
            id="appeal-type"
            value={appealType}
            onChange={(event) => setAppealType(event.target.value)}
          >
            {Object.entries(appealTypes).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label} ({value.days} days)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filing-method">Submission method</label>
          <select
            id="filing-method"
            value={filingMethod}
            onChange={(event) => setFilingMethod(event.target.value)}
          >
            <option value="other">Online/fax/phone/in person</option>
            <option value="mail">Mail</option>
          </select>
        </div>
      </div>

      {!output ? (
        <div className="result muted">
          Select a date to calculate a deadline.
        </div>
      ) : (
        <div className="result stack" aria-live="polite">
          <h3>Appeal window</h3>
          <p>
            <strong>{output.selected.label}</strong>: {output.selected.days}{" "}
            calendar days
          </p>
          <p>
            Estimated deadline date:{" "}
            <strong>{dateFormatter.format(output.deadline)}</strong>
          </p>
          <p className="muted">{output.methodNote}</p>
          <p className="muted">
            If filing is late, include a written explanation for late filing.
          </p>
        </div>
      )}
    </section>
  );
}

export default AppealsHelperPage;
