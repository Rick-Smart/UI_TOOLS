import { PET_CATALOG } from "./petCatalog.js";
import { getPetBehaviorProfile } from "./pets/index.js";
import {
  drawAtlasFrame,
  drawHeart,
  drawPixelSprite,
  drawSparkle,
} from "./core/rendering.js";
import { PET_ROUTE_ZONES, resolveRouteZone } from "./behaviors/zones.js";

const CHECKLIST_MILESTONES = [3, 6, 10];
const DEFAULT_PET_ID = Object.keys(PET_CATALOG)[0];
const BASE_PET_SPEED_MULTIPLIER = 0.5;
const DEFAULT_ATLAS_SCALE = 1.5;
const SEQUENCE_STAGE_TICK_MS = 1000 / 60;
const EMOTION_SHEET_SRC =
  "/agent-pet/imports/emotions/emotionIcons_PaperPluto_demo.png";
const ATLAS_IMAGE_CACHE = new Map();
const ATLAS_FRAME_METRICS_CACHE = new Map();
const EMOTION_ICON_REGIONS_CACHE = new Map();
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
const PET_SEQUENCE_RULES = {
  ferret: {
    id: "burrow-hop",
    startChance: 0.64,
    checkWindowMs: [1800, 3000],
    cooldownMs: [6500, 10500],
    stages: [
      { name: "dig", animationKey: "dig", loops: [2, 3] },
      { name: "disappear", animationKey: "disappear", loops: 1 },
      { name: "travel", hidden: true, holdMs: [320, 780], relocate: true },
      { name: "emerge", animationKey: "emerge", loops: [1, 2] },
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
      { name: "dive", animationKey: "dive", loops: [2, 3] },
      { name: "travel", hidden: true, holdMs: [700, 1700], relocate: true },
      { name: "ascent", animationKey: "ascent", loops: [2, 3] },
    ],
  },
};

const EMOTION_THEME_GROUPS = {
  positive: [0, 1, 2, 3],
  neutral: [3, 4, 5],
  negative: [6, 7, 8],
};

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

function resolveFrameIndexByTicks(frames, tickCount, defaultDuration = 6) {
  if (!Array.isArray(frames) || !frames.length) {
    return 0;
  }

  const totalTicks = frames.reduce(
    (sum, frameRect) =>
      sum + Math.max(1, Number(frameRect?.ticks) || defaultDuration),
    0,
  );

  if (!totalTicks) {
    return 0;
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

  const cached = ATLAS_IMAGE_CACHE.get(src);
  if (cached) {
    return cached;
  }

  const image = new Image();
  image.src = src;
  ATLAS_IMAGE_CACHE.set(src, image);
  return image;
}

function detectEmotionIconRegions(image, src) {
  if (!image?.complete || !src) {
    return [];
  }

  const cached = EMOTION_ICON_REGIONS_CACHE.get(src);
  if (cached) {
    return cached;
  }

  const width = Math.max(1, Number(image.naturalWidth || image.width || 0));
  const height = Math.max(1, Number(image.naturalHeight || image.height || 0));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height).data;
  const visited = new Uint8Array(width * height);
  const regions = [];
  const alphaThreshold = 18;

  function indexAt(x, y) {
    return y * width + x;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const baseIndex = indexAt(x, y);
      if (visited[baseIndex]) {
        continue;
      }

      const alpha = imageData[baseIndex * 4 + 3];
      if (alpha < alphaThreshold) {
        visited[baseIndex] = 1;
        continue;
      }

      const stack = [[x, y]];
      visited[baseIndex] = 1;

      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      let pixelCount = 0;

      while (stack.length) {
        const [cx, cy] = stack.pop();
        pixelCount += 1;
        if (cx < minX) {
          minX = cx;
        }
        if (cy < minY) {
          minY = cy;
        }
        if (cx > maxX) {
          maxX = cx;
        }
        if (cy > maxY) {
          maxY = cy;
        }

        const neighbors = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }

          const neighborIndex = indexAt(nx, ny);
          if (visited[neighborIndex]) {
            continue;
          }

          visited[neighborIndex] = 1;
          const neighborAlpha = imageData[neighborIndex * 4 + 3];
          if (neighborAlpha >= alphaThreshold) {
            stack.push([nx, ny]);
          }
        }
      }

      const regionWidth = maxX - minX + 1;
      const regionHeight = maxY - minY + 1;
      if (pixelCount < 20 || regionWidth < 4 || regionHeight < 4) {
        continue;
      }

      regions.push({
        x: minX,
        y: minY,
        w: regionWidth,
        h: regionHeight,
        area: regionWidth * regionHeight,
        pixelCount,
      });
    }
  }

  const topRegions = regions
    .sort((a, b) => b.pixelCount - a.pixelCount)
    .slice(0, 9)
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

  EMOTION_ICON_REGIONS_CACHE.set(src, topRegions);
  return topRegions;
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

function pickAnimationChoice(pet, animations, options = {}) {
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

  if (isPetting && defaults.interaction && animations[defaults.interaction]) {
    return { key: defaults.interaction, reason: "petting" };
  }

  if (
    (allTenStepsCompleted || isMilestoneBoost) &&
    defaults.celebration &&
    animations[defaults.celebration]
  ) {
    return { key: defaults.celebration, reason: "celebration" };
  }

  if (wantsMovement && defaults.movement && animations[defaults.movement]) {
    return { key: defaults.movement, reason: "movement" };
  }

  if (!wantsMovement && defaults.idle && animations[defaults.idle]) {
    return { key: defaults.idle, reason: "idle" };
  }

  return { key: keys[0], reason: "fallback" };
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
  let sequenceCooldownUntil = 0;
  let nextSequenceCheckAt = 0;
  let currentPetId = "";
  let randomState = 0x9e3779b9;
  let emotionParticles = [];
  let nextIdleEmotionAt = 0;
  let wasPettingLastFrame = false;
  let lastNegativeBurstAnimationKey = "";
  let pendingMilestoneEmotionBursts = 0;
  let lastFrameAt = performance.now();
  const onDebugFrame =
    typeof options.onDebugFrame === "function" ? options.onDebugFrame : null;
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

  function reseedForPet(petId) {
    randomState =
      (hashStringSeed(`${petId}|${Date.now()}`) || 0x9e3779b9) >>> 0;
  }

  function clearSequence() {
    sequenceState = null;
  }

  function pickEmotionRegion(regions, theme) {
    if (!regions.length) {
      return null;
    }

    const configuredIndices = EMOTION_THEME_GROUPS[theme] || [];
    const validConfigured = configuredIndices.filter(
      (index) => index >= 0 && index < regions.length,
    );
    const candidateIndices = validConfigured.length
      ? validConfigured
      : regions.map((_, index) => index);
    const pickIndex =
      candidateIndices[Math.floor(nextRandom() * candidateIndices.length)] || 0;
    return regions[pickIndex] || regions[0];
  }

  function emitEmotionBurst(theme, originX, originY, options = {}) {
    const emotionImage = getAtlasImage(EMOTION_SHEET_SRC);
    if (!emotionImage?.complete) {
      return;
    }

    const regions = detectEmotionIconRegions(emotionImage, EMOTION_SHEET_SRC);
    if (!regions.length) {
      return;
    }

    const intensity = Math.max(1, Number(options.intensity || 1));
    const burstCount = Math.max(
      4,
      Math.round((options.count || 10) * intensity),
    );

    for (let index = 0; index < burstCount; index += 1) {
      const region = pickEmotionRegion(regions, theme);
      if (!region) {
        continue;
      }

      const size =
        resolveValueRange(options.sizeRange || [8, 14], nextRandom()) *
        (0.75 + nextRandom() * 0.4);
      const speed = resolveValueRange(
        options.speedRange || [36, 96],
        nextRandom(),
      );
      const angle = resolveValueRange(
        options.angleRange || [-Math.PI * 0.9, -Math.PI * 0.1],
        nextRandom(),
      );
      const spreadX = resolveValueRange(
        options.spreadX || [-20, 20],
        nextRandom(),
      );
      const spreadY = resolveValueRange(
        options.spreadY || [-8, 8],
        nextRandom(),
      );
      const lifetimeMs = Math.round(
        resolveValueRange(options.lifeRange || [1200, 2400], nextRandom()),
      );

      emotionParticles.push({
        region,
        x: originX + spreadX,
        y: originY + spreadY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: resolveValueRange(
          options.gravityRange || [70, 150],
          nextRandom(),
        ),
        drag: resolveValueRange(options.dragRange || [0.9, 0.96], nextRandom()),
        rotation: resolveValueRange([-0.7, 0.7], nextRandom()),
        spin: resolveValueRange([-2.8, 2.8], nextRandom()),
        ageMs: 0,
        lifeMs: lifetimeMs,
        size,
      });
    }

    if (emotionParticles.length > 180) {
      emotionParticles = emotionParticles.slice(emotionParticles.length - 180);
    }
  }

  function updateEmotionParticles(deltaMs) {
    if (!emotionParticles.length) {
      return;
    }

    const dt = Math.max(0, deltaMs) / 1000;
    emotionParticles = emotionParticles.filter((particle) => {
      particle.ageMs += deltaMs;
      if (particle.ageMs >= particle.lifeMs) {
        return false;
      }

      particle.vx *= particle.drag;
      particle.vy = particle.vy * particle.drag + particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rotation += particle.spin * dt;

      return true;
    });
  }

  function drawEmotionParticles(ctx) {
    if (!emotionParticles.length) {
      return;
    }

    const emotionImage = getAtlasImage(EMOTION_SHEET_SRC);
    if (!emotionImage?.complete) {
      return;
    }

    for (const particle of emotionParticles) {
      const lifeProgress = clamp01(
        particle.ageMs / Math.max(1, particle.lifeMs),
      );
      const fade = lifeProgress < 0.75 ? 1 : 1 - (lifeProgress - 0.75) / 0.25;
      if (fade <= 0.01) {
        continue;
      }

      ctx.save();
      ctx.globalAlpha = clamp01(fade);
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      const half = particle.size / 2;
      ctx.drawImage(
        emotionImage,
        particle.region.x,
        particle.region.y,
        particle.region.w,
        particle.region.h,
        -half,
        -half,
        particle.size,
        particle.size,
      );
      ctx.restore();
    }
  }

  function canRunRule(rule, animationSet) {
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

  function buildSequenceRuntime(rule, animationSet, now) {
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
      stageIndex: 0,
      startedAt: now,
      stageStartedAt: now,
      stageEndsAt: now + stages[0].durationMs,
      stages,
    };
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
  }

  function getRuleForPet(petId, animationSet) {
    const rule = PET_SEQUENCE_RULES[petId];
    if (!rule) {
      return null;
    }

    return canRunRule(rule, animationSet) ? rule : null;
  }

  function advanceSequence(now, topSafeInset) {
    if (!sequenceState) {
      return;
    }

    while (sequenceState && now >= sequenceState.stageEndsAt) {
      const nextIndex = sequenceState.stageIndex + 1;
      if (nextIndex >= sequenceState.stages.length) {
        const rule = PET_SEQUENCE_RULES[currentPetId];
        const cooldownMs = rule
          ? Math.max(1200, Math.round(pickInRange(rule.cooldownMs || 12000)))
          : 12000;
        sequenceCooldownUntil = now + cooldownMs;
        nextSequenceCheckAt = sequenceCooldownUntil;
        clearSequence();
        return;
      }

      sequenceState.stageIndex = nextIndex;
      sequenceState.stageStartedAt = now;
      sequenceState.stageEndsAt =
        now + sequenceState.stages[nextIndex].durationMs;

      const stage = sequenceState.stages[nextIndex];
      if (stage.relocate) {
        relocateDuringSequence(topSafeInset);
      }
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
  }) {
    if (!animationSet) {
      return;
    }

    if (forcedAnimationKey) {
      clearSequence();
      return;
    }

    if (sequenceState) {
      advanceSequence(now, topSafeInset);
      return;
    }

    if (isPetting || movementIntentByContext || currentSpeed > 0.2) {
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

    sequenceState = buildSequenceRuntime(rule, animationSet, now);
    const stage = sequenceState.stages[sequenceState.stageIndex];
    if (stage?.relocate) {
      relocateDuringSequence(topSafeInset);
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
    const allowMovement = options.allowMovement !== false;
    const speedMultiplier = Math.max(0.1, Number(options.speedMultiplier || 1));
    const behavior = getContext() || {};
    const profile = getPetBehaviorProfile(state.selectedPetId);
    const topSafeInset = Math.max(0, Number(behavior.topSafeInset || 0));
    const routeZone = resolveRouteZone(behavior.pathname);
    const checklistCompleted = Number(behavior.checklistCompleted || 0);
    const checklistTotal = Number(behavior.checklistTotal || 0);
    const checklistIncomplete = checklistTotal > checklistCompleted;
    const allTenStepsCompleted =
      checklistTotal >= 10 && checklistCompleted >= 10;

    if (checklistCompleted > lastChecklistCompleted) {
      const hitMilestone = CHECKLIST_MILESTONES.some(
        (milestone) =>
          checklistCompleted >= milestone && lastChecklistCompleted < milestone,
      );

      if (hitMilestone) {
        milestoneBoostUntil = Date.now() + 1800;
        pendingMilestoneEmotionBursts += 1;
      }
    }

    lastChecklistCompleted = checklistCompleted;

    if (!allowMovement) {
      velocity.x *= 0.78;
      velocity.y *= 0.78;
      return {
        allTenStepsCompleted,
      };
    }

    if (routeZone === PET_ROUTE_ZONES.LEFT_ASSIST && checklistIncomplete) {
      const targetX = 70 + Math.sin(frame / 70) * 28;
      const minTargetY = Math.max(24, topSafeInset + 18);
      const targetY = Math.max(
        minTargetY,
        Math.min(
          canvas.height - spriteHeight - 24,
          130 + Math.sin(frame / 62) * 40,
        ),
      );
      velocity.x += (targetX - position.x) * profile.checklistPull;
      velocity.y +=
        (targetY - position.y) *
        (profile.checklistPull * 0.7 * speedMultiplier);
    } else if (routeZone === PET_ROUTE_ZONES.BOTTOM_ROAM) {
      const targetY = Math.max(
        topSafeInset + 22,
        canvas.height - spriteHeight - 26,
      );
      const targetX =
        canvas.width * 0.5 +
        Math.sin(frame / 80) * Math.min(260, canvas.width * 0.26);
      velocity.x += (targetX - position.x) * (0.0012 * speedMultiplier);
      velocity.y += (targetY - position.y) * (0.0021 * speedMultiplier);
    } else if (routeZone === PET_ROUTE_ZONES.RIGHT_SUMMARY) {
      const targetX = Math.max(
        80,
        canvas.width - spriteWidth - 120 + Math.sin(frame / 95) * 22,
      );
      const targetY = Math.max(
        topSafeInset + 24,
        Math.min(canvas.height - spriteHeight - 30, canvas.height * 0.56),
      );
      velocity.x += (targetX - position.x) * (0.0015 * speedMultiplier);
      velocity.y += (targetY - position.y) * (0.0013 * speedMultiplier);
    } else if (routeZone === PET_ROUTE_ZONES.HEADER_PERCH) {
      const targetY = Math.max(
        topSafeInset + 18,
        30 + Math.sin(frame / 75) * 8,
      );
      const targetX =
        canvas.width * 0.5 +
        Math.sin(frame / 105) * Math.min(220, canvas.width * 0.2);
      velocity.x += (targetX - position.x) * (0.0013 * speedMultiplier);
      velocity.y += (targetY - position.y) * (0.002 * speedMultiplier);
    } else {
      velocity.x += Math.sin(frame / 130) * profile.driftX * speedMultiplier;
      velocity.y += Math.cos(frame / 150) * profile.driftY * speedMultiplier;
    }

    if (allTenStepsCompleted) {
      velocity.x += Math.sin(frame / 16) * (0.012 * speedMultiplier);
      velocity.y += Math.cos(frame / 18) * (0.01 * speedMultiplier);
    }

    if (Date.now() < milestoneBoostUntil) {
      velocity.x += Math.sin(frame / 12) * (0.009 * speedMultiplier);
      velocity.y += Math.cos(frame / 14) * (0.008 * speedMultiplier);
    }

    position.x += velocity.x;
    position.y += velocity.y;

    const minX = 6;
    const minY = Math.max(6, topSafeInset + 6);
    const maxX = Math.max(minX, canvas.width - spriteWidth - 6);
    const maxY = Math.max(minY, canvas.height - spriteHeight - 6);

    if (position.x <= minX || position.x >= maxX) {
      velocity.x *= -1;
      position.x = Math.max(minX, Math.min(maxX, position.x));
    }

    if (position.y <= minY || position.y >= maxY) {
      velocity.y *= -1;
      position.y = Math.max(minY, Math.min(maxY, position.y));
    }

    const celebrationBoost = allTenStepsCompleted ? 1.2 : 1;
    velocity.x = Math.max(
      -profile.maxSpeedX * celebrationBoost * speedMultiplier,
      Math.min(
        profile.maxSpeedX * celebrationBoost * speedMultiplier,
        velocity.x,
      ),
    );
    velocity.y = Math.max(
      -profile.maxSpeedY * celebrationBoost * speedMultiplier,
      Math.min(
        profile.maxSpeedY * celebrationBoost * speedMultiplier,
        velocity.y,
      ),
    );

    return {
      allTenStepsCompleted,
    };
  }

  function render() {
    if (!running) {
      return;
    }

    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nowPerf = performance.now();
    const deltaMs = Math.min(60, Math.max(8, nowPerf - lastFrameAt));
    lastFrameAt = nowPerf;
    updateEmotionParticles(deltaMs);

    const state = getState();
    if (state.selectedPetId !== currentPetId) {
      currentPetId = state.selectedPetId;
      reseedForPet(currentPetId);
      sequenceCooldownUntil = 0;
      nextSequenceCheckAt = 0;
      nextIdleEmotionAt = Date.now() + Math.round(pickInRange([3500, 8500]));
      pendingMilestoneEmotionBursts = 0;
      emotionParticles = [];
      clearSequence();
    }

    const tuning = getTuning ? getTuning() || {} : {};
    const speedMultiplier =
      Math.max(0.1, Number(tuning.speedMultiplier || 1)) *
      BASE_PET_SPEED_MULTIPLIER;
    const scaleMultiplier = Math.max(0.5, Number(tuning.scaleMultiplier || 1));
    const shadowOffsetAdjust = Number(tuning.shadowOffsetAdjust || 0);
    const shadowAlpha = Math.max(
      0.05,
      Math.min(1, Number(tuning.shadowAlpha || 0.18)),
    );
    const highContrastShadow = Boolean(tuning.highContrastShadow);
    const forceFreeze = Boolean(tuning.freezeMotion);
    const forcedAnimationKey = String(tuning.forceAnimationKey || "").trim();
    const normalizedForcedActionKey = toActionKey(forcedAnimationKey);

    if (forceFreeze) {
      velocity.x = 0;
      velocity.y = 0;
    }

    const pet = PET_CATALOG[state.selectedPetId] || PET_CATALOG[DEFAULT_PET_ID];
    const atlasEnabled = Boolean(
      pet?.atlas?.src &&
      Array.isArray(pet?.frames) &&
      typeof pet.frames[0] === "object",
    );

    const frameDuration = pet.frameDuration || 18;
    const animationSet = resolveAnimationSet(pet);
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

    const now = Date.now();
    maybeStartSequence({
      now,
      petId: state.selectedPetId,
      animationSet,
      forcedAnimationKey,
      isPetting,
      movementIntentByContext,
      currentSpeed,
      topSafeInset,
    });
    const activeStage = sequenceState
      ? sequenceState.stages[sequenceState.stageIndex]
      : null;
    const sequenceAnimationKey = String(activeStage?.animationKey || "");
    const sequenceHiddenStage = Boolean(activeStage?.hidden);
    const canForceSequenceAnimation =
      Boolean(sequenceAnimationKey) &&
      Boolean(animationSet?.[sequenceAnimationKey]?.frames?.length);

    const animationChoice = pickAnimationChoice(pet, animationSet, {
      allTenStepsCompleted,
      isMilestoneBoost: Date.now() < milestoneBoostUntil,
      isPetting: Date.now() < pettingUntil,
      wantsMovement,
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

    const selectedAnimationKey =
      forcedAnimationKey && animationSet?.[forcedAnimationKey]
        ? forcedAnimationKey
        : canForceSequenceAnimation
          ? sequenceAnimationKey
          : canForceFromFrames
            ? normalizedForcedActionKey
            : animationChoice.key;
    const animationReason =
      forcedAnimationKey && animationSet?.[forcedAnimationKey]
        ? "forced"
        : canForceSequenceAnimation
          ? `sequence:${sequenceState?.ruleId || "unknown"}:${activeStage?.name || "stage"}`
          : canForceFromFrames
            ? "forced-frame-action"
            : animationChoice.reason;

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
        )
      : Math.floor(frame / frameDuration) % safeFrameSource.length;
    const sprite = safeFrameSource[frameIndex] || safeFrameSource[0];

    const scale = atlasEnabled ? DEFAULT_ATLAS_SCALE : 4;
    const tunedScale = scale * scaleMultiplier;
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
    const allowMovement = atlasEnabled
      ? MOVEMENT_ACTIONS.has(currentAction) ||
        MOVEMENT_ACTIONS.has(currentCategory)
      : true;

    const movementActive = allowMovement && !forceFreeze && !sequenceState;

    const motionState = updateMotion(spriteWidth, spriteHeight, state, {
      allowMovement: movementActive,
      speedMultiplier,
    });

    const shadow = pet.shadow || {};
    const airborneActions = Array.isArray(shadow.airborneActions)
      ? shadow.airborneActions.map((action) => toActionKey(action))
      : [];
    const isAirborneAction =
      airborneActions.includes(currentActionKey) ||
      /flight|flap|glide|ascent|dive|hover/.test(currentActionKey);
    const isJumpAction = /jump/.test(currentActionKey);

    const hasCelebration =
      motionState.allTenStepsCompleted || Date.now() < milestoneBoostUntil;
    const hasPetting = Date.now() < pettingUntil;
    const hasDynamicBob =
      movementActive ||
      isAirborneAction ||
      isJumpAction ||
      hasCelebration ||
      hasPetting;
    const bobScale = hasCelebration
      ? 5
      : hasPetting
        ? 4
        : movementActive
          ? 2
          : 0;
    const bob =
      forceFreeze || !hasDynamicBob
        ? 0
        : Math.round(Math.sin(frame / 15) * bobScale);
    const shouldBlink = frame % 120 > 108;

    const originX = Math.round(position.x);
    const originY = Math.round(position.y + bob);

    if (pendingMilestoneEmotionBursts > 0) {
      emitEmotionBurst("positive", originX + spriteWidth * 0.5, originY - 6, {
        count: 10,
        intensity: Math.min(1.7, pendingMilestoneEmotionBursts),
        sizeRange: [8, 13],
        speedRange: [34, 96],
        lifeRange: [1200, 2100],
        spreadX: [-24, 24],
      });
      pendingMilestoneEmotionBursts = 0;
    }

    const isCurrentlyPetting = Date.now() < pettingUntil;
    if (isCurrentlyPetting && !wasPettingLastFrame) {
      emitEmotionBurst("positive", originX + spriteWidth * 0.5, originY - 2, {
        count: 5,
        sizeRange: [8, 12],
        speedRange: [30, 72],
        lifeRange: [900, 1600],
        spreadX: [-18, 18],
      });
    }
    wasPettingLastFrame = isCurrentlyPetting;

    const isNegativeAction = /damage|death|hurt|cry|sad/.test(currentActionKey);
    if (
      isNegativeAction &&
      activeAnimationKey !== lastNegativeBurstAnimationKey
    ) {
      emitEmotionBurst("negative", originX + spriteWidth * 0.5, originY + 4, {
        count: 5,
        sizeRange: [8, 12],
        speedRange: [22, 56],
        angleRange: [-Math.PI * 0.75, -Math.PI * 0.25],
        lifeRange: [850, 1500],
        gravityRange: [85, 170],
        spreadX: [-14, 14],
      });
      lastNegativeBurstAnimationKey = activeAnimationKey;
    }

    if (!isNegativeAction) {
      lastNegativeBurstAnimationKey = "";
    }

    const idleEmotionEligible =
      !isPetting &&
      !sequenceState &&
      !movementIntentByContext &&
      !movementActive &&
      !isNegativeAction;
    if (idleEmotionEligible && now >= nextIdleEmotionAt) {
      emitEmotionBurst("neutral", originX + spriteWidth * 0.5, originY - 4, {
        count: 4,
        sizeRange: [7, 11],
        speedRange: [20, 44],
        lifeRange: [900, 1500],
        gravityRange: [60, 125],
        spreadX: [-16, 16],
      });
      nextIdleEmotionAt = now + Math.round(pickInRange([9000, 17000]));
    }

    if (velocity.x > 0.08) {
      facingDirection = "right";
    } else if (velocity.x < -0.08) {
      facingDirection = "left";
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
      ctx.fillStyle = highContrastShadow
        ? `rgba(255, 255, 255, ${shadowAlpha})`
        : `rgba(2, 6, 23, ${shadowAlpha})`;
      ctx.fillRect(shadowX, shadowY, shadowWidth, 4);

      if (atlasEnabled) {
        const defaultFacing = String(
          pet?.atlas?.facing || "right",
        ).toLowerCase();
        const flipHorizontal =
          (defaultFacing === "right" && facingDirection === "left") ||
          (defaultFacing === "left" && facingDirection === "right");
        if (atlasImage?.complete) {
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

    drawEmotionParticles(ctx);

    if (motionState.allTenStepsCompleted || Date.now() < milestoneBoostUntil) {
      const pulse = frame % 22 < 11;
      drawSparkle(
        ctx,
        originX - (pulse ? 10 : 4),
        originY + (pulse ? 8 : 2),
        2,
      );
      drawSparkle(
        ctx,
        originX + spriteWidth + (pulse ? 4 : -2),
        originY + (pulse ? 16 : 10),
        2,
      );

      if (
        motionState.allTenStepsCompleted ||
        Date.now() < milestoneBoostUntil
      ) {
        drawSparkle(ctx, originX + spriteWidth / 2 - 6, originY - 16, 2);
        drawSparkle(ctx, originX + spriteWidth / 2 + 10, originY - 8, 2);
      }
    }

    if (Date.now() < pettingUntil) {
      drawHeart(ctx, originX + 14, originY - 16, 2);
      drawHeart(ctx, originX + spriteWidth - 26, originY - 12, 2);
    }

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
        sequenceHidden: sequenceHiddenStage,
        emotionParticles: emotionParticles.length,
        position: {
          x: Math.round(position.x),
          y: Math.round(position.y),
        },
      });
    }

    if (!forceFreeze) {
      activeAnimationTick += 1;
    }
    frame += 1;
    rafId = window.requestAnimationFrame(render);
  }

  function start() {
    if (running) {
      return;
    }

    running = true;
    lastFrameAt = performance.now();
    if (!nextIdleEmotionAt) {
      nextIdleEmotionAt = Date.now() + Math.round(pickInRange([3000, 7000]));
    }
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

  return {
    start,
    stop,
    handleViewportClick,
  };
}
