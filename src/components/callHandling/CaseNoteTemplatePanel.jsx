import Tooltip from "../Tooltip";

function CaseNoteTemplatePanel({
  interactionMemoryLength,
  handleRefreshCaseTemplate,
  handleCopyCaseNoteTemplate,
  handleClearCapturedDetails,
  noteCopyStatus,
  caseNoteDraft,
  setCaseNoteDraft,
}) {
  return (
    <div
      className="result call-col call-col-middle call-template-panel"
      aria-live="polite"
    >
      <h3>
        Fillable case note template
        <Tooltip text="Template includes required note fields and can pull copied summaries from other tools used during this interaction." />
      </h3>
      <p className="muted">
        Use Copy summary on tools during the call, then select Refresh template
        to pull those details here.
      </p>
      <p className="muted">
        Captured tool summaries: <strong>{interactionMemoryLength}</strong>
      </p>
      <div className="actions-row">
        <button
          type="button"
          className="button-secondary"
          onClick={handleRefreshCaseTemplate}
        >
          Refresh template
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleCopyCaseNoteTemplate}
        >
          Copy case note
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleClearCapturedDetails}
        >
          Clear captured details
        </button>
        {noteCopyStatus ? (
          <span className="muted">{noteCopyStatus}</span>
        ) : null}
      </div>
      <div className="call-note-editor">
        <label htmlFor="case-note-template">
          Case note draft
          <Tooltip text="Spellcheck is enabled in this field. Review for policy accuracy before finalizing in system notes." />
        </label>
        <textarea
          id="case-note-template"
          className="note-output call-note-output"
          spellCheck
          value={caseNoteDraft}
          onChange={(event) => setCaseNoteDraft(event.target.value)}
        />
      </div>
    </div>
  );
}

export default CaseNoteTemplatePanel;
