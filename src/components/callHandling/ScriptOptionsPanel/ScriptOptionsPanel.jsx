import { useState } from "react";
import Tooltip from "../../Tooltip";
import AppButton from "../../ui/AppButton/AppButton";
import "./ScriptOptionsPanel.css";

function ScriptOptionsPanel({
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
}) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  return (
    <div className="script-options-panel result stack" aria-live="polite">
      <div className="title-row">
        <h3>
          Script options
          <Tooltip text="Approved script is always included. Use Prev/Next to cycle approved, suggested, and your saved custom scripts." />
        </h3>
        <AppButton
          type="button"
          variant="secondary"
          onClick={() => setIsOptionsOpen((current) => !current)}
          aria-expanded={isOptionsOpen}
          aria-controls="script-options-content"
        >
          {isOptionsOpen
            ? "Hide script options"
            : "Create/manage custom scripts"}
        </AppButton>
      </div>

      {isOptionsOpen ? (
        <div id="script-options-content" className="stack">
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
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => handleCycleScript(-1)}
            >
              Prev
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => handleCycleScript(1)}
            >
              Next
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              onClick={handleCopyActiveScript}
            >
              Copy script
            </AppButton>
            {activeScript?.source === "custom" ? (
              <AppButton
                type="button"
                variant="secondary"
                onClick={handleRemoveCurrentCustomScript}
              >
                Remove custom
              </AppButton>
            ) : null}
            <span className="muted">
              {activeScriptOptions.length
                ? `${scriptIndex + 1} of ${activeScriptOptions.length}`
                : "No scripts available"}
            </span>
          </div>

          <div className="actions-row">
            <AppButton
              type="button"
              variant="secondary"
              onClick={handleResetCustomScriptsForType}
            >
              Reset this type
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              onClick={handleResetAllCustomScripts}
            >
              Reset all custom
            </AppButton>
          </div>

          <p className="muted">
            Source: <strong>{activeScript?.source || "n/a"}</strong>
          </p>
          <textarea
            className="note-field-large"
            readOnly
            value={activeScript?.text || ""}
          />
          {scriptCopyStatus ? (
            <p className="muted">{scriptCopyStatus}</p>
          ) : null}

          <div>
            <label htmlFor="custom-script-input">Add custom script</label>
            <p className="muted">
              Custom scripts must be approved by leadership before use.
            </p>
            <textarea
              id="custom-script-input"
              className="note-field-large"
              value={newCustomScript}
              onChange={(event) => setNewCustomScript(event.target.value)}
              placeholder="Add your preferred script wording for this script type"
            />
            <div className="actions-row">
              <AppButton
                type="button"
                variant="secondary"
                onClick={handleSaveCustomScript}
              >
                Save custom script
              </AppButton>
              {scriptEditStatus ? (
                <span className="muted">{scriptEditStatus}</span>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <p className="muted script-options-collapsed-note">
          Hidden by default. Open this section only when you need to create or
          manage custom scripts.
        </p>
      )}
    </div>
  );
}

export default ScriptOptionsPanel;
