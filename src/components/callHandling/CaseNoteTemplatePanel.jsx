import Tooltip from "../Tooltip";

function applySentenceCase(value) {
  return value.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
    return `${prefix}${letter.toUpperCase()}`;
  });
}

function CaseNoteTemplatePanel({
  interactionMemoryLength,
  handleRefreshCaseTemplate,
  handleCopyCaseNoteTemplate,
  handleClearCapturedDetails,
  noteCopyStatus,
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
      <p className="muted">
        Use Copy summary on tools during the call, then select Refresh template
        to pull those details here.
      </p>
      <p className="muted">
        Captured tool summaries: <strong>{interactionMemoryLength}</strong>
      </p>
      <p className="muted">
        Tip: If spellcheck is not underlining typos, in Chrome open
        chrome://settings/languages, turn on Spell check, enable English (United
        States), then right-click inside the case note field and confirm
        spellcheck is enabled.
      </p>
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
