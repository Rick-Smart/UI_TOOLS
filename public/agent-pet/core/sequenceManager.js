export const SEQUENCE_STAGE_TICK_MS = 1000 / 60;

export const PET_SEQUENCE_RULES = {
  ferret: {
    id: "burrow-hop",
    startChance: 0.64,
    checkWindowMs: [1800, 3000],
    cooldownMs: [6500, 10500],
    stages: [
      { name: "dig", animationKey: "dig", loops: 1 },
      { name: "disappear", animationKey: "disappear", loops: 1 },
      { name: "travel", hidden: true, holdMs: [320, 780], relocate: true },
      { name: "emerge", animationKey: "emerge", loops: 1 },
    ],
  },
  chameleon: {
    id: "camo-shift",
    startChance: 0.3,
    checkWindowMs: [3800, 6200],
    cooldownMs: [14500, 23500],
    stages: [
      { name: "disappear", animationKey: "disappear", loops: 1 },
      { name: "travel", hidden: true, holdMs: [520, 1500], relocate: true },
      { name: "reappear", animationKey: "reappear", loops: [1, 1] },
    ],
  },
  beaver: {
    id: "dive-hop",
    startChance: 0.24,
    checkWindowMs: [5200, 8600],
    cooldownMs: [18500, 32000],
    stages: [
      {
        name: "swim",
        animationKey: "movement-water",
        sequenceOnly: false,
        requiredEnvironment: "water",
        loops: 1,
        holdMs: [220, 520],
      },
      {
        name: "dive",
        animationKey: "dive",
        sequenceOnly: true,
        requiredEnvironment: "water",
        loops: 1,
        holdMs: [480, 900],
      },
      { name: "travel", hidden: true, holdMs: [520, 1150], relocate: true },
      {
        name: "ascent",
        animationKey: "ascent",
        sequenceOnly: true,
        requiredEnvironment: ["water", "land"],
        loops: 1,
      },
    ],
  },
};

export const SEQUENCE_RELOCATE_TUNING = {
  default: {
    travelPxPerSec: 210,
    minMs: 480,
    maxMs: 2200,
  },
  ferret: {
    travelPxPerSec: 165,
    minMs: 620,
    maxMs: 2800,
  },
  chameleon: {
    travelPxPerSec: 135,
    minMs: 760,
    maxMs: 3200,
  },
  beaver: {
    travelPxPerSec: 190,
    minMs: 540,
    maxMs: 2400,
  },
};

function defaultNormalizeEnvironmentKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isSequenceOnlyAnimationKey(petId, key) {
  const rule = PET_SEQUENCE_RULES[petId];
  if (!rule || !Array.isArray(rule.stages) || !key) {
    return false;
  }

  return rule.stages.some(
    (stage) => stage?.animationKey === key && stage.sequenceOnly !== false,
  );
}

export function canRunRule(rule, animationSet) {
  if (!rule || !animationSet) {
    return false;
  }

  return rule.stages.every((stage) => {
    if (!stage.animationKey) {
      return true;
    }
    const animation = animationSet[stage.animationKey];
    return Boolean(animation?.frames?.length);
  });
}

export function getRuleForPet(petId, animationSet) {
  const rule = PET_SEQUENCE_RULES[petId];
  if (!rule) {
    return null;
  }

  return canRunRule(rule, animationSet) ? rule : null;
}

export function buildSequenceRuntime({
  rule,
  animationSet,
  now,
  petId,
  pickInRange,
  estimateAnimationDurationMs,
}) {
  const stages = rule.stages.map((stage) => {
    const loopsRaw = pickInRange(stage.loops || 1);
    const loops = Math.max(1, Math.round(loopsRaw));
    const animation = stage.animationKey
      ? animationSet[stage.animationKey]
      : null;
    const holdMs = Math.max(0, Math.round(pickInRange(stage.holdMs || 0)));
    const animationMs = animation
      ? Math.round(estimateAnimationDurationMs(animation, loops))
      : 0;
    const durationMs = Math.max(80, animationMs + holdMs);

    return {
      ...stage,
      loops,
      durationMs,
    };
  });

  return {
    ruleId: rule.id,
    petId,
    stageIndex: 0,
    startedAt: now,
    stageStartedAt: now,
    stageEndsAt: now + stages[0].durationMs,
    stages,
  };
}

export function normalizeEnvironmentRequirementSet(
  requiredEnvironment,
  normalizeEnvironmentKey = defaultNormalizeEnvironmentKey,
) {
  if (Array.isArray(requiredEnvironment)) {
    return requiredEnvironment
      .map((entry) => normalizeEnvironmentKey(entry))
      .filter(Boolean);
  }

  const single = normalizeEnvironmentKey(requiredEnvironment);
  return single ? [single] : [];
}

export function isSequenceStageEnvironmentValid({
  stage,
  currentEnvironment,
  desiredEnvironment,
  normalizeEnvironmentKey = defaultNormalizeEnvironmentKey,
}) {
  const required = normalizeEnvironmentRequirementSet(
    stage?.requiredEnvironment,
    normalizeEnvironmentKey,
  );
  if (!required.length) {
    return true;
  }

  const current = normalizeEnvironmentKey(currentEnvironment);
  const desired = normalizeEnvironmentKey(desiredEnvironment);
  return required.includes(current) || required.includes(desired);
}

export function getSequenceRelocateConfig(petId, profile) {
  const defaults =
    SEQUENCE_RELOCATE_TUNING[petId] || SEQUENCE_RELOCATE_TUNING.default;
  const overrides = profile?.sequenceRelocate || {};

  const travelPxPerSec = Math.max(
    40,
    Number(overrides.travelPxPerSec || defaults.travelPxPerSec),
  );
  const minMs = Math.max(80, Number(overrides.minMs || defaults.minMs));
  const maxMs = Math.max(minMs, Number(overrides.maxMs || defaults.maxMs));

  return {
    travelPxPerSec,
    minMs,
    maxMs,
  };
}

export function resolveRelocateStageDurationMs({
  petId,
  stage,
  baseDurationMs,
  distance,
  profile,
}) {
  if (!stage?.hidden || !stage?.relocate) {
    return baseDurationMs;
  }

  const config = getSequenceRelocateConfig(petId, profile);
  const safeDistance = Math.max(0, Number(distance) || 0);
  const distanceTravelMs = Math.round(
    (safeDistance / config.travelPxPerSec) * 1000,
  );
  const boundedTravelMs = Math.max(
    120,
    Math.max(config.minMs, Math.min(config.maxMs, distanceTravelMs)),
  );
  return stage?.hidden && stage?.relocate
    ? boundedTravelMs
    : Math.max(baseDurationMs, boundedTravelMs);
}
