// behaviorCoordinator.js
// Orchestrates all behavioral decisions for the active pet.
// Delegates particle effects to effectScheduler and pet-specific
// one-off behaviors to pet behavior plugins (e.g. beaver forage).
// The engine calls coordinator.step(inputs) → decision each frame,
// then uses the decision purely for rendering and motion.

import {
  buildSequenceRuntime,
  getRuleForPet,
  isSequenceOnlyAnimationKey,
  isSequenceStageEnvironmentValid,
  PET_SEQUENCE_RULES,
  resolveRelocateStageDurationMs as resolveSequenceRelocateStageDurationMs,
  SEQUENCE_STAGE_TICK_MS,
} from "./sequenceManager.js";
import {
  getEnvironmentAllowedKeys,
  getEnvironmentConfig,
  normalizeEnvironmentKey,
  resolveDesiredEnvironment,
  resolveEnvironmentTransitionSpec,
} from "./environmentFSM.js";
import {
  pickAnimationChoice,
  resolveAnimationState,
} from "./animationSelector.js";
import { createEffectScheduler } from "./effectScheduler.js";
import { getPetBehaviorProfile, getPetPlugin } from "../pets/index.js";
import { PET_ROUTE_ZONES } from "../behaviors/zones.js";

const MAX_SEQUENCE_HIDDEN_STAGE_MS = 5200;

// ── Shared utilities ──────────────────────────────────────────────────────────

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function toActionKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function hasAnimationFrames(animationSet, key) {
  return Boolean(
    animationSet &&
    key &&
    Array.isArray(animationSet[key]?.frames) &&
    animationSet[key].frames.length,
  );
}

function estimateAnimationDurationMs(animation, loops) {
  const explicit = Number(animation?.totalTicks || 0);
  const computed = Array.isArray(animation?.frames)
    ? animation.frames.reduce(
        (s, f) => s + Math.max(1, Number(f?.ticks) || 1),
        0,
      )
    : 0;
  return (
    Math.max(1, explicit || computed || 1) *
    SEQUENCE_STAGE_TICK_MS *
    Math.max(1, Number(loops || 1))
  );
}

// ── Factory ────────────────────────────────────────────────────────────────────

export function createBehaviorCoordinator({ canvas, nextRandom, pickInRange }) {
  // ─── Scheduling ───────────────────────────────────────────────────────────
  let playfulActionKey = "";
  let playfulUntil = 0;
  let nextPlayfulAt = 0;

  // ─── Sequence ─────────────────────────────────────────────────────────────
  let sequenceState = null;
  let sequenceHiddenStartedAt = 0;
  let sequenceCooldownUntil = 0;
  let nextSequenceCheckAt = 0;

  // ─── Environment FSM ──────────────────────────────────────────────────────
  let environmentState = "";
  let environmentDesiredState = "";
  let environmentTransitionState = null;

  // ─── Animation state machine ──────────────────────────────────────────────
  let animationStateReason = "fallback";
  let animationStatePriority = 0;
  let animationStateUntil = 0;
  /** Key selected last frame — lets coordinator detect first-frame-of-animation. */
  let internalAnimationKey = "";

  // ─── Animation pool state ─────────────────────────────────────────────────
  const animationPoolStateByPet = new Map();

  // ─── Subsystems ───────────────────────────────────────────────────────────
  const effectScheduler = createEffectScheduler({ nextRandom, pickInRange });
  let activePetPlugin = null;

  // ─── Current pet identity ─────────────────────────────────────────────────
  let coordPetId = "";

  // ═════════════════════════════════════════════════════════════════════════
  // Internal helpers
  // ═════════════════════════════════════════════════════════════════════════

  function pickAnimationKeyFromCandidates(animationSet, candidateKeys = []) {
    const normalized = Array.from(
      new Set(
        (Array.isArray(candidateKeys) ? candidateKeys : [])
          .map((k) => String(k || "").trim())
          .filter(Boolean),
      ),
    );
    const valid = normalized.filter((k) => hasAnimationFrames(animationSet, k));
    if (!valid.length) return "";
    return valid[Math.floor(nextRandom() * valid.length)] || valid[0] || "";
  }

  function isAnimationSelectableOutsideSequence({ petId, key }) {
    if (!key) return false;
    if (!isSequenceOnlyAnimationKey(petId, key)) return true;
    if (!sequenceState) return false;
    const stage = sequenceState.stages?.[sequenceState.stageIndex];
    return stage?.animationKey === key;
  }

  function pickAnimationPoolVariant(
    petId,
    poolName,
    keys,
    weightsByKey = null,
  ) {
    const normalized = Array.isArray(keys)
      ? keys.map((k) => String(k || "").trim()).filter(Boolean)
      : [];
    if (!normalized.length) return "";
    if (normalized.length === 1) return normalized[0];

    const petBucket = animationPoolStateByPet.get(petId) || new Map();
    const poolState = petBucket.get(poolName) || { index: -1, lastKey: "" };
    const hasWeights =
      weightsByKey &&
      typeof weightsByKey === "object" &&
      !Array.isArray(weightsByKey);

    if (hasWeights) {
      const weighted = normalized
        .map((key) => {
          const raw = Number(weightsByKey[key]);
          return { key, weight: Number.isFinite(raw) ? Math.max(0, raw) : 1 };
        })
        .filter((item) => item.weight > 0);

      if (weighted.length) {
        const dampened = weighted.map((item) => ({ ...item }));
        if (dampened.length > 1 && poolState.lastKey) {
          const last = dampened.find((item) => item.key === poolState.lastKey);
          if (last) last.weight *= 0.2;
        }
        const total = dampened.reduce(
          (s, item) => s + Math.max(0, item.weight),
          0,
        );
        if (total > 0) {
          const roll = nextRandom() * total;
          let cum = 0;
          let picked = dampened[dampened.length - 1].key;
          for (const item of dampened) {
            cum += Math.max(0, item.weight);
            if (roll <= cum) {
              picked = item.key;
              break;
            }
          }
          petBucket.set(poolName, {
            index: normalized.indexOf(picked),
            lastKey: picked,
          });
          animationPoolStateByPet.set(petId, petBucket);
          return picked;
        }
      }
    }

    let nextIdx = (poolState.index + 1) % normalized.length;
    let candidate = normalized[nextIdx];
    if (candidate === poolState.lastKey) {
      nextIdx = (nextIdx + 1) % normalized.length;
      candidate = normalized[nextIdx];
    }
    petBucket.set(poolName, { index: nextIdx, lastKey: candidate });
    animationPoolStateByPet.set(petId, petBucket);
    return candidate;
  }

  function resolveAnimationLocomotion({
    selectedAnimation,
    selectedAnimationKey,
    currentCategory,
    currentAction,
    profile,
  }) {
    if (typeof selectedAnimation?.locomotion === "boolean")
      return selectedAnimation.locomotion;

    const cfg = profile?.locomotion || {};
    const forceAllow = new Set(
      Array.isArray(cfg.forceAllowKeys)
        ? cfg.forceAllowKeys.map(toActionKey)
        : [],
    );
    const forceDeny = new Set(
      Array.isArray(cfg.forceDenyKeys)
        ? cfg.forceDenyKeys.map(toActionKey)
        : [],
    );
    const nk = toActionKey(selectedAnimationKey);
    const na = toActionKey(currentAction);
    const nc = toActionKey(currentCategory);

    if (forceDeny.has(nk) || forceDeny.has(na)) return false;
    if (forceAllow.has(nk) || forceAllow.has(na)) return true;
    if (nc === "interaction" || nc === "idle") return false;
    if (/movement|walk|run|swim|dash|flight|flap|glide/.test(nk)) return true;
    if (/movement|walk|run|swim|dash|flight|flap|glide/.test(na)) return true;
    if (/movement/.test(nc)) return true;
    return false;
  }

  function resolveDirectionalFlightVisual({
    selectedAnimationKey,
    animationSet,
    profile,
    velocityX,
    velocityY,
  }) {
    const config = profile?.directionalFlight || {};
    if (config.enabled !== true || !animationSet) return null;

    const allowed = new Set(
      Array.isArray(config.actionKeys)
        ? config.actionKeys.map(toActionKey).filter(Boolean)
        : [],
    );
    const nk = toActionKey(selectedAnimationKey);
    if (allowed.size > 0 && !allowed.has(nk)) return null;

    const hx = Number(velocityX) || 0;
    const hy = Number(velocityY) || 0;
    const hSpeed = Math.hypot(hx, hy);
    const minSpeed = Math.max(0.01, Number(config.minSpeed ?? 0.2));
    if (hSpeed < minSpeed) return null;

    const northKey = toActionKey(config.northKey || "");
    const southKey = toActionKey(config.southKey || "");
    const westKey = toActionKey(config.westKey || "");
    const northWestKey = toActionKey(config.northWestKey || "");
    const southWestKey = toActionKey(config.southWestKey || "");
    const mirrorEast = config.mirrorEast !== false;
    const hasFrames = (k) => Boolean(k && animationSet?.[k]?.frames?.length);

    const deg = ((Math.atan2(-hy, hx) * 180) / Math.PI + 360) % 360;
    let directionalKey = "";
    let forceFlipHorizontal = null;

    if (deg >= 22.5 && deg < 67.5) {
      directionalKey = northWestKey;
      forceFlipHorizontal = mirrorEast ? true : null;
    } else if (deg >= 67.5 && deg < 112.5) {
      directionalKey = northKey;
    } else if (deg >= 112.5 && deg < 157.5) {
      directionalKey = northWestKey;
      forceFlipHorizontal = false;
    } else if (deg >= 157.5 && deg < 202.5) {
      directionalKey = westKey;
      forceFlipHorizontal = false;
    } else if (deg >= 202.5 && deg < 247.5) {
      directionalKey = southWestKey;
      forceFlipHorizontal = false;
    } else if (deg >= 247.5 && deg < 292.5) {
      directionalKey = southKey;
    } else if (deg >= 292.5 && deg < 337.5) {
      directionalKey = southWestKey;
      forceFlipHorizontal = mirrorEast ? true : null;
    } else {
      directionalKey = westKey;
      forceFlipHorizontal = mirrorEast ? true : null;
    }

    if (!hasFrames(directionalKey)) return null;
    return {
      animationKey: directionalKey,
      forceFlipHorizontal,
      disableTilt: config.disableTilt === true,
    };
  }

  function scheduleNextPlayfulBeat(profile, now) {
    const cfg = profile?.playfulNature || {};
    nextPlayfulAt =
      now +
      Math.max(1200, Math.round(pickInRange(cfg.intervalMs || [5500, 12000])));
  }

  function clearSequence() {
    sequenceState = null;
    sequenceHiddenStartedAt = 0;
  }

  function abortSequenceWithCooldown(now, fallbackCooldownMs = 1800) {
    const cooldownMs = Math.max(900, Number(fallbackCooldownMs) || 1800);
    sequenceCooldownUntil = now + cooldownMs;
    nextSequenceCheckAt = sequenceCooldownUntil;
    clearSequence();
  }

  /** Teleports the sprite to a random far position. Mutates position and velocity. */
  function relocateDuringSequence(
    position,
    velocity,
    topSafeInset,
    lastBounds,
  ) {
    const w = Math.max(24, Number(lastBounds.width) || 64);
    const h = Math.max(24, Number(lastBounds.height) || 64);
    const minX = 8;
    const minY = Math.max(8, topSafeInset + 8);
    const maxX = Math.max(minX, canvas.width - w - 8);
    const maxY = Math.max(minY, canvas.height - h - 8);

    let bestX = position.x;
    let bestY = position.y;
    let bestDist = -1;
    for (let i = 0; i < 10; i++) {
      const cx = minX + nextRandom() * (maxX - minX);
      const cy = minY + nextRandom() * (maxY - minY);
      const dist = Math.hypot(cx - position.x, cy - position.y);
      if (dist > bestDist) {
        bestDist = dist;
        bestX = cx;
        bestY = cy;
      }
    }

    position.x = bestX;
    position.y = bestY;
    velocity.x = 0;
    velocity.y = 0;
    return bestDist > 0 ? bestDist : 0;
  }

  function advanceSequence(now, topSafeInset, position, velocity, lastBounds) {
    if (!sequenceState) return;

    const activeStage = sequenceState.stages?.[sequenceState.stageIndex];
    if (
      activeStage &&
      !isSequenceStageEnvironmentValid({
        stage: activeStage,
        currentEnvironment: environmentState,
        desiredEnvironment: environmentDesiredState,
      })
    ) {
      abortSequenceWithCooldown(now, 2200);
      return;
    }

    while (sequenceState && now >= sequenceState.stageEndsAt) {
      const nextIndex = sequenceState.stageIndex + 1;
      if (nextIndex >= sequenceState.stages.length) {
        const rule = PET_SEQUENCE_RULES[coordPetId];
        const cooldownMs = rule
          ? Math.max(1200, Math.round(pickInRange(rule.cooldownMs || 12000)))
          : 12000;
        abortSequenceWithCooldown(now, cooldownMs);
        return;
      }

      sequenceState.stageIndex = nextIndex;
      sequenceState.stageStartedAt = now;
      const stage = sequenceState.stages[nextIndex];
      if (
        !isSequenceStageEnvironmentValid({
          stage,
          currentEnvironment: environmentState,
          desiredEnvironment: environmentDesiredState,
        })
      ) {
        abortSequenceWithCooldown(now, 2200);
        return;
      }

      let stageDurationMs = Math.max(80, Number(stage?.durationMs) || 80);
      if (stage.relocate) {
        const dist = relocateDuringSequence(
          position,
          velocity,
          topSafeInset,
          lastBounds,
        );
        stageDurationMs = resolveSequenceRelocateStageDurationMs({
          petId: coordPetId,
          stage,
          baseDurationMs: stageDurationMs,
          distance: dist,
          profile: getPetBehaviorProfile(coordPetId),
        });
      }
      sequenceState.stageEndsAt = now + stageDurationMs;
      sequenceHiddenStartedAt = stage?.hidden ? now : 0;
    }
  }

  function maybeStartSequence({
    now,
    animationSet,
    forcedAnimationKey,
    isPetting,
    movementIntentByContext,
    currentSpeed,
    topSafeInset,
    routeZone,
    position,
    velocity,
    lastBounds,
  }) {
    if (!animationSet) return;
    if (forcedAnimationKey) {
      clearSequence();
      return;
    }

    if (sequenceState) {
      advanceSequence(now, topSafeInset, position, velocity, lastBounds);
      return;
    }

    if (isPetting || movementIntentByContext || currentSpeed > 0.2) return;
    if (routeZone === PET_ROUTE_ZONES.LEFT_ASSIST) return;
    if (now < sequenceCooldownUntil || now < nextSequenceCheckAt) return;

    const rule = getRuleForPet(coordPetId, animationSet);
    if (!rule) {
      nextSequenceCheckAt = now + 6000;
      return;
    }

    const checkDelay = Math.max(
      1200,
      Math.round(pickInRange(rule.checkWindowMs || [3000, 4500])),
    );
    nextSequenceCheckAt = now + checkDelay;
    if (nextRandom() > Number(rule.startChance || 0.35)) return;

    sequenceState = buildSequenceRuntime({
      rule,
      animationSet,
      now,
      petId: coordPetId,
      pickInRange,
      estimateAnimationDurationMs,
    });
    const stage = sequenceState.stages[sequenceState.stageIndex];
    if (
      !isSequenceStageEnvironmentValid({
        stage,
        currentEnvironment: environmentState,
        desiredEnvironment: environmentDesiredState,
      })
    ) {
      abortSequenceWithCooldown(now, 2200);
      return;
    }

    sequenceHiddenStartedAt = stage?.hidden ? now : 0;
    if (stage?.relocate) {
      const dist = relocateDuringSequence(
        position,
        velocity,
        topSafeInset,
        lastBounds,
      );
      const stageDurationMs = resolveSequenceRelocateStageDurationMs({
        petId: coordPetId,
        stage,
        baseDurationMs: Math.max(80, Number(stage?.durationMs) || 80),
        distance: dist,
        profile: getPetBehaviorProfile(coordPetId),
      });
      sequenceState.stageEndsAt = now + stageDurationMs;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Main step — called once per render frame
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * @param {object} inputs
   * @param {number}  inputs.now
   * @param {number}  inputs.frame
   * @param {string}  inputs.petId
   * @param {object}  inputs.pet              Full pet catalog entry (for animationSelector)
   * @param {object}  inputs.animationSet
   * @param {object}  inputs.behaviorProfile  Already scoped (fish-scoped, overrides applied)
   * @param {boolean} inputs.isPetting
   * @param {number}  inputs.pettingUntil
   * @param {number}  inputs.topSafeInset
   * @param {string}  inputs.routeZone
   * @param {boolean} inputs.wantsMovement
   * @param {boolean} inputs.movementIntentByContext
   * @param {number}  inputs.currentSpeed
   * @param {boolean} inputs.forceFreeze
   * @param {string}  inputs.forcedAnimationKey
   * @param {boolean} inputs.allTenStepsCompleted
   * @param {number}  inputs.milestoneBoostUntil
   * @param {number}  inputs.pendingMilestoneEmotionBursts   From previous frame's motionController
   * @param {object}  inputs.position         { x, y } — read-only for most calcs, mutated by sequence relocate
   * @param {object}  inputs.velocity         { x, y } — read-only, except sequence relocate
   * @param {object}  inputs.lastBounds        { x, y, width, height }
   * @param {string}  inputs.facingDirection   "left"|"right"
   * @param {Array}   inputs.followers         Fish school followers array (for bubble positions)
   */
  function step({
    now,
    frame,
    petId,
    pet,
    animationSet,
    behaviorProfile,
    isPetting,
    pettingUntil,
    topSafeInset,
    routeZone,
    wantsMovement,
    movementIntentByContext,
    currentSpeed,
    forceFreeze,
    forcedAnimationKey,
    allTenStepsCompleted,
    milestoneBoostUntil,
    pendingMilestoneEmotionBursts,
    position,
    velocity,
    lastBounds,
    facingDirection,
    followers,
  }) {
    coordPetId = petId;

    // ── Pet behavior plugin (e.g. beaver forage) ─────────────────────────
    const pluginResult = activePetPlugin
      ? activePetPlugin.step({
          now,
          profile: behaviorProfile,
          position,
          lastBounds,
          topSafeInset,
          forceFreeze,
          forcedAnimationKey,
          isPetting,
          hasActiveSequence: Boolean(sequenceState),
        })
      : null;

    // ── Environment FSM ───────────────────────────────────────────────────
    const environmentConfig = getEnvironmentConfig(behaviorProfile);
    if (!environmentConfig?.enabled) {
      environmentState = "";
      environmentDesiredState = "";
      environmentTransitionState = null;
    } else {
      const spriteH = Math.max(24, Number(lastBounds.height) || 64);
      const centerY = position.y + spriteH * 0.5;
      const initial =
        normalizeEnvironmentKey(environmentState) ||
        normalizeEnvironmentKey(environmentConfig.initial);

      environmentDesiredState = resolveDesiredEnvironment({
        config: environmentConfig,
        currentEnvironment: environmentState,
        fallbackEnvironment: initial,
        centerY,
        canvasHeight: canvas.height,
        beaverLogCyclePhase: pluginResult?.phase || "",
      });

      if (!environmentState)
        environmentState = environmentDesiredState || initial;

      if (
        environmentTransitionState &&
        now >= Number(environmentTransitionState.endsAt || 0)
      ) {
        environmentState = environmentTransitionState.to;
        environmentTransitionState = null;
      }

      if (
        !environmentTransitionState &&
        environmentDesiredState &&
        environmentState &&
        environmentDesiredState !== environmentState &&
        !forceFreeze &&
        !forcedAnimationKey &&
        !isPetting &&
        !sequenceState
      ) {
        const spec = resolveEnvironmentTransitionSpec(
          environmentConfig,
          environmentState,
          environmentDesiredState,
        );
        const transKey = toActionKey(spec?.key);
        let transDurationMs = Math.max(
          280,
          Math.round(pickInRange(spec?.durationMs || [420, 760])),
        );
        const canUse =
          transKey &&
          hasAnimationFrames(animationSet, transKey) &&
          isAnimationSelectableOutsideSequence({ petId, key: transKey });

        if (canUse && spec?.requireFullAnimation) {
          const fullMs = estimateAnimationDurationMs(
            animationSet?.[transKey],
            Math.max(1, Number(spec?.fullAnimationLoops || 1)),
          );
          transDurationMs = Math.max(transDurationMs, Math.round(fullMs));
        }

        if (canUse) {
          environmentTransitionState = {
            from: environmentState,
            to: environmentDesiredState,
            key: transKey,
            endsAt: now + transDurationMs,
            forceMovement: Boolean(spec?.forceMovement),
          };
        } else {
          environmentState = environmentDesiredState;
        }
      }
    }

    // ── Playful beat ──────────────────────────────────────────────────────
    if (!nextPlayfulAt) scheduleNextPlayfulBeat(behaviorProfile, now);

    if (
      playfulActionKey &&
      (now >= playfulUntil || forceFreeze || isPetting || sequenceState)
    ) {
      playfulActionKey = "";
      playfulUntil = 0;
    }

    if (
      !playfulActionKey &&
      !forceFreeze &&
      !isPetting &&
      !sequenceState &&
      !forcedAnimationKey &&
      !pluginResult?.phase &&
      now >= nextPlayfulAt
    ) {
      const cfg = behaviorProfile?.playfulNature || {};
      const triggerChance = clamp01(Number(cfg.activationChance ?? 0.65));
      if (nextRandom() <= triggerChance) {
        const k = pickAnimationKeyFromCandidates(animationSet, cfg.actionKeys);
        if (k && isAnimationSelectableOutsideSequence({ petId, key: k })) {
          playfulActionKey = k;
          playfulUntil =
            now +
            Math.max(
              500,
              Math.round(pickInRange(cfg.durationMs || [900, 1700])),
            );
        }
      }
      scheduleNextPlayfulBeat(behaviorProfile, now);
    }

    // ── Sequence management ───────────────────────────────────────────────
    if (!pluginResult?.phase) {
      maybeStartSequence({
        now,
        animationSet,
        forcedAnimationKey,
        isPetting,
        movementIntentByContext:
          movementIntentByContext || Boolean(environmentTransitionState),
        currentSpeed,
        topSafeInset,
        routeZone,
        position,
        velocity,
        lastBounds,
      });
    }

    if (sequenceState) {
      const curStage = sequenceState.stages?.[sequenceState.stageIndex];
      if (curStage?.hidden) {
        if (!sequenceHiddenStartedAt) sequenceHiddenStartedAt = now;
        if (now - sequenceHiddenStartedAt > MAX_SEQUENCE_HIDDEN_STAGE_MS) {
          abortSequenceWithCooldown(now, 1800);
        }
      } else {
        sequenceHiddenStartedAt = 0;
      }
    }

    // ── Animation resolution ──────────────────────────────────────────────
    const activeStage = sequenceState
      ? sequenceState.stages[sequenceState.stageIndex]
      : null;
    const sequenceAnimationKey = String(activeStage?.animationKey || "");
    const sequenceHiddenStage = Boolean(activeStage?.hidden);

    const seqEnvValid =
      !activeStage ||
      isSequenceStageEnvironmentValid({
        stage: activeStage,
        currentEnvironment: environmentState,
        desiredEnvironment: environmentDesiredState,
      });
    const canForceSequenceAnimation =
      seqEnvValid &&
      Boolean(sequenceAnimationKey) &&
      Boolean(animationSet?.[sequenceAnimationKey]?.frames?.length);

    const environmentAllowedKeys = getEnvironmentAllowedKeys(
      environmentConfig,
      environmentState,
      toActionKey,
    );
    const transAnimKey = toActionKey(environmentTransitionState?.key);
    const canForceEnvTransition =
      Boolean(transAnimKey) &&
      hasAnimationFrames(animationSet, transAnimKey) &&
      isAnimationSelectableOutsideSequence({ petId, key: transAnimKey });
    const envTransitionLockKey = canForceEnvTransition ? transAnimKey : "";

    const animationChoice = pickAnimationChoice(pet, animationSet, {
      toActionKey,
      allTenStepsCompleted,
      isMilestoneBoost: now < milestoneBoostUntil,
      isPetting: now < pettingUntil,
      wantsMovement,
      playfulActionKey: pluginResult?.animationKeyOverride || playfulActionKey,
      animationPools: behaviorProfile?.animationPools || {},
      pickPoolKey: (poolName, keys) =>
        pickAnimationPoolVariant(
          petId,
          poolName,
          keys,
          behaviorProfile?.animationPoolWeights?.[poolName] || null,
        ),
      isAnimationAllowed: (key) =>
        isAnimationSelectableOutsideSequence({ petId, key }) &&
        (envTransitionLockKey
          ? key === envTransitionLockKey
          : !environmentAllowedKeys ||
            environmentAllowedKeys.has(toActionKey(key))),
    });

    const hasDirectForcedKey = Boolean(
      forcedAnimationKey && animationSet?.[forcedAnimationKey],
    );
    const candidateKey = hasDirectForcedKey
      ? forcedAnimationKey
      : canForceSequenceAnimation && sequenceAnimationKey
        ? sequenceAnimationKey
        : canForceEnvTransition
          ? transAnimKey
          : animationChoice.key;
    const candidateReason = hasDirectForcedKey
      ? "forced"
      : canForceSequenceAnimation && sequenceAnimationKey
        ? `sequence:${sequenceState?.ruleId || "unknown"}:${activeStage?.name || "stage"}`
        : canForceEnvTransition
          ? "environment-transition"
          : animationChoice.reason;

    const isHardLocked =
      hasDirectForcedKey ||
      (canForceSequenceAnimation && Boolean(sequenceAnimationKey)) ||
      canForceEnvTransition;

    const guardedKey =
      isHardLocked ||
      isAnimationSelectableOutsideSequence({ petId, key: candidateKey })
        ? candidateKey
        : animationChoice.key;

    const resolved = resolveAnimationState({
      now,
      candidateKey: guardedKey,
      candidateReason,
      animationSet,
      profile: behaviorProfile,
      pettingUntil,
      playfulUntil,
      activeAnimationKey: internalAnimationKey,
      animationStateReason,
      animationStatePriority,
      animationStateUntil,
      hasAnimationFrames,
      toActionKey,
      estimateAnimationDurationMs,
    });
    animationStateReason = resolved.nextState.reason;
    animationStatePriority = resolved.nextState.priority;
    animationStateUntil = resolved.nextState.until;

    let selectedAnimationKey = resolved.key;
    let animationReason = resolved.reason;

    // Directional flight visual override
    const directionalFlight = isHardLocked
      ? null
      : resolveDirectionalFlightVisual({
          selectedAnimationKey,
          animationSet,
          profile: behaviorProfile,
          velocityX: velocity.x,
          velocityY: velocity.y,
        });
    if (directionalFlight?.animationKey) {
      selectedAnimationKey = directionalFlight.animationKey;
      animationReason = `${animationReason}|directional-flight`;
    }

    // Detect first frame of animation (key changed from previous frame)
    const isAnimationFirstFrame = selectedAnimationKey !== internalAnimationKey;
    internalAnimationKey = selectedAnimationKey;

    // ── Locomotion ────────────────────────────────────────────────────────
    const selectedAnimation = animationSet?.[selectedAnimationKey] || null;
    const currentCategory = String(
      selectedAnimation?.category || "",
    ).toLowerCase();
    const currentAction = String(
      selectedAnimation?.title || selectedAnimationKey || "",
    ).toLowerCase();
    const currentActionKey = toActionKey(selectedAnimationKey);

    const locomotionAllowed = resolveAnimationLocomotion({
      selectedAnimation,
      selectedAnimationKey,
      currentCategory,
      currentAction,
      profile: behaviorProfile,
    });

    // ── Context flags ─────────────────────────────────────────────────────
    const inFlightCfg = behaviorProfile?.inFlightBoids || {};
    const isFlightBoidsPet = inFlightCfg.enabled === true;
    const inFlightActionKeys = Array.isArray(inFlightCfg.actionKeys)
      ? inFlightCfg.actionKeys.map(toActionKey).filter(Boolean)
      : ["flap", "glide", "glide-2", "flight"];
    const isBirdInFlightAction = inFlightActionKeys.includes(currentActionKey);
    const isBirdAirborneAction = /flight|flap|glide/.test(currentActionKey);
    const isBirdIdleAction = /^idle($|-)/.test(currentActionKey);

    // ── Movement active (proxy for effect gating) ─────────────────────────
    const currentEnvCfg =
      environmentConfig?.environments?.[environmentState] || null;
    const allowMovementByEnvironment =
      !environmentConfig?.enabled ||
      Boolean(environmentTransitionState?.forceMovement) ||
      currentEnvCfg?.allowLocomotion !== false;
    const beaverCycleWantsMovement = Boolean(pluginResult?.wantsMovement);
    const environmentTransitionForceMovement = Boolean(
      environmentTransitionState?.forceMovement,
    );
    const effectiveMovementIntent =
      wantsMovement ||
      beaverCycleWantsMovement ||
      environmentTransitionForceMovement;
    const movementActive =
      !forceFreeze &&
      !sequenceState &&
      allowMovementByEnvironment &&
      locomotionAllowed &&
      effectiveMovementIntent;

    const overrideTarget = pluginResult?.overrideTarget ?? null;
    const overrideTargetPull = pluginResult?.overrideTargetPull ?? 0.0038;

    // ── Particle effect emission ──────────────────────────────────────────
    const pendingEffects = effectScheduler.step({
      now,
      currentActionKey,
      isAnimationFirstFrame,
      movementActive,
      facingDirection,
      isFlightBoidsPet,
      isBirdAirborneAction,
      isBirdIdleAction,
      behaviorProfile,
      followers,
      lastBounds,
      velocityX: velocity.x,
    });

    // ── Task completion celebration ────────────────────────────────────────
    if (
      pendingMilestoneEmotionBursts > 0 &&
      !isPetting &&
      !sequenceState &&
      !forceFreeze
    ) {
      const taskCfg = behaviorProfile?.taskCompletion || {};
      const triggerChance = clamp01(Number(taskCfg.triggerChance ?? 0.9));
      if (nextRandom() <= triggerChance) {
        const taskKey = pickAnimationKeyFromCandidates(
          animationSet,
          taskCfg.actionKeys,
        );
        if (
          taskKey &&
          isAnimationSelectableOutsideSequence({ petId, key: taskKey })
        ) {
          playfulActionKey = taskKey;
          playfulUntil =
            now +
            Math.max(
              700,
              Math.round(pickInRange(taskCfg.durationMs || [1100, 2200])),
            );
          scheduleNextPlayfulBeat(behaviorProfile, now);
        }
      }
    }

    // ── Build and return decision ─────────────────────────────────────────
    return {
      selectedAnimationKey,
      animationReason,
      locomotionAllowed,
      overrideTarget,
      overrideTargetPull,
      pendingEffects,
      sequenceHiddenStage,
      hasActiveSequence: Boolean(sequenceState),
      isHardLockedAnimation: isHardLocked,
      allowMovementByEnvironment,
      beaverCycleWantsMovement,
      environmentTransitionForceMovement,
      beaverLogCycleProp: pluginResult?.prop ?? null,
      currentActionKey,
      isBirdInFlightAction,
      isBirdAirborneAction,
      isFlightBoidsPet,
      directionalFlightDisableTilt: Boolean(directionalFlight?.disableTilt),
      directionalFlightForceFlip: directionalFlight?.animationKey
        ? directionalFlight.forceFlipHorizontal
        : null,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Reset — call when selected pet changes
  // ═════════════════════════════════════════════════════════════════════════

  function reset(petId, now) {
    coordPetId = petId;
    clearSequence();
    sequenceCooldownUntil = 0;
    nextSequenceCheckAt = 0;
    playfulActionKey = "";
    playfulUntil = 0;
    nextPlayfulAt = 0;
    environmentState = "";
    environmentDesiredState = "";
    environmentTransitionState = null;
    animationStateReason = "fallback";
    animationStatePriority = 0;
    animationStateUntil = 0;
    internalAnimationKey = "";
    effectScheduler.reset();
    const pluginFactory = getPetPlugin(petId);
    activePetPlugin = pluginFactory
      ? pluginFactory({ canvas, nextRandom, pickInRange })
      : null;

    if (!animationPoolStateByPet.has(petId)) {
      animationPoolStateByPet.set(petId, new Map());
    }
  }

  return { step, reset };
}
