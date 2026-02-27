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
import CallChecklistPanel from "../components/callHandling/CallChecklistPanel";
import CaseNoteTemplatePanel from "../components/callHandling/CaseNoteTemplatePanel";
import CallRightRail from "../components/callHandling/CallRightRail";
import { copyText } from "../utils/copyText";
import { addDailySynopsisFromCaseNote } from "../utils/dailySynopsisMemory";
import {
  clearInteractionMemory,
  formatInteractionMemory,
  getInteractionMemory,
  subscribeInteractionMemory,
} from "../utils/interactionMemory";

const CASE_NOTE_DRAFT_KEY = "azdes.callHandling.caseNoteDraft";
const CUSTOM_SCRIPTS_KEY = "azdes.callHandling.customScripts";
const AGENT_NAME_KEY = "azdes.callHandling.agentName";
const TOOL_RESULTS_HEADER = "Tool Results";
const CHECKLIST_PROGRESS_HEADER = "Checklist Progress";
const LEGACY_CHECKLIST_SECTION_START = "[[Checklist Auto-Log Start]]";
const LEGACY_CHECKLIST_SECTION_END = "[[Checklist Auto-Log End]]";
const LEGACY_TOOL_RESULTS_SECTION_START = "[[Tool Results Start]]";
const LEGACY_TOOL_RESULTS_SECTION_END = "[[Tool Results End]]";
const LEGACY_CAPTURED_DETAILS_SECTION_START = "[[Captured Tool Details Start]]";
const LEGACY_CAPTURED_DETAILS_SECTION_END = "[[Captured Tool Details End]]";

const scriptTypeOptions = [
  { key: "inboundGreeting", label: "Greeting (Inbound)" },
  { key: "callbackGreeting", label: "Greeting (Callback)" },
  { key: "voicemail", label: "Voicemail" },
  { key: "ghostCall", label: "Ghost Call" },
  { key: "closing", label: "Closing" },
];

const scriptTypeKeys = scriptTypeOptions.map((item) => item.key);

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

function buildCaseNoteTemplate(agentName = "") {
  const trimmedAgentName = agentName.trim();
  const baseTemplate = [
    `Agent name - ${trimmedAgentName}`,
    `Time of call: ${getDefaultTimeOfCall()}`,
    "Claimant: ",
    "Reason for call: ",
    "Actions taken:",
    "Important information for next team member:",
    "Next steps: ",
  ];

  return baseTemplate.join("\n");
}

function getSavedCaseNoteDraft() {
  if (typeof window === "undefined") {
    return "";
  }

  const saved = window.localStorage.getItem(CASE_NOTE_DRAFT_KEY);
  return saved || "";
}

function getSavedAgentName() {
  if (typeof window === "undefined") {
    return "";
  }

  const saved = window.localStorage.getItem(AGENT_NAME_KEY);
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

    return scriptTypeKeys.reduce((accumulator, key) => {
      const value = parsed[key];
      accumulator[key] = Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : [];
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

function buildCapturedDetailsSection(memoryItems) {
  if (!memoryItems.length) {
    return "";
  }

  return `${TOOL_RESULTS_HEADER}:\n${formatInteractionMemory(memoryItems)}`;
}

function stripSection(caseNoteDraft, startMarker, endMarker) {
  let output = String(caseNoteDraft || "");
  let start = output.indexOf(startMarker);

  while (start !== -1) {
    const endMarkerIndex = output.indexOf(endMarker, start);
    if (endMarkerIndex === -1) {
      output = output.slice(0, start);
      break;
    }

    const end = endMarkerIndex + endMarker.length;
    const removeStart =
      start > 0 && output[start - 1] === "\n" ? start - 1 : start;
    const removeEnd =
      end < output.length && output[end] === "\n" ? end + 1 : end;

    output = `${output.slice(0, removeStart)}${output.slice(removeEnd)}`;
    start = output.indexOf(startMarker);
  }

  return output.trimEnd();
}

function stripManagedSections(caseNoteDraft) {
  const withoutToolResults = stripSection(
    caseNoteDraft,
    LEGACY_TOOL_RESULTS_SECTION_START,
    LEGACY_TOOL_RESULTS_SECTION_END,
  );
  const withoutLegacyCapturedDetails = stripSection(
    withoutToolResults,
    LEGACY_CAPTURED_DETAILS_SECTION_START,
    LEGACY_CAPTURED_DETAILS_SECTION_END,
  );
  const withoutLegacyChecklist = stripSection(
    withoutLegacyCapturedDetails,
    LEGACY_CHECKLIST_SECTION_START,
    LEGACY_CHECKLIST_SECTION_END,
  );

  const withoutCurrentToolResults = withoutLegacyChecklist.replace(
    /\n*Tool Results:\n[\s\S]*?(?=\n\nChecklist Progress:|$)/,
    "",
  );
  const withoutCurrentChecklist = withoutCurrentToolResults.replace(
    /\n*Checklist Progress:\n[\s\S]*$/,
    "",
  );

  return withoutCurrentChecklist.trimEnd();
}

function buildChecklistSection(checkState) {
  const completedLines = orderedCallChecklist
    .map((item, index) => ({ item, index }))
    .filter((entry) => checkState[entry.index])
    .map((entry) => `- Step ${entry.index + 1}: ${entry.item}`);

  if (!completedLines.length) {
    return "";
  }

  return [`${CHECKLIST_PROGRESS_HEADER}:`, ...completedLines].join("\n");
}

function composeManagedSections(
  baseDraft,
  toolResultsSection,
  checklistSection,
) {
  return [baseDraft.trimEnd(), toolResultsSection, checklistSection]
    .filter(Boolean)
    .join("\n\n");
}

function syncChecklistSection(caseNoteDraft, checkState, memoryItems) {
  const baseDraft = stripManagedSections(caseNoteDraft);
  const toolResultsSection = buildCapturedDetailsSection(memoryItems);
  const checklistSection = buildChecklistSection(checkState);

  return composeManagedSections(
    baseDraft,
    toolResultsSection,
    checklistSection,
  );
}

function syncCapturedDetailsSection(caseNoteDraft, memoryItems, checkState) {
  const baseDraft = stripManagedSections(caseNoteDraft);
  const toolResultsSection = buildCapturedDetailsSection(memoryItems);
  const checklistSection = buildChecklistSection(checkState);

  return composeManagedSections(
    baseDraft,
    toolResultsSection,
    checklistSection,
  );
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
  const [agentName, setAgentName] = useState(getSavedAgentName);
  const [caseNoteDraft, setCaseNoteDraft] = useState(() => {
    const saved = getSavedCaseNoteDraft();
    return saved || buildCaseNoteTemplate(getSavedAgentName());
  });
  const [checkState, setCheckState] = useState(
    orderedCallChecklist.map(() => false),
  );

  const checklistCompletedCount = useMemo(
    () => checkState.filter(Boolean).length,
    [checkState],
  );

  useEffect(() => {
    const memory = getInteractionMemory();
    setInteractionMemory(memory);

    const unsubscribe = subscribeInteractionMemory((nextMemory) => {
      setInteractionMemory(nextMemory);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    setCaseNoteDraft((currentDraft) =>
      syncCapturedDetailsSection(currentDraft, interactionMemory, checkState),
    );
  }, [interactionMemory, checkState]);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(AGENT_NAME_KEY, agentName);
  }, [agentName]);

  const completedCount = checklistCompletedCount;

  const currentStepScripts = useMemo(
    () => ({
      inbound:
        customScriptsByType.inboundGreeting?.[0] || greetingScripts.inbound,
      callback:
        customScriptsByType.callbackGreeting?.[0] || greetingScripts.callback,
      closing: customScriptsByType.closing?.[0] || closeScript,
    }),
    [customScriptsByType],
  );

  const scriptCatalog = useMemo(
    () => ({
      inboundGreeting: [
        { source: "approved", text: greetingScripts.inbound },
        ...(suggestedScripts.inboundGreeting || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...(customScriptsByType.inboundGreeting || []).map(
          (text, customIndex) => ({
            source: "custom",
            text,
            customIndex,
          }),
        ),
      ],
      callbackGreeting: [
        { source: "approved", text: greetingScripts.callback },
        ...(suggestedScripts.callbackGreeting || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...(customScriptsByType.callbackGreeting || []).map(
          (text, customIndex) => ({
            source: "custom",
            text,
            customIndex,
          }),
        ),
      ],
      voicemail: [
        { source: "approved", text: voicemailScripts.voicemail },
        ...(suggestedScripts.voicemail || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...(customScriptsByType.voicemail || []).map((text, customIndex) => ({
          source: "custom",
          text,
          customIndex,
        })),
      ],
      ghostCall: [
        { source: "approved", text: voicemailScripts.ghost },
        ...(suggestedScripts.ghostCall || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...(customScriptsByType.ghostCall || []).map((text, customIndex) => ({
          source: "custom",
          text,
          customIndex,
        })),
      ],
      closing: [
        { source: "approved", text: closeScript },
        ...(suggestedScripts.closing || []).map((text) => ({
          source: "suggested",
          text,
        })),
        ...(customScriptsByType.closing || []).map((text, customIndex) => ({
          source: "custom",
          text,
          customIndex,
        })),
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
    if (!suggestedType) {
      return;
    }

    setSelectedScriptType((current) =>
      current === suggestedType ? current : suggestedType,
    );
    setScriptIndex(0);
  }, [selectedStep]);

  function toggleChecklist(index, checked) {
    setCheckState((current) => {
      const nextState = current.map((item, itemIndex) =>
        itemIndex === index ? checked : item,
      );

      setCaseNoteDraft((currentDraft) =>
        syncChecklistSection(currentDraft, nextState, interactionMemory),
      );
      return nextState;
    });
  }

  async function handleCopyCloseScript() {
    const copied = await copyText(closeScript);
    setCopyStatus(copied ? "Closing script copied." : "Copy unavailable.");
  }

  function handleRefreshCaseTemplate() {
    const captureResult = addDailySynopsisFromCaseNote(caseNoteDraft, {
      checklistCompletedSteps: checklistCompletedCount,
      checklistTotalSteps: orderedCallChecklist.length,
    });
    clearInteractionMemory();
    setInteractionMemory([]);
    setCheckState(orderedCallChecklist.map(() => false));
    setSelectedStep(0);

    setCaseNoteDraft(buildCaseNoteTemplate(agentName));

    if (captureResult.added) {
      setNoteCopyStatus(
        "Template refreshed, prior case note saved, and captured tool details cleared for a new interaction.",
      );
      return;
    }

    if (captureResult.reason === "duplicate") {
      setNoteCopyStatus(
        "Template refreshed. Prior case note already matched the latest daily synopsis entry, and captured tool details were cleared.",
      );
      return;
    }

    setNoteCopyStatus(
      "Template refreshed and captured tool details cleared. No synopsis was saved because all synopsis fields were blank.",
    );
  }

  function handleClearCapturedDetails() {
    clearInteractionMemory();
    setInteractionMemory([]);
    setNoteCopyStatus("Captured tool details cleared.");
  }

  function handleAppendCapturedDetails() {
    const memory = getInteractionMemory();
    setInteractionMemory(memory);

    if (!memory.length) {
      setNoteCopyStatus("No captured tool details to add yet.");
      return;
    }

    setCaseNoteDraft((currentDraft) =>
      syncCapturedDetailsSection(currentDraft, memory, checkState),
    );
    setNoteCopyStatus("Captured tool details added to case note.");
  }

  async function handleCopyCaseNoteTemplate() {
    const copied = await copyText(caseNoteDraft);
    if (!copied) {
      setNoteCopyStatus("Copy unavailable.");
      return;
    }

    const captureResult = addDailySynopsisFromCaseNote(caseNoteDraft, {
      checklistCompletedSteps: checklistCompletedCount,
      checklistTotalSteps: orderedCallChecklist.length,
    });
    if (captureResult.added) {
      setNoteCopyStatus("Case note copied and daily synopsis captured.");
      return;
    }

    if (captureResult.reason === "duplicate") {
      setNoteCopyStatus(
        "Case note copied. Daily synopsis already matches latest entry.",
      );
      return;
    }

    setNoteCopyStatus(
      "Case note copied. No synopsis was saved because all synopsis fields were blank.",
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

    const baseScriptCount =
      1 + (suggestedScripts[selectedScriptType]?.length || 0);

    setCustomScriptsByType((current) => ({
      ...current,
      [selectedScriptType]: [value],
    }));
    setNewCustomScript("");
    setScriptEditStatus(
      "Custom script saved and applied for this script type.",
    );
    setScriptIndex(baseScriptCount);
  }

  function handleRemoveCurrentCustomScript() {
    if (
      !activeScript ||
      activeScript.source !== "custom" ||
      typeof activeScript.customIndex !== "number"
    ) {
      return;
    }

    setCustomScriptsByType((current) => {
      const currentList = current[selectedScriptType] || [];
      const nextList = currentList.filter(
        (_, index) => index !== activeScript.customIndex,
      );
      return {
        ...current,
        [selectedScriptType]: nextList,
      };
    });
    setScriptIndex(0);
    setScriptEditStatus("Custom script removed.");
  }

  function handleResetCustomScriptsForType() {
    setCustomScriptsByType((current) => ({
      ...current,
      [selectedScriptType]: [],
    }));
    setScriptIndex(0);
    setScriptEditStatus("Custom scripts cleared for this script type.");
  }

  function handleResetAllCustomScripts() {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Clear all custom scripts for every script type? This cannot be undone.",
      );
      if (!confirmed) {
        return;
      }
    }

    setCustomScriptsByType({});
    setScriptIndex(0);
    setScriptEditStatus("All custom scripts cleared.");
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
              <strong>Inbound:</strong> {currentStepScripts.inbound}
            </p>
            <p>
              <strong>Callback:</strong> {currentStepScripts.callback}
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
            <p>
              <strong>Closing:</strong> {currentStepScripts.closing}
            </p>
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
        <CallChecklistPanel
          orderedCallChecklist={orderedCallChecklist}
          completedCount={completedCount}
          selectedStep={selectedStep}
          checkState={checkState}
          toggleChecklist={toggleChecklist}
          setSelectedStep={setSelectedStep}
        />

        <CaseNoteTemplatePanel
          handleRefreshCaseTemplate={handleRefreshCaseTemplate}
          handleCopyCaseNoteTemplate={handleCopyCaseNoteTemplate}
          handleAppendCapturedDetails={handleAppendCapturedDetails}
          handleClearCapturedDetails={handleClearCapturedDetails}
          noteCopyStatus={noteCopyStatus}
          capturedDetailsCount={interactionMemory.length}
          agentName={agentName}
          setAgentName={setAgentName}
          caseNoteDraft={caseNoteDraft}
          setCaseNoteDraft={setCaseNoteDraft}
        />

        <CallRightRail
          selectedStep={selectedStep}
          orderedCallChecklist={orderedCallChecklist}
          renderSelectedStepContent={renderSelectedStepContent}
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
          voicemailScripts={voicemailScripts}
          difficultCallerScripts={difficultCallerScripts}
          unableToVerifyProtocol={unableToVerifyProtocol}
          contactInfo={contactInfo}
          supportResources={supportResources}
        />
      </section>
    </section>
  );
}

export default CallHandlingPage;
