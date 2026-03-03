import { useState } from "react";
import Tooltip from "../Tooltip";
import ScriptOptionsPanel from "./ScriptOptionsPanel/ScriptOptionsPanel";
import AppButton from "../ui/AppButton/AppButton";

function CallRightRail({
  selectedStep,
  orderedCallChecklist,
  stepContent,
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
  const [quickPreviewType, setQuickPreviewType] = useState("");

  function toggleQuickPreview(type) {
    setQuickPreviewType((current) => (current === type ? "" : type));
  }

  function renderQuickPreview() {
    if (quickPreviewType === "voicemail") {
      return (
        <div className="result stack">
          <h3>Voicemail script</h3>
          <p>{voicemailScripts.voicemail}</p>
        </div>
      );
    }

    if (quickPreviewType === "ghostCall") {
      return (
        <div className="result stack">
          <h3>Ghost call script</h3>
          <p>{voicemailScripts.ghost}</p>
        </div>
      );
    }

    if (quickPreviewType === "difficultCaller") {
      return (
        <div className="result stack">
          <h3>Difficult caller scripts</h3>
          <p>
            <strong>Warning 1:</strong> {difficultCallerScripts.warning1}
          </p>
          <p>
            <strong>Warning 2:</strong> {difficultCallerScripts.warning2}
          </p>
          <p>
            <strong>Final:</strong> {difficultCallerScripts.final}
          </p>
          <p className="muted">
            Note suffix: {difficultCallerScripts.noteSuffix}
          </p>
        </div>
      );
    }

    return null;
  }

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
        {stepContent}
        <div className="actions-row">
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => toggleQuickPreview("voicemail")}
          >
            Voicemail script
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => toggleQuickPreview("ghostCall")}
          >
            Ghost call script
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => toggleQuickPreview("difficultCaller")}
          >
            Difficult caller scripts
          </AppButton>
        </div>
        <p className="muted">
          Quick access displays script text here only and does not change Script
          options. Select the same button again to hide it.
        </p>
        {renderQuickPreview()}
      </div>

      <ScriptOptionsPanel
        selectedScriptType={selectedScriptType}
        setSelectedScriptType={setSelectedScriptType}
        setScriptIndex={setScriptIndex}
        setScriptEditStatus={setScriptEditStatus}
        setScriptCopyStatus={setScriptCopyStatus}
        scriptTypeOptions={scriptTypeOptions}
        handleCycleScript={handleCycleScript}
        handleCopyActiveScript={handleCopyActiveScript}
        activeScript={activeScript}
        handleRemoveCurrentCustomScript={handleRemoveCurrentCustomScript}
        activeScriptOptions={activeScriptOptions}
        scriptIndex={scriptIndex}
        handleResetCustomScriptsForType={handleResetCustomScriptsForType}
        handleResetAllCustomScripts={handleResetAllCustomScripts}
        newCustomScript={newCustomScript}
        setNewCustomScript={setNewCustomScript}
        handleSaveCustomScript={handleSaveCustomScript}
        scriptEditStatus={scriptEditStatus}
        scriptCopyStatus={scriptCopyStatus}
      />

      <div className="result stack">
        <h3>At-a-glance resources</h3>
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
