import "./StepContentRenderer.css";
import AppButton from "../../ui/AppButton/AppButton";

function StepContentRenderer({
  selectedStep,
  managingCallSteps,
  prepareChecklist,
  currentStepScripts,
  greetingScripts,
  verificationGuides,
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
            <strong>Initial hold:</strong> {rfcPrompts.holdInitial}
          </p>
          <p>
            <strong>Hold check-in:</strong> {rfcPrompts.holdCheckIn}
          </p>
          <p>
            <strong>General claim review</strong>
          </p>
          <ul className="list">
            {generalReviewChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case 6:
      return (
        <div className="step-content-renderer">
          <p>
            Provide status update and next steps in plain language before moving
            to close.
          </p>
          <ul className="list">
            {customerServiceHighlights.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case 7:
      return (
        <div className="step-content-renderer">
          <p>
            Reinforce weekly certification requirement when claim remains
            active.
          </p>
          <ul className="list">
            <li>
              If No Valid Certifications, advise claimant that weekly
              certifications are required.
            </li>
            <li>
              Paper weekly claims should be escalated through supervisor support
              to add certifications in system.
            </li>
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
