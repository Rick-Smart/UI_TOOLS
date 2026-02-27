const MAX_SYNOPSIS_ITEMS = 100;

let dailySynopsisEntries = [];
const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => {
    listener(getDailySynopsisEntries());
  });
}

function normalizeComparison(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function parseCaseNoteFields(caseNoteDraft) {
  const fieldMap = {
    claimant: "",
    reasonForCall: "",
    actionsTaken: "",
    importantInformation: "",
    nextSteps: "",
  };

  const lines = String(caseNoteDraft || "").split(/\r?\n/);
  let activeField = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (
      /^tool\s+results\s*:/i.test(line) ||
      /^checklist\s+progress\s*:/i.test(line) ||
      /^captured\s+tool\s+details\s*:/i.test(line) ||
      /^\[\[/i.test(line)
    ) {
      activeField = "";
      continue;
    }

    if (/^claimant\s*:/i.test(line)) {
      activeField = "claimant";
      fieldMap.claimant = line.replace(/^claimant\s*:/i, "").trim();
      continue;
    }

    if (/^reason\s+for\s+call\s*:/i.test(line)) {
      activeField = "reasonForCall";
      fieldMap.reasonForCall = line
        .replace(/^reason\s+for\s+call\s*:/i, "")
        .trim();
      continue;
    }

    if (/^actions\s+taken\s*:/i.test(line)) {
      activeField = "actionsTaken";
      fieldMap.actionsTaken = line.replace(/^actions\s+taken\s*:/i, "").trim();
      continue;
    }

    if (
      /^important\s+information\s+for\s+next\s+team\s+member\s*:/i.test(line)
    ) {
      activeField = "importantInformation";
      fieldMap.importantInformation = line
        .replace(
          /^important\s+information\s+for\s+next\s+team\s+member\s*:/i,
          "",
        )
        .trim();
      continue;
    }

    if (/^next\s+steps\s*:/i.test(line)) {
      activeField = "nextSteps";
      fieldMap.nextSteps = line.replace(/^next\s+steps\s*:/i, "").trim();
      continue;
    }

    if (!activeField || !line) {
      continue;
    }

    const existing = fieldMap[activeField];
    fieldMap[activeField] = existing ? `${existing} ${line}` : line;
  }

  return fieldMap;
}

function extractFirstName(claimantField) {
  const tokens = String(claimantField || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return "";
  }

  return tokens[0].replace(/[^A-Za-z'-]/g, "");
}

function toNumberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function calculateStepRating(completedSteps, totalSteps) {
  if (!totalSteps) {
    return 1;
  }

  const ratio = completedSteps / totalSteps;
  return Math.max(1, Math.min(5, Math.round(ratio * 5)));
}

export function getDailySynopsisEntries() {
  return [...dailySynopsisEntries];
}

export function subscribeDailySynopsis(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDailySynopsis() {
  dailySynopsisEntries = [];
  emitChange();
}

export function addDailySynopsisEntry(entry) {
  const firstName = String(entry?.firstName || "").trim();
  const reasonForCall = String(entry?.reasonForCall || "").trim();
  const actionsTaken = String(entry?.actionsTaken || "").trim();
  const importantInformation = String(entry?.importantInformation || "").trim();
  const nextSteps = String(entry?.nextSteps || "").trim();
  const checklistCompletedSteps = toNumberOrZero(
    entry?.checklistCompletedSteps,
  );
  const checklistTotalSteps = toNumberOrZero(entry?.checklistTotalSteps);
  const stepRating = calculateStepRating(
    checklistCompletedSteps,
    checklistTotalSteps,
  );

  if (
    !firstName ||
    !reasonForCall ||
    !actionsTaken ||
    !importantInformation ||
    !nextSteps
  ) {
    return { added: false, reason: "incomplete" };
  }

  const latest = dailySynopsisEntries[0];
  if (
    latest &&
    normalizeComparison(latest.firstName) === normalizeComparison(firstName) &&
    normalizeComparison(latest.reasonForCall) ===
      normalizeComparison(reasonForCall) &&
    normalizeComparison(latest.actionsTaken) ===
      normalizeComparison(actionsTaken) &&
    normalizeComparison(latest.importantInformation) ===
      normalizeComparison(importantInformation) &&
    normalizeComparison(latest.nextSteps) === normalizeComparison(nextSteps) &&
    Number(latest.checklistCompletedSteps || 0) === checklistCompletedSteps &&
    Number(latest.checklistTotalSteps || 0) === checklistTotalSteps
  ) {
    return { added: false, reason: "duplicate" };
  }

  const nextEntry = {
    id: `synopsis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    loggedAt: new Date().toISOString(),
    firstName,
    reasonForCall,
    actionsTaken,
    importantInformation,
    nextSteps,
    checklistCompletedSteps,
    checklistTotalSteps,
    stepRating,
  };

  dailySynopsisEntries = [nextEntry, ...dailySynopsisEntries].slice(
    0,
    MAX_SYNOPSIS_ITEMS,
  );
  emitChange();
  return { added: true, reason: "ok", entry: nextEntry };
}

export function addDailySynopsisFromCaseNote(caseNoteDraft, options = {}) {
  const fields = parseCaseNoteFields(caseNoteDraft);
  const firstName = extractFirstName(fields.claimant);

  return addDailySynopsisEntry({
    firstName,
    reasonForCall: fields.reasonForCall,
    actionsTaken: fields.actionsTaken,
    importantInformation: fields.importantInformation,
    nextSteps: fields.nextSteps,
    checklistCompletedSteps: options.checklistCompletedSteps,
    checklistTotalSteps: options.checklistTotalSteps,
  });
}
