import { defaultLinks, linksStorageKey } from "../data/defaultLinks";

const LINKS_UPDATED_EVENT = "azdes-ui-toolbox-links-updated";

function normalizeLink(link) {
  if (!link || typeof link !== "object") {
    return null;
  }

  const name = String(link.name || "").trim();
  const url = String(link.url || "").trim();
  const group = String(link.group || "General").trim() || "General";

  if (!name || !url) {
    return null;
  }

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { name, url, group };
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  const unique = new Map();

  for (const link of links) {
    const normalized = normalizeLink(link);
    if (!normalized) {
      continue;
    }

    const key = `${normalized.name.toLowerCase()}|${normalized.url.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, normalized);
    }
  }

  return Array.from(unique.values());
}

export function readManagedLinks() {
  if (typeof window === "undefined") {
    return normalizeLinks(defaultLinks);
  }

  try {
    const stored = window.localStorage.getItem(linksStorageKey);
    const storedLinks = stored ? JSON.parse(stored) : defaultLinks;
    const normalized = normalizeLinks(storedLinks);
    return normalized.length ? normalized : normalizeLinks(defaultLinks);
  } catch {
    return normalizeLinks(defaultLinks);
  }
}

export function writeManagedLinks(nextLinks) {
  const normalized = normalizeLinks(nextLinks);
  const safeLinks = normalized.length
    ? normalized
    : normalizeLinks(defaultLinks);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(linksStorageKey, JSON.stringify(safeLinks));
    window.dispatchEvent(new CustomEvent(LINKS_UPDATED_EVENT));
  }

  return safeLinks;
}

export function resetManagedLinks() {
  return writeManagedLinks(defaultLinks);
}

export function subscribeManagedLinks(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleUpdated = () => listener(readManagedLinks());
  const handleStorage = (event) => {
    if (event.key === linksStorageKey) {
      handleUpdated();
    }
  };

  window.addEventListener(LINKS_UPDATED_EVENT, handleUpdated);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(LINKS_UPDATED_EVENT, handleUpdated);
    window.removeEventListener("storage", handleStorage);
  };
}
