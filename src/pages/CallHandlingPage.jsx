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
const CUSTOM_SCRIPTS_KEY = "azdes.callHandling.customScripts";

const scriptTypeOptions = [
  { key: "inboundGreeting", label: "Greeting (Inbound)" },
  { key: "callbackGreeting", label: "Greeting (Callback)" },
  { key: "voicemail", label: "Voicemail" },
  { key: "ghostCall", label: "Ghost Call" },
  { key: "closing", label: "Closing" },
];

const stepScriptTypeMap = {
  1: "inboundGreeting",
  9: "closing",
};

const suggestedScripts = {
  inboundGreeting: [
    "Thank you for calling Arizona Unemployment. This is [First Name]. Who am I speaking with today, and how can I help?",
    "You’ve reached Arizona Unemployment. My name is [First Name]. Who am I speaking with, and what can I help with today?",
  ],
  callbackGreeting: [
    "Hello, this is Arizona Unemployment returning your callback request. My name is [First Name]. Who am I speaking with, and how can I assist?",
    "Hi, this is [First Name] with Arizona Unemployment returning your call. Who am I speaking with, and how may I help today?",
  ],
  voicemail: [
    "Thank you for calling Arizona Unemployment. This is [First Name]. We’re sorry we missed you. Please call us back when available. If you have an established claim, please have your SSN and PIN ready. Toll-free: 1-877-600-2722. Hours: Monday-Friday, 8:00 a.m. to 4:00 p.m. Thank you.",
  ],
  ghostCall: [
    "Hello, [claimant name]? (pause) Hello, [claimant name]? I cannot hear you. Please call us back when available, and we will be happy to assist you. If you have an established claim, please have your SSN and PIN ready. Toll-free: 1-877-600-2722. Hours: Monday-Friday, 8:00 a.m. to 4:00 p.m. Thank you.",
  ],
  closing: [
    "Before we end the call, do you have any other questions? Thank you for calling Arizona Unemployment. I will transfer you to the survey now.",
    "Is there anything else I can help with today? Thank you for calling, and I will transfer you to the survey now.",
  ],
};

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

function getSavedCustomScripts() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(CUSTOM_SCRIPTS_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function CallHandlingPage() {
  const [copyStatus, setCopyStatus] = useState("");
  const [noteCopyStatus, setNoteCopyStatus] = useState("");
  const [interactionMemory, setInteractionMemory] = useState([]);
  const [selectedStep, setSelectedStep] = useState(0);
  const [selectedScriptType, setSelectedScriptType] =
    useState("inboundGreeting");
  const [scriptIndex, setScriptIndex] = useState(0);
  const [scriptCopyStatus, setScriptCopyStatus] = useState("");
  const [scriptEditStatus, setScriptEditStatus] = useState("");
  const [newCustomScript, setNewCustomScript] = useState("");
  const [customScriptsByType, setCustomScriptsByType] = useState(
    getSavedCustomScripts,
  );
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      CUSTOM_SCRIPTS_KEY,
      JSON.stringify(customScriptsByType),
    );
  }, [customScriptsByType]);

  const completedCount = useMemo(
    () => checkState.filter(Boolean).length,
    [checkState],
  );

  const scriptCatalog = useMemo(
    () => ({
      inboundGreeting: [
        { source: "approved", text: greetingScripts.inbound },
        ...(suggestedScripts.inboundGreeting || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...((customScriptsByType.inboundGreeting || []).map((text) => ({
          source: "custom",
          text,
        })) || []),
      ],
      callbackGreeting: [
        { source: "approved", text: greetingScripts.callback },
        ...(suggestedScripts.callbackGreeting || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...((customScriptsByType.callbackGreeting || []).map((text) => ({
          source: "custom",
          text,
        })) || []),
      ],
      voicemail: [
        { source: "approved", text: voicemailScripts.voicemail },
        ...(suggestedScripts.voicemail || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...((customScriptsByType.voicemail || []).map((text) => ({
          source: "custom",
          text,
        })) || []),
      ],
      ghostCall: [
        { source: "approved", text: voicemailScripts.ghost },
        ...(suggestedScripts.ghostCall || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...((customScriptsByType.ghostCall || []).map((text) => ({
          source: "custom",
          text,
        })) || []),
      ],
      closing: [
        { source: "approved", text: closeScript },
        ...(suggestedScripts.closing || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...((customScriptsByType.closing || []).map((text) => ({
          source: "custom",
          text,
        })) || []),
      ],
    }),
    [customScriptsByType],
  );

  const activeScriptOptions = scriptCatalog[selectedScriptType] || [];
  const activeScript =
    activeScriptOptions[scriptIndex] || activeScriptOptions[0] || null;

  useEffect(() => {
    if (scriptIndex >= activeScriptOptions.length) {
      setScriptIndex(0);
    }
  }, [activeScriptOptions.length, scriptIndex]);

  useEffect(() => {
    const suggestedType = stepScriptTypeMap[selectedStep];
    if (suggestedType && suggestedType !== selectedScriptType) {
      setSelectedScriptType(suggestedType);
      setScriptIndex(0);
    }
  }, [selectedStep, selectedScriptType]);

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

  function handleCycleScript(direction) {
    if (!activeScriptOptions.length) {
      return;
    }

    setScriptIndex((current) => {
      const next = current + direction;
      if (next < 0) {
        return activeScriptOptions.length - 1;
      }
      if (next >= activeScriptOptions.length) {
        return 0;
      }
      return next;
    });
    setScriptCopyStatus("");
  }

  async function handleCopyActiveScript() {
    if (!activeScript?.text) {
      return;
    }

    const copied = await copyText(activeScript.text);
    setScriptCopyStatus(copied ? "Script copied." : "Copy unavailable.");
  }

  function handleSaveCustomScript() {
    const value = newCustomScript.trim();
    if (!value) {
      setScriptEditStatus("Enter a script before saving.");
      return;
    }

    setCustomScriptsByType((current) => ({
      ...current,
      [selectedScriptType]: [...(current[selectedScriptType] || []), value],
    }));
    setNewCustomScript("");
    setScriptEditStatus("Custom script saved for this script type.");
    setScriptIndex(activeScriptOptions.length);
  }

  function handleRemoveCurrentCustomScript() {
    if (!activeScript || activeScript.source !== "custom") {
      return;
    }

    setCustomScriptsByType((current) => {
      const currentList = current[selectedScriptType] || [];
      const nextList = currentList.filter((text) => text !== activeScript.text);
      return {
        ...current,
        [selectedScriptType]: nextList,
      };
    });
    setScriptIndex(0);
    setScriptEditStatus("Custom script removed.");
  }

  function renderSelectedStepContent() {
    switch (selectedStep) {
      case 0:
        return (
          <>
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
          </>
        );
      case 1:
        return (
          <>
            <p>
              <strong>Inbound:</strong> {greetingScripts.inbound}
            </p>
            <p>
              <strong>Callback:</strong> {greetingScripts.callback}
            </p>
            <p className="muted">{greetingScripts.proxy}</p>
          </>
        );
      case 2:
        return (
          <>
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
          </>
        );
      case 3:
        return (
          <>
            <p>
              Confirm callback number immediately after verification in case the
              call drops.
            </p>
            <p className="muted">
              Include callback attempts in actions taken if disconnection
              occurs.
            </p>
          </>
        );
      case 4:
        return (
          <>
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
          </>
        );
      case 5:
        return (
          <>
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
          </>
        );
      case 6:
        return (
          <>
            <p>
              Provide status update and next steps in plain language before
              moving to close.
            </p>
            <ul className="list">
              {customerServiceHighlights.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        );
      case 7:
        return (
          <>
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
                Paper weekly claims should be escalated through supervisor
                support to add certifications in system.
              </li>
            </ul>
          </>
        );
      case 8:
        return (
          <>
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
          </>
        );
      case 9:
        return (
          <>
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
          </>
        );
      default:
        return null;
    }
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

      <section className="call-workspace">
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
                  onChange={(event) =>
                    toggleChecklist(index, event.target.checked)
                  }
                  aria-label={`Mark step ${index + 1} complete`}
                />
                <button
                  type="button"
                  className="call-step-button"
                  onClick={() => setSelectedStep(index)}
                >
                  <strong>Step {index + 1}:</strong> {item}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div
          className="result call-col call-col-middle call-template-panel"
          aria-live="polite"
        >
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
                  {item.phone ? ` · ${item.phone}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </section>
  );
}

export default CallHandlingPage;
