import { useMemo, useState } from "react";
import { wrapUpCodes } from "../data/callHandlingData";

function findCode(code) {
  return wrapUpCodes.find((item) => item.code === code);
}

function WrapUpRecommenderPage() {
  const [callerType, setCallerType] = useState("claimant");
  const [callResult, setCallResult] = useState("completed");
  const [reason, setReason] = useState("claimReview");
  const [activeIssueAge, setActiveIssueAge] = useState("none");

  const recommendation = useMemo(() => {
    if (callResult === "busy") {
      return {
        primary: findCode("UIB-Callback: Busy Tone"),
        rationale: "Callback attempt reached a busy tone.",
      };
    }

    if (callResult === "noAnswer") {
      return {
        primary: findCode("UIB-Callback: No Answer"),
        rationale: "Callback attempt did not connect to a caller.",
      };
    }

    if (callResult === "ghost") {
      return {
        primary: findCode("UIB-Ghost Call"),
        rationale: "No caller response after ghost-call scripting.",
      };
    }

    if (callResult === "dropped") {
      return {
        primary: findCode("UIB-Dropped Call"),
        rationale: "Call disconnected during active interaction.",
      };
    }

    if (callerType === "employer") {
      if (reason === "appeal") {
        return {
          primary: findCode("UIB-Appeal ER"),
          rationale: "Employer call focused on appeal assistance/direction.",
        };
      }

      return {
        primary: findCode("UIB-ER Call"),
        rationale: "Inbound employer support call.",
      };
    }

    switch (reason) {
      case "appeal":
        return {
          primary: findCode("UIB-Appeal CLMT"),
          rationale: "Claimant call focused on appeal filing or guidance.",
        };
      case "banking":
        return {
          primary: findCode("UIB-Banking Info"),
          rationale: "Caller requested direct deposit or card help.",
        };
      case "docs":
        return {
          primary: findCode("UIB-CLMT Docs"),
          rationale: "Caller reported requested documents were submitted.",
        };
      case "cwc":
        return {
          primary: findCode("UIB-CWC Request"),
          rationale: "Caller requested combined wage claim support.",
        };
      case "idme":
        return {
          primary: findCode("UIB-IDme"),
          rationale: "Caller reported identity verification login issues.",
        };
      case "missingPayment":
        return {
          primary: findCode("UIB-Missing Pymt"),
          rationale: "Caller requested missing payment review.",
        };
      case "login":
        return {
          primary: findCode("UIB-Password / Login Issue"),
          rationale: "Caller requested portal login/password support.",
        };
      case "reviseInfo":
        return {
          primary: findCode("UIB-Revise Information"),
          rationale: "Caller requested help updating demographic details.",
        };
      case "op":
        return {
          primary: findCode("UIB-UI OP"),
          rationale: "Caller reported overpayment balance discrepancy.",
        };
      case "claimReview":
      default:
        if (activeIssueAge === "timely") {
          return {
            primary: findCode("UIB-CLMT Timely Claim"),
            rationale: "Claimant has active issue at 21 days or less.",
          };
        }

        if (activeIssueAge === "untimely") {
          return {
            primary: findCode("UIB-CLMT Untimely Claim"),
            rationale: "Claimant has active issue older than 21 days.",
          };
        }

        return {
          primary: findCode("UIB-CLMT No active Issue"),
          rationale: "Claim review completed with no active issue found.",
        };
    }
  }, [activeIssueAge, callResult, callerType, reason]);

  return (
    <section className="card stack">
      <div>
        <h2>Wrap-Up Code Recommender</h2>
        <p className="muted section-copy">
          Select call context and reason to get a likely wrap-up code
          suggestion.
        </p>
      </div>

      <div className="input-grid">
        <div>
          <label htmlFor="caller-type">Caller type</label>
          <select
            id="caller-type"
            value={callerType}
            onChange={(event) => setCallerType(event.target.value)}
          >
            <option value="claimant">Claimant</option>
            <option value="employer">Employer</option>
          </select>
        </div>

        <div>
          <label htmlFor="call-result">Call result</label>
          <select
            id="call-result"
            value={callResult}
            onChange={(event) => setCallResult(event.target.value)}
          >
            <option value="completed">Completed interaction</option>
            <option value="busy">Callback busy tone</option>
            <option value="noAnswer">Callback no answer</option>
            <option value="ghost">Ghost call</option>
            <option value="dropped">Dropped call</option>
          </select>
        </div>

        <div>
          <label htmlFor="reason">Primary reason</label>
          <select
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={callResult !== "completed"}
          >
            <option value="claimReview">Claim status review</option>
            <option value="appeal">Appeal support</option>
            <option value="banking">Banking/card issue</option>
            <option value="docs">Docs submitted update</option>
            <option value="cwc">Combined wage request</option>
            <option value="idme">Identity verification issue</option>
            <option value="missingPayment">Missing payment</option>
            <option value="login">Password/login issue</option>
            <option value="reviseInfo">Revise claim information</option>
            <option value="op">Overpayment discrepancy</option>
          </select>
        </div>

        <div>
          <label htmlFor="issue-age">Active issue age</label>
          <select
            id="issue-age"
            value={activeIssueAge}
            onChange={(event) => setActiveIssueAge(event.target.value)}
            disabled={
              callResult !== "completed" ||
              reason !== "claimReview" ||
              callerType !== "claimant"
            }
          >
            <option value="none">No active issue</option>
            <option value="timely">21 days or less</option>
            <option value="untimely">Over 21 days</option>
          </select>
        </div>
      </div>

      <div className="result stack" aria-live="polite">
        <h3>Recommended wrap-up code</h3>
        <p>
          <strong>{recommendation?.primary?.code || "No match"}</strong>
        </p>
        <p>{recommendation?.primary?.use || "Adjust call context inputs."}</p>
        <p className="muted">Reason: {recommendation?.rationale}</p>
      </div>

      <div className="result stack">
        <h3>Operator note</h3>
        <p className="muted">
          Verify the final code against live call details before ending the
          interaction.
        </p>
      </div>
    </section>
  );
}

export default WrapUpRecommenderPage;
