import Tooltip from "../Tooltip";

function CallChecklistPanel({
  orderedCallChecklist,
  completedCount,
  selectedStep,
  checkState,
  toggleChecklist,
  setSelectedStep,
}) {
  return (
    <div
      className="result stack call-col call-col-left call-checklist-panel"
      aria-live="polite"
    >
      <div className="title-row">
        <h3>
          In-order call checklist
          <Tooltip text="Use this checklist in sequence while on the call. Select a step to view scripts and guidance." />
        </h3>
        <span className="pill">
          {completedCount}/{orderedCallChecklist.length} complete
        </span>
      </div>
      <div className="stack">
        {orderedCallChecklist.map((item, index) => (
          <div
            key={item}
            className={`call-step-row ${selectedStep === index ? "call-step-active" : ""}`}
          >
            <input
              type="checkbox"
              checked={checkState[index]}
              onChange={(event) => toggleChecklist(index, event.target.checked)}
              aria-label={`Mark step ${index + 1} complete`}
            />
            <button
              type="button"
              className="call-step-button"
              onClick={() => setSelectedStep(index)}
            >
              <span className="call-step-text">
                <strong className="call-step-label">Step {index + 1}:</strong>{" "}
                <span>{item}</span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CallChecklistPanel;
