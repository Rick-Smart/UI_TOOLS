import { useEffect, useMemo, useState } from "react";
import {
  callGuideMeta,
  closeScript,
  contactInfo,
  customerServiceHighlights,
  difficultCallerScripts,
  generalReviewChecklist,
  greetingScripts,
  managingCallSteps,
  noteDoNotInclude,
  noteRequirements,
  orderedCallChecklist,
  prepareChecklist,
  rfcPrompts,
  supportResources,
  unableToVerifyProtocol,
  verificationGuides,
  voicemailScripts,
} from "../data/callHandlingGuideData";
import Tooltip from "../components/Tooltip";
import { copyText } from "../utils/copyText";
import {
  clearInteractionMemory,
  formatInteractionMemory,
  getInteractionMemory,
} from "../utils/interactionMemory";

const CASE_NOTE_DRAFT_KEY = "azdes.callHandling.caseNoteDraft";
const TOOL_DETAILS_HEADER = "Tool details pulled from this interaction:";

function getDefaultTimeOfCall() {
  return new Date().toLocaleString();
}

function buildCaseNoteTemplate(toolDetailText) {
  const baseTemplate = [
    "VALOR_Agent ID - [FirstName_LastInitial]",
    `Time of call: ${getDefaultTimeOfCall()}`,
    "Reason for call: [Enter reason for call]",
    "Actions taken (including dropped-call callback attempts): [Enter actions taken]",
    "Important information for next deputy: [Enter key information]",
    "Next steps: [Enter next steps]",
    "Approved abbreviations used: [Enter abbreviations used]",
  ];

  if (!toolDetailText || !toolDetailText.trim()) {
    return baseTemplate.join("\n");
  }

  return [...baseTemplate, "", TOOL_DETAILS_HEADER, toolDetailText].join("\n");
}

function stripToolDetailsSection(noteText) {
  const headerIndex = noteText.indexOf(TOOL_DETAILS_HEADER);
  if (headerIndex === -1) {
    return noteText.trimEnd();
  }

  return noteText.slice(0, headerIndex).trimEnd();
}

function applyToolDetailsToDraft(noteText, toolDetailText) {
  const base = stripToolDetailsSection(noteText);
  if (!toolDetailText || !toolDetailText.trim()) {
    return base;
  }

  return [base, "", TOOL_DETAILS_HEADER, toolDetailText].join("\n");
}

function getSavedCaseNoteDraft() {
  if (typeof window === "undefined") {
    return "";
  }

  const saved = window.localStorage.getItem(CASE_NOTE_DRAFT_KEY);
  return saved || "";
}

function CallHandlingPage() {
  const [copyStatus, setCopyStatus] = useState("");
  const [noteCopyStatus, setNoteCopyStatus] = useState("");
  const [interactionMemory, setInteractionMemory] = useState([]);
  const [caseNoteDraft, setCaseNoteDraft] = useState(() => {
    const saved = getSavedCaseNoteDraft();
    return saved || buildCaseNoteTemplate("");
  });
  const [checkState, setCheckState] = useState(
    orderedCallChecklist.map(() => false),
  );

  useEffect(() => {
    const memory = getInteractionMemory();
    setInteractionMemory(memory);

    setCaseNoteDraft((current) => {
      const existing =
        current || getSavedCaseNoteDraft() || buildCaseNoteTemplate("");
      return applyToolDetailsToDraft(
        existing,
        memory.length ? formatInteractionMemory(memory) : "",
      );
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CASE_NOTE_DRAFT_KEY, caseNoteDraft);
  }, [caseNoteDraft]);

  const completedCount = useMemo(
    () => checkState.filter(Boolean).length,
    [checkState],
  );

  function toggleChecklist(index, checked) {
    setCheckState((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? checked : item)),
    );
  }

  async function handleCopyCloseScript() {
    const copied = await copyText(closeScript);
    setCopyStatus(copied ? "Closing script copied." : "Copy unavailable.");
  }

  function handleRefreshCaseTemplate() {
    const memory = getInteractionMemory();
    setInteractionMemory(memory);
    setCaseNoteDraft((current) =>
      applyToolDetailsToDraft(
        current,
        memory.length ? formatInteractionMemory(memory) : "",
      ),
    );
    setNoteCopyStatus(
      memory.length
        ? "Template refreshed with latest tool details."
        : "Template refreshed. No tool summaries captured yet.",
    );
  }

  function handleClearCapturedDetails() {
    clearInteractionMemory();
    setInteractionMemory([]);
    setCaseNoteDraft((current) => stripToolDetailsSection(current));
    setNoteCopyStatus("Captured tool details cleared.");
  }

  async function handleCopyCaseNoteTemplate() {
    const copied = await copyText(caseNoteDraft);
    setNoteCopyStatus(
      copied ? "Case note template copied." : "Copy unavailable.",
    );
  }

  return (
    <section className="card stack">
      <div className="title-row">
        <div>
          <h2>Call Handling</h2>
          <p className="muted section-copy">
            {callGuideMeta.title} · {callGuideMeta.version} ·{" "}
            {callGuideMeta.program}
          </p>
        </div>
        <span className="pill">Guide access restored</span>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Managing a call</h3>
          <ul className="list">
            {managingCallSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="result stack">
          <h3>Prepare checklist</h3>
          <ul className="list">
            {prepareChecklist.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="result stack" aria-live="polite">
        <div className="title-row">
          <h3>
            In-order call checklist
            <Tooltip text="Use this checklist in sequence while on the call. Complete each step before moving to close." />
          </h3>
          <span className="pill">
            {completedCount}/{orderedCallChecklist.length} complete
          </span>
        </div>
        <p className="muted">
          Complete each step in order to confirm required actions were handled
          before close.
        </p>
        <div className="stack">
          {orderedCallChecklist.map((item, index) => (
            <label key={item} className="checkbox-row">
              <input
                type="checkbox"
                checked={checkState[index]}
                onChange={(event) =>
                  toggleChecklist(index, event.target.checked)
                }
              />
              <span>
                <strong>Step {index + 1}:</strong> {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Greeting scripts</h3>
          <p>
            <strong>Inbound:</strong> {greetingScripts.inbound}
          </p>
          <p>
            <strong>Callback:</strong> {greetingScripts.callback}
          </p>
          <p className="muted">{greetingScripts.proxy}</p>
        </div>

        <div className="result stack">
          <h3>Voicemail / Ghost call</h3>
          <p>
            <strong>Voicemail:</strong> {voicemailScripts.voicemail}
          </p>
          <p>
            <strong>Ghost call:</strong> {voicemailScripts.ghost}
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Verification (PIN verified)</h3>
          <ul className="list">
            {verificationGuides.pinVerified.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="result stack">
          <h3>
            Verification (No PIN)
            <Tooltip text="Use 5-point verification when caller did not verify with PIN. If verification fails, provide only general UI information." />
          </h3>
          <ul className="list">
            {verificationGuides.noPin.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <h3>Employer verification</h3>
          <ul className="list">
            {verificationGuides.employer.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <h3>
            If claimant cannot be verified
            <Tooltip text="Do not discuss claim-specific details. Document non-verification and direct caller to return with required information." />
          </h3>
          <ul className="list">
            {unableToVerifyProtocol.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="result stack">
        <h3>Identify RFC + hold language</h3>
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
        <p>
          <strong>Initial hold:</strong> {rfcPrompts.holdInitial}
        </p>
        <p>
          <strong>Hold check-in:</strong> {rfcPrompts.holdCheckIn}
        </p>
      </div>

      <div className="result stack">
        <h3>General claim review</h3>
        <ul className="list">
          {generalReviewChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Case note required fields</h3>
          <ul className="list">
            {noteRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="result stack">
          <h3>Do not include in notes</h3>
          <ul className="list">
            {noteDoNotInclude.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="result stack" aria-live="polite">
        <h3>
          Fillable case note template
          <Tooltip text="Template includes required note fields and can pull copied summaries from other tools used during this interaction." />
        </h3>
        <p className="muted">
          Use Copy summary on tools during the call, then select Refresh
          template to pull those details here.
        </p>
        <p className="muted">
          Captured tool summaries: <strong>{interactionMemory.length}</strong>
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
        <div>
          <label htmlFor="case-note-template">
            Case note draft
            <Tooltip text="Spellcheck is enabled in this field. Review for policy accuracy before finalizing in system notes." />
          </label>
          <textarea
            id="case-note-template"
            className="note-output"
            spellCheck
            value={caseNoteDraft}
            onChange={(event) => setCaseNoteDraft(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Closing script</h3>
          <p>{closeScript}</p>
          <div className="actions-row">
            <button
              type="button"
              className="button-secondary"
              onClick={handleCopyCloseScript}
            >
              Copy closing script
            </button>
            {copyStatus ? <span className="muted">{copyStatus}</span> : null}
          </div>
        </div>

        <div className="result stack">
          <h3>Difficult caller protocol</h3>
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
      </div>

      <div className="result stack">
        <h3>Customer service reminders</h3>
        <ul className="list">
          {customerServiceHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Contact information</h3>
          <p>
            <strong>Unemployment phones</strong>
          </p>
          <ul className="list">
            {contactInfo.unemploymentPhones.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p>
            <strong>Automated system</strong>
          </p>
          <ul className="list">
            {contactInfo.automatedSystem.map((item) => (
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
        </div>

        <div className="result stack">
          <h3>UI Assist services</h3>
          <ul className="list">
            {supportResources.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                {item.phone ? ` · ${item.phone}` : ""}
                {item.url ? (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.url}
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CallHandlingPage;
