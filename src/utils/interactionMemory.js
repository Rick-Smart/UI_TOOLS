const INTERACTION_MEMORY_KEY = "azdes.interactionMemory";
const MAX_INTERACTION_ITEMS = 20;
const INTERACTION_MEMORY_UPDATED_EVENT = "azdes:interaction-memory-updated";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getInteractionMemory() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(INTERACTION_MEMORY_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.tool === "string" &&
          typeof item.summary === "string" &&
          typeof item.capturedAt === "string",
      )
      .slice(0, MAX_INTERACTION_ITEMS);
  } catch {
    return [];
  }
}

export function addInteractionMemory(tool, summary) {
  if (!isBrowser() || !tool || !summary) {
    return;
  }

  const item = {
    tool,
    summary,
    capturedAt: new Date().toISOString(),
  };

  const existing = getInteractionMemory();
  const withoutSameTool = existing.filter(
    (entry) => String(entry.tool).toLowerCase() !== String(tool).toLowerCase(),
  );
  const next = [item, ...withoutSameTool].slice(0, MAX_INTERACTION_ITEMS);
  window.localStorage.setItem(INTERACTION_MEMORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(INTERACTION_MEMORY_UPDATED_EVENT));
}

export function clearInteractionMemory() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(INTERACTION_MEMORY_KEY);
  window.dispatchEvent(new Event(INTERACTION_MEMORY_UPDATED_EVENT));
}

export function subscribeInteractionMemory(listener) {
  if (!isBrowser()) {
    return () => {};
  }

  const handleChange = () => {
    listener(getInteractionMemory());
  };

  window.addEventListener(INTERACTION_MEMORY_UPDATED_EVENT, handleChange);

  return () => {
    window.removeEventListener(INTERACTION_MEMORY_UPDATED_EVENT, handleChange);
  };
}

export function formatInteractionMemory(memoryItems) {
  if (!memoryItems.length) {
    return "No recent tool details captured yet. Use Copy summary on other tools to capture details here.";
  }

  return memoryItems
    .map(
      (item) =>
        `[${new Date(item.capturedAt).toLocaleString()}] ${item.tool}\n${item.summary}`,
    )
    .join("\n\n");
}
