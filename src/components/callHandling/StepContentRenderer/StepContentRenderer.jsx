import "./StepContentRenderer.css";
import AppButton from "../../ui/AppButton/AppButton";

function StepContentRenderer({
  selectedStep,
  managingCallSteps,
  prepareChecklist,
  currentStepScripts,
  greetingScripts,
  verificationGuides,
  unableToVerifyProtocol,
  rfcPrompts,
  generalReviewChecklist,
  customerServiceHighlights,
  noteRequirements,
  noteDoNotInclude,
  onCopyCloseScript,
  closeCopyStatus,
}) {
  switch (selectedStep) {
    case 0:
      return (
        <div className="step-content-renderer">
          <p>
            <strong>Managing a call flow:</strong>
          </p>
          <ul className="list">
            {managingCallSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p>
            <strong>Prepare checklist:</strong>
          </p>
          <ul className="list">
            {prepareChecklist.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      );
    case 1:
      return (
        <div className="step-content-renderer">
          <p>
            <strong>Inbound:</strong> {currentStepScripts.inbound}
          </p>
          <p>
            <strong>Callback:</strong> {currentStepScripts.callback}
          </p>
          <p className="muted">{greetingScripts.proxy}</p>
        </div>
      );
    case 2:
      return (
        <div className="step-content-renderer">
          <p>
            <strong>Verification (PIN verified)</strong>
          </p>
          <ul className="list">
            {verificationGuides.pinVerified.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>Verification (No PIN)</strong>
          </p>
          <ul className="list">
            {verificationGuides.noPin.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>Employer verification</strong>
          </p>
          <ul className="list">
            {verificationGuides.employer.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>If claimant cannot be verified</strong>
          </p>
          <ul className="list">
            {unableToVerifyProtocol.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      );
    case 3:
      return (
        <div className="step-content-renderer">
          <p>
            Confirm callback number immediately after verification in case the
            call drops.
          </p>
          <p className="muted">
            Include callback attempts in actions taken if disconnection occurs.
          </p>
        </div>
      );
    case 4:
      return (
        <div className="step-content-renderer">
          <p>
            <strong>Openers:</strong>
          </p>
          <ul className="list">
            {rfcPrompts.openers.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>Follow-up examples:</strong>
          </p>
          <ul className="list">
            {rfcPrompts.followUps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>Paraphrase RFC:</strong> {rfcPrompts.paraphrase}
          </p>
        </div>
      );
    case 5:
      return (
        <div className="step-content-renderer">
          <p>
            Use the <strong>Call Triage Flow</strong> at the top of this page to
            identify the issue type and determine the correct resolution path.
          </p>
          <p>
            <strong>Issue types:</strong>
          </p>
          <ul className="list">
            <li>
              <strong>Error</strong> — assess type: FCC error, request
              submission error, system error, or user error.
            </li>
            <li>
              <strong>Locked out / password reset</strong> — determine if the
              account is locked and follow the appropriate reset flow.
            </li>
            <li>
              <strong>Functionality question</strong> — provide information and
              refer to CBC user guides at des.az.gov/cbc.
            </li>
            <li>
              <strong>Status request or explanation</strong> — provide status
              information; escalate to OLR if manual review is pending.
            </li>
          </ul>
        </div>
      );
    case 6:
      return (
        <div className="step-content-renderer">
          <p>
            <strong>Initial hold:</strong> {rfcPrompts.holdInitial}
          </p>
          <p>
            <strong>Hold check-in:</strong> {rfcPrompts.holdCheckIn}
          </p>
          <p>
            <strong>General account review</strong>
          </p>
          <ul className="list">
            {generalReviewChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case 7:
      return (
        <div className="step-content-renderer">
          <p>
            Confirm the resolution or next steps with the caller in plain
            language before moving to close.
          </p>
          <ul className="list">
            {customerServiceHighlights.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case 8:
      return (
        <div className="step-content-renderer">
          <p>
            <strong>Case note required fields</strong>
          </p>
          <ul className="list">
            {noteRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <strong>Do not include in notes</strong>
          </p>
          <ul className="list">
            {noteDoNotInclude.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case 9:
      return (
        <div className="step-content-renderer">
          <p>
            <strong>Closing:</strong> {currentStepScripts.closing}
          </p>
          <div className="actions-row">
            <AppButton
              type="button"
              variant="secondary"
              onClick={onCopyCloseScript}
            >
              Copy closing script
            </AppButton>
            {closeCopyStatus ? (
              <span className="muted">{closeCopyStatus}</span>
            ) : null}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default StepContentRenderer;
