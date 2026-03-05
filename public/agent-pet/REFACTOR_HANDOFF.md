# petEngine Refactor — Handoff Notes

**Status as of 2026-03-05** — All extraction modules complete. `petEngine.js` rewrite is the only remaining task.

---

## Goal

Reduce `petEngine.js` from 3,825 lines to ~500–700 lines by replacing all inlined logic with calls to the 6 completed core modules. The engine should only handle: resize, frame loop, pet-switch reset, fish species scoping, motion, flock stepping, particle emission, and drawing.

---

## What Is Done ✅

| File                          | Status                    | Purpose                                                                                                           |
| ----------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `core/particleSystem.js`      | ✅ Complete               | `emitParticleBurst`, `updateParticles`, `drawParticles`                                                           |
| `core/atlasUtils.js`          | ✅ Complete               | `resolveFrameIndexByTicks`, `getAtlasImage`, `getAtlasFrameMetrics`, `drawAtlasFrameTransformed`                  |
| `core/flockSystem.js`         | ✅ Complete               | `createFlockSystem({canvas,nextRandom})` → fish school + bird boids + path traces                                 |
| `core/effectScheduler.js`     | ✅ Complete               | `createEffectScheduler({nextRandom,pickInRange})` → all 7 effect timing clocks                                    |
| `pets/beaver/foragePlugin.js` | ✅ Complete               | `createForagePlugin({canvas,nextRandom,pickInRange})` → 4-phase forage machine                                    |
| `core/behaviorCoordinator.js` | ✅ Complete (1,000 lines) | All behavioral decisions, FSM, sequences, playful beats, locomotion — delegates to effectScheduler + foragePlugin |
| `pets/index.js`               | ✅ Updated                | Now also exports `getPetPlugin(petId)`                                                                            |
| `pets/beaver/logic.js`        | ✅ Updated                | Added `capabilities: { propForage: true }`                                                                        |
| `pets/fish/logic.js`          | ✅ Updated                | Added `capabilities: { schooling: true }`                                                                         |

**`petEngine.js` is NOT yet modified.** All new modules sit alongside it but haven't replaced it.

---

## The Only Remaining Task: Rewrite `petEngine.js`

### New import block (replace the entire existing import section at the top):

```js
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
```

### Module-level constants to keep (lines ~33–47 in current file):

```
CHECKLIST_MILESTONES, DEFAULT_PET_ID, BASE_PET_SPEED_MULTIPLIER,
DEFAULT_ATLAS_SCALE, PET_SIZE_MULTIPLIER, LAZY_MOVEMENT_MULTIPLIER,
MAX_SEQUENCE_HIDDEN_STAGE_MS, FISH_SPECIES_ROTATION_INDEX_KEY, MOVEMENT_ACTIONS
```

**Remove**: `ATLAS_IMAGE_CACHE`, `ATLAS_FRAME_METRICS_CACHE` (now in atlasUtils.js)

### Module-level functions to KEEP (do not move, keep as-is):

- `clamp01`, `lerp`, `toActionKey` (lines ~49–64)
- `getFishSpeciesKey`, `pickNextFishSpeciesKey` (lines ~65–102) — fish species rotation with localStorage
- `isPlainObject`, `mergeDeep`, `applyFishBehaviorOverrides` (lines ~104–131)
- `resolveAnimationSet`, `getAvailableAnimationKeys`, `hashStringSeed`, `resolveValueRange` (lines ~293–342)

### Module-level functions to DELETE (now in core modules, no longer needed):

- `resolveFrameIndexByTicks` (use `atlasUtils.js`)
- `getAtlasImage`, `getAtlasFrameMetrics` (use `atlasUtils.js`)
- `drawAtlasFrameTransformed` (use `atlasUtils.js`)
- `estimateAnimationDurationMs` (in `behaviorCoordinator.js`)

---

### Inside `createPetEngine` — state vars to KEEP:

```js
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
```

### Inside `createPetEngine` — state vars to DELETE (owned by modules now):

```
beaverDiveSplashCooldownUntil, ferretDirtNextAt, birdWindNextAt,
birdLandingDustCooldownUntil, fishBubbleNextAt, fishTurnRippleCooldownUntil,
fishSchoolTargetCount, fishSchoolFollowers, fishPathTracePoints,
fishPathTraceLastAt, fishFollowerPathTraces, fishFollowerTraceSeed,
sleepZNextAt, previousActionKey, previousVelocityX,
playfulActionKey, playfulUntil, nextPlayfulAt,
animationStateReason, animationStatePriority, animationStateUntil,
beaverLogCyclePhase, beaverLogCycleNextAt, beaverLogCyclePhaseUntil,
beaverLogCycleTarget, beaverLogCycleDepartTarget, beaverLogCycleActionKey,
beaverLogCycleProp, beaverLogCycleFadeStartedAt,
environmentState, environmentDesiredState, environmentTransitionState,
animationPoolStateByPet, sequenceState, sequenceHiddenStartedAt,
sequenceCooldownUntil, nextSequenceCheckAt
```

### Inside `createPetEngine` — ADD after state vars:

```js
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
  randomState = (hashStringSeed(`${petId}|${Date.now()}`) || 0x9e3779b9) >>> 0;
}

const coordinator = createBehaviorCoordinator({
  canvas,
  nextRandom,
  pickInRange,
});
const flockSystem = createFlockSystem({ canvas, nextRandom });
```

### Inner helpers to DELETE (all owned by coordinator or flockSystem):

- `hasAnimationFrames`, `pickAnimationKeyFromCandidates`, `isAnimationSelectableOutsideSequence`
- `scheduleNextPlayfulBeat`, `scheduleNextBeaverLogCycle`, `resetBeaverLogCycle`
- `ensureFishSchoolFollowers`, `updateFishSchoolFollowers`, `updateLeadFishWithBoids`
- `startBeaverLogCycle`, `pickAnimationPoolVariant`
- `resolveAnimationLocomotion`, `resolveDirectionalFlightVisual`
- `reseedForPet` (keep only the one that calls `hashStringSeed`)
- `clearSequence`, `abortSequenceWithCooldown`
- `emitSceneEffectBurstCore`, `updateSceneEffectParticlesCore`, `drawSceneEffectParticlesCore`
- `emitSceneEffectBurst`, `updateSceneEffectParticles`, `drawSceneEffectParticles`
- `updateFishPathTrace`, `drawFishPathTrace`, `updateFishFollowerPathTraces`, `drawFishFollowerPathTraces`
- `relocateDuringSequence`, `advanceSequence`, `maybeStartSequence`

### Keep as-is:

- `resizeCanvas` (lines ~2045–2053)
- `start`, `stop`, `handleViewportClick`, `triggerTaskCompletionEmotionBurst` (lines ~3776–3825)
- The `updateMotion` wrapper (adapt to new form — see below)

---

## New `render()` Loop Structure

Replace the entire current `render()` function (~lines 2083–3775) with this structure:

```js
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
    const scaleMultiplier = Math.max(0.5, Number(tuning.scaleMultiplier || 1));
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
    const pet = PET_CATALOG[state.selectedPetId] || PET_CATALOG[DEFAULT_PET_ID];
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
      // [copy the fish species scoping block verbatim from current engine lines ~2212–2285]
      // This sets fishVariantSpeciesKey and scopes behaviorProfile's pool arrays
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

    // ── Motion update ─────────────────────────────────────────────────────
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
    } = decision;

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
      flockSystem.reset(); // non-flock pets — clear any leftover state
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
          : Math.round(position.x) + spriteWidth * (effect.originXRatio ?? 0.5);
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
    // (currentActionKey already from decision)

    const currentSpeed2 = Math.hypot(velocity.x, velocity.y);
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
      const clamped = Math.max(-fishTiltMaxRad, Math.min(fishTiltMaxRad, raw));
      fishVisualTiltRad = lerp(fishVisualTiltRad, clamped, fishTiltSmoothing);
      leadFishTiltRad = fishVisualTiltRad;
    } else {
      fishVisualTiltRad = lerp(fishVisualTiltRad, 0, 0.32);
    }

    const birdTiltEnabled =
      isFlightBoidsPet && isBirdInFlightAction && !directionalFlightDisableTilt;
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
    const groundAnchorRatio = Number.isFinite(Number(shadow.groundAnchorRatio))
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
    const shadowY = Math.round(shadowBaseY + shadowOffset + shadowOffsetAdjust);

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
        const fr = beaverLogCycleProp.frame || { x: 32, y: 160, w: 32, h: 32 };
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
        reason: decision.animationReason,
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
```

---

## Critical Details to Not Forget

1. **`pendingMilestoneEmotionBursts` counter** — `motionController.js` increments it on checklist milestones. The coordinator reads it and resets it to 0 after handling. The engine needs to pass the engine-local counter into `coordinator.step()` and also pass it into `updateMotionState`. After `updateMotionState` runs, update the local var from `motion.pendingMilestoneEmotionBursts`. After coordinator runs, reset to 0 if coordinator consumed it (coordinator returns `pendingMilestoneEmotionBursts` consumed implicitly — just copy the pattern from the old engine).

2. **Fish path traces** — `updateLeadPathTrace` and `updateFollowerPathTraces` must be called AFTER position is settled (after flock step), not before.

3. **`flockSystem.reset()` for non-flock pets** — current engine nulls out followers when switching away from fish/bird. The new engine should call `flockSystem.reset()` when pet is neither fish nor bird-in-flight. However, calling reset every frame for non-flock pets is wasteful — gate it: only call if `flockSystem.getFollowers().length > 0`.

4. **`hasActiveSequence` vs `sequenceState`** — In old engine, effects like beaver cycle were gated on `!sequenceState`. In new engine, use `decision.hasActiveSequence`.

5. **`drawParticles` placement** — Draw particles OUTSIDE the `!sequenceHiddenStage` block so particles persist during hidden sequence stages (e.g., beaver underwater is hidden but bubbles should still show).

6. **The `animationReason` field** — The coordinator returns it as `decision.animationReason` (not `selectedAnimationKey`). Pass it to `onDebugFrame` as `reason`.

7. **The old `updateMotion` wrapper** in the old engine reads `lastChecklistCompleted`, `milestoneBoostUntil`, `pendingMilestoneEmotionBursts` from outer scope and writes them back. In the new engine, call `updateMotionState` directly and manually read the returned values.

8. **`resolveAnimationSet`** — This stays in petEngine.js as a local helper. It's simple: just returns `pet.animations`.

9. **Fish followers bob** — `Math.sin((frame + follower.frameOffset) / 14) * 1.6` added to follower Y. Keep this.

10. **`fishTiltMinSpeed = 0.24`** — needed in follower drawing code. Keep as a local const.

---

## Steps to Execute the Rewrite

1. Read current `petEngine.js` lines 1–403 (imports + module-level utils)
2. Build the new file from scratch starting with the new import block
3. Add KEPT module-level utils: `clamp01`, `lerp`, `toActionKey`, `getFishSpeciesKey`, `pickNextFishSpeciesKey`, `isPlainObject`, `mergeDeep`, `applyFishBehaviorOverrides`, `resolveAnimationSet`, `getAvailableAnimationKeys`, `hashStringSeed`, `resolveValueRange`
4. Write `createPetEngine` with new minimal state vars + `nextRandom`, `pickInRange`, `reseedForPet`
5. Instantiate `coordinator` and `flockSystem`
6. Write `resizeCanvas` (copy verbatim from old engine)
7. Write the new `render()` using the structure above
8. Copy `start`, `stop`, `handleViewportClick`, `triggerTaskCompletionEmotionBurst` verbatim from old engine
9. Test: open http://localhost:5173/#/pet, switch all pets, verify no console errors

---

## Fish Species Scoping Block (copy verbatim into render loop)

This replaces the `fishPetSelected` block (~lines 2212–2285 in old engine).
The key variables: `fishVariantSpeciesKey` (engine state), `behaviorProfile` (reassigned locally).

```js
// Fish species scoping (only when fish is selected)
if (isFishSelected) {
  const baseMovementPool = Array.isArray(
    behaviorProfile?.animationPools?.movement,
  )
    ? behaviorProfile.animationPools.movement
    : [];
  const validSpecies = baseMovementPool
    .filter((k) => animationSet?.[k]?.frames?.length)
    .map((k) => getFishSpeciesKey(k))
    .filter(Boolean);

  if (!fishVariantSpeciesKey || !validSpecies.includes(fishVariantSpeciesKey)) {
    const prev = fishVariantSpeciesKey;
    fishVariantSpeciesKey = pickNextFishSpeciesKey(validSpecies, nextRandom);
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
```

---

## Dev Server

```
npm run dev    -- starts at http://localhost:5173/
```

Pet UI: http://localhost:5173/#/pet (or the direct agent-pet iframe at http://localhost:5173/agent-pet/)

---

## Git

```powershell
& "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe" add -A
& "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe" commit -m "message"
& "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe" push
```
