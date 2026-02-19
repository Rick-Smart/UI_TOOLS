import Tooltip from "../Tooltip";

function CallRightRail({
  selectedStep,
  orderedCallChecklist,
  renderSelectedStepContent,
  selectedScriptType,
  setSelectedScriptType,
  setScriptIndex,
  setScriptEditStatus,
  setScriptCopyStatus,
  scriptTypeOptions,
  handleCycleScript,
  handleCopyActiveScript,
  activeScript,
  handleRemoveCurrentCustomScript,
  activeScriptOptions,
  scriptIndex,
  handleResetCustomScriptsForType,
  handleResetAllCustomScripts,
  newCustomScript,
  setNewCustomScript,
  handleSaveCustomScript,
  scriptEditStatus,
  scriptCopyStatus,
  voicemailScripts,
  difficultCallerScripts,
  unableToVerifyProtocol,
  contactInfo,
  supportResources,
}) {
  return (
    <div className="stack call-col call-col-right">
      <div className="result stack" aria-live="polite">
        <h3>
          Current step guidance
          <Tooltip text="Scripts and guidance change based on the selected checklist step." />
        </h3>
        <p className="muted">
          <strong>Step {selectedStep + 1}:</strong>{" "}
          {orderedCallChecklist[selectedStep]}
        </p>
        {renderSelectedStepContent()}
      </div>

      <div className="result stack" aria-live="polite">
        <h3>
          Script options
          <Tooltip text="Approved script is always included. Use Prev/Next to cycle approved, suggested, and your saved custom scripts." />
        </h3>
        <div className="input-grid compact-grid">
          <div>
            <label htmlFor="script-type-select">Script type</label>
            <select
              id="script-type-select"
              value={selectedScriptType}
              onChange={(event) => {
                setSelectedScriptType(event.target.value);
                setScriptIndex(0);
                setScriptEditStatus("");
                setScriptCopyStatus("");
              }}
            >
              {scriptTypeOptions.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={() => handleCycleScript(-1)}
          >
            Prev
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => handleCycleScript(1)}
          >
            Next
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={handleCopyActiveScript}
          >
            Copy script
          </button>
          {activeScript?.source === "custom" ? (
            <button
              type="button"
              className="button-secondary"
              onClick={handleRemoveCurrentCustomScript}
            >
              Remove custom
            </button>
          ) : null}
          <span className="muted">
            {activeScriptOptions.length
              ? `${scriptIndex + 1} of ${activeScriptOptions.length}`
              : "No scripts available"}
          </span>
        </div>
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={handleResetCustomScriptsForType}
          >
            Reset this type
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={handleResetAllCustomScripts}
          >
            Reset all custom
          </button>
        </div>
        <p className="muted">
          Source: <strong>{activeScript?.source || "n/a"}</strong>
        </p>
        <textarea
          className="note-field-large"
          readOnly
          value={activeScript?.text || ""}
        />
        {scriptCopyStatus ? <p className="muted">{scriptCopyStatus}</p> : null}
        <div>
          <label htmlFor="custom-script-input">Add custom script</label>
          <textarea
            id="custom-script-input"
            className="note-field-large"
            value={newCustomScript}
            onChange={(event) => setNewCustomScript(event.target.value)}
            placeholder="Add your preferred script wording for this script type"
          />
          <div className="actions-row">
            <button
              type="button"
              className="button-secondary"
              onClick={handleSaveCustomScript}
            >
              Save custom script
            </button>
            {scriptEditStatus ? (
              <span className="muted">{scriptEditStatus}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="result stack">
        <h3>At-a-glance resources</h3>
        <p>
          <strong>Voicemail:</strong> {voicemailScripts.voicemail}
        </p>
        <p>
          <strong>Ghost call:</strong> {voicemailScripts.ghost}
        </p>
        <p>
          <strong>Difficult caller warning 1:</strong>{" "}
          {difficultCallerScripts.warning1}
        </p>
        <p>
          <strong>Difficult caller warning 2:</strong>{" "}
          {difficultCallerScripts.warning2}
        </p>
        <p>
          <strong>Difficult caller final:</strong>{" "}
          {difficultCallerScripts.final}
        </p>
        <p className="muted">
          Note suffix: {difficultCallerScripts.noteSuffix}
        </p>

        <p>
          <strong>If claimant cannot be verified</strong>
        </p>
        <ul className="list">
          {unableToVerifyProtocol.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p>
          <strong>Unemployment phones</strong>
        </p>
        <ul className="list">
          {contactInfo.unemploymentPhones.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p>
          <strong>Internal transfers</strong>
        </p>
        <ul className="list">
          {contactInfo.internalTransfers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p>
          <strong>Email:</strong> {contactInfo.emails.join(", ")}
        </p>
        <p>
          <strong>Website:</strong> {contactInfo.website}
        </p>

        <p>
          <strong>UI Assist services</strong>
        </p>
        <ul className="list">
          {supportResources.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>
              {item.phone ? ` · ${item.phone}` : " · Phone not listed"}
              {item.url ? (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-break"
                  >
                    Website
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CallRightRail;
