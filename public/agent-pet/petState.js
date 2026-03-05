import { MOOD_BY_STARS, PET_CATALOG } from "./petCatalog.js";

export function queryAgentId() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("agentId") || "agent-default";
  } catch {
    return "agent-default";
  }
}

function keySet(agentId) {
  return {
    profile: `azdes.pet.v1.agent.${agentId}.profile`,
    progress: `azdes.pet.v1.agent.${agentId}.progress`,
  };
}

function safeRead(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function moodFromProgress(progress) {
  const totalRewards = safeNumber(progress?.totalRewards, 0);
  const lastStars = Math.max(
    1,
    Math.min(5, safeNumber(progress?.lastRewardStars, 3)),
  );

  if (!totalRewards) {
    return "Calm";
  }

  return MOOD_BY_STARS[lastStars] || "Calm";
}

function levelFromPoints(points) {
  return Math.max(1, Math.floor(points / 120) + 1);
}

const DEFAULT_PET_ID = Object.keys(PET_CATALOG)[0];
const LEGACY_PET_ID_MAP = {
  cat: "sphynx-cat",
  dog: "jack-russell",
  raccoon: "raccoon",
  dragonling: "beaver",
};

export function buildPetState(agentId) {
  const keys = keySet(agentId);
  const profile = safeRead(keys.profile) || {};
  const progress = safeRead(keys.progress) || {};
  const normalizedPetId =
    LEGACY_PET_ID_MAP[profile.selectedPetId] || profile.selectedPetId;
  const selectedPetId = PET_CATALOG[normalizedPetId]
    ? normalizedPetId
    : DEFAULT_PET_ID;
  const points = safeNumber(progress.totalPoints, 0);
  const fiveStarCount = safeNumber(progress.qualifyingFiveStarCount, 0);

  return {
    selectedPetId,
    petName: PET_CATALOG[selectedPetId]?.name || "Pet companion",
    points,
    fiveStarCount,
    mood: moodFromProgress(progress),
    level: levelFromPoints(points),
  };
}
