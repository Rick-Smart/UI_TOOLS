import { PET_CATALOG } from "./petCatalog.js";
import { getPetBehaviorProfile } from "./pets/index.js";
import { drawAtlasFrame, drawPixelSprite } from "./core/rendering.js";
import {
  resolveFrameIndexByTicks,
  getAtlasImage,
  getAtlasFrameMetrics,
  drawAtlasFrameTransformed,
} from "./core/atlasUtils.js";
import {
  emitParticleBurst,
  updateParticles,
  drawParticles,
} from "./core/particleSystem.js";
import { createFlockSystem } from "./core/flockSystem.js";
import { createBehaviorCoordinator } from "./core/behaviorCoordinator.js";
import { updateMotionState } from "./core/motionController.js";
import { PET_ROUTE_ZONES, resolveRouteZone } from "./behaviors/zones.js";

const CHECKLIST_MILESTONES = [3, 6, 10];
const DEFAULT_PET_ID = Object.keys(PET_CATALOG)[0];
const BASE_PET_SPEED_MULTIPLIER = 0.5;
const DEFAULT_ATLAS_SCALE = 1.5;
const PET_SIZE_MULTIPLIER = 1.5;
const LAZY_MOVEMENT_MULTIPLIER = 0.5;
const MAX_SEQUENCE_HIDDEN_STAGE_MS = 5200;
const FISH_SPECIES_ROTATION_INDEX_KEY = "azdes.pet.fishSpeciesRotationIndex";
const MOVEMENT_ACTIONS = new Set([
  "movement",
  "walk",
  "run",
  "flight",
  "flap",
  "glide",
  "glide 2",
  "dash",
  "swim",
]);

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function lerp(a, b, t) {
  return a + (b - a) * clamp01(t);
}

function toActionKey(actionName) {
  return String(actionName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function getFishSpeciesKey(actionKey) {
  const normalized = toActionKey(actionKey);
  const match = normalized.match(/^(.+)-(movement|barrel-roll|death)$/);
  return match ? match[1] : "";
}

function pickNextFishSpeciesKey(validSpecies, nextRandom) {
  const speciesList = Array.from(
    new Set((Array.isArray(validSpecies) ? validSpecies : []).filter(Boolean)),
  );
  if (!speciesList.length) {
    return "";
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const lastIndexRaw = Number(
        window.localStorage.getItem(FISH_SPECIES_ROTATION_INDEX_KEY),
      );
      const hasValidIndex =
        Number.isFinite(lastIndexRaw) &&
        lastIndexRaw >= 0 &&
        lastIndexRaw < speciesList.length;
      const nextIndex = hasValidIndex
        ? (Math.floor(lastIndexRaw) + 1) % speciesList.length
        : Math.floor(nextRandom() * speciesList.length);
      window.localStorage.setItem(
        FISH_SPECIES_ROTATION_INDEX_KEY,
        String(nextIndex),
      );
      return speciesList[nextIndex] || speciesList[0] || "";
    }
  } catch {
    return speciesList[Math.floor(nextRandom() * speciesList.length)] || "";
  }

  return speciesList[Math.floor(nextRandom() * speciesList.length)] || "";
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(baseValue, overrideValue) {
  if (!isPlainObject(baseValue) || !isPlainObject(overrideValue)) {
    return overrideValue;
  }

  const merged = { ...baseValue };
  for (const [key, value] of Object.entries(overrideValue)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeDeep(merged[key], value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

function applyFishBehaviorOverrides(profile, overrides) {
  if (!isPlainObject(overrides)) {
    return profile;
  }

  return mergeDeep(profile || {}, overrides);
}

function resolveAnimationSet(pet) {
  if (!pet || typeof pet !== "object") {
    return null;
  }

  const animations = pet.animations;
  if (!animations || typeof animations !== "object") {
    return null;
  }

  return animations;
}

function getAvailableAnimationKeys(animationSet) {
  if (!animationSet || typeof animationSet !== "object") {
    return [];
  }

  return Object.keys(animationSet).filter(
    (key) =>
      Array.isArray(animationSet[key]?.frames) &&
      animationSet[key].frames.length,
  );
}

function hashStringSeed(input) {
  const text = String(input || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function resolveValueRange(value, randomUnit) {
  if (Array.isArray(value) && value.length >= 2) {
    const min = Number(value[0]) || 0;
    const max = Number(value[1]) || min;
    if (max <= min) {
      return min;
    }

    return min + (max - min) * randomUnit;
  }

  return Number(value) || 0;
}

export function createPetEngine(canvas, getState, getContext, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return {
      start: () => {},
      stop: () => {},
      handleViewportClick: () => {},
      triggerTaskCompletionEmotionBurst: () => {},
    };
  }

  let running = false;
  let frame = 0;
  let rafId = 0;
  let pettingUntil = 0;
  let milestoneBoostUntil = 0;
  let lastChecklistCompleted = 0;
  let position = { x: 180, y: 220 };
  let velocity = { x: 1.2, y: 0.9 };
  let lastBounds = { x: 0, y: 0, width: 64, height: 64 };
  let facingDirection = "right";
  let activeAnimationKey = "";
  let activeAnimationTick = 0;
  let shadowLift = 0;
  let currentPetId = "";
  let randomState = 0x9e3779b9;
  let sceneEffectParticles = [];
  let fishVariantSpeciesKey = "";
  let fishVisualTiltRad = 0;
  let birdVisualTiltRad = 0;
  let pendingMilestoneEmotionBursts = 0;
  let lastFrameAt = performance.now();

  const onDebugFrame =
    typeof options.onDebugFrame === "function" ? options.onDebugFrame : null;
  const onRuntimeError =
    typeof options.onRuntimeError === "function"
      ? options.onRuntimeError
      : null;
  const getTuning =
    typeof options.getTuning === "function" ? options.getTuning : null;

  function nextRandom() {
    randomState += 0x6d2b79f5;
    let v = randomState;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  }

  function pickInRange(range) {
    return resolveValueRange(range, nextRandom());
  }

  function reseedForPet(petId) {
    randomState =
      (hashStringSeed(`${petId}|${Date.now()}`) || 0x9e3779b9) >>> 0;
  }

  const coordinator = createBehaviorCoordinator({
    canvas,
    nextRandom,
    pickInRange,
  });
  const flockSystem = createFlockSystem({ canvas, nextRandom });

  function resizeCanvas() {
    const width = Math.max(320, window.innerWidth || 1280);
    const height = Math.max(220, window.innerHeight || 720);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function render() {
    if (!running) return;
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const nowPerf = performance.now();
      const deltaMs = Math.min(60, Math.max(8, nowPerf - lastFrameAt));
      lastFrameAt = nowPerf;

      // ── Update particles ──────────────────────────────────────────────────
      sceneEffectParticles = updateParticles(sceneEffectParticles, deltaMs);

      const state = getState();

      // ── Pet switch ────────────────────────────────────────────────────────
      if (state.selectedPetId !== currentPetId) {
        currentPetId = state.selectedPetId;
        reseedForPet(currentPetId);
        pendingMilestoneEmotionBursts = 0;
        sceneEffectParticles = [];
        fishVariantSpeciesKey = "";
        fishVisualTiltRad = 0;
        birdVisualTiltRad = 0;
        coordinator.reset(currentPetId, Date.now());
        flockSystem.reset();
      }

      // ── Tuning ────────────────────────────────────────────────────────────
      const tuning = getTuning ? getTuning() || {} : {};
      const speedMultiplier =
        Math.max(0.1, Number(tuning.speedMultiplier || 1)) *
        BASE_PET_SPEED_MULTIPLIER *
        LAZY_MOVEMENT_MULTIPLIER;
      const scaleMultiplier = Math.max(
        0.5,
        Number(tuning.scaleMultiplier || 1),
      );
      const shadowOffsetAdjust = Number(tuning.shadowOffsetAdjust || 0);
      const shadowAlpha = Math.max(
        0.05,
        Math.min(1, Number(tuning.shadowAlpha || 0.18)),
      );
      const highContrastShadow = Boolean(tuning.highContrastShadow);
      const forceFreeze = Boolean(tuning.freezeMotion);
      const forcedAnimationKey = String(tuning.forceAnimationKey || "").trim();
      const fishOverridesEnabled = tuning.fishOverridesEnabled !== false;
      const fishOverrides =
        tuning.fishOverrides && typeof tuning.fishOverrides === "object"
          ? tuning.fishOverrides
          : null;

      if (forceFreeze) {
        velocity.x = 0;
        velocity.y = 0;
      }

      // ── Pet catalog + animation set ───────────────────────────────────────
      const pet =
        PET_CATALOG[state.selectedPetId] || PET_CATALOG[DEFAULT_PET_ID];
      const atlasEnabled = Boolean(
        pet?.atlas?.src &&
        Array.isArray(pet?.frames) &&
        typeof pet.frames[0] === "object",
      );
      let frameDuration = pet.frameDuration || 18;
      const animationSet = resolveAnimationSet(pet);
      let behaviorProfile = getPetBehaviorProfile(state.selectedPetId);
      const animFrameDurMult = Math.max(
        0.75,
        Number(behaviorProfile?.animationFrameDurationMultiplier || 1),
      );
      frameDuration = Math.max(1, Math.round(frameDuration * animFrameDurMult));

      // ── Context ───────────────────────────────────────────────────────────
      const behavior = getContext() || {};
      const topSafeInset = Math.max(0, Number(behavior.topSafeInset || 0));
      const routeZone = resolveRouteZone(behavior.pathname);
      const checklistCompleted = Number(behavior.checklistCompleted || 0);
      const checklistTotal = Number(behavior.checklistTotal || 0);
      const checklistIncomplete = checklistTotal > checklistCompleted;
      const allTenStepsCompleted =
        checklistTotal >= 10 && checklistCompleted >= 10;
      const movementIntentByContext =
        routeZone === PET_ROUTE_ZONES.BOTTOM_ROAM ||
        routeZone === PET_ROUTE_ZONES.RIGHT_SUMMARY ||
        routeZone === PET_ROUTE_ZONES.HEADER_PERCH ||
        (routeZone === PET_ROUTE_ZONES.LEFT_ASSIST && checklistIncomplete);
      const isPetting = Date.now() < pettingUntil;
      const currentSpeed = Math.hypot(velocity.x, velocity.y);
      const wantsMovement =
        !isPetting && (movementIntentByContext || currentSpeed > 0.12);

      // ── Fish species scoping ──────────────────────────────────────────────
      const isFishSelected = state.selectedPetId === "fish";
      if (!isFishSelected) {
        fishVariantSpeciesKey = "";
      } else {
        const baseMovementPool = Array.isArray(
          behaviorProfile?.animationPools?.movement,
        )
          ? behaviorProfile.animationPools.movement
          : [];
        const validSpecies = baseMovementPool
          .filter((k) => animationSet?.[k]?.frames?.length)
          .map((k) => getFishSpeciesKey(k))
          .filter(Boolean);

        if (
          !fishVariantSpeciesKey ||
          !validSpecies.includes(fishVariantSpeciesKey)
        ) {
          const prev = fishVariantSpeciesKey;
          fishVariantSpeciesKey = pickNextFishSpeciesKey(
            validSpecies,
            nextRandom,
          );
          if (fishVariantSpeciesKey !== prev) flockSystem.reset();
        }

        if (fishVariantSpeciesKey) {
          const keep = (keys = []) =>
            Array.from(
              new Set(
                (Array.isArray(keys) ? keys : []).filter(
                  (k) =>
                    getFishSpeciesKey(k) === fishVariantSpeciesKey &&
                    animationSet?.[k]?.frames?.length,
                ),
              ),
            );
          const p = behaviorProfile?.animationPools || {};
          behaviorProfile = {
            ...behaviorProfile,
            animationPools: {
              ...p,
              movement: keep(p.movement),
              idle: keep(p.idle),
              interaction: keep(p.interaction),
              celebration: keep(p.celebration),
            },
            playfulNature: {
              ...(behaviorProfile?.playfulNature || {}),
              actionKeys: keep(behaviorProfile?.playfulNature?.actionKeys),
            },
            taskCompletion: {
              ...(behaviorProfile?.taskCompletion || {}),
              actionKeys: keep(behaviorProfile?.taskCompletion?.actionKeys),
            },
          };
        }
      }

      if (isFishSelected && fishOverridesEnabled && fishOverrides) {
        behaviorProfile = applyFishBehaviorOverrides(
          behaviorProfile,
          fishOverrides,
        );
      }

      // ── Behavior coordinator ──────────────────────────────────────────────
      const followers = flockSystem.getFollowers();
      const decision = coordinator.step({
        now: Date.now(),
        frame,
        petId: state.selectedPetId,
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
      });

      // ── Destructure coordinator decision ──────────────────────────────────
      const {
        selectedAnimationKey,
        locomotionAllowed,
        overrideTarget,
        overrideTargetPull,
        pendingEffects,
        sequenceHiddenStage,
        hasActiveSequence,
        isHardLockedAnimation,
        allowMovementByEnvironment,
        beaverCycleWantsMovement,
        environmentTransitionForceMovement,
        beaverLogCycleProp,
        currentActionKey,
        isBirdInFlightAction,
        isBirdAirborneAction,
        isFlightBoidsPet,
        directionalFlightDisableTilt,
        directionalFlightForceFlip,
        animationReason,
      } = decision;

      // ── Motion update ─────────────────────────────────────────────────────
      const useBirdInFlightBoids = isFlightBoidsPet && isBirdInFlightAction;
      const effectiveMovementIntent =
        wantsMovement ||
        beaverCycleWantsMovement ||
        environmentTransitionForceMovement;
      const movementActive =
        !forceFreeze &&
        !hasActiveSequence &&
        allowMovementByEnvironment &&
        locomotionAllowed &&
        effectiveMovementIntent;

      const motion = updateMotionState({
        spriteWidth: Math.max(24, lastBounds.width),
        spriteHeight: Math.max(24, lastBounds.height),
        state,
        options: {
          allowMovement:
            isFishSelected || useBirdInFlightBoids ? false : movementActive,
          speedMultiplier,
          profile: behaviorProfile,
          overrideTarget,
          overrideTargetPull,
        },
        frame,
        canvas,
        position,
        velocity,
        lastChecklistCompleted,
        milestoneBoostUntil,
        pendingMilestoneEmotionBursts,
        getContext,
        getPetBehaviorProfile,
        resolveRouteZone,
        petRouteZones: PET_ROUTE_ZONES,
        checklistMilestones: CHECKLIST_MILESTONES,
      });
      lastChecklistCompleted = motion.lastChecklistCompleted;
      milestoneBoostUntil = motion.milestoneBoostUntil;
      pendingMilestoneEmotionBursts = motion.pendingMilestoneEmotionBursts;

      // ── Flock / boid step ─────────────────────────────────────────────────
      const fishSchoolConfig = behaviorProfile?.schooling || {};
      const fishBoidConfig = behaviorProfile?.boids || {};
      const birdBoidConfig = behaviorProfile?.boids || {};

      if (isFishSelected) {
        flockSystem.ensureFollowers({
          leadX: Math.round(position.x),
          leadY: Math.round(position.y),
          spriteWidth: Math.max(24, lastBounds.width),
          schoolConfig: fishSchoolConfig,
          boidConfig: fishBoidConfig,
        });
        flockSystem.stepLead({
          position,
          velocity,
          spriteWidth: Math.max(24, lastBounds.width),
          spriteHeight: Math.max(24, lastBounds.height),
          deltaMs,
          boidConfig: fishBoidConfig,
        });
        flockSystem.stepFollowers({
          leadX: Math.round(position.x),
          leadY: Math.round(position.y),
          leadVX: velocity.x,
          leadVY: velocity.y,
          spriteWidth: Math.max(24, lastBounds.width),
          spriteHeight: Math.max(24, lastBounds.height),
          deltaMs,
          boidConfig: fishBoidConfig,
        });
      } else if (useBirdInFlightBoids && movementActive) {
        flockSystem.stepLead({
          position,
          velocity,
          spriteWidth: Math.max(24, lastBounds.width),
          spriteHeight: Math.max(24, lastBounds.height),
          deltaMs,
          boidConfig: birdBoidConfig,
        });
      } else {
        if (flockSystem.getFollowers().length > 0) flockSystem.reset();
      }

      // ── Resolve frame / sprite ────────────────────────────────────────────
      const selectedAnimation =
        selectedAnimationKey && animationSet
          ? animationSet[selectedAnimationKey]
          : null;
      const nextAnimKey = selectedAnimationKey || "__fallback__";
      if (nextAnimKey !== activeAnimationKey) {
        activeAnimationKey = nextAnimKey;
        activeAnimationTick = 0;
      }

      const normalizedForcedActionKey = toActionKey(forcedAnimationKey);
      const fallbackAnimationKeys = Array.from(
        new Set(
          (Array.isArray(pet?.frames) ? pet.frames : [])
            .map((f) => toActionKey(f?.action))
            .filter(Boolean),
        ),
      );
      const canForceFromFrames =
        Boolean(normalizedForcedActionKey) &&
        fallbackAnimationKeys.includes(normalizedForcedActionKey);
      const frameSource = selectedAnimation?.frames?.length
        ? selectedAnimation.frames
        : canForceFromFrames
          ? pet.frames.filter(
              (f) => toActionKey(f?.action) === selectedAnimationKey,
            )
          : pet.frames;
      const animationKeys = getAvailableAnimationKeys(animationSet);
      const fallbackAnimationFrames = animationKeys.length
        ? animationSet[animationKeys[0]]?.frames || []
        : [];
      const safeFrameSource =
        Array.isArray(frameSource) && frameSource.length
          ? frameSource
          : Array.isArray(pet?.frames) && pet.frames.length
            ? pet.frames
            : fallbackAnimationFrames;
      if (!safeFrameSource.length) {
        if (!forceFreeze) frame += 1;
        rafId = window.requestAnimationFrame(render);
        return;
      }

      const frameIndex = atlasEnabled
        ? resolveFrameIndexByTicks(
            safeFrameSource,
            activeAnimationTick,
            frameDuration,
            { holdOnLastFrame: Boolean(selectedAnimation?.holdOnLastFrame) },
          )
        : Math.floor(frame / frameDuration) % safeFrameSource.length;
      const sprite = safeFrameSource[frameIndex] || safeFrameSource[0];

      const scale = atlasEnabled ? DEFAULT_ATLAS_SCALE : 4;
      const petSizeMultiplier = Math.max(0.2, Number(pet?.sizeMultiplier || 1));
      const tunedScale =
        scale * scaleMultiplier * PET_SIZE_MULTIPLIER * petSizeMultiplier;
      const spriteHeight = atlasEnabled
        ? (Number(sprite?.h) || 16) * tunedScale
        : sprite.length * tunedScale;
      const spriteWidth = atlasEnabled
        ? (Number(sprite?.w) || 16) * tunedScale
        : (sprite[0]?.length || 0) * tunedScale;

      // ── Emit pending particle effects ─────────────────────────────────────
      for (const effect of pendingEffects) {
        const originX =
          effect.originX !== undefined
            ? effect.originX
            : Math.round(position.x) +
              spriteWidth * (effect.originXRatio ?? 0.5);
        const originY =
          effect.originY !== undefined
            ? effect.originY
            : Math.round(position.y) +
              spriteHeight * (effect.originYRatio ?? 0.5);
        sceneEffectParticles = emitParticleBurst(
          sceneEffectParticles,
          { ...effect, originX, originY },
          nextRandom,
        );
      }

      // ── Position state ────────────────────────────────────────────────────
      const currentCategory = String(
        selectedAnimation?.category || "",
      ).toLowerCase();
      const currentAction = String(
        selectedAnimation?.title || selectedAnimationKey || "",
      ).toLowerCase();

      if (velocity.x > 0.08) facingDirection = "right";
      else if (velocity.x < -0.08) facingDirection = "left";

      let originX = Math.round(position.x);
      let originY = Math.round(position.y);

      // ── Path traces ───────────────────────────────────────────────────────
      const fishPathTraceConfig = behaviorProfile?.effects?.pathTrace || {};
      const fishPathTraceEnabled =
        isFishSelected && fishPathTraceConfig.enabled !== false;
      flockSystem.updateLeadPathTrace({
        enabled: fishPathTraceEnabled,
        x: originX + spriteWidth * 0.5,
        y: originY + spriteHeight * 0.5,
        now: Date.now(),
        config: fishPathTraceConfig,
      });
      flockSystem.updateFollowerPathTraces({
        enabled: fishPathTraceEnabled,
        now: Date.now(),
        config: fishPathTraceConfig,
        spriteWidth,
        spriteHeight,
      });

      // ── Shadow ────────────────────────────────────────────────────────────
      const shadow = pet.shadow || {};
      const airborneActions = Array.isArray(shadow.airborneActions)
        ? shadow.airborneActions.map((a) => toActionKey(a))
        : [];
      const isAirborneAction =
        airborneActions.includes(currentActionKey) ||
        /flight|flap|glide|ascent|dive|hover/.test(currentActionKey);
      const isJumpAction = /jump/.test(currentActionKey);
      const hasPetting = Date.now() < pettingUntil;
      const hasDynamicBob =
        movementActive || isAirborneAction || isJumpAction || hasPetting;
      const bobScale = hasPetting ? 4 : movementActive ? 2 : 0;
      const bob =
        forceFreeze || !hasDynamicBob
          ? 0
          : Math.round(Math.sin(frame / 15) * bobScale);
      const shouldBlink = frame % 120 > 108;

      originY = Math.round(position.y + bob);

      // ── Tilt (fish + bird) ────────────────────────────────────────────────
      const fishTiltMaxRad = (24 * Math.PI) / 180;
      const fishTiltSmoothing = 0.24;
      const fishTiltMinSpeed = 0.24;
      let leadFishTiltRad = 0;
      if (isFishSelected) {
        const leadSpeed = Math.hypot(velocity.x, velocity.y);
        const raw =
          leadSpeed >= fishTiltMinSpeed
            ? Math.atan2(velocity.y, Math.max(Math.abs(velocity.x), 0.0001))
            : 0;
        const clamped = Math.max(
          -fishTiltMaxRad,
          Math.min(fishTiltMaxRad, raw),
        );
        fishVisualTiltRad = lerp(fishVisualTiltRad, clamped, fishTiltSmoothing);
        leadFishTiltRad = fishVisualTiltRad;
      } else {
        fishVisualTiltRad = lerp(fishVisualTiltRad, 0, 0.32);
      }

      const birdTiltEnabled =
        isFlightBoidsPet &&
        isBirdInFlightAction &&
        !directionalFlightDisableTilt;
      let leadBirdTiltRad = 0;
      if (birdTiltEnabled) {
        const leadSpeed = Math.hypot(velocity.x, velocity.y);
        const raw =
          leadSpeed >= 0.16
            ? Math.atan2(velocity.y, Math.max(Math.abs(velocity.x), 0.0001))
            : 0;
        birdVisualTiltRad = lerp(birdVisualTiltRad, raw, 0.2);
        leadBirdTiltRad = birdVisualTiltRad;
      } else {
        birdVisualTiltRad = lerp(birdVisualTiltRad, 0, 0.28);
      }

      // ── Compute shadow geometry ───────────────────────────────────────────
      const atlasImage = atlasEnabled ? getAtlasImage(pet?.atlas?.src) : null;
      const frameMetrics =
        atlasEnabled && atlasImage?.complete
          ? getAtlasFrameMetrics(atlasImage, sprite, pet?.atlas?.src)
          : null;

      let targetLift = isAirborneAction ? 1 : 0;
      if (isJumpAction) {
        const jumpSpan = Math.max(1, safeFrameSource.length - 1);
        const jumpPhase = (frameIndex % (jumpSpan + 1)) / jumpSpan;
        targetLift = Math.max(targetLift, Math.sin(jumpPhase * Math.PI));
      }
      if (forceFreeze) targetLift = shadowLift;
      const transSpeed = clamp01(shadow.transitionSpeed ?? 0.18);
      shadowLift = lerp(shadowLift, targetLift, transSpeed);

      const groundOffset = Number(shadow.groundOffset ?? 1);
      const airborneOffset = Number(shadow.airborneOffset ?? 14);
      const groundWidthPad = Number(shadow.groundWidthPad ?? 14);
      const airborneWidthPad = Number(shadow.airborneWidthPad ?? 4);
      const visibleWidth = frameMetrics
        ? frameMetrics.visibleWidth * tunedScale
        : spriteWidth;
      const visibleBottom = frameMetrics
        ? (frameMetrics.maxY + 1) * tunedScale
        : spriteHeight;
      const visibleCenterX = frameMetrics
        ? (frameMetrics.minX + frameMetrics.visibleWidth * 0.5) * tunedScale
        : spriteWidth * 0.5;
      const groundAnchorRatio = Number.isFinite(
        Number(shadow.groundAnchorRatio),
      )
        ? clamp01(Number(shadow.groundAnchorRatio))
        : null;
      const airborneAnchorRatio = Number.isFinite(
        Number(shadow.airborneAnchorRatio),
      )
        ? clamp01(Number(shadow.airborneAnchorRatio))
        : null;
      const groundedWidth = Math.max(14, visibleWidth - groundWidthPad);
      const airborneWidth = Math.min(
        Math.max(10, visibleWidth - airborneWidthPad),
        groundedWidth * 0.75,
      );
      const shadowOffset = lerp(groundOffset, airborneOffset, shadowLift);
      const shadowWidth = lerp(groundedWidth, airborneWidth, shadowLift);
      const groundShadowBaseY =
        groundAnchorRatio === null
          ? originY + visibleBottom
          : originY + spriteHeight * groundAnchorRatio;
      const airborneShadowBaseY =
        airborneAnchorRatio === null
          ? groundShadowBaseY
          : originY + spriteHeight * airborneAnchorRatio;
      const shadowBaseY = lerp(
        groundShadowBaseY,
        airborneShadowBaseY,
        shadowLift,
      );
      const shadowX = Math.round(originX + visibleCenterX - shadowWidth / 2);
      const shadowY = Math.round(
        shadowBaseY + shadowOffset + shadowOffsetAdjust,
      );

      lastBounds = {
        x: originX,
        y: originY,
        width: spriteWidth,
        height: spriteHeight,
      };

      // ── DRAW ──────────────────────────────────────────────────────────────
      if (!sequenceHiddenStage) {
        // Path traces
        if (fishPathTraceEnabled) {
          flockSystem.drawTraces(ctx, fishPathTraceConfig);
        }

        // Shadow
        ctx.fillStyle = highContrastShadow
          ? `rgba(255,255,255,${shadowAlpha})`
          : `rgba(2,6,23,${shadowAlpha})`;
        ctx.fillRect(shadowX, shadowY, shadowWidth, 4);

        // Beaver log prop
        if (
          beaverLogCycleProp &&
          beaverLogCycleProp.alpha > 0.01 &&
          atlasImage?.complete
        ) {
          const fr = beaverLogCycleProp.frame || {
            x: 32,
            y: 160,
            w: 32,
            h: 32,
          };
          const propScale = tunedScale * 0.95;
          const propW = (Number(fr.w) || 32) * propScale;
          const propH = (Number(fr.h) || 32) * propScale;
          ctx.save();
          ctx.globalAlpha = clamp01(beaverLogCycleProp.alpha);
          ctx.drawImage(
            atlasImage,
            Number(fr.x) || 32,
            Number(fr.y) || 160,
            Number(fr.w) || 32,
            Number(fr.h) || 32,
            Math.round(beaverLogCycleProp.x - propW / 2),
            Math.round(beaverLogCycleProp.y - propH / 2),
            propW,
            propH,
          );
          ctx.restore();
        }

        // Main sprite
        if (atlasEnabled) {
          const defaultFacing = String(
            pet?.atlas?.facing || "right",
          ).toLowerCase();
          const naturalFlip =
            (defaultFacing === "right" && facingDirection === "left") ||
            (defaultFacing === "left" && facingDirection === "right");
          const flipHorizontal =
            typeof directionalFlightForceFlip === "boolean"
              ? directionalFlightForceFlip
              : naturalFlip;
          if (atlasImage?.complete) {
            const leadTilt = isFishSelected ? leadFishTiltRad : leadBirdTiltRad;
            const leadRenderTilt = flipHorizontal ? -leadTilt : leadTilt;
            const tiltEnabled = isFishSelected || birdTiltEnabled;
            if (tiltEnabled) {
              drawAtlasFrameTransformed(
                ctx,
                atlasImage,
                sprite,
                originX,
                originY,
                tunedScale,
                { flipHorizontal, rotationRad: leadRenderTilt },
              );
            } else {
              drawAtlasFrame(
                ctx,
                atlasImage,
                sprite,
                originX,
                originY,
                tunedScale,
                flipHorizontal,
              );
            }

            // Fish school followers
            if (isFishSelected) {
              const currentFollowers = flockSystem.getFollowers();
              const schoolRenderOrder = currentFollowers
                .slice()
                .sort((a, b) => a.y - b.y);
              for (const follower of schoolRenderOrder) {
                const followerFrameIdx = resolveFrameIndexByTicks(
                  safeFrameSource,
                  activeAnimationTick + follower.frameOffset,
                  frameDuration,
                );
                const followerSprite =
                  safeFrameSource[followerFrameIdx] || safeFrameSource[0];
                const fvx = Number(follower.vx ?? 0);
                const fvy = Number(follower.vy ?? 0);
                const fSpeed = Math.hypot(fvx, fvy);
                const phx = Number(follower.facingVX ?? fvx);
                const phy = Number(follower.facingVY ?? fvy);
                const headingX = fSpeed > 0.03 ? fvx : phx;
                const headingY = fSpeed > 0.03 ? fvy : phy;
                const followerFacing =
                  headingX < -0.03
                    ? "left"
                    : headingX > 0.03
                      ? "right"
                      : phx < -0.03
                        ? "left"
                        : phx > 0.03
                          ? "right"
                          : facingDirection;
                const followerFlip =
                  (defaultFacing === "right" && followerFacing === "left") ||
                  (defaultFacing === "left" && followerFacing === "right");
                const followerScale = tunedScale * follower.scale;
                const ftiltSrc = fSpeed >= fishTiltMinSpeed ? fvx : headingX;
                const ftiltSrcY = fSpeed >= fishTiltMinSpeed ? fvy : headingY;
                const ftiltRaw = Math.atan2(
                  ftiltSrcY,
                  Math.max(Math.abs(ftiltSrc), 0.0001),
                );
                const ftiltRad = Math.max(
                  -fishTiltMaxRad,
                  Math.min(fishTiltMaxRad, ftiltRaw),
                );
                const followerRenderTilt =
                  (followerFlip ? -1 : 1) * ftiltRad * 0.85;
                drawAtlasFrameTransformed(
                  ctx,
                  atlasImage,
                  followerSprite,
                  Math.round(follower.x),
                  Math.round(
                    follower.y +
                      Math.sin((frame + follower.frameOffset) / 14) * 1.6,
                  ),
                  followerScale,
                  {
                    flipHorizontal: followerFlip,
                    rotationRad: followerRenderTilt,
                  },
                );
              }
            }
          }
        } else {
          drawPixelSprite(
            ctx,
            sprite,
            pet.palette,
            originX,
            originY,
            tunedScale,
            shouldBlink,
          );
        }
      }

      // Particles (always drawn, even during sequenceHiddenStage)
      drawParticles(ctx, sceneEffectParticles);

      // ── Debug callback ────────────────────────────────────────────────────
      if (onDebugFrame) {
        const availableAnimationKeys = animationSet
          ? getAvailableAnimationKeys(animationSet)
          : fallbackAnimationKeys;
        onDebugFrame({
          petId: state.selectedPetId,
          animationKey: activeAnimationKey,
          action: currentAction,
          category: currentCategory,
          routeZone,
          topSafeInset,
          reason: animationReason,
          shadowLift: Number(shadowLift.toFixed(3)),
          frameIndex,
          frameCount: safeFrameSource.length,
          speed: Number(currentSpeed.toFixed(3)),
          moving: movementActive,
          availableAnimationKeys,
          forcedAnimationKey: forcedAnimationKey || null,
          directionalFlight: {
            active: Boolean(
              directionalFlightForceFlip !== null &&
              directionalFlightForceFlip !== undefined,
            ),
            hardLocked: isHardLockedAnimation,
          },
          baseSpeedMultiplier: BASE_PET_SPEED_MULTIPLIER,
          baseAtlasScale: DEFAULT_ATLAS_SCALE,
          effectiveSpeedMultiplier: Number(speedMultiplier.toFixed(3)),
          effectiveScale: Number(tunedScale.toFixed(3)),
          position: { x: Math.round(position.x), y: Math.round(position.y) },
        });
      }

      // ── Frame bookkeeping ─────────────────────────────────────────────────
      if (!forceFreeze) activeAnimationTick += 1;
      frame += 1;
      rafId = window.requestAnimationFrame(render);
    } catch (error) {
      if (onRuntimeError) {
        onRuntimeError({
          message: "Pet render loop failure",
          detail: error?.stack || String(error),
          petId: currentPetId || null,
        });
      }

      rafId = window.requestAnimationFrame(render);
    }
  }

  function start() {
    if (running) {
      return;
    }

    running = true;
    lastFrameAt = performance.now();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    rafId = window.requestAnimationFrame(render);
  }

  function stop() {
    running = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    window.removeEventListener("resize", resizeCanvas);
  }

  function handleViewportClick(x, y) {
    const clickX = Number(x);
    const clickY = Number(y);
    if (!Number.isFinite(clickX) || !Number.isFinite(clickY)) {
      return;
    }

    const insideX =
      clickX >= lastBounds.x && clickX <= lastBounds.x + lastBounds.width;
    const insideY =
      clickY >= lastBounds.y && clickY <= lastBounds.y + lastBounds.height;

    if (insideX && insideY) {
      pettingUntil = Date.now() + 1400;
    }
  }

  function triggerTaskCompletionEmotionBurst() {
    pendingMilestoneEmotionBursts += 1;
    milestoneBoostUntil = Date.now() + 1500;
  }

  return {
    start,
    stop,
    handleViewportClick,
    triggerTaskCompletionEmotionBurst,
  };
}
