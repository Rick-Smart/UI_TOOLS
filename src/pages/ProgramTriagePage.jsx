import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { copyText } from "../utils/copyText";

function ProgramTriagePage() {
  const [searchParams] = useSearchParams();
  const [answers, setAnswers] = useState({
    federalEmployee: false,
    exMilitaryOrNoaa: false,
    multiStateWages: false,
    approvedTraining: false,
    sharedWork: false,
    workersCompInjury: false,
    laborDispute: false,
    disasterDeclared: false,
    tradeImpacted: false,
  });
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const preset = searchParams.get("preset");
    if (!preset) {
      return;
    }

    if (preset === "federal-military") {
      setAnswers((current) => ({
        ...current,
        federalEmployee: true,
        exMilitaryOrNoaa: true,
      }));
    }

    if (preset === "disaster") {
      setAnswers((current) => ({
        ...current,
        disasterDeclared: true,
      }));
    }
  }, [searchParams]);

  function setAnswer(field, value) {
    setAnswers((current) => ({ ...current, [field]: value }));
  }

  const recommendations = useMemo(() => {
    const results = [];

    if (answers.federalEmployee) {
      results.push("UCFE (Unemployment Insurance for Federal Employees)");
    }
    if (answers.exMilitaryOrNoaa) {
      results.push("UCX (Ex-Military/NOAA)");
    }
    if (answers.multiStateWages) {
      results.push("Combined Wages claim");
    }
    if (answers.approvedTraining) {
      results.push("Approved Training review");
    }
    if (answers.sharedWork) {
      results.push("Shared Work (employer approved plan required)");
    }
    if (answers.workersCompInjury) {
      results.push("Alternate Base Period (Workers Compensation claim)");
    }
    if (answers.laborDispute) {
      results.push("Labor Dispute claim");
    }
    if (answers.disasterDeclared) {
      results.push("DUA (Disaster Unemployment Assistance)");
    }
    if (answers.tradeImpacted) {
      results.push("TRA (Trade Readjustment Allowance)");
    }

    if (!results.length) {
      results.push("Regular UI claim path");
    }

    return results;
  }, [answers]);

  async function handleCopySummary() {
    const summary = [
      "Program Triage Summary",
      ...recommendations.map((item) => `- ${item}`),
    ].join("\n");

    const copied = await copyText(summary);
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <section className="card stack">
      <div>
        <h2>Program Triage Wizard</h2>
        <p className="muted section-copy">
          Quick routing helper for the Arizona UI programs listed in UIB-1240A.
        </p>
      </div>

      <div className="input-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.federalEmployee}
            onChange={(event) =>
              setAnswer("federalEmployee", event.target.checked)
            }
          />
          <span>Claimant last worked in federal civilian employment</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.exMilitaryOrNoaa}
            onChange={(event) =>
              setAnswer("exMilitaryOrNoaa", event.target.checked)
            }
          />
          <span>Claimant separated from military service or NOAA</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.multiStateWages}
            onChange={(event) =>
              setAnswer("multiStateWages", event.target.checked)
            }
          />
          <span>Wages earned in multiple states</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.approvedTraining}
            onChange={(event) =>
              setAnswer("approvedTraining", event.target.checked)
            }
          />
          <span>Currently in potentially approved training</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.sharedWork}
            onChange={(event) => setAnswer("sharedWork", event.target.checked)}
          />
          <span>Employer has approved Shared Work plan</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.workersCompInjury}
            onChange={(event) =>
              setAnswer("workersCompInjury", event.target.checked)
            }
          />
          <span>
            Work-related injury/disability with workers compensation history
          </span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.laborDispute}
            onChange={(event) =>
              setAnswer("laborDispute", event.target.checked)
            }
          />
          <span>Strike/lockout labor dispute at worksite</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.disasterDeclared}
            onChange={(event) =>
              setAnswer("disasterDeclared", event.target.checked)
            }
          />
          <span>Claim connected to federally declared disaster</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.tradeImpacted}
            onChange={(event) =>
              setAnswer("tradeImpacted", event.target.checked)
            }
          />
          <span>Job loss tied to import/outsourcing trade impacts</span>
        </label>
      </div>

      <div className="result stack" aria-live="polite">
        <h3>Suggested program path(s)</h3>
        <ul className="list">
          {recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
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
    </section>
  );
}

export default ProgramTriagePage;
