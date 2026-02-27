import Tooltip from "../Tooltip";

function applySentenceCase(value) {
  return value.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
    return `${prefix}${letter.toUpperCase()}`;
  });
}

function CaseNoteTemplatePanel({
  handleRefreshCaseTemplate,
  handleCopyCaseNoteTemplate,
  handleAppendCapturedDetails,
  handleClearCapturedDetails,
  noteCopyStatus,
  capturedDetailsCount,
  agentName,
  setAgentName,
  caseNoteDraft,
  setCaseNoteDraft,
}) {
  function handleCaseNoteChange(event) {
    const nextValue = event.target.value;
    setCaseNoteDraft(applySentenceCase(nextValue));
  }

  return (
    <div
      className="result call-col call-col-middle call-template-panel"
      aria-live="polite"
    >
      <h3>
        Fillable case note template
        <Tooltip text="Template includes required note fields and can pull copied summaries from other tools used during this interaction." />
      </h3>
      <div className="compact-grid">
        <label htmlFor="agent-name-input">
          Agent name
          <Tooltip text="Saved in your browser on this device and reused when you refresh the template." />
        </label>
        <input
          id="agent-name-input"
          type="text"
          value={agentName}
          onChange={(event) => setAgentName(event.target.value)}
          placeholder="FirstName_LastInitial"
        />
      </div>
      <div className="actions-row">
        <button
          type="button"
          className="button-secondary"
          onClick={handleRefreshCaseTemplate}
          title="Refreshes the template and pulls in copied tool summaries for this interaction."
        >
          Refresh template
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleCopyCaseNoteTemplate}
          title="Copies the current case note and captures a daily synopsis entry when required fields are complete."
        >
          Copy case note
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleAppendCapturedDetails}
          title={`Adds copied tool summaries to the case note. Captured summaries available: ${capturedDetailsCount}.`}
        >
          Add captured details
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleClearCapturedDetails}
          title="Removes the Tool Results section from the case note draft."
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
          <Tooltip text="Spellcheck is enabled in this field. If typos are not underlined in Chrome, enable Spell check in language settings and verify spellcheck in the editor context menu." />
        </label>
        <textarea
          id="case-note-template"
          className="note-output call-note-output"
          spellCheck={true}
          lang="en-US"
          autoCorrect="on"
          autoCapitalize="sentences"
          value={caseNoteDraft}
          onChange={handleCaseNoteChange}
        />
      </div>
    </div>
  );
}

export default CaseNoteTemplatePanel;
