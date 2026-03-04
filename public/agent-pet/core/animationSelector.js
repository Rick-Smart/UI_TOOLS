export function pickAnimationChoice(pet, animations, options = {}) {
  const toActionKey =
    typeof options.toActionKey === "function"
      ? options.toActionKey
      : (value) =>
          String(value || "")
            .trim()
            .toLowerCase();

  if (!animations) {
    return { key: null, reason: "no-animations" };
  }

  const keys = Object.keys(animations).filter(
    (key) =>
      Array.isArray(animations[key]?.frames) && animations[key].frames.length,
  );
  if (!keys.length) {
    return { key: null, reason: "no-animation-keys" };
  }

  const defaults = pet?.defaultAnimationKeys || {};
  const allTenStepsCompleted = Boolean(options.allTenStepsCompleted);
  const isMilestoneBoost = Boolean(options.isMilestoneBoost);
  const isPetting = Boolean(options.isPetting);
  const wantsMovement = Boolean(options.wantsMovement);
  const playfulActionKey = String(options.playfulActionKey || "").trim();
  const animationPools =
    options.animationPools && typeof options.animationPools === "object"
      ? options.animationPools
      : {};
  const pickPoolKey =
    typeof options.pickPoolKey === "function" ? options.pickPoolKey : null;
  const isAnimationAllowed =
    typeof options.isAnimationAllowed === "function"
      ? options.isAnimationAllowed
      : () => true;

  const hasAnimationKey = (key) =>
    Boolean(
      key &&
      animations[key] &&
      Array.isArray(animations[key]?.frames) &&
      animations[key].frames.length &&
      isAnimationAllowed(key),
    );

  const animationOrder = Array.isArray(pet?.animationOrder)
    ? pet.animationOrder.filter((key) => hasAnimationKey(key))
    : [];

  const availableInOrder = animationOrder.length
    ? animationOrder
    : keys.filter((key) => hasAnimationKey(key));

  const pickFromPool = (poolName) => {
    const poolCandidates = Array.isArray(animationPools?.[poolName])
      ? animationPools[poolName].filter((key) => hasAnimationKey(key))
      : [];
    if (!poolCandidates.length) {
      return "";
    }

    if (!pickPoolKey) {
      return poolCandidates[0];
    }

    const candidate = String(pickPoolKey(poolName, poolCandidates) || "");
    if (candidate && poolCandidates.includes(candidate)) {
      return candidate;
    }

    return poolCandidates[0];
  };

  const findFromCandidates = (candidates, matcher = null) => {
    for (const candidate of candidates) {
      if (!hasAnimationKey(candidate)) {
        continue;
      }

      if (typeof matcher === "function" && !matcher(candidate)) {
        continue;
      }

      return candidate;
    }

    return null;
  };

  const movementLikeMatcher = (key) => {
    const normalized = toActionKey(key);
    return /(^|-)movement($|-)|walk|run|swim/.test(normalized);
  };

  const birdLikeMatcher = (key) => {
    const normalized = toActionKey(key);
    return /flap|glide|flight/.test(normalized);
  };

  const resolvePreferredMovementKey = () => {
    if (hasAnimationKey("movement")) {
      return "movement";
    }

    const movementByDefault = String(defaults.movement || "").trim();
    if (movementByDefault && hasAnimationKey(movementByDefault)) {
      if (movementLikeMatcher(movementByDefault)) {
        return movementByDefault;
      }

      if (birdLikeMatcher(movementByDefault)) {
        return movementByDefault;
      }
    }

    const semanticMovement = findFromCandidates(
      availableInOrder,
      movementLikeMatcher,
    );
    if (semanticMovement) {
      return semanticMovement;
    }

    const birdFallback = findFromCandidates(availableInOrder, birdLikeMatcher);
    if (birdFallback) {
      return birdFallback;
    }

    return null;
  };

  if (isPetting && defaults.interaction && animations[defaults.interaction]) {
    const interactionPoolKey = pickFromPool("interaction");
    if (interactionPoolKey) {
      return { key: interactionPoolKey, reason: "petting" };
    }

    return { key: defaults.interaction, reason: "petting" };
  }

  if (playfulActionKey && hasAnimationKey(playfulActionKey)) {
    return { key: playfulActionKey, reason: "playful" };
  }

  if (wantsMovement) {
    const movementPoolKey = pickFromPool("movement");
    if (movementPoolKey) {
      return { key: movementPoolKey, reason: "movement" };
    }

    const preferredMovementKey = resolvePreferredMovementKey();
    if (preferredMovementKey) {
      return { key: preferredMovementKey, reason: "movement" };
    }
  }

  if (
    (allTenStepsCompleted || isMilestoneBoost) &&
    defaults.celebration &&
    animations[defaults.celebration]
  ) {
    const celebrationPoolKey = pickFromPool("celebration");
    if (celebrationPoolKey) {
      return { key: celebrationPoolKey, reason: "celebration" };
    }

    return { key: defaults.celebration, reason: "celebration" };
  }

  if (!wantsMovement && defaults.idle && animations[defaults.idle]) {
    const idlePoolKey = pickFromPool("idle");
    if (idlePoolKey) {
      return { key: idlePoolKey, reason: "idle" };
    }

    return { key: defaults.idle, reason: "idle" };
  }

  const fallbackKey = findFromCandidates(availableInOrder);
  if (fallbackKey) {
    return { key: fallbackKey, reason: "fallback" };
  }

  return { key: null, reason: "fallback-none" };
}

function getAnimationReasonPriority(reason) {
  const normalized = String(reason || "fallback").toLowerCase();
  if (normalized === "forced") {
    return 100;
  }

  if (normalized.startsWith("sequence:")) {
    return 90;
  }

  if (normalized === "environment-transition") {
    return 88;
  }

  if (normalized === "forced-frame-action") {
    return 85;
  }

  if (normalized === "petting") {
    return 80;
  }

  if (normalized === "playful") {
    return 70;
  }

  if (normalized === "celebration") {
    return 60;
  }

  if (normalized === "movement") {
    return 45;
  }

  if (normalized === "idle") {
    return 35;
  }

  return 25;
}

function isAnimationReasonOverride(reason) {
  const normalized = String(reason || "").toLowerCase();
  return (
    normalized === "forced" ||
    normalized === "forced-frame-action" ||
    normalized === "environment-transition" ||
    normalized.startsWith("sequence:")
  );
}

function getAnimationHoldMs({
  reason,
  key,
  animation,
  profile,
  now,
  pettingUntil,
  playfulUntil,
  toActionKey,
  estimateAnimationDurationMs,
}) {
  const normalizedReason = String(reason || "fallback").toLowerCase();
  const normalizedKey = toActionKey(key);
  const cycleMs = animation
    ? Math.round(estimateAnimationDurationMs(animation, 1))
    : 0;

  const reasonBaseMap = {
    petting: 260,
    playful: 900,
    celebration: 1050,
    "environment-transition": 620,
    movement: 900,
    idle: 1150,
    fallback: 950,
  };

  let minHoldMs = reasonBaseMap[normalizedReason] ?? reasonBaseMap.fallback;

  const longCycleAction =
    /swim|glide|flap|dig|dive|ascent|emerge|disappear|reappear|flight/.test(
      normalizedKey,
    );
  if (longCycleAction) {
    minHoldMs = Math.max(minHoldMs, 1350);
  }

  const sleepLikeAction = /sleep|snooze|nap/.test(normalizedKey);
  if (sleepLikeAction) {
    minHoldMs = Math.max(minHoldMs, 2600);
  }

  const groomingLikeAction = /groom|clean|wash|lick/.test(normalizedKey);
  if (groomingLikeAction) {
    minHoldMs = Math.max(minHoldMs, 1800);
  }

  const settledIdleAction =
    normalizedReason === "idle" &&
    (/^idle($|-)|idlesit|sit-idle|rest/.test(normalizedKey) ||
      sleepLikeAction ||
      groomingLikeAction);
  if (settledIdleAction) {
    minHoldMs = Math.max(minHoldMs, 1650);
  }

  if (normalizedReason === "petting") {
    return Math.max(180, pettingUntil - now);
  }

  if (normalizedReason === "playful") {
    minHoldMs = Math.max(minHoldMs, Math.max(0, playfulUntil - now));
  }

  const profileOverrides = profile?.stateMachine || {};
  if (profileOverrides && typeof profileOverrides === "object") {
    const byReason = profileOverrides.minHoldMsByReason || {};
    const reasonOverride = Number(byReason[normalizedReason]);
    if (Number.isFinite(reasonOverride) && reasonOverride > 0) {
      minHoldMs = Math.max(minHoldMs, Math.round(reasonOverride));
    }
  }

  const cycleScaled = cycleMs ? Math.round(cycleMs * 2.2) : 0;
  return Math.max(minHoldMs, Math.min(2600, cycleScaled || minHoldMs));
}

export function resolveAnimationState({
  now,
  candidateKey,
  candidateReason,
  animationSet,
  profile,
  pettingUntil,
  playfulUntil,
  activeAnimationKey,
  animationStateReason,
  animationStatePriority,
  animationStateUntil,
  hasAnimationFrames,
  toActionKey,
  estimateAnimationDurationMs,
}) {
  if (!candidateKey || !hasAnimationFrames(animationSet, candidateKey)) {
    return {
      key: candidateKey,
      reason: candidateReason,
      nextState: {
        reason: animationStateReason,
        priority: animationStatePriority,
        until: animationStateUntil,
      },
    };
  }

  const candidatePriority = getAnimationReasonPriority(candidateReason);
  const candidateIsOverride = isAnimationReasonOverride(candidateReason);
  const currentStillHeld =
    now < animationStateUntil &&
    hasAnimationFrames(animationSet, activeAnimationKey) &&
    !candidateIsOverride;

  if (
    currentStillHeld &&
    activeAnimationKey &&
    activeAnimationKey !== candidateKey &&
    candidatePriority <= animationStatePriority
  ) {
    return {
      key: activeAnimationKey,
      reason: animationStateReason,
      nextState: {
        reason: animationStateReason,
        priority: animationStatePriority,
        until: animationStateUntil,
      },
    };
  }

  const candidateAnimation = animationSet[candidateKey] || null;
  const nextReason = String(candidateReason || "fallback");
  const nextPriority = candidatePriority;
  const nextUntil = candidateIsOverride
    ? now
    : now +
      getAnimationHoldMs({
        reason: candidateReason,
        key: candidateKey,
        animation: candidateAnimation,
        profile,
        now,
        pettingUntil,
        playfulUntil,
        toActionKey,
        estimateAnimationDurationMs,
      });

  return {
    key: candidateKey,
    reason: candidateReason,
    nextState: {
      reason: nextReason,
      priority: nextPriority,
      until: nextUntil,
    },
  };
}
