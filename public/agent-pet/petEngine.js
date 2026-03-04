import { PET_CATALOG } from "./petCatalog.js";
import { getPetBehaviorProfile } from "./pets/index.js";
import { drawAtlasFrame, drawPixelSprite } from "./core/rendering.js";
import {
  getEnvironmentAllowedKeys,
  getEnvironmentConfig,
  normalizeEnvironmentKey,
  resolveDesiredEnvironment,
  resolveEnvironmentTransitionSpec,
} from "./core/environmentFSM.js";
import {
  pickAnimationChoice,
  resolveAnimationState,
} from "./core/animationSelector.js";
import { updateMotionState } from "./core/motionController.js";
import {
  buildSequenceRuntime,
  getRuleForPet,
  isSequenceOnlyAnimationKey,
  isSequenceStageEnvironmentValid,
  PET_SEQUENCE_RULES,
  resolveRelocateStageDurationMs as resolveSequenceRelocateStageDurationMs,
  SEQUENCE_STAGE_TICK_MS,
} from "./core/sequenceManager.js";
import { PET_ROUTE_ZONES, resolveRouteZone } from "./behaviors/zones.js";

const CHECKLIST_MILESTONES = [3, 6, 10];
const DEFAULT_PET_ID = Object.keys(PET_CATALOG)[0];
const BASE_PET_SPEED_MULTIPLIER = 0.5;
const DEFAULT_ATLAS_SCALE = 1.5;
const PET_SIZE_MULTIPLIER = 1.5;
const LAZY_MOVEMENT_MULTIPLIER = 0.5;
const MAX_SEQUENCE_HIDDEN_STAGE_MS = 5200;
const FISH_SPECIES_ROTATION_INDEX_KEY = "azdes.pet.fishSpeciesRotationIndex";
const ATLAS_IMAGE_CACHE = new Map();
const ATLAS_FRAME_METRICS_CACHE = new Map();
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

function resolveFrameIndexByTicks(
  frames,
  tickCount,
  defaultDuration = 6,
  options = {},
) {
  if (!Array.isArray(frames) || !frames.length) {
    return 0;
  }

  const holdOnLastFrame = Boolean(options.holdOnLastFrame);

  const totalTicks = frames.reduce(
    (sum, frameRect) =>
      sum + Math.max(1, Number(frameRect?.ticks) || defaultDuration),
    0,
  );

  if (!totalTicks) {
    return 0;
  }

  if (holdOnLastFrame && tickCount >= totalTicks) {
    return frames.length - 1;
  }

  const pointer = tickCount % totalTicks;
  let elapsed = 0;

  for (let index = 0; index < frames.length; index += 1) {
    elapsed += Math.max(1, Number(frames[index]?.ticks) || defaultDuration);
    if (pointer < elapsed) {
      return index;
    }
  }

  return 0;
}

function getAtlasImage(src) {
  if (!src) {
    return null;
  }

  let resolvedSrc = src;
  if (typeof src === "string" && src.startsWith("/agent-pet/")) {
    const relativeSrc = src.replace(/^\/agent-pet\//, "");
    resolvedSrc = new URL(`./${relativeSrc}`, window.location.href).toString();
  }

  const cached = ATLAS_IMAGE_CACHE.get(resolvedSrc);
  if (cached) {
    return cached;
  }

  const image = new Image();
  image.src = resolvedSrc;
  ATLAS_IMAGE_CACHE.set(resolvedSrc, image);
  return image;
}

let frameMetricsCanvas = null;
let frameMetricsContext = null;

function getAtlasFrameMetrics(image, frameRect, atlasSrc) {
  if (!image || !frameRect || !atlasSrc) {
    return null;
  }

  const width = Number(frameRect.w) || 0;
  const height = Number(frameRect.h) || 0;
  if (!width || !height) {
    return null;
  }

  const cacheKey = `${atlasSrc}|${frameRect.x}|${frameRect.y}|${width}|${height}`;
  const cached = ATLAS_FRAME_METRICS_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!frameMetricsCanvas) {
    frameMetricsCanvas = document.createElement("canvas");
    frameMetricsContext = frameMetricsCanvas.getContext("2d", {
      willReadFrequently: true,
    });
  }

  if (!frameMetricsContext) {
    return null;
  }

  frameMetricsCanvas.width = width;
  frameMetricsCanvas.height = height;
  frameMetricsContext.clearRect(0, 0, width, height);
  frameMetricsContext.drawImage(
    image,
    Number(frameRect.x) || 0,
    Number(frameRect.y) || 0,
    width,
    height,
    0,
    0,
    width,
    height,
  );

  const data = frameMetricsContext.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 8) {
        continue;
      }

      if (x < minX) {
        minX = x;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (y > maxY) {
        maxY = y;
      }
    }
  }

  const result =
    maxX >= minX && maxY >= minY
      ? {
          hasVisiblePixels: true,
          minX,
          maxX,
          minY,
          maxY,
          visibleWidth: maxX - minX + 1,
          visibleHeight: maxY - minY + 1,
        }
      : {
          hasVisiblePixels: false,
          minX: 0,
          maxX: width - 1,
          minY: 0,
          maxY: height - 1,
          visibleWidth: width,
          visibleHeight: height,
        };

  ATLAS_FRAME_METRICS_CACHE.set(cacheKey, result);
  return result;
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

function estimateAnimationDurationMs(animation, loops) {
  const explicitTicks = Number(animation?.totalTicks || 0);
  const computedTicks = Array.isArray(animation?.frames)
    ? animation.frames.reduce(
        (sum, frameItem) => sum + Math.max(1, Number(frameItem?.ticks) || 1),
        0,
      )
    : 0;
  const totalTicks = Math.max(1, explicitTicks || computedTicks || 1);
  const loopCount = Math.max(1, Number(loops || 1));
  return totalTicks * SEQUENCE_STAGE_TICK_MS * loopCount;
}

function drawAtlasFrameTransformed(
  ctx,
  image,
  frameRect,
  originX,
  originY,
  scale,
  options = {},
) {
  if (!image || !frameRect) {
    return;
  }

  const sourceWidth = Number(frameRect.w) || 0;
  const sourceHeight = Number(frameRect.h) || 0;
  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const destWidth = sourceWidth * scale;
  const destHeight = sourceHeight * scale;
  const flipHorizontal = Boolean(options.flipHorizontal);
  const rotationRad = Number(options.rotationRad || 0);

  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(originX + destWidth * 0.5, originY + destHeight * 0.5);
  if (Math.abs(rotationRad) > 0.0001) {
    ctx.rotate(rotationRad);
  }
  if (flipHorizontal) {
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    image,
    Number(frameRect.x) || 0,
    Number(frameRect.y) || 0,
    sourceWidth,
    sourceHeight,
    -destWidth * 0.5,
    -destHeight * 0.5,
    destWidth,
    destHeight,
  );
  ctx.restore();
}

export function createPetEngine(canvas, getState, getContext, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return {
      start: () => {},
      stop: () => {},
      handleViewportClick: () => {},
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
  let sequenceState = null;
  let sequenceHiddenStartedAt = 0;
  let sequenceCooldownUntil = 0;
  let nextSequenceCheckAt = 0;
  let currentPetId = "";
  let randomState = 0x9e3779b9;
  let sceneEffectParticles = [];
  let beaverDiveSplashCooldownUntil = 0;
  let ferretDirtNextAt = 0;
  let birdWindNextAt = 0;
  let birdLandingDustCooldownUntil = 0;
  let fishBubbleNextAt = 0;
  let fishTurnRippleCooldownUntil = 0;
  let fishVariantSpeciesKey = "";
  let fishSchoolTargetCount = 0;
  let fishSchoolFollowers = [];
  let fishVisualTiltRad = 0;
  let fishPathTracePoints = [];
  let fishPathTraceLastAt = 0;
  let fishFollowerPathTraces = [];
  let fishFollowerTraceSeed = 0;
  let sleepZNextAt = 0;
  let previousActionKey = "";
  let previousVelocityX = 0;
  let playfulActionKey = "";
  let playfulUntil = 0;
  let nextPlayfulAt = 0;
  let pendingMilestoneEmotionBursts = 0;
  let animationStateReason = "fallback";
  let animationStatePriority = 0;
  let animationStateUntil = 0;
  let beaverLogCyclePhase = "";
  let beaverLogCycleNextAt = 0;
  let beaverLogCyclePhaseUntil = 0;
  let beaverLogCycleTarget = null;
  let beaverLogCycleDepartTarget = null;
  let beaverLogCycleActionKey = "";
  let beaverLogCycleProp = null;
  let beaverLogCycleFadeStartedAt = 0;
  let environmentState = "";
  let environmentDesiredState = "";
  let environmentTransitionState = null;
  const animationPoolStateByPet = new Map();
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
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function pickInRange(value) {
    return resolveValueRange(value, nextRandom());
  }

  function hasAnimationFrames(animationSet, key) {
    return Boolean(
      animationSet &&
      key &&
      animationSet[key] &&
      Array.isArray(animationSet[key]?.frames) &&
      animationSet[key].frames.length,
    );
  }

  function pickAnimationKeyFromCandidates(animationSet, candidateKeys = []) {
    const normalized = Array.from(
      new Set(
        (Array.isArray(candidateKeys) ? candidateKeys : [])
          .map((key) => String(key || "").trim())
          .filter(Boolean),
      ),
    );

    const valid = normalized.filter((key) =>
      hasAnimationFrames(animationSet, key),
    );
    if (!valid.length) {
      return "";
    }

    const index = Math.floor(nextRandom() * valid.length);
    return valid[index] || valid[0] || "";
  }

  function isAnimationSelectableOutsideSequence({ petId, key, sequenceState }) {
    if (!key) {
      return false;
    }

    if (!isSequenceOnlyAnimationKey(petId, key)) {
      return true;
    }

    if (!sequenceState) {
      return false;
    }

    const activeStage = sequenceState.stages?.[sequenceState.stageIndex];
    return activeStage?.animationKey === key;
  }

  function scheduleNextPlayfulBeat(profile, now) {
    const playfulConfig = profile?.playfulNature || {};
    const delayMs = Math.max(
      1200,
      Math.round(pickInRange(playfulConfig.intervalMs || [5500, 12000])),
    );
    nextPlayfulAt = now + delayMs;
  }

  function scheduleNextBeaverLogCycle(profile, now) {
    const forage = profile?.logForage || {};
    const delayMs = Math.max(
      6000,
      Math.round(pickInRange(forage.intervalMs || [20000, 36000])),
    );
    beaverLogCycleNextAt = now + delayMs;
  }

  function resetBeaverLogCycle(profile, now) {
    beaverLogCyclePhase = "";
    beaverLogCyclePhaseUntil = 0;
    beaverLogCycleTarget = null;
    beaverLogCycleDepartTarget = null;
    beaverLogCycleActionKey = "";
    beaverLogCycleProp = null;
    beaverLogCycleFadeStartedAt = 0;
    scheduleNextBeaverLogCycle(profile, now);
  }

  function ensureFishSchoolFollowers({
    originX,
    originY,
    spriteWidth,
    schoolConfig,
    boidConfig,
  }) {
    const sizeRange = Array.isArray(schoolConfig?.sizeRange)
      ? schoolConfig.sizeRange
      : [3, 6];
    const minTotal = Math.max(1, Math.round(Number(sizeRange[0] ?? 3)));
    const maxTotal = Math.max(minTotal, Math.round(Number(sizeRange[1] ?? 6)));
    if (fishSchoolTargetCount < minTotal || fishSchoolTargetCount > maxTotal) {
      fishSchoolTargetCount =
        minTotal +
        Math.floor(nextRandom() * Math.max(1, maxTotal - minTotal + 1));
    }

    const totalCount = fishSchoolTargetCount;
    const desiredFollowers = Math.max(0, totalCount - 1);

    if (fishSchoolFollowers.length === desiredFollowers) {
      return;
    }

    const radius = Math.max(spriteWidth * 1.4, 40);
    const followerScaleRange = Array.isArray(boidConfig?.followerScaleRange)
      ? boidConfig.followerScaleRange
      : [0.34, 0.48];
    const minFollowerScale = Math.max(
      0.2,
      Math.min(0.95, Number(followerScaleRange[0] ?? 0.34)),
    );
    const maxFollowerScale = Math.max(
      minFollowerScale,
      Math.min(0.95, Number(followerScaleRange[1] ?? 0.48)),
    );
    const initialSpeed = Math.max(0.35, Number(boidConfig?.minSpeed ?? 1.25));

    while (fishSchoolFollowers.length < desiredFollowers) {
      const index = fishSchoolFollowers.length;
      const angle = (Math.PI * 2 * (index + 1)) / Math.max(1, desiredFollowers);
      const distance = radius * (0.55 + nextRandom() * 0.45);
      fishSchoolFollowers.push({
        traceId: ++fishFollowerTraceSeed,
        x: originX + Math.cos(angle) * distance,
        y: originY + Math.sin(angle) * distance * 0.55,
        vx: Math.cos(angle) * initialSpeed,
        vy: Math.sin(angle) * initialSpeed * 0.5,
        frameOffset: Math.floor(nextRandom() * 24),
        scale:
          minFollowerScale +
          nextRandom() * Math.max(0, maxFollowerScale - minFollowerScale),
        bubbleNextAt: 0,
      });
    }

    if (fishSchoolFollowers.length > desiredFollowers) {
      fishSchoolFollowers.length = desiredFollowers;
    }
  }

  function updateFishSchoolFollowers({
    leadX,
    leadY,
    leadVX,
    leadVY,
    spriteWidth,
    spriteHeight,
    deltaMs,
    boidConfig,
  }) {
    if (!fishSchoolFollowers.length) {
      return;
    }

    const dt = Math.max(0.5, Math.min(1.15, deltaMs / 16.666));
    const neighborRadius = Math.max(
      spriteWidth,
      Number(boidConfig?.neighborRadiusPx ?? 136),
    );
    const separationRadius = Math.max(
      spriteWidth * 0.4,
      Number(boidConfig?.separationRadiusPx ?? 48),
    );
    const boidNeighborRadius = neighborRadius;
    const boidSeparationRadius = separationRadius;
    const boidMaxForceBase = Math.max(
      0.001,
      Number(boidConfig?.maxForce ?? 0.13),
    );
    const boidAlignmentWeight = Math.max(
      0,
      Number(boidConfig?.alignmentWeight ?? 0.9),
    );
    const boidCohesionWeight = Math.max(
      0,
      Number(boidConfig?.cohesionWeight ?? 0.7),
    );
    const boidSeparationWeight = Math.max(
      0,
      Number(boidConfig?.separationWeight ?? 1.15),
    );
    const boidEdgeAvoidanceWeight = Math.max(
      0,
      Number(boidConfig?.edgeAvoidanceWeight ?? 0.9),
    );
    const minSpeed = Math.max(0.05, Number(boidConfig?.minSpeed ?? 1.25));
    const maxSpeed = Math.max(
      minSpeed + 0.05,
      Number(boidConfig?.maxSpeed ?? 8.625),
    );
    const drag = clamp01(Number(boidConfig?.drag ?? 0.992));
    const edgeMargin = Math.max(
      spriteWidth * 0.85,
      Number(boidConfig?.edgeAvoidanceMarginPx ?? 140),
    );
    const edgeAvoidanceMaxForceBase = Math.max(
      0.001,
      Number(boidConfig?.edgeAvoidanceMaxForce ?? 0.16),
    );
    const minX = -spriteWidth * 0.8;
    const maxX = canvas.width - spriteWidth * 0.2;
    const minY = 12;
    const maxY = canvas.height - spriteHeight - 8;

    const limitVector = (valueX, valueY, maxMagnitude) => {
      const magnitude = Math.hypot(valueX, valueY);
      if (magnitude <= maxMagnitude || magnitude <= 0.0001) {
        return { x: valueX, y: valueY };
      }

      const ratio = maxMagnitude / magnitude;
      return { x: valueX * ratio, y: valueY * ratio };
    };

    for (let index = 0; index < fishSchoolFollowers.length; index += 1) {
      const fish = fishSchoolFollowers[index];
      const localForwardX =
        Math.hypot(leadVX, leadVY) > 0.06
          ? leadVX / Math.hypot(leadVX, leadVY)
          : fish.vx || 1;
      const localForwardY =
        Math.hypot(leadVX, leadVY) > 0.06
          ? leadVY / Math.hypot(leadVX, leadVY)
          : fish.vy || 0;
      let localFacingX =
        Math.abs(fish.facingVX) > 0.0001
          ? Number(fish.facingVX)
          : localForwardX;
      let localFacingY =
        Math.abs(fish.facingVY) > 0.0001
          ? Number(fish.facingVY)
          : localForwardY;
      let alignX = 0;
      let alignY = 0;
      let cohesionX = 0;
      let cohesionY = 0;
      let separationX = 0;
      let separationY = 0;
      let separationSamples = 0;
      let neighbors = 0;

      for (
        let otherIndex = 0;
        otherIndex < fishSchoolFollowers.length;
        otherIndex += 1
      ) {
        if (index === otherIndex) {
          continue;
        }

        const other = fishSchoolFollowers[otherIndex];
        const dx = other.x - fish.x;
        const dy = other.y - fish.y;
        const distance = Math.hypot(dx, dy) || 0.0001;

        if (distance <= boidNeighborRadius) {
          neighbors += 1;
          alignX += other.vx;
          alignY += other.vy;
          cohesionX += other.x;
          cohesionY += other.y;
        }

        if (distance <= boidSeparationRadius) {
          separationX += (fish.x - other.x) / distance;
          separationY += (fish.y - other.y) / distance;
          separationSamples += 1;
        }
      }

      const leadDX = leadX - fish.x;
      const leadDY = leadY - fish.y;
      const leadDistance = Math.hypot(leadDX, leadDY) || 0.0001;
      if (leadDistance <= boidNeighborRadius) {
        neighbors += 1;
        alignX += leadVX;
        alignY += leadVY;
        cohesionX += leadX;
        cohesionY += leadY;
      }
      if (leadDistance <= boidSeparationRadius) {
        separationX += (fish.x - leadX) / leadDistance;
        separationY += (fish.y - leadY) / leadDistance;
        separationSamples += 1;
      }

      if (neighbors > 0) {
        alignX /= neighbors;
        alignY /= neighbors;
        cohesionX = cohesionX / neighbors - fish.x;
        cohesionY = cohesionY / neighbors - fish.y;
      }

      const boidMaxForce = boidMaxForceBase * dt;
      const followerSpeed = Math.hypot(fish.vx, fish.vy);
      const desiredSpeed = Math.max(
        minSpeed,
        Math.min(maxSpeed, Math.max(minSpeed, followerSpeed)),
      );

      let boidForceX = 0;
      let boidForceY = 0;

      if (neighbors > 0) {
        const alignLength = Math.hypot(alignX, alignY) || 0;
        if (alignLength > 0.0001) {
          const desiredAlignX = (alignX / alignLength) * desiredSpeed;
          const desiredAlignY = (alignY / alignLength) * desiredSpeed;
          const alignSteer = limitVector(
            desiredAlignX - fish.vx,
            desiredAlignY - fish.vy,
            boidMaxForce,
          );
          boidForceX += alignSteer.x * boidAlignmentWeight;
          boidForceY += alignSteer.y * boidAlignmentWeight;
        }

        const toCenterX = cohesionX;
        const toCenterY = cohesionY;
        const toCenterLength = Math.hypot(toCenterX, toCenterY) || 0;
        if (toCenterLength > 0.0001) {
          const desiredCohesionX = (toCenterX / toCenterLength) * desiredSpeed;
          const desiredCohesionY = (toCenterY / toCenterLength) * desiredSpeed;
          const cohesionSteer = limitVector(
            desiredCohesionX - fish.vx,
            desiredCohesionY - fish.vy,
            boidMaxForce,
          );
          boidForceX += cohesionSteer.x * boidCohesionWeight;
          boidForceY += cohesionSteer.y * boidCohesionWeight;
        }
      }

      if (separationSamples > 0) {
        const avgSeparationX = separationX / separationSamples;
        const avgSeparationY = separationY / separationSamples;
        const separationLength =
          Math.hypot(avgSeparationX, avgSeparationY) || 0;
        if (separationLength > 0.0001) {
          const desiredSeparationX =
            (avgSeparationX / separationLength) * desiredSpeed;
          const desiredSeparationY =
            (avgSeparationY / separationLength) * desiredSpeed;
          const separationSteer = limitVector(
            desiredSeparationX - fish.vx,
            desiredSeparationY - fish.vy,
            boidMaxForce,
          );
          boidForceX += separationSteer.x * boidSeparationWeight;
          boidForceY += separationSteer.y * boidSeparationWeight;
        }
      }

      const edgePushX =
        1 -
        clamp01((fish.x - minX) / Math.max(1, edgeMargin)) -
        (1 - clamp01((maxX - fish.x) / Math.max(1, edgeMargin)));
      const edgePushY =
        1 -
        clamp01((fish.y - minY) / Math.max(1, edgeMargin)) -
        (1 - clamp01((maxY - fish.y) / Math.max(1, edgeMargin)));
      const edgePushLength = Math.hypot(edgePushX, edgePushY);
      if (edgePushLength > 0.0001) {
        const desiredEdgeX = (edgePushX / edgePushLength) * desiredSpeed;
        const desiredEdgeY = (edgePushY / edgePushLength) * desiredSpeed;
        const edgeSteer = limitVector(
          desiredEdgeX - fish.vx,
          desiredEdgeY - fish.vy,
          edgeAvoidanceMaxForceBase * dt,
        );
        boidForceX += edgeSteer.x * boidEdgeAvoidanceWeight;
        boidForceY += edgeSteer.y * boidEdgeAvoidanceWeight;
      }

      const netBoidForce = limitVector(
        boidForceX,
        boidForceY,
        boidMaxForce * 2,
      );
      fish.vx += netBoidForce.x;
      fish.vy += netBoidForce.y;

      fish.vx *= drag;
      fish.vy *= drag;

      const velocityLength = Math.hypot(fish.vx, fish.vy);
      if (velocityLength > 0.03) {
        localFacingX = fish.vx / velocityLength;
        localFacingY = fish.vy / velocityLength;
      } else if (Math.hypot(localFacingX, localFacingY) <= 0.0001) {
        localFacingX = localForwardX;
        localFacingY = localForwardY;
      }

      fish.facingVX = lerp(Number(fish.facingVX || 0), localFacingX, 0.28);
      fish.facingVY = lerp(Number(fish.facingVY || 0), localFacingY, 0.28);

      const speed = Math.hypot(fish.vx, fish.vy);
      if (speed > maxSpeed) {
        const ratio = maxSpeed / Math.max(0.0001, speed);
        fish.vx *= ratio;
        fish.vy *= ratio;
      } else if (speed < minSpeed) {
        const baseDirectionX =
          Math.abs(fish.vx) > 0.02 ? fish.vx : leadX - fish.x;
        const baseDirectionY =
          Math.abs(fish.vy) > 0.02 ? fish.vy : (leadY - fish.y) * 0.7;
        const directionLength = Math.hypot(baseDirectionX, baseDirectionY) || 1;
        fish.vx = (baseDirectionX / directionLength) * minSpeed;
        fish.vy = (baseDirectionY / directionLength) * minSpeed;
      }

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;

      fish.y = Math.max(minY, Math.min(maxY, fish.y));
      fish.x = Math.max(minX, Math.min(maxX, fish.x));
    }
  }

  function updateLeadFishWithBoids({
    spriteWidth,
    spriteHeight,
    deltaMs,
    boidConfig,
  }) {
    const dt = Math.max(0.5, Math.min(1.15, deltaMs / 16.666));
    const neighborRadius = Math.max(
      spriteWidth,
      Number(boidConfig?.neighborRadiusPx ?? 136),
    );
    const separationRadius = Math.max(
      spriteWidth * 0.4,
      Number(boidConfig?.separationRadiusPx ?? 48),
    );
    const boidNeighborRadius = neighborRadius;
    const boidSeparationRadius = separationRadius;
    const boidMaxForceBase = Math.max(
      0.001,
      Number(boidConfig?.maxForce ?? 0.13),
    );
    const boidAlignmentWeight = Math.max(
      0,
      Number(boidConfig?.alignmentWeight ?? 0.9),
    );
    const boidCohesionWeight = Math.max(
      0,
      Number(boidConfig?.cohesionWeight ?? 0.7),
    );
    const boidSeparationWeight = Math.max(
      0,
      Number(boidConfig?.separationWeight ?? 1.15),
    );
    const boidEdgeAvoidanceWeight = Math.max(
      0,
      Number(boidConfig?.edgeAvoidanceWeight ?? 0.9),
    );
    const minSpeed = Math.max(0.05, Number(boidConfig?.minSpeed ?? 1.25));
    const maxSpeed = Math.max(
      minSpeed + 0.05,
      Number(boidConfig?.maxSpeed ?? 8.625),
    );
    const drag = clamp01(Number(boidConfig?.drag ?? 0.992));
    const edgeMargin = Math.max(
      spriteWidth * 0.85,
      Number(boidConfig?.edgeAvoidanceMarginPx ?? 140),
    );
    const edgeAvoidanceMaxForceBase = Math.max(
      0.001,
      Number(boidConfig?.edgeAvoidanceMaxForce ?? 0.16),
    );

    let alignX = 0;
    let alignY = 0;
    let cohesionX = 0;
    let cohesionY = 0;
    let separationX = 0;
    let separationY = 0;
    let separationSamples = 0;
    let neighbors = 0;

    for (let index = 0; index < fishSchoolFollowers.length; index += 1) {
      const fish = fishSchoolFollowers[index];
      const dx = Number(fish.x) - position.x;
      const dy = Number(fish.y) - position.y;
      const distance = Math.hypot(dx, dy) || 0.0001;

      if (distance <= boidNeighborRadius) {
        neighbors += 1;
        alignX += Number(fish.vx || 0);
        alignY += Number(fish.vy || 0);
        cohesionX += Number(fish.x || 0);
        cohesionY += Number(fish.y || 0);
      }

      if (distance <= boidSeparationRadius) {
        separationX += (position.x - Number(fish.x || 0)) / distance;
        separationY += (position.y - Number(fish.y || 0)) / distance;
        separationSamples += 1;
      }
    }

    if (!neighbors) {
      velocity.x *= 0.985;
      velocity.y *= 0.985;
      return;
    }

    const limitVector = (valueX, valueY, maxMagnitude) => {
      const magnitude = Math.hypot(valueX, valueY);
      if (magnitude <= maxMagnitude || magnitude <= 0.0001) {
        return { x: valueX, y: valueY };
      }

      const ratio = maxMagnitude / magnitude;
      return { x: valueX * ratio, y: valueY * ratio };
    };

    const boidMaxForce = boidMaxForceBase * dt;
    const leadSpeed = Math.hypot(velocity.x, velocity.y);
    const desiredSpeed = Math.max(minSpeed, Math.min(maxSpeed, leadSpeed));
    let boidForceX = 0;
    let boidForceY = 0;

    if (neighbors > 0) {
      alignX /= neighbors;
      alignY /= neighbors;
      cohesionX = cohesionX / neighbors - position.x;
      cohesionY = cohesionY / neighbors - position.y;

      const alignLength = Math.hypot(alignX, alignY) || 0;
      if (alignLength > 0.0001) {
        const desiredAlignX = (alignX / alignLength) * desiredSpeed;
        const desiredAlignY = (alignY / alignLength) * desiredSpeed;
        const alignSteer = limitVector(
          desiredAlignX - velocity.x,
          desiredAlignY - velocity.y,
          boidMaxForce,
        );
        boidForceX += alignSteer.x * boidAlignmentWeight;
        boidForceY += alignSteer.y * boidAlignmentWeight;
      }

      const toCenterLength = Math.hypot(cohesionX, cohesionY) || 0;
      if (toCenterLength > 0.0001) {
        const desiredCohesionX = (cohesionX / toCenterLength) * desiredSpeed;
        const desiredCohesionY = (cohesionY / toCenterLength) * desiredSpeed;
        const cohesionSteer = limitVector(
          desiredCohesionX - velocity.x,
          desiredCohesionY - velocity.y,
          boidMaxForce,
        );
        boidForceX += cohesionSteer.x * boidCohesionWeight;
        boidForceY += cohesionSteer.y * boidCohesionWeight;
      }
    }

    if (separationSamples > 0) {
      const avgSeparationX = separationX / separationSamples;
      const avgSeparationY = separationY / separationSamples;
      const separationLength = Math.hypot(avgSeparationX, avgSeparationY) || 0;
      if (separationLength > 0.0001) {
        const desiredSeparationX =
          (avgSeparationX / separationLength) * desiredSpeed;
        const desiredSeparationY =
          (avgSeparationY / separationLength) * desiredSpeed;
        const separationSteer = limitVector(
          desiredSeparationX - velocity.x,
          desiredSeparationY - velocity.y,
          boidMaxForce,
        );
        boidForceX += separationSteer.x * boidSeparationWeight;
        boidForceY += separationSteer.y * boidSeparationWeight;
      }
    }

    const minX = -spriteWidth * 0.8;
    const maxX = canvas.width - spriteWidth * 0.2;
    const minY = 12;
    const maxY = canvas.height - spriteHeight - 8;
    const edgePushX =
      1 -
      clamp01((position.x - minX) / Math.max(1, edgeMargin)) -
      (1 - clamp01((maxX - position.x) / Math.max(1, edgeMargin)));
    const edgePushY =
      1 -
      clamp01((position.y - minY) / Math.max(1, edgeMargin)) -
      (1 - clamp01((maxY - position.y) / Math.max(1, edgeMargin)));
    const edgePushLength = Math.hypot(edgePushX, edgePushY);
    if (edgePushLength > 0.0001) {
      const desiredEdgeX = (edgePushX / edgePushLength) * desiredSpeed;
      const desiredEdgeY = (edgePushY / edgePushLength) * desiredSpeed;
      const edgeSteer = limitVector(
        desiredEdgeX - velocity.x,
        desiredEdgeY - velocity.y,
        edgeAvoidanceMaxForceBase * dt,
      );
      boidForceX += edgeSteer.x * boidEdgeAvoidanceWeight;
      boidForceY += edgeSteer.y * boidEdgeAvoidanceWeight;
    }

    const netBoidForce = limitVector(boidForceX, boidForceY, boidMaxForce * 2);
    velocity.x += netBoidForce.x;
    velocity.y += netBoidForce.y;

    velocity.x *= drag;
    velocity.y *= drag;

    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed > maxSpeed) {
      const ratio = maxSpeed / Math.max(0.0001, speed);
      velocity.x *= ratio;
      velocity.y *= ratio;
    } else if (speed < minSpeed) {
      const fallbackX =
        Math.abs(velocity.x) > 0.02 ? velocity.x : (nextRandom() - 0.5) * 2;
      const fallbackY =
        Math.abs(velocity.y) > 0.02 ? velocity.y : (nextRandom() - 0.5) * 2;
      const directionLength = Math.hypot(fallbackX, fallbackY) || 1;
      velocity.x = (fallbackX / directionLength) * minSpeed;
      velocity.y = (fallbackY / directionLength) * minSpeed;
    }

    position.x += velocity.x * dt;
    position.y += velocity.y * dt;

    const boundaryInwardSpeed = Math.max(minSpeed * 0.35, 0.12);
    if (position.x <= minX || position.x >= maxX) {
      position.x = Math.max(minX, Math.min(maxX, position.x));
      if (position.x <= minX) {
        velocity.x = Math.max(velocity.x, boundaryInwardSpeed);
      } else {
        velocity.x = Math.min(velocity.x, -boundaryInwardSpeed);
      }
    }
    if (position.y <= minY || position.y >= maxY) {
      position.y = Math.max(minY, Math.min(maxY, position.y));
      if (position.y <= minY) {
        velocity.y = Math.max(velocity.y, boundaryInwardSpeed);
      } else {
        velocity.y = Math.min(velocity.y, -boundaryInwardSpeed);
      }
    }
  }

  function startBeaverLogCycle({ profile, now, topSafeInset }) {
    const forage = profile?.logForage || {};
    const frame = forage.propFrame || { x: 32, y: 160, w: 32, h: 32 };
    const edgeInsetX = Math.max(20, Number(forage.edgeInsetX || 36));
    const edgeBandWidth = Math.max(56, Number(forage.edgeBandWidth || 120));
    const spawnBottomBandHeight = Math.max(
      40,
      Number(forage.bottomBandHeight || 96),
    );
    const bottomUiClearancePx = Math.max(
      0,
      Number(forage.bottomUiClearancePx || 74),
    );
    const spriteProbeWidth = Math.max(24, Number(lastBounds.width) || 64);
    const spriteProbeHeight = Math.max(24, Number(lastBounds.height) || 64);

    const minX = edgeInsetX;
    const maxX = Math.max(minX, canvas.width - edgeInsetX - frame.w);
    const leftBandMax = Math.min(maxX, edgeInsetX + edgeBandWidth);
    const rightBandMin = Math.max(minX, maxX - edgeBandWidth);
    const spawnBandMinY = Math.max(
      topSafeInset + 16,
      canvas.height - spawnBottomBandHeight - bottomUiClearancePx,
    );
    const spawnBandMaxY = Math.max(spawnBandMinY, canvas.height - 24 - frame.h);

    const useLeftBand = nextRandom() < 0.5;
    const logX = useLeftBand
      ? minX + nextRandom() * Math.max(0, leftBandMax - minX)
      : rightBandMin + nextRandom() * Math.max(0, maxX - rightBandMin);
    const logY =
      spawnBandMinY + nextRandom() * Math.max(0, spawnBandMaxY - spawnBandMinY);

    const departX = useLeftBand
      ? Math.max(minX, rightBandMin - spriteProbeWidth * 0.5)
      : Math.min(maxX, leftBandMax + spriteProbeWidth * 0.5);
    const departY = Math.max(
      topSafeInset + 12,
      Math.min(canvas.height - spriteProbeHeight - 12, logY - 8),
    );

    const fadeInDurationMs = Math.max(
      120,
      Math.round(pickInRange(forage.fadeInMs || [220, 460])),
    );

    beaverLogCycleProp = {
      frame,
      x: logX,
      y: logY,
      alpha: 0,
      fadeInStartedAt: now,
      fadeInUntil: now + fadeInDurationMs,
    };
    beaverLogCycleTarget = {
      x: logX,
      y: logY,
    };
    beaverLogCycleDepartTarget = {
      x: departX,
      y: departY,
    };
    beaverLogCyclePhase = "approach";
    beaverLogCycleActionKey = "movement-water";
    beaverLogCycleFadeStartedAt = 0;
    beaverLogCyclePhaseUntil =
      now +
      Math.max(
        2200,
        Math.round(pickInRange(forage.approachTimeoutMs || [3200, 5200])),
      );
  }

  function pickAnimationPoolVariant(petId, poolName, keys) {
    const normalizedKeys = Array.isArray(keys)
      ? keys.map((key) => String(key || "").trim()).filter(Boolean)
      : [];

    if (!normalizedKeys.length) {
      return "";
    }

    if (normalizedKeys.length === 1) {
      return normalizedKeys[0];
    }

    const petBucket = animationPoolStateByPet.get(petId) || new Map();
    const poolState = petBucket.get(poolName) || {
      index: -1,
      lastKey: "",
    };

    let nextIndex = (poolState.index + 1) % normalizedKeys.length;
    let candidate = normalizedKeys[nextIndex];
    if (candidate === poolState.lastKey) {
      nextIndex = (nextIndex + 1) % normalizedKeys.length;
      candidate = normalizedKeys[nextIndex];
    }

    petBucket.set(poolName, {
      index: nextIndex,
      lastKey: candidate,
    });
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
    if (typeof selectedAnimation?.locomotion === "boolean") {
      return selectedAnimation.locomotion;
    }

    const locomotionConfig = profile?.locomotion || {};
    const forceAllow = new Set(
      Array.isArray(locomotionConfig.forceAllowKeys)
        ? locomotionConfig.forceAllowKeys.map((key) => toActionKey(key))
        : [],
    );
    const forceDeny = new Set(
      Array.isArray(locomotionConfig.forceDenyKeys)
        ? locomotionConfig.forceDenyKeys.map((key) => toActionKey(key))
        : [],
    );

    const normalizedKey = toActionKey(selectedAnimationKey);
    const normalizedAction = toActionKey(currentAction);
    const normalizedCategory = toActionKey(currentCategory);

    if (forceDeny.has(normalizedKey) || forceDeny.has(normalizedAction)) {
      return false;
    }

    if (forceAllow.has(normalizedKey) || forceAllow.has(normalizedAction)) {
      return true;
    }

    if (normalizedCategory === "interaction") {
      return false;
    }

    if (normalizedCategory === "idle") {
      return false;
    }

    if (/movement|walk|run|swim|dash|flight|flap|glide/.test(normalizedKey)) {
      return true;
    }

    if (
      /movement|walk|run|swim|dash|flight|flap|glide/.test(normalizedAction)
    ) {
      return true;
    }

    if (/movement/.test(normalizedCategory)) {
      return true;
    }

    return false;
  }

  function reseedForPet(petId) {
    randomState =
      (hashStringSeed(`${petId}|${Date.now()}`) || 0x9e3779b9) >>> 0;
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

  function emitSceneEffectBurstCore({
    sceneEffectParticles,
    options = {},
    nextRandom,
    resolveValueRange,
  }) {
    const particles = Array.isArray(sceneEffectParticles)
      ? sceneEffectParticles.slice()
      : [];
    const count = Math.max(0, Math.round(Number(options.count ?? 0)));
    if (!count) {
      return particles;
    }

    const originX = Number(options.originX ?? 0);
    const originY = Number(options.originY ?? 0);
    const colorA = String(options.color || "#9dd8ea");
    const colorB = String(options.colorSecondary || colorA);
    const spreadX = options.spreadX || [0, 0];
    const spreadY = options.spreadY || [0, 0];
    const speedRange = options.speedRange || [10, 22];
    const angleRange = options.angleRange || [0, Math.PI * 2];
    const sizeRange = options.sizeRange || [1.6, 3.4];
    const lifeRange = options.lifeRange || [300, 760];
    const gravityRange = options.gravityRange || [0, 0];
    const dragRange = options.dragRange || [0.92, 0.98];
    const glyphs = Array.isArray(options.glyphs)
      ? options.glyphs.filter(Boolean)
      : null;

    for (let index = 0; index < count; index += 1) {
      const angle = resolveValueRange(angleRange, nextRandom());
      const speed = Math.max(0, resolveValueRange(speedRange, nextRandom()));
      const life = Math.max(60, resolveValueRange(lifeRange, nextRandom()));
      const drag = clamp01(resolveValueRange(dragRange, nextRandom()));
      const gravity = resolveValueRange(gravityRange, nextRandom());
      const size = Math.max(0.4, resolveValueRange(sizeRange, nextRandom()));
      const color = nextRandom() < 0.5 ? colorA : colorB;
      const glyph = glyphs?.length
        ? String(glyphs[Math.floor(nextRandom() * glyphs.length)] || "")
        : "";

      particles.push({
        x: originX + resolveValueRange(spreadX, nextRandom()),
        y: originY + resolveValueRange(spreadY, nextRandom()),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        life,
        lifeMax: life,
        drag: Math.max(0.75, drag),
        gravity,
        color,
        glyph,
      });
    }

    return particles;
  }

  function updateSceneEffectParticlesCore({ sceneEffectParticles, deltaMs }) {
    const particles = Array.isArray(sceneEffectParticles)
      ? sceneEffectParticles
      : [];
    if (!particles.length) {
      return [];
    }

    const dtSeconds = Math.max(0.001, Number(deltaMs || 16.67) / 1000);
    const updated = [];

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const nextLife = Number(particle.life || 0) - Number(deltaMs || 16.67);
      if (nextLife <= 0) {
        continue;
      }

      const drag = Math.max(0.75, Math.min(1, Number(particle.drag ?? 0.95)));
      const dragFactor = Math.pow(drag, dtSeconds * 60);
      const vx = Number(particle.vx || 0) * dragFactor;
      const vy =
        Number(particle.vy || 0) * dragFactor +
        Number(particle.gravity || 0) * dtSeconds;

      updated.push({
        ...particle,
        life: nextLife,
        vx,
        vy,
        x: Number(particle.x || 0) + vx * dtSeconds,
        y: Number(particle.y || 0) + vy * dtSeconds,
      });
    }

    return updated;
  }

  function drawSceneEffectParticlesCore({
    ctx,
    sceneEffectParticles,
    clamp01,
  }) {
    if (
      !ctx ||
      !Array.isArray(sceneEffectParticles) ||
      !sceneEffectParticles.length
    ) {
      return;
    }

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let index = 0; index < sceneEffectParticles.length; index += 1) {
      const particle = sceneEffectParticles[index];
      const lifeMax = Math.max(1, Number(particle.lifeMax || 1));
      const lifeRatio = clamp01(Number(particle.life || 0) / lifeMax);
      const alpha = clamp01(lifeRatio);
      if (alpha <= 0.01) {
        continue;
      }

      const x = Number(particle.x || 0);
      const y = Number(particle.y || 0);
      const size = Math.max(0.6, Number(particle.size || 1.6));
      const color = String(particle.color || "#9dd8ea");
      const glyph = String(particle.glyph || "").trim();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;

      if (glyph) {
        ctx.font = `${Math.max(9, size * 4)}px sans-serif`;
        ctx.fillText(glyph, x, y);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function emitSceneEffectBurst(options = {}) {
    sceneEffectParticles = emitSceneEffectBurstCore({
      sceneEffectParticles,
      options,
      nextRandom,
      resolveValueRange,
    });
  }

  function updateSceneEffectParticles(deltaMs) {
    sceneEffectParticles = updateSceneEffectParticlesCore({
      sceneEffectParticles,
      deltaMs,
    });
  }

  function drawSceneEffectParticles(ctx) {
    drawSceneEffectParticlesCore({ ctx, sceneEffectParticles, clamp01 });
  }

  function updateFishPathTrace({ enabled, x, y, now, config = {} }) {
    if (!enabled) {
      if (fishPathTracePoints.length) {
        fishPathTracePoints = [];
      }
      fishPathTraceLastAt = 0;
      return;
    }

    const pointX = Number(x);
    const pointY = Number(y);
    if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
      return;
    }

    const sampleEveryMs = Math.max(16, Number(config.sampleEveryMs ?? 32));
    const maxPoints = Math.max(20, Math.round(Number(config.maxPoints ?? 420)));
    if (
      fishPathTracePoints.length &&
      now - fishPathTraceLastAt < sampleEveryMs
    ) {
      return;
    }

    fishPathTraceLastAt = now;
    fishPathTracePoints.push({ x: pointX, y: pointY });
    if (fishPathTracePoints.length > maxPoints) {
      fishPathTracePoints.splice(0, fishPathTracePoints.length - maxPoints);
    }
  }

  function drawFishPathTrace(ctx, config = {}) {
    const points = fishPathTracePoints;
    if (!Array.isArray(points) || points.length < 2) {
      return;
    }

    const lineWidth = Math.max(1, Number(config.lineWidth ?? 2));
    const strokeColor = String(config.color || "rgba(157, 216, 234, 0.82)");
    const fadeTail = config.fadeTail !== false;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;

    if (fadeTail) {
      const totalSegments = points.length - 1;
      for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        const alphaRatio = index / Math.max(1, totalSegments);
        ctx.globalAlpha = clamp01(alphaRatio * 0.9);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        ctx.lineTo(points[index].x, points[index].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function updateFishFollowerPathTraces({
    enabled,
    followers,
    now,
    config = {},
    spriteWidth,
    spriteHeight,
  }) {
    if (!enabled || !Array.isArray(followers) || !followers.length) {
      if (fishFollowerPathTraces.length) {
        fishFollowerPathTraces = [];
      }
      return;
    }

    const sampleEveryMs = Math.max(
      12,
      Number(config.followerSampleEveryMs ?? config.sampleEveryMs ?? 32),
    );
    const maxPoints = Math.max(
      16,
      Math.round(Number(config.followerMaxPoints ?? config.maxPoints ?? 420)),
    );

    const tracesById = new Map(
      fishFollowerPathTraces
        .filter((trace) => Number.isFinite(trace?.id))
        .map((trace) => [trace.id, trace]),
    );
    const nextTraces = [];

    for (let index = 0; index < followers.length; index += 1) {
      const follower = followers[index];
      if (!Number.isFinite(follower.traceId)) {
        follower.traceId = ++fishFollowerTraceSeed;
      }
      const traceId = Number(follower.traceId);
      const trace = tracesById.get(traceId) || {
        id: traceId,
        points: [],
        lastAt: 0,
      };
      if (!trace) {
        continue;
      }

      if (
        trace.points.length &&
        now - Number(trace.lastAt || 0) < sampleEveryMs
      ) {
        continue;
      }

      const followerScale = Math.max(0.45, Number(follower?.scale || 0.78));
      const pointX =
        Number(follower?.x || 0) + spriteWidth * followerScale * 0.5;
      const pointY =
        Number(follower?.y || 0) + spriteHeight * followerScale * 0.5;
      if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
        continue;
      }

      trace.lastAt = now;
      trace.points.push({ x: pointX, y: pointY });
      if (trace.points.length > maxPoints) {
        trace.points.splice(0, trace.points.length - maxPoints);
      }

      nextTraces.push(trace);
    }

    fishFollowerPathTraces = nextTraces;
  }

  function drawFishFollowerPathTraces(ctx, config = {}) {
    if (
      !Array.isArray(fishFollowerPathTraces) ||
      !fishFollowerPathTraces.length
    ) {
      return;
    }

    const lineWidth = Math.max(1, Number(config.followerLineWidth ?? 1.4));
    const fadeTail = config.fadeTail !== false;
    const baseHue = Number(config.followerTraceBaseHue ?? 160);
    const hueSpread = Math.max(
      16,
      Number(config.followerTraceHueSpread ?? 130),
    );
    const alphaBase = clamp01(Number(config.followerTraceAlpha ?? 0.72));

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth;

    for (let index = 0; index < fishFollowerPathTraces.length; index += 1) {
      const points = fishFollowerPathTraces[index]?.points;
      if (!Array.isArray(points) || points.length < 2) {
        continue;
      }

      const hue =
        (baseHue +
          (index / Math.max(1, fishFollowerPathTraces.length)) * hueSpread) %
        360;
      ctx.strokeStyle = `hsla(${hue}, 78%, 70%, ${alphaBase})`;

      if (fadeTail) {
        const totalSegments = points.length - 1;
        for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
          const start = points[pointIndex - 1];
          const end = points[pointIndex];
          const alphaRatio = pointIndex / Math.max(1, totalSegments);
          ctx.globalAlpha = clamp01(alphaRatio * alphaBase);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = alphaBase;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
          ctx.lineTo(points[pointIndex].x, points[pointIndex].y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function relocateDuringSequence(topSafeInset) {
    const width = Math.max(24, Number(lastBounds.width) || 64);
    const height = Math.max(24, Number(lastBounds.height) || 64);
    const minX = 8;
    const minY = Math.max(8, topSafeInset + 8);
    const maxX = Math.max(minX, canvas.width - width - 8);
    const maxY = Math.max(minY, canvas.height - height - 8);

    let bestX = position.x;
    let bestY = position.y;
    let bestDistance = -1;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidateX = minX + nextRandom() * (maxX - minX);
      const candidateY = minY + nextRandom() * (maxY - minY);
      const dx = candidateX - position.x;
      const dy = candidateY - position.y;
      const distance = Math.hypot(dx, dy);

      if (distance > bestDistance) {
        bestDistance = distance;
        bestX = candidateX;
        bestY = candidateY;
      }
    }

    position.x = bestX;
    position.y = bestY;
    velocity.x = 0;
    velocity.y = 0;
    return bestDistance > 0 ? bestDistance : 0;
  }

  function advanceSequence(
    now,
    topSafeInset,
    environmentState,
    environmentDesiredState,
  ) {
    if (!sequenceState) {
      return;
    }

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
        const rule = PET_SEQUENCE_RULES[currentPetId];
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
        const relocateDistance = relocateDuringSequence(topSafeInset);
        stageDurationMs = resolveSequenceRelocateStageDurationMs({
          petId: currentPetId,
          stage,
          baseDurationMs: stageDurationMs,
          distance: relocateDistance,
          profile: getPetBehaviorProfile(currentPetId),
        });
      }
      sequenceState.stageEndsAt = now + stageDurationMs;
      sequenceHiddenStartedAt = stage?.hidden ? now : 0;
    }
  }

  function maybeStartSequence({
    now,
    petId,
    animationSet,
    forcedAnimationKey,
    isPetting,
    movementIntentByContext,
    currentSpeed,
    topSafeInset,
    routeZone,
    environmentState,
    environmentDesiredState,
  }) {
    if (!animationSet) {
      return;
    }

    if (forcedAnimationKey) {
      clearSequence();
      return;
    }

    if (sequenceState) {
      advanceSequence(
        now,
        topSafeInset,
        environmentState,
        environmentDesiredState,
      );
      return;
    }

    if (isPetting || movementIntentByContext || currentSpeed > 0.2) {
      return;
    }

    if (routeZone === PET_ROUTE_ZONES.LEFT_ASSIST) {
      return;
    }

    if (now < sequenceCooldownUntil || now < nextSequenceCheckAt) {
      return;
    }

    const rule = getRuleForPet(petId, animationSet);
    if (!rule) {
      nextSequenceCheckAt = now + 6000;
      return;
    }

    const checkDelay = Math.max(
      1200,
      Math.round(pickInRange(rule.checkWindowMs || [3000, 4500])),
    );
    nextSequenceCheckAt = now + checkDelay;

    if (nextRandom() > Number(rule.startChance || 0.35)) {
      return;
    }

    sequenceState = buildSequenceRuntime({
      rule,
      animationSet,
      now,
      petId,
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
      const relocateDistance = relocateDuringSequence(topSafeInset);
      const stageDurationMs = resolveSequenceRelocateStageDurationMs({
        petId,
        stage,
        baseDurationMs: Math.max(80, Number(stage?.durationMs) || 80),
        distance: relocateDistance,
        profile: getPetBehaviorProfile(petId),
      });
      sequenceState.stageEndsAt = now + stageDurationMs;
    }
  }

  function resizeCanvas() {
    const width = Math.max(320, window.innerWidth || 1280);
    const height = Math.max(220, window.innerHeight || 720);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function updateMotion(spriteWidth, spriteHeight, state, options = {}) {
    const motion = updateMotionState({
      spriteWidth,
      spriteHeight,
      state,
      options,
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

    return {
      allTenStepsCompleted: motion.allTenStepsCompleted,
    };
  }

  function render() {
    if (!running) {
      return;
    }

    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const nowPerf = performance.now();
      const deltaMs = Math.min(60, Math.max(8, nowPerf - lastFrameAt));
      lastFrameAt = nowPerf;
      updateSceneEffectParticles(deltaMs);

      const state = getState();
      if (state.selectedPetId !== currentPetId) {
        currentPetId = state.selectedPetId;
        reseedForPet(currentPetId);
        sequenceCooldownUntil = 0;
        nextSequenceCheckAt = 0;
        pendingMilestoneEmotionBursts = 0;
        sceneEffectParticles = [];
        beaverDiveSplashCooldownUntil = 0;
        ferretDirtNextAt = 0;
        birdWindNextAt = 0;
        birdLandingDustCooldownUntil = 0;
        fishBubbleNextAt = 0;
        fishTurnRippleCooldownUntil = 0;
        fishVariantSpeciesKey = "";
        fishSchoolTargetCount = 0;
        fishSchoolFollowers = [];
        fishFollowerTraceSeed = 0;
        fishVisualTiltRad = 0;
        fishPathTracePoints = [];
        fishPathTraceLastAt = 0;
        fishFollowerPathTraces = [];
        sleepZNextAt = 0;
        previousActionKey = "";
        previousVelocityX = velocity.x;
        playfulActionKey = "";
        playfulUntil = 0;
        nextPlayfulAt = 0;
        animationStateReason = "fallback";
        animationStatePriority = 0;
        animationStateUntil = 0;
        beaverLogCycleFadeStartedAt = 0;
        environmentState = "";
        environmentDesiredState = "";
        environmentTransitionState = null;
        resetBeaverLogCycle(getPetBehaviorProfile(currentPetId), Date.now());
        if (!animationPoolStateByPet.has(currentPetId)) {
          animationPoolStateByPet.set(currentPetId, new Map());
        }
        clearSequence();
      }

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
      const normalizedForcedActionKey = toActionKey(forcedAnimationKey);

      if (forceFreeze) {
        velocity.x = 0;
        velocity.y = 0;
      }

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
      const animationFrameDurationMultiplier = Math.max(
        0.75,
        Number(behaviorProfile?.animationFrameDurationMultiplier || 1),
      );
      frameDuration = Math.max(
        1,
        Math.round(frameDuration * animationFrameDurationMultiplier),
      );
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
      const currentlyMoving = currentSpeed > 0.12;
      const wantsMovement =
        !isPetting && (movementIntentByContext || currentlyMoving);

      const fishPetSelected = state.selectedPetId === "fish";
      if (!fishPetSelected) {
        fishVariantSpeciesKey = "";
        fishSchoolTargetCount = 0;
        fishSchoolFollowers = [];
      } else {
        const baseMovementPool = Array.isArray(
          behaviorProfile?.animationPools?.movement,
        )
          ? behaviorProfile.animationPools.movement
          : [];
        const validMovementPool = baseMovementPool.filter((key) =>
          hasAnimationFrames(animationSet, key),
        );

        const validSpecies = validMovementPool
          .map((key) => getFishSpeciesKey(key))
          .filter(Boolean);

        if (
          !fishVariantSpeciesKey ||
          !validSpecies.includes(fishVariantSpeciesKey)
        ) {
          const previousSpeciesKey = fishVariantSpeciesKey;
          fishVariantSpeciesKey = pickNextFishSpeciesKey(
            validSpecies,
            nextRandom,
          );

          if (fishVariantSpeciesKey !== previousSpeciesKey) {
            fishSchoolTargetCount = 0;
            fishSchoolFollowers = [];
          }
        }

        if (fishVariantSpeciesKey) {
          const keepScopedKeys = (keys = []) =>
            Array.from(
              new Set(
                (Array.isArray(keys) ? keys : []).filter(
                  (key) =>
                    getFishSpeciesKey(key) === fishVariantSpeciesKey &&
                    hasAnimationFrames(animationSet, key),
                ),
              ),
            );

          const scopedPools = behaviorProfile?.animationPools || {};

          behaviorProfile = {
            ...behaviorProfile,
            animationPools: {
              ...scopedPools,
              movement: keepScopedKeys(scopedPools.movement),
              idle: keepScopedKeys(scopedPools.idle),
              interaction: keepScopedKeys(scopedPools.interaction),
              celebration: keepScopedKeys(scopedPools.celebration),
            },
            playfulNature: {
              ...(behaviorProfile?.playfulNature || {}),
              actionKeys: keepScopedKeys(
                behaviorProfile?.playfulNature?.actionKeys,
              ),
            },
            taskCompletion: {
              ...(behaviorProfile?.taskCompletion || {}),
              actionKeys: keepScopedKeys(
                behaviorProfile?.taskCompletion?.actionKeys,
              ),
            },
          };
        }
      }

      if (fishPetSelected && fishOverridesEnabled && fishOverrides) {
        behaviorProfile = applyFishBehaviorOverrides(
          behaviorProfile,
          fishOverrides,
        );
      }

      const now = Date.now();
      const isBeaverSelected = state.selectedPetId === "beaver";
      const beaverForage = isBeaverSelected
        ? behaviorProfile?.logForage || null
        : null;
      const environmentConfig = getEnvironmentConfig(behaviorProfile);

      if (!isBeaverSelected || !beaverForage?.enabled) {
        beaverLogCyclePhase = "";
        beaverLogCycleActionKey = "";
        beaverLogCycleProp = null;
        beaverLogCycleTarget = null;
        beaverLogCycleDepartTarget = null;
        beaverLogCycleFadeStartedAt = 0;
      } else {
        if (!beaverLogCycleNextAt) {
          scheduleNextBeaverLogCycle(behaviorProfile, now);
        }

        const cycleBlocked =
          forceFreeze ||
          Boolean(forcedAnimationKey) ||
          isPetting ||
          Boolean(sequenceState);

        if (
          !beaverLogCyclePhase &&
          !cycleBlocked &&
          now >= beaverLogCycleNextAt
        ) {
          startBeaverLogCycle({
            profile: behaviorProfile,
            now,
            topSafeInset,
          });
        }

        if (beaverLogCyclePhase && beaverLogCycleTarget) {
          const spriteProbeWidth = Math.max(24, Number(lastBounds.width) || 64);
          const spriteProbeHeight = Math.max(
            24,
            Number(lastBounds.height) || 64,
          );
          const spriteCenterX = position.x + spriteProbeWidth * 0.5;
          const spriteCenterY = position.y + spriteProbeHeight * 0.5;
          const distanceToLog = Math.hypot(
            beaverLogCycleTarget.x - spriteCenterX,
            beaverLogCycleTarget.y - spriteCenterY,
          );
          const approachReachPx = Math.max(
            8,
            Number(beaverForage.approachReachPx || 12),
          );

          if (beaverLogCycleProp && beaverLogCyclePhase !== "fade") {
            const fadeInStartedAt = Number(
              beaverLogCycleProp.fadeInStartedAt || 0,
            );
            const fadeInUntil = Number(beaverLogCycleProp.fadeInUntil || 0);
            const fadeInDuration = Math.max(1, fadeInUntil - fadeInStartedAt);

            if (fadeInUntil > fadeInStartedAt && now < fadeInUntil) {
              const fadeInElapsed = Math.max(0, now - fadeInStartedAt);
              beaverLogCycleProp.alpha = clamp01(
                fadeInElapsed / fadeInDuration,
              );
            } else {
              beaverLogCycleProp.alpha = 1;
            }
          }

          if (beaverLogCyclePhase === "approach") {
            beaverLogCycleActionKey = "movement-water";
            if (distanceToLog <= approachReachPx) {
              beaverLogCyclePhase = "collect";
              beaverLogCycleActionKey = "idle-water";
              beaverLogCyclePhaseUntil =
                now +
                Math.max(
                  600,
                  Math.round(
                    pickInRange(beaverForage.collectHoldMs || [900, 1600]),
                  ),
                );
            } else if (now >= beaverLogCyclePhaseUntil) {
              beaverLogCyclePhaseUntil =
                now +
                Math.max(
                  900,
                  Math.round(
                    pickInRange(beaverForage.approachRetryMs || [900, 1600]),
                  ),
                );
            }
          } else if (beaverLogCyclePhase === "collect") {
            beaverLogCycleActionKey = "idle-water";
            if (now >= beaverLogCyclePhaseUntil) {
              beaverLogCyclePhase = "depart";
              beaverLogCycleActionKey = "movement-water-with-stick";
              beaverLogCyclePhaseUntil =
                now +
                Math.max(
                  1800,
                  Math.round(
                    pickInRange(beaverForage.departTimeoutMs || [2600, 4200]),
                  ),
                );
            }
          } else if (beaverLogCyclePhase === "depart") {
            beaverLogCycleActionKey = "movement-water-with-stick";
            const departDistance = beaverLogCycleDepartTarget
              ? Math.hypot(
                  beaverLogCycleDepartTarget.x - spriteCenterX,
                  beaverLogCycleDepartTarget.y - spriteCenterY,
                )
              : 999;

            if (departDistance <= 28 || now >= beaverLogCyclePhaseUntil) {
              beaverLogCyclePhase = "fade";
              beaverLogCycleActionKey = "movement-water-with-stick";
              beaverLogCycleFadeStartedAt = now;
              beaverLogCyclePhaseUntil =
                now +
                Math.max(
                  800,
                  Math.round(pickInRange(beaverForage.fadeMs || [1300, 2200])),
                );
            }
          } else if (beaverLogCyclePhase === "fade") {
            const fadeDuration = Math.max(
              1,
              beaverLogCyclePhaseUntil - beaverLogCycleFadeStartedAt,
            );
            if (beaverLogCycleProp) {
              const elapsed = Math.max(0, now - beaverLogCycleFadeStartedAt);
              beaverLogCycleProp.alpha = clamp01(1 - elapsed / fadeDuration);
            }

            if (now >= beaverLogCyclePhaseUntil) {
              resetBeaverLogCycle(behaviorProfile, now);
            }
          }
        }
      }

      if (!environmentConfig?.enabled) {
        environmentState = "";
        environmentDesiredState = "";
        environmentTransitionState = null;
      } else {
        const spriteProbeHeight = Math.max(24, Number(lastBounds.height) || 64);
        const centerY = position.y + spriteProbeHeight * 0.5;
        const initialEnvironment =
          normalizeEnvironmentKey(environmentState) ||
          normalizeEnvironmentKey(environmentConfig.initial);

        environmentDesiredState = resolveDesiredEnvironment({
          config: environmentConfig,
          currentEnvironment: environmentState,
          fallbackEnvironment: initialEnvironment,
          centerY,
          canvasHeight: canvas.height,
          beaverLogCyclePhase,
        });

        if (!environmentState) {
          environmentState = environmentDesiredState || initialEnvironment;
        }

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
          const transitionSpec = resolveEnvironmentTransitionSpec(
            environmentConfig,
            environmentState,
            environmentDesiredState,
          );
          const transitionAnimationKey = toActionKey(transitionSpec?.key);
          const transitionDurationMs = Math.max(
            280,
            Math.round(pickInRange(transitionSpec?.durationMs || [420, 760])),
          );

          const canUseTransitionAnimation =
            transitionAnimationKey &&
            hasAnimationFrames(animationSet, transitionAnimationKey) &&
            isAnimationSelectableOutsideSequence({
              petId: state.selectedPetId,
              key: transitionAnimationKey,
              sequenceState: null,
            });

          if (canUseTransitionAnimation) {
            environmentTransitionState = {
              from: environmentState,
              to: environmentDesiredState,
              key: transitionAnimationKey,
              endsAt: now + transitionDurationMs,
              forceMovement: Boolean(transitionSpec?.forceMovement),
            };
          } else {
            environmentState = environmentDesiredState;
          }
        }
      }

      if (!nextPlayfulAt) {
        scheduleNextPlayfulBeat(behaviorProfile, now);
      }

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
        !beaverLogCyclePhase &&
        now >= nextPlayfulAt
      ) {
        const playfulConfig = behaviorProfile?.playfulNature || {};
        const triggerChance = clamp01(
          Number(playfulConfig.activationChance ?? 0.65),
        );

        if (nextRandom() <= triggerChance) {
          const nextPlayfulKey = pickAnimationKeyFromCandidates(
            animationSet,
            playfulConfig.actionKeys,
          );
          if (
            nextPlayfulKey &&
            isAnimationSelectableOutsideSequence({
              petId: state.selectedPetId,
              key: nextPlayfulKey,
              sequenceState,
            })
          ) {
            playfulActionKey = nextPlayfulKey;
            playfulUntil =
              now +
              Math.max(
                500,
                Math.round(
                  pickInRange(playfulConfig.durationMs || [900, 1700]),
                ),
              );
          }
        }

        scheduleNextPlayfulBeat(behaviorProfile, now);
      }

      if (!beaverLogCyclePhase) {
        maybeStartSequence({
          now,
          petId: state.selectedPetId,
          animationSet,
          forcedAnimationKey,
          isPetting,
          movementIntentByContext:
            movementIntentByContext || Boolean(environmentTransitionState),
          currentSpeed,
          topSafeInset,
          routeZone,
          environmentState,
          environmentDesiredState,
        });
      }

      if (sequenceState) {
        const currentStage = sequenceState.stages?.[sequenceState.stageIndex];
        if (currentStage?.hidden) {
          if (!sequenceHiddenStartedAt) {
            sequenceHiddenStartedAt = now;
          }

          if (now - sequenceHiddenStartedAt > MAX_SEQUENCE_HIDDEN_STAGE_MS) {
            abortSequenceWithCooldown(now, 1800);
          }
        } else {
          sequenceHiddenStartedAt = 0;
        }
      }

      const activeStage = sequenceState
        ? sequenceState.stages[sequenceState.stageIndex]
        : null;
      const sequenceAnimationKey = String(activeStage?.animationKey || "");
      const sequenceHiddenStage = Boolean(activeStage?.hidden);
      const sequenceStageEnvironmentValid =
        !activeStage ||
        isSequenceStageEnvironmentValid({
          stage: activeStage,
          currentEnvironment: environmentState,
          desiredEnvironment: environmentDesiredState,
        });
      const canForceSequenceAnimation =
        sequenceStageEnvironmentValid &&
        Boolean(sequenceAnimationKey) &&
        Boolean(animationSet?.[sequenceAnimationKey]?.frames?.length);
      const environmentAllowedKeys = getEnvironmentAllowedKeys(
        environmentConfig,
        environmentState,
        toActionKey,
      );
      const transitionAnimationKey = toActionKey(
        environmentTransitionState?.key,
      );
      const canForceEnvironmentTransition =
        Boolean(transitionAnimationKey) &&
        hasAnimationFrames(animationSet, transitionAnimationKey) &&
        isAnimationSelectableOutsideSequence({
          petId: state.selectedPetId,
          key: transitionAnimationKey,
          sequenceState: null,
        });
      const environmentTransitionLockKey = canForceEnvironmentTransition
        ? transitionAnimationKey
        : "";

      const animationChoice = pickAnimationChoice(pet, animationSet, {
        toActionKey,
        allTenStepsCompleted,
        isMilestoneBoost: Date.now() < milestoneBoostUntil,
        isPetting: Date.now() < pettingUntil,
        wantsMovement,
        playfulActionKey: beaverLogCycleActionKey || playfulActionKey,
        animationPools: behaviorProfile?.animationPools || {},
        pickPoolKey: (poolName, keys) =>
          pickAnimationPoolVariant(state.selectedPetId, poolName, keys),
        isAnimationAllowed: (key) =>
          isAnimationSelectableOutsideSequence({
            petId: state.selectedPetId,
            key,
            sequenceState,
          }) &&
          (environmentTransitionLockKey
            ? key === environmentTransitionLockKey
            : !environmentAllowedKeys ||
              environmentAllowedKeys.has(toActionKey(key))),
      });

      const fallbackAnimationKeys = Array.from(
        new Set(
          (Array.isArray(pet?.frames) ? pet.frames : [])
            .map((item) => toActionKey(item?.action))
            .filter(Boolean),
        ),
      );
      const canForceFromFrames =
        Boolean(normalizedForcedActionKey) &&
        fallbackAnimationKeys.includes(normalizedForcedActionKey);

      const candidateAnimationKey =
        forcedAnimationKey && animationSet?.[forcedAnimationKey]
          ? forcedAnimationKey
          : canForceSequenceAnimation
            ? sequenceAnimationKey
            : canForceEnvironmentTransition
              ? transitionAnimationKey
              : canForceFromFrames
                ? normalizedForcedActionKey
                : animationChoice.key;
      const candidateAnimationReason =
        forcedAnimationKey && animationSet?.[forcedAnimationKey]
          ? "forced"
          : canForceSequenceAnimation
            ? `sequence:${sequenceState?.ruleId || "unknown"}:${activeStage?.name || "stage"}`
            : canForceEnvironmentTransition
              ? "environment-transition"
              : canForceFromFrames
                ? "forced-frame-action"
                : animationChoice.reason;

      const guardedCandidateAnimationKey =
        canForceSequenceAnimation ||
        isAnimationSelectableOutsideSequence({
          petId: state.selectedPetId,
          key: candidateAnimationKey,
          sequenceState,
        })
          ? candidateAnimationKey
          : animationChoice.key;

      const resolvedAnimationState = resolveAnimationState({
        now,
        candidateKey: guardedCandidateAnimationKey,
        candidateReason: candidateAnimationReason,
        animationSet,
        profile: behaviorProfile,
        pettingUntil,
        playfulUntil,
        activeAnimationKey,
        animationStateReason,
        animationStatePriority,
        animationStateUntil,
        hasAnimationFrames,
        toActionKey,
        estimateAnimationDurationMs,
      });
      animationStateReason = resolvedAnimationState.nextState.reason;
      animationStatePriority = resolvedAnimationState.nextState.priority;
      animationStateUntil = resolvedAnimationState.nextState.until;
      const selectedAnimationKey = resolvedAnimationState.key;
      const animationReason = resolvedAnimationState.reason;

      const selectedAnimation =
        selectedAnimationKey && animationSet
          ? animationSet[selectedAnimationKey]
          : null;

      const nextAnimationKey = selectedAnimationKey || "__fallback__";
      if (nextAnimationKey !== activeAnimationKey) {
        activeAnimationKey = nextAnimationKey;
        activeAnimationTick = 0;
      }

      const frameSource = selectedAnimation?.frames?.length
        ? selectedAnimation.frames
        : canForceFromFrames
          ? pet.frames.filter(
              (frameItem) =>
                toActionKey(frameItem?.action) === selectedAnimationKey,
            )
          : pet.frames;
      const frameSourceKind = selectedAnimation?.frames?.length
        ? "selected-animation"
        : canForceFromFrames
          ? "forced-frame-action"
          : "pet-frames";

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
      const safeFrameSourceKind =
        Array.isArray(frameSource) && frameSource.length
          ? frameSourceKind
          : Array.isArray(pet?.frames) && pet.frames.length
            ? "fallback-pet-frames"
            : "fallback-animation-frames";

      if (!safeFrameSource.length) {
        if (!forceFreeze) {
          frame += 1;
        }
        rafId = window.requestAnimationFrame(render);
        return;
      }

      const frameIndex = atlasEnabled
        ? resolveFrameIndexByTicks(
            safeFrameSource,
            activeAnimationTick,
            frameDuration,
            {
              holdOnLastFrame: Boolean(selectedAnimation?.holdOnLastFrame),
            },
          )
        : Math.floor(frame / frameDuration) % safeFrameSource.length;
      const sprite = safeFrameSource[frameIndex] || safeFrameSource[0];

      const scale = atlasEnabled ? DEFAULT_ATLAS_SCALE : 4;
      const tunedScale = scale * scaleMultiplier * PET_SIZE_MULTIPLIER;
      const spriteHeight = atlasEnabled
        ? (Number(sprite?.h) || 16) * tunedScale
        : sprite.length * tunedScale;
      const spriteWidth = atlasEnabled
        ? (Number(sprite?.w) || 16) * tunedScale
        : (sprite[0]?.length || 0) * tunedScale;

      const currentAction = String(
        sprite?.action || selectedAnimation?.title || "",
      ).toLowerCase();
      const currentActionKey = toActionKey(currentAction);
      const currentCategory = String(
        sprite?.category || selectedAnimation?.category || "",
      ).toLowerCase();
      const allowMovementByAnimation = atlasEnabled
        ? resolveAnimationLocomotion({
            selectedAnimation,
            selectedAnimationKey,
            currentCategory,
            currentAction,
            profile: behaviorProfile,
          })
        : true;

      const currentEnvironmentConfig =
        environmentConfig?.environments?.[environmentState] || null;
      const allowMovementByEnvironment =
        !environmentConfig?.enabled ||
        Boolean(environmentTransitionState?.forceMovement) ||
        currentEnvironmentConfig?.allowLocomotion !== false;

      const beaverCycleWantsMovement =
        beaverLogCyclePhase === "approach" ||
        beaverLogCyclePhase === "collect" ||
        beaverLogCyclePhase === "depart" ||
        beaverLogCyclePhase === "fade";
      const effectiveMovementIntent =
        wantsMovement ||
        beaverCycleWantsMovement ||
        Boolean(environmentTransitionState?.forceMovement);

      const movementActive =
        !forceFreeze &&
        !sequenceState &&
        allowMovementByEnvironment &&
        allowMovementByAnimation &&
        effectiveMovementIntent;
      const isFishSelected = state.selectedPetId === "fish";

      updateMotion(spriteWidth, spriteHeight, state, {
        allowMovement: isFishSelected ? false : movementActive,
        speedMultiplier,
        profile: behaviorProfile,
        overrideTarget:
          beaverLogCyclePhase === "approach" ||
          beaverLogCyclePhase === "collect"
            ? {
                x: beaverLogCycleTarget.x - spriteWidth * 0.5,
                y: beaverLogCycleTarget.y - spriteHeight * 0.5,
              }
            : beaverLogCyclePhase === "depart" || beaverLogCyclePhase === "fade"
              ? {
                  x: beaverLogCycleDepartTarget.x - spriteWidth * 0.5,
                  y: beaverLogCycleDepartTarget.y - spriteHeight * 0.5,
                }
              : null,
        overrideTargetPull:
          beaverLogCyclePhase === "approach" ? 0.0062 : 0.0038,
      });

      const shadow = pet.shadow || {};
      const airborneActions = Array.isArray(shadow.airborneActions)
        ? shadow.airborneActions.map((action) => toActionKey(action))
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

      let originX = Math.round(position.x);
      let originY = Math.round(position.y + bob);
      let schoolLeadX = Math.round(position.x);
      let schoolLeadY = Math.round(position.y);

      const fishSchoolConfig = behaviorProfile?.schooling || {};
      const fishBoidConfig = behaviorProfile?.boids || {};
      const fishPathTraceConfig = behaviorProfile?.effects?.pathTrace || {};
      const fishPathTraceEnabled =
        isFishSelected && fishPathTraceConfig.enabled !== false;
      if (isFishSelected) {
        ensureFishSchoolFollowers({
          originX: schoolLeadX,
          originY: schoolLeadY,
          spriteWidth,
          schoolConfig: fishSchoolConfig,
          boidConfig: fishBoidConfig,
        });

        updateLeadFishWithBoids({
          spriteWidth,
          spriteHeight,
          deltaMs,
          boidConfig: fishBoidConfig,
        });

        schoolLeadX = Math.round(position.x);
        schoolLeadY = Math.round(position.y);
        originX = schoolLeadX;
        originY = Math.round(position.y + bob);

        updateFishSchoolFollowers({
          leadX: schoolLeadX,
          leadY: schoolLeadY,
          leadVX: velocity.x,
          leadVY: velocity.y,
          spriteWidth,
          spriteHeight,
          deltaMs,
          boidConfig: fishBoidConfig,
        });

        updateFishPathTrace({
          enabled: fishPathTraceEnabled,
          x: schoolLeadX + spriteWidth * 0.5,
          y: schoolLeadY + spriteHeight * 0.5,
          now,
          config: fishPathTraceConfig,
        });

        updateFishFollowerPathTraces({
          enabled: fishPathTraceEnabled,
          followers: fishSchoolFollowers,
          now,
          config: fishPathTraceConfig,
          spriteWidth,
          spriteHeight,
        });
      } else if (fishSchoolFollowers.length) {
        fishSchoolTargetCount = 0;
        fishSchoolFollowers = [];
        fishFollowerTraceSeed = 0;
      }

      if (!isFishSelected && fishPathTracePoints.length) {
        fishPathTracePoints = [];
        fishPathTraceLastAt = 0;
      }

      if (!isFishSelected && fishFollowerPathTraces.length) {
        fishFollowerPathTraces = [];
      }

      const beaverDiveSplashConfig = behaviorProfile?.effects?.diveSplash || {};
      const sleepZConfig = behaviorProfile?.effects?.sleepZ || {};
      const isSleepAction = /(^|-)sleep($|-)|snooze|nap/.test(currentActionKey);
      if (
        sleepZConfig.enabled !== false &&
        isSleepAction &&
        !movementActive &&
        now >= sleepZNextAt
      ) {
        emitSceneEffectBurst({
          count: Number(sleepZConfig.count || 2),
          originX: originX + spriteWidth * 0.5,
          originY: originY + spriteHeight * 0.12,
          color: String(sleepZConfig.color || "#8a6fe8"),
          colorSecondary: String(sleepZConfig.colorSecondary || "#c5b8f8"),
          glyphs: Array.isArray(sleepZConfig.glyphs)
            ? sleepZConfig.glyphs
            : ["z", "Z"],
          speedRange: sleepZConfig.speedRange || [8, 22],
          sizeRange: sleepZConfig.sizeRange || [4, 7],
          lifeRange: sleepZConfig.lifeRange || [760, 1560],
          gravityRange: sleepZConfig.gravityRange || [-22, -8],
          dragRange: sleepZConfig.dragRange || [0.95, 0.985],
          spreadX: sleepZConfig.spreadX || [-8, 8],
          spreadY: sleepZConfig.spreadY || [-4, 2],
          angleRange: sleepZConfig.angleRange || [
            -Math.PI * 0.7,
            -Math.PI * 0.3,
          ],
        });

        sleepZNextAt =
          now +
          Math.max(
            150,
            Math.round(pickInRange(sleepZConfig.intervalMs || [460, 820])),
          );
      }

      if (
        state.selectedPetId === "beaver" &&
        beaverDiveSplashConfig.enabled !== false &&
        currentActionKey === "dive" &&
        activeAnimationTick <= 1 &&
        now >= beaverDiveSplashCooldownUntil
      ) {
        const splashOriginYOffsetRatio = Math.max(
          0,
          Math.min(
            1.4,
            Number(beaverDiveSplashConfig.originYOffsetRatio ?? 0.82),
          ),
        );
        emitSceneEffectBurst({
          count: Number(beaverDiveSplashConfig.count || 14),
          originX: originX + spriteWidth * 0.5,
          originY: originY + spriteHeight * splashOriginYOffsetRatio,
          color: String(beaverDiveSplashConfig.color || "#5da8c6"),
          colorSecondary: String(
            beaverDiveSplashConfig.colorSecondary || "#9ad0e4",
          ),
          speedRange: beaverDiveSplashConfig.speedRange || [34, 94],
          sizeRange: beaverDiveSplashConfig.sizeRange || [2, 5],
          lifeRange: beaverDiveSplashConfig.lifeRange || [360, 860],
          gravityRange: beaverDiveSplashConfig.gravityRange || [160, 280],
          dragRange: beaverDiveSplashConfig.dragRange || [0.88, 0.95],
          spreadX: beaverDiveSplashConfig.spreadX || [-14, 14],
          spreadY: beaverDiveSplashConfig.spreadY || [-3, 5],
          angleRange: beaverDiveSplashConfig.angleRange || [
            -Math.PI * 0.95,
            -Math.PI * 0.05,
          ],
        });
        beaverDiveSplashCooldownUntil =
          now + Math.max(220, Number(beaverDiveSplashConfig.cooldownMs || 560));
      }

      const ferretDirtConfig = behaviorProfile?.effects?.digDirt || {};
      if (
        state.selectedPetId === "ferret" &&
        ferretDirtConfig.enabled !== false &&
        /dig|disappear|emerge/.test(currentActionKey) &&
        now >= ferretDirtNextAt
      ) {
        emitSceneEffectBurst({
          count: Number(ferretDirtConfig.count || 7),
          originX: originX + spriteWidth * 0.5,
          originY: originY + spriteHeight * 0.86,
          color: String(ferretDirtConfig.color || "#8d6b4e"),
          colorSecondary: String(ferretDirtConfig.colorSecondary || "#b3906f"),
          speedRange: ferretDirtConfig.speedRange || [24, 76],
          sizeRange: ferretDirtConfig.sizeRange || [2.2, 5.8],
          lifeRange: ferretDirtConfig.lifeRange || [420, 1020],
          gravityRange: ferretDirtConfig.gravityRange || [200, 330],
          dragRange: ferretDirtConfig.dragRange || [0.9, 0.96],
          spreadX: ferretDirtConfig.spreadX || [-10, 10],
          spreadY: ferretDirtConfig.spreadY || [-2, 4],
          angleRange: ferretDirtConfig.angleRange || [
            -Math.PI * 0.9,
            -Math.PI * 0.1,
          ],
        });

        ferretDirtNextAt =
          now +
          Math.max(
            80,
            Math.round(pickInRange(ferretDirtConfig.intervalMs || [120, 220])),
          );
      }

      const isBirdSelected =
        state.selectedPetId === "seagull" || state.selectedPetId === "pidgeon";
      const birdWindConfig = behaviorProfile?.effects?.windTrail || {};
      const birdLandingConfig = behaviorProfile?.effects?.landingDust || {};
      const isBirdAirborneAction = /flight|flap|glide/.test(currentActionKey);
      const wasBirdAirborneAction = /flight|flap|glide/.test(previousActionKey);
      const isBirdIdleAction = /^idle($|-)/.test(currentActionKey);

      if (
        isBirdSelected &&
        birdWindConfig.enabled !== false &&
        isBirdAirborneAction &&
        movementActive &&
        now >= birdWindNextAt
      ) {
        const directionSign = facingDirection === "left" ? 1 : -1;
        emitSceneEffectBurst({
          count: Number(birdWindConfig.count || 5),
          originX: originX + spriteWidth * (directionSign < 0 ? 0.18 : 0.82),
          originY: originY + spriteHeight * 0.45,
          color: String(birdWindConfig.color || "#d8ecf7"),
          colorSecondary: String(birdWindConfig.colorSecondary || "#bfe2f3"),
          speedRange: birdWindConfig.speedRange || [16, 42],
          sizeRange: birdWindConfig.sizeRange || [1.8, 3.6],
          lifeRange: birdWindConfig.lifeRange || [220, 520],
          gravityRange: birdWindConfig.gravityRange || [18, 60],
          dragRange: birdWindConfig.dragRange || [0.9, 0.96],
          spreadX: birdWindConfig.spreadX || [-6, 6],
          spreadY: birdWindConfig.spreadY || [-4, 4],
          angleRange:
            directionSign < 0
              ? [-Math.PI * 0.05, Math.PI * 0.18]
              : [Math.PI * 0.82, Math.PI * 1.05],
        });

        birdWindNextAt =
          now +
          Math.max(
            80,
            Math.round(pickInRange(birdWindConfig.intervalMs || [120, 200])),
          );
      }

      if (
        isBirdSelected &&
        birdLandingConfig.enabled !== false &&
        now >= birdLandingDustCooldownUntil &&
        wasBirdAirborneAction &&
        isBirdIdleAction &&
        activeAnimationTick <= 1
      ) {
        emitSceneEffectBurst({
          count: Number(birdLandingConfig.count || 7),
          originX: originX + spriteWidth * 0.5,
          originY: originY + spriteHeight * 0.92,
          color: String(birdLandingConfig.color || "#d9c9ad"),
          colorSecondary: String(birdLandingConfig.colorSecondary || "#efe1c9"),
          speedRange: birdLandingConfig.speedRange || [20, 56],
          sizeRange: birdLandingConfig.sizeRange || [1.8, 4.2],
          lifeRange: birdLandingConfig.lifeRange || [280, 760],
          gravityRange: birdLandingConfig.gravityRange || [180, 290],
          dragRange: birdLandingConfig.dragRange || [0.9, 0.96],
          spreadX: birdLandingConfig.spreadX || [-10, 10],
          spreadY: birdLandingConfig.spreadY || [-2, 2],
          angleRange: birdLandingConfig.angleRange || [
            -Math.PI * 0.95,
            -Math.PI * 0.05,
          ],
        });

        birdLandingDustCooldownUntil =
          now + Math.max(300, Number(birdLandingConfig.cooldownMs || 760));
      }

      const fishEffects = behaviorProfile?.effects || {};
      const fishBubbleConfig = fishEffects.bubbleTrail || {};
      const fishRippleConfig = fishEffects.turnRipple || {};
      const isFishMovementAction = /movement/.test(currentActionKey);

      if (
        isFishSelected &&
        fishBubbleConfig.enabled !== false &&
        movementActive &&
        isFishMovementAction &&
        now >= fishBubbleNextAt
      ) {
        emitSceneEffectBurst({
          count: Number(fishBubbleConfig.count || 4),
          originX: originX + spriteWidth * 0.35,
          originY: originY + spriteHeight * 0.68,
          color: String(fishBubbleConfig.color || "#9dd8ea"),
          colorSecondary: String(fishBubbleConfig.colorSecondary || "#d3f0fb"),
          speedRange: fishBubbleConfig.speedRange || [12, 30],
          sizeRange: fishBubbleConfig.sizeRange || [1.4, 3],
          lifeRange: fishBubbleConfig.lifeRange || [520, 1200],
          gravityRange: fishBubbleConfig.gravityRange || [-45, -15],
          dragRange: fishBubbleConfig.dragRange || [0.92, 0.98],
          spreadX: fishBubbleConfig.spreadX || [-8, 8],
          spreadY: fishBubbleConfig.spreadY || [-2, 3],
          angleRange: fishBubbleConfig.angleRange || [
            -Math.PI * 0.7,
            -Math.PI * 0.3,
          ],
        });

        fishBubbleNextAt =
          now +
          Math.max(
            80,
            Math.round(pickInRange(fishBubbleConfig.intervalMs || [130, 220])),
          );

        const followerBubbleInterval = fishBubbleConfig.followerIntervalMs || [
          260, 520,
        ];
        const followerBubbleCount = Math.max(
          1,
          Math.round(Number(fishBubbleConfig.followerCount || 2)),
        );

        for (const follower of fishSchoolFollowers) {
          if (now < Number(follower?.bubbleNextAt || 0)) {
            continue;
          }

          const followerScale = Math.max(0.55, Number(follower?.scale || 0.78));
          emitSceneEffectBurst({
            count: followerBubbleCount,
            originX:
              Number(follower?.x || originX) +
              spriteWidth * followerScale * 0.35,
            originY:
              Number(follower?.y || originY) +
              spriteHeight * followerScale * 0.68,
            color: String(fishBubbleConfig.color || "#9dd8ea"),
            colorSecondary: String(
              fishBubbleConfig.colorSecondary || "#d3f0fb",
            ),
            speedRange: fishBubbleConfig.followerSpeedRange || [10, 24],
            sizeRange: fishBubbleConfig.followerSizeRange || [1.1, 2.3],
            lifeRange: fishBubbleConfig.followerLifeRange || [460, 980],
            gravityRange: fishBubbleConfig.gravityRange || [-45, -15],
            dragRange: fishBubbleConfig.dragRange || [0.92, 0.98],
            spreadX: fishBubbleConfig.followerSpreadX || [-6, 6],
            spreadY: fishBubbleConfig.followerSpreadY || [-2, 2],
            angleRange: fishBubbleConfig.angleRange || [
              -Math.PI * 0.7,
              -Math.PI * 0.3,
            ],
          });

          follower.bubbleNextAt =
            now +
            Math.max(140, Math.round(pickInRange(followerBubbleInterval)));
        }
      }

      const pivotDetected =
        Math.abs(previousVelocityX) > 0.08 &&
        Math.abs(velocity.x) > 0.08 &&
        Math.sign(previousVelocityX) !== Math.sign(velocity.x);

      if (
        isFishSelected &&
        fishRippleConfig.enabled !== false &&
        pivotDetected &&
        now >= fishTurnRippleCooldownUntil
      ) {
        emitSceneEffectBurst({
          count: Number(fishRippleConfig.count || 8),
          originX: originX + spriteWidth * 0.5,
          originY: originY + spriteHeight * 0.56,
          color: String(fishRippleConfig.color || "#7ec7de"),
          colorSecondary: String(fishRippleConfig.colorSecondary || "#b5e3f2"),
          speedRange: fishRippleConfig.speedRange || [18, 52],
          sizeRange: fishRippleConfig.sizeRange || [1.6, 3.8],
          lifeRange: fishRippleConfig.lifeRange || [260, 620],
          gravityRange: fishRippleConfig.gravityRange || [0, 24],
          dragRange: fishRippleConfig.dragRange || [0.9, 0.96],
          spreadX: fishRippleConfig.spreadX || [-6, 6],
          spreadY: fishRippleConfig.spreadY || [-3, 3],
          angleRange:
            previousVelocityX > 0
              ? [Math.PI * 0.65, Math.PI * 1.1]
              : [-Math.PI * 0.1, Math.PI * 0.35],
        });

        fishTurnRippleCooldownUntil =
          now + Math.max(220, Number(fishRippleConfig.cooldownMs || 520));
      }

      if (pendingMilestoneEmotionBursts > 0) {
        if (!isPetting && !sequenceState && !forceFreeze) {
          const taskCompletionConfig = behaviorProfile?.taskCompletion || {};
          const triggerChance = clamp01(
            Number(taskCompletionConfig.triggerChance ?? 0.9),
          );

          if (nextRandom() <= triggerChance) {
            const taskActionKey = pickAnimationKeyFromCandidates(
              animationSet,
              taskCompletionConfig.actionKeys,
            );

            if (
              taskActionKey &&
              isAnimationSelectableOutsideSequence({
                petId: state.selectedPetId,
                key: taskActionKey,
                sequenceState,
              })
            ) {
              playfulActionKey = taskActionKey;
              playfulUntil =
                now +
                Math.max(
                  700,
                  Math.round(
                    pickInRange(
                      taskCompletionConfig.durationMs || [1100, 2200],
                    ),
                  ),
                );
              scheduleNextPlayfulBeat(behaviorProfile, now);
            }
          }
        }

        pendingMilestoneEmotionBursts = 0;
      }

      if (velocity.x > 0.08) {
        facingDirection = "right";
      } else if (velocity.x < -0.08) {
        facingDirection = "left";
      }

      const fishTiltEnabled = isFishSelected;
      const fishTiltMaxRad = Math.max(
        0,
        Math.min(Math.PI * 0.5, (24 * Math.PI) / 180),
      );
      const fishTiltSmoothing = 0.24;
      const fishTiltMinSpeed = 0.24;
      const fishFollowerTiltScale = 0.85;

      let leadFishTiltRad = 0;
      if (fishTiltEnabled) {
        const leadSpeed = Math.hypot(velocity.x, velocity.y);
        const leadRawTilt =
          leadSpeed >= fishTiltMinSpeed
            ? Math.atan2(velocity.y, Math.max(Math.abs(velocity.x), 0.0001))
            : 0;
        const leadClampedTilt = Math.max(
          -fishTiltMaxRad,
          Math.min(fishTiltMaxRad, leadRawTilt),
        );
        fishVisualTiltRad = lerp(
          fishVisualTiltRad,
          leadClampedTilt,
          fishTiltSmoothing || 0.24,
        );
        leadFishTiltRad = fishVisualTiltRad;
      } else {
        fishVisualTiltRad = lerp(fishVisualTiltRad, 0, 0.32);
      }

      lastBounds = {
        x: originX,
        y: originY,
        width: spriteWidth,
        height: spriteHeight,
      };

      const atlasImage = atlasEnabled ? getAtlasImage(pet?.atlas?.src) : null;
      const frameMetrics =
        atlasEnabled && atlasImage?.complete
          ? getAtlasFrameMetrics(atlasImage, sprite, pet?.atlas?.src)
          : null;

      let targetLift = isAirborneAction ? 1 : 0;
      if (isJumpAction) {
        const jumpSpan = Math.max(1, safeFrameSource.length - 1);
        const jumpPhase = (frameIndex % (jumpSpan + 1)) / jumpSpan;
        const jumpArc = Math.sin(jumpPhase * Math.PI);
        targetLift = Math.max(targetLift, jumpArc);
      }

      if (forceFreeze) {
        targetLift = shadowLift;
      }

      const transitionSpeed = clamp01(shadow.transitionSpeed ?? 0.18);
      shadowLift = lerp(shadowLift, targetLift, transitionSpeed || 0.18);

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

      const groundedWidth = Math.max(14, visibleWidth - groundWidthPad);
      const airborneWidthRaw = Math.max(10, visibleWidth - airborneWidthPad);
      const airborneWidth = Math.min(airborneWidthRaw, groundedWidth * 0.75);

      const shadowOffset = lerp(groundOffset, airborneOffset, shadowLift);
      const shadowWidth = lerp(groundedWidth, airborneWidth, shadowLift);
      const shadowX = Math.round(originX + visibleCenterX - shadowWidth / 2);
      const shadowY = Math.round(
        originY + visibleBottom + shadowOffset + shadowOffsetAdjust,
      );

      if (!sequenceHiddenStage) {
        if (fishPathTraceEnabled) {
          drawFishFollowerPathTraces(ctx, fishPathTraceConfig);
          drawFishPathTrace(ctx, fishPathTraceConfig);
        }

        ctx.fillStyle = highContrastShadow
          ? `rgba(255, 255, 255, ${shadowAlpha})`
          : `rgba(2, 6, 23, ${shadowAlpha})`;
        ctx.fillRect(shadowX, shadowY, shadowWidth, 4);

        if (
          isBeaverSelected &&
          beaverLogCycleProp &&
          beaverLogCycleProp.alpha > 0.01 &&
          atlasImage?.complete
        ) {
          const frameRect = beaverLogCycleProp.frame || {
            x: 32,
            y: 160,
            w: 32,
            h: 32,
          };
          const propScale = tunedScale * 0.95;
          const propW = (Number(frameRect.w) || 32) * propScale;
          const propH = (Number(frameRect.h) || 32) * propScale;

          ctx.save();
          ctx.globalAlpha = clamp01(beaverLogCycleProp.alpha);
          ctx.drawImage(
            atlasImage,
            Number(frameRect.x) || 32,
            Number(frameRect.y) || 160,
            Number(frameRect.w) || 32,
            Number(frameRect.h) || 32,
            Math.round(beaverLogCycleProp.x - propW / 2),
            Math.round(beaverLogCycleProp.y - propH / 2),
            propW,
            propH,
          );
          ctx.restore();
        }

        if (atlasEnabled) {
          const defaultFacing = String(
            pet?.atlas?.facing || "right",
          ).toLowerCase();
          const flipHorizontal =
            (defaultFacing === "right" && facingDirection === "left") ||
            (defaultFacing === "left" && facingDirection === "right");
          if (atlasImage?.complete) {
            const leadRenderTilt = flipHorizontal
              ? -leadFishTiltRad
              : leadFishTiltRad;
            if (fishTiltEnabled) {
              drawAtlasFrameTransformed(
                ctx,
                atlasImage,
                sprite,
                originX,
                originY,
                tunedScale,
                {
                  flipHorizontal,
                  rotationRad: leadRenderTilt,
                },
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

            if (isFishSelected && fishSchoolFollowers.length) {
              const schoolRenderOrder = fishSchoolFollowers
                .slice()
                .sort((left, right) => left.y - right.y);
              for (const follower of schoolRenderOrder) {
                const followerFrameIndex = resolveFrameIndexByTicks(
                  safeFrameSource,
                  activeAnimationTick + follower.frameOffset,
                  frameDuration,
                );
                const followerSprite =
                  safeFrameSource[followerFrameIndex] || safeFrameSource[0];
                const followerVelocityX = Number(follower.vx ?? 0);
                const followerVelocityY = Number(follower.vy ?? 0);
                const followerVelocitySpeed = Math.hypot(
                  followerVelocityX,
                  followerVelocityY,
                );
                const followerPathHeadingX = Number(
                  follower.facingVX ?? followerVelocityX,
                );
                const followerPathHeadingY = Number(
                  follower.facingVY ?? followerVelocityY,
                );
                const followerHeadingX =
                  followerVelocitySpeed > 0.03
                    ? followerVelocityX
                    : followerPathHeadingX;
                const followerHeadingY =
                  followerVelocitySpeed > 0.03
                    ? followerVelocityY
                    : followerPathHeadingY;
                const followerFacingDirection =
                  followerHeadingX < -0.03
                    ? "left"
                    : followerHeadingX > 0.03
                      ? "right"
                      : followerPathHeadingX < -0.03
                        ? "left"
                        : followerPathHeadingX > 0.03
                          ? "right"
                          : facingDirection;
                const followerFlip =
                  (defaultFacing === "right" &&
                    followerFacingDirection === "left") ||
                  (defaultFacing === "left" &&
                    followerFacingDirection === "right");
                const followerScale = tunedScale * follower.scale;
                const followerTiltSourceX =
                  followerVelocitySpeed >= fishTiltMinSpeed
                    ? followerVelocityX
                    : followerHeadingX;
                const followerTiltSourceY =
                  followerVelocitySpeed >= fishTiltMinSpeed
                    ? followerVelocityY
                    : followerHeadingY;
                const followerRawTilt = Math.atan2(
                  followerTiltSourceY,
                  Math.max(Math.abs(followerTiltSourceX), 0.0001),
                );
                const followerTiltRad = Math.max(
                  -fishTiltMaxRad,
                  Math.min(fishTiltMaxRad, followerRawTilt),
                );
                const followerRenderTilt = fishTiltEnabled
                  ? (followerFlip ? -1 : 1) *
                    followerTiltRad *
                    fishFollowerTiltScale
                  : 0;

                if (fishTiltEnabled) {
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
                } else {
                  drawAtlasFrame(
                    ctx,
                    atlasImage,
                    followerSprite,
                    Math.round(follower.x),
                    Math.round(
                      follower.y +
                        Math.sin((frame + follower.frameOffset) / 14) * 1.6,
                    ),
                    followerScale,
                    followerFlip,
                  );
                }
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

      drawSceneEffectParticles(ctx);

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
          frameSourceKind: safeFrameSourceKind,
          forcedAnimationKey: forcedAnimationKey || null,
          baseSpeedMultiplier: BASE_PET_SPEED_MULTIPLIER,
          baseAtlasScale: DEFAULT_ATLAS_SCALE,
          effectiveSpeedMultiplier: Number(speedMultiplier.toFixed(3)),
          effectiveScale: Number(tunedScale.toFixed(3)),
          sequence: sequenceState
            ? `${sequenceState.ruleId}:${activeStage?.name || "stage"}`
            : "none",
          environment: {
            current: environmentState || null,
            desired: environmentDesiredState || null,
            transition: environmentTransitionState
              ? {
                  from: environmentTransitionState.from,
                  to: environmentTransitionState.to,
                  key: environmentTransitionState.key,
                }
              : null,
          },
          sequenceHidden: sequenceHiddenStage,
          position: {
            x: Math.round(position.x),
            y: Math.round(position.y),
          },
        });
      }

      if (!forceFreeze) {
        activeAnimationTick += 1;
      }
      previousActionKey = currentActionKey;
      previousVelocityX = velocity.x;
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
