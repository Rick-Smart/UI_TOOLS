const PET_SCHEMA_VERSION = 1;
const AGENT_NAME_KEY = "azdes.callHandling.agentName";
const PET_STATE_UPDATED_EVENT = "azdes.pet.state-updated";
const PET_REWARD_EVENT = "azdes.pet.reward.v1";
const PET_UNLOCK_FIVE_STAR_REQUIRED = 3;
const PET_UNLOCK_TEST_INTERACTIONS_REQUIRED = 3;
const IS_DEV_BUILD = Boolean(import.meta.env?.DEV);

const PET_CATALOG = [
  { id: "cat", name: "Cat", mythical: false },
  { id: "dog", name: "Dog", mythical: false },
  { id: "crow", name: "Crow", mythical: false },
  { id: "raccoon", name: "Raccoon", mythical: false },
  { id: "dragonling", name: "Dragonling", mythical: true },
];

const POINTS_BY_STARS = {
  1: 5,
  2: 10,
  3: 16,
  4: 23,
  5: 31,
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeAgentId(rawAgentName) {
  const trimmed = String(rawAgentName || "")
    .trim()
    .toLowerCase();
  if (!trimmed) {
    return "agent-default";
  }

  return (
    trimmed.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
    "agent-default"
  );
}

function getCurrentAgentId() {
  if (!isBrowser()) {
    return "agent-default";
  }

  const savedName = window.localStorage.getItem(AGENT_NAME_KEY) || "";
  return normalizeAgentId(savedName);
}

function buildKeys(agentId) {
  return {
    profile: `azdes.pet.v1.agent.${agentId}.profile`,
    progress: `azdes.pet.v1.agent.${agentId}.progress`,
    inventory: `azdes.pet.v1.agent.${agentId}.inventory`,
  };
}

function readJsonOrNull(key) {
  if (!isBrowser()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function buildDefaultProfile(agentId) {
  const now = new Date().toISOString();
  return {
    schemaVersion: PET_SCHEMA_VERSION,
    agentId,
    unlocked: false,
    enabled: false,
    selectedPetId: null,
    unlockAt: null,
    dismissedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildDefaultProgress() {
  const now = new Date().toISOString();
  return {
    schemaVersion: PET_SCHEMA_VERSION,
    qualifyingFiveStarCount: 0,
    totalPoints: 0,
    totalRewards: 0,
    lastRewardStars: 0,
    processedInteractionIds: [],
    lastRewardAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildDefaultInventory() {
  const now = new Date().toISOString();
  return {
    schemaVersion: PET_SCHEMA_VERSION,
    ownedPetIds: PET_CATALOG.map((pet) => pet.id),
    unlockedPetIds: PET_CATALOG.map((pet) => pet.id),
    createdAt: now,
    updatedAt: now,
  };
}

function sanitizeProfile(profile, agentId) {
  const fallback = buildDefaultProfile(agentId);
  const merged = {
    ...fallback,
    ...(profile && typeof profile === "object" ? profile : {}),
    schemaVersion: PET_SCHEMA_VERSION,
    agentId,
  };

  if (
    merged.selectedPetId &&
    !PET_CATALOG.some((pet) => pet.id === merged.selectedPetId)
  ) {
    merged.selectedPetId = null;
  }

  return merged;
}

function sanitizeProgress(progress) {
  const fallback = buildDefaultProgress();
  const merged = {
    ...fallback,
    ...(progress && typeof progress === "object" ? progress : {}),
    schemaVersion: PET_SCHEMA_VERSION,
  };

  merged.qualifyingFiveStarCount = Math.max(
    0,
    Number(merged.qualifyingFiveStarCount) || 0,
  );
  merged.totalPoints = Math.max(0, Number(merged.totalPoints) || 0);
  merged.totalRewards = Math.max(0, Number(merged.totalRewards) || 0);
  merged.lastRewardStars = Math.max(
    0,
    Math.min(5, Number(merged.lastRewardStars) || 0),
  );
  merged.processedInteractionIds = Array.isArray(merged.processedInteractionIds)
    ? merged.processedInteractionIds.filter((item) => typeof item === "string")
    : [];

  return merged;
}

function sanitizeInventory(inventory) {
  const fallback = buildDefaultInventory();
  const merged = {
    ...fallback,
    ...(inventory && typeof inventory === "object" ? inventory : {}),
    schemaVersion: PET_SCHEMA_VERSION,
  };

  merged.ownedPetIds = Array.isArray(merged.ownedPetIds)
    ? merged.ownedPetIds.filter((item) => typeof item === "string")
    : fallback.ownedPetIds;

  merged.unlockedPetIds = Array.isArray(merged.unlockedPetIds)
    ? merged.unlockedPetIds.filter((item) => typeof item === "string")
    : fallback.unlockedPetIds;

  return merged;
}

function readPetState(agentId = getCurrentAgentId()) {
  const keys = buildKeys(agentId);

  const profile = sanitizeProfile(readJsonOrNull(keys.profile), agentId);
  const progress = sanitizeProgress(readJsonOrNull(keys.progress));
  const inventory = sanitizeInventory(readJsonOrNull(keys.inventory));

  return { agentId, keys, profile, progress, inventory };
}

function savePetState({ keys, profile, progress, inventory }) {
  writeJson(keys.profile, profile);
  writeJson(keys.progress, progress);
  writeJson(keys.inventory, inventory);
}

function emitPetStateUpdate(detail = {}) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(PET_STATE_UPDATED_EVENT, {
      detail,
    }),
  );
}

function emitPetReward(detail = {}) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(PET_REWARD_EVENT, {
      detail,
    }),
  );
}

function getPointsForStars(stars) {
  const safeStars = Math.max(1, Math.min(5, Number(stars) || 1));
  return POINTS_BY_STARS[safeStars] || POINTS_BY_STARS[1];
}

function hasMetUnlockRequirement(progress) {
  if (IS_DEV_BUILD) {
    return (
      Number(progress.totalRewards || 0) >=
      PET_UNLOCK_TEST_INTERACTIONS_REQUIRED
    );
  }

  return (
    Number(progress.qualifyingFiveStarCount || 0) >=
    PET_UNLOCK_FIVE_STAR_REQUIRED
  );
}

export function getPetCatalog() {
  return PET_CATALOG;
}

export function getPetStateForCurrentAgent() {
  const { agentId, profile, progress, inventory } = readPetState();
  return { agentId, profile, progress, inventory };
}

export function subscribePetState(listener) {
  if (!isBrowser()) {
    return () => {};
  }

  const handlePetUpdate = () => {
    listener(getPetStateForCurrentAgent());
  };

  const handleStorage = (event) => {
    if (!String(event.key || "").includes("azdes.pet.v1.agent.")) {
      return;
    }

    handlePetUpdate();
  };

  window.addEventListener(PET_STATE_UPDATED_EVENT, handlePetUpdate);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(PET_STATE_UPDATED_EVENT, handlePetUpdate);
    window.removeEventListener("storage", handleStorage);
  };
}

export function choosePet(petId) {
  const { agentId, keys, profile, progress, inventory } = readPetState();

  if (!PET_CATALOG.some((pet) => pet.id === petId)) {
    return;
  }

  const nextProfile = {
    ...profile,
    selectedPetId: petId,
    enabled: true,
    dismissedAt: null,
    updatedAt: new Date().toISOString(),
  };

  savePetState({ keys, profile: nextProfile, progress, inventory });
  emitPetStateUpdate({ agentId, reason: "choose-pet", petId });
}

export function dismissPet() {
  const { agentId, keys, profile, progress, inventory } = readPetState();

  const nextProfile = {
    ...profile,
    enabled: false,
    dismissedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  savePetState({ keys, profile: nextProfile, progress, inventory });
  emitPetStateUpdate({ agentId, reason: "dismiss-pet" });
}

export function showPet() {
  const { agentId, keys, profile, progress, inventory } = readPetState();

  const nextProfile = {
    ...profile,
    enabled: true,
    dismissedAt: null,
    updatedAt: new Date().toISOString(),
  };

  savePetState({ keys, profile: nextProfile, progress, inventory });
  emitPetStateUpdate({ agentId, reason: "show-pet" });
}

export function applySynopsisPetReward(entry) {
  if (!isBrowser() || !entry || typeof entry !== "object") {
    return null;
  }

  const interactionId = String(entry.id || "").trim();
  if (!interactionId) {
    return null;
  }

  const stars = Math.max(1, Math.min(5, Number(entry.stepRating) || 1));
  const points = getPointsForStars(stars);
  const qualifyingFiveStar = stars === 5;

  const { agentId, keys, profile, progress, inventory } = readPetState();

  if (progress.processedInteractionIds.includes(interactionId)) {
    return {
      applied: false,
      duplicate: true,
      agentId,
    };
  }

  const nextProgress = {
    ...progress,
    totalPoints: progress.totalPoints + points,
    totalRewards: progress.totalRewards + 1,
    lastRewardStars: stars,
    qualifyingFiveStarCount:
      progress.qualifyingFiveStarCount + (qualifyingFiveStar ? 1 : 0),
    processedInteractionIds: [
      interactionId,
      ...progress.processedInteractionIds,
    ].slice(0, 1000),
    lastRewardAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let unlockedNow = false;
  let nextProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  if (!profile.unlocked && hasMetUnlockRequirement(nextProgress)) {
    unlockedNow = true;
    nextProfile = {
      ...nextProfile,
      unlocked: true,
      enabled: true,
      unlockAt: new Date().toISOString(),
      selectedPetId: null,
      dismissedAt: null,
    };
  }

  savePetState({
    keys,
    profile: nextProfile,
    progress: nextProgress,
    inventory,
  });

  emitPetStateUpdate({
    agentId,
    reason: "synopsis-reward",
    interactionId,
    stars,
    points,
    unlockedNow,
  });

  emitPetReward({
    agentId,
    interactionId,
    loggedAt: entry.loggedAt || new Date().toISOString(),
    stars,
    checklistCompletedSteps: Number(entry.checklistCompletedSteps || 0),
    checklistTotalSteps: Number(entry.checklistTotalSteps || 0),
    rewardPoints: points,
    qualifyingFiveStar,
    unlockedNow,
  });

  return {
    applied: true,
    duplicate: false,
    agentId,
    interactionId,
    stars,
    points,
    qualifyingFiveStar,
    unlockedNow,
  };
}

export function getPetIframeUrl() {
  const agentId = getCurrentAgentId();
  const params = new URLSearchParams({
    agentId,
    v: String(PET_SCHEMA_VERSION),
  });
  return `/agent-pet/index.html?${params.toString()}`;
}

export function simulatePetRewardForTesting(stars = 5) {
  if (!IS_DEV_BUILD) {
    return null;
  }

  const safeStars = Math.max(1, Math.min(5, Number(stars) || 5));

  return applySynopsisPetReward({
    id: `pet-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stepRating: safeStars,
    checklistCompletedSteps: 7,
    checklistTotalSteps: 7,
    loggedAt: new Date().toISOString(),
  });
}

export const petBridgeEvents = {
  stateUpdated: PET_STATE_UPDATED_EVENT,
  reward: PET_REWARD_EVENT,
};
