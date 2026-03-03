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
import StepContentRenderer from "../components/callHandling/StepContentRenderer/StepContentRenderer";
import {
  buildScriptCatalog,
  scriptTypeKeys,
  scriptTypeOptions,
  stepScriptTypeMap,
  suggestedScripts,
} from "../components/callHandling/ScriptOptionsPanel/scriptOptionsLogic";
import { copyText } from "../utils/copyText";
import { addDailySynopsisFromCaseNote } from "../utils/dailySynopsisMemory";
import {
  clearInteractionMemory,
  formatInteractionMemory,
  getInteractionMemory,
  subscribeInteractionMemory,
} from "../utils/interactionMemory";
import PageSection from "../components/layout/PageSection";

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
  const [interactionMemory, setInteractionMemory] =
    useState(getInteractionMemory);
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
    const unsubscribe = subscribeInteractionMemory((nextMemory) => {
      setInteractionMemory(nextMemory);
      setCaseNoteDraft((currentDraft) =>
        syncCapturedDetailsSection(currentDraft, nextMemory, checkState),
      );
    });

    return unsubscribe;
  }, [checkState]);

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
    () =>
      buildScriptCatalog({
        greetingScripts,
        voicemailScripts,
        closeScript,
        customScriptsByType,
      }),
    [customScriptsByType],
  );

  const activeScriptOptions = scriptCatalog[selectedScriptType] || [];
  const selectedScriptIndex =
    scriptIndex >= activeScriptOptions.length ? 0 : scriptIndex;
  const activeScript =
    activeScriptOptions[selectedScriptIndex] || activeScriptOptions[0] || null;

  function handleSelectStep(stepIndex) {
    setSelectedStep(stepIndex);

    const suggestedType = stepScriptTypeMap[stepIndex];
    if (!suggestedType) {
      return;
    }

    setSelectedScriptType((current) =>
      current === suggestedType ? current : suggestedType,
    );
    setScriptIndex(0);
  }

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
      forceCapture: true,
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
        captureResult.redacted
          ? "Template refreshed, prior case note saved with sensitive details redacted in synopsis capture, and captured tool details cleared for a new interaction."
          : "Template refreshed, prior case note saved, and captured tool details cleared for a new interaction.",
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
      forceCapture: true,
      checklistCompletedSteps: checklistCompletedCount,
      checklistTotalSteps: orderedCallChecklist.length,
    });
    if (captureResult.added) {
      setNoteCopyStatus(
        captureResult.redacted
          ? "Case note copied and daily synopsis captured with sensitive details redacted."
          : "Case note copied and daily synopsis captured.",
      );
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
      const safeCurrent =
        current >= activeScriptOptions.length || current < 0 ? 0 : current;
      const next = safeCurrent + direction;
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

  const stepContent = (
    <StepContentRenderer
      selectedStep={selectedStep}
      managingCallSteps={managingCallSteps}
      prepareChecklist={prepareChecklist}
      currentStepScripts={currentStepScripts}
      greetingScripts={greetingScripts}
      verificationGuides={verificationGuides}
      rfcPrompts={rfcPrompts}
      generalReviewChecklist={generalReviewChecklist}
      customerServiceHighlights={customerServiceHighlights}
      noteRequirements={noteRequirements}
      noteDoNotInclude={noteDoNotInclude}
      onCopyCloseScript={handleCopyCloseScript}
      closeCopyStatus={copyStatus}
    />
  );

  return (
    <PageSection
      title="Call Handling"
      headerContent={
        <p className="muted section-copy">
          {callGuideMeta.title} · {callGuideMeta.version} ·{" "}
          {callGuideMeta.program}
        </p>
      }
    >
      <section className="call-workspace">
        <CallChecklistPanel
          orderedCallChecklist={orderedCallChecklist}
          completedCount={completedCount}
          selectedStep={selectedStep}
          checkState={checkState}
          toggleChecklist={toggleChecklist}
          setSelectedStep={handleSelectStep}
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
          stepContent={stepContent}
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
          scriptIndex={selectedScriptIndex}
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
    </PageSection>
  );
}

export default CallHandlingPage;
