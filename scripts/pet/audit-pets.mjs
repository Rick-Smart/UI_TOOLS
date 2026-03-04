import fs from "node:fs";
import path from "node:path";
import { PET_SPRITES } from "../../public/agent-pet/pets/sprites.js";
import { getPetBehaviorProfile } from "../../public/agent-pet/pets/index.js";

const root = process.cwd();
const petsRoot = path.join(root, "public", "agent-pet", "pets");

function toActionKey(actionName) {
  return String(actionName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function readSheetJson(petId) {
  const filePath = path.join(petsRoot, petId, "media", "sheet.json");
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function buildSheetRectSet(sheet) {
  const set = new Set();

  for (const frame of Object.values(sheet?.frames || {})) {
    const rect = frame?.frame;
    if (!rect) {
      continue;
    }

    const x = Number(rect.x) || 0;
    const y = Number(rect.y) || 0;
    const w = Number(rect.w) || 0;
    const h = Number(rect.h) || 0;
    set.add(`${x}|${y}|${w}|${h}`);
  }

  return set;
}

const petIds = Object.keys(PET_SPRITES);
const allIssues = [];
const allWarnings = [];
const stats = [];

for (const petId of petIds) {
  const sprite = PET_SPRITES[petId];
  const issues = [];
  const warnings = [];

  const atlasSrc = String(sprite?.atlas?.src || "").trim();
  const atlasScale = Number(sprite?.atlas?.scale);
  const atlasFacing = String(sprite?.atlas?.facing || "").toLowerCase();

  if (!atlasSrc) {
    issues.push("missing atlas.src");
  }

  if (!isFiniteNumber(atlasScale) || atlasScale <= 0) {
    issues.push(`invalid atlas.scale (${sprite?.atlas?.scale})`);
  }

  if (!["left", "right"].includes(atlasFacing)) {
    warnings.push(`unexpected atlas.facing (${sprite?.atlas?.facing})`);
  }

  if (atlasSrc) {
    const atlasFile = path.join(root, "public", atlasSrc.replace(/^\//, ""));
    if (!fs.existsSync(atlasFile)) {
      issues.push(`missing atlas image (${atlasSrc})`);
    }
  }

  const sheet = readSheetJson(petId);
  if (!sheet) {
    issues.push("missing media/sheet.json");
  }

  const sheetRectSet = buildSheetRectSet(sheet);
  const animations =
    sprite?.animations && typeof sprite.animations === "object"
      ? sprite.animations
      : null;

  if (!animations) {
    issues.push("missing animations map");
  }

  const animationKeys = animations ? Object.keys(animations) : [];
  if (!animationKeys.length) {
    issues.push("no animation keys");
  }

  const order = Array.isArray(sprite?.animationOrder)
    ? sprite.animationOrder
    : [];
  if (!order.length) {
    warnings.push("missing animationOrder");
  } else {
    for (const key of order) {
      if (!animations?.[key]) {
        issues.push(`animationOrder contains unknown key (${key})`);
      }
    }

    for (const key of animationKeys) {
      if (!order.includes(key)) {
        warnings.push(`animation key not listed in animationOrder (${key})`);
      }
    }
  }

  const defaults = sprite?.defaultAnimationKeys || {};
  for (const defaultKey of ["idle", "movement", "interaction", "celebration"]) {
    const value = defaults[defaultKey];
    if (!value) {
      warnings.push(`defaultAnimationKeys.${defaultKey} is empty`);
      continue;
    }

    if (!animations?.[value]) {
      issues.push(
        `defaultAnimationKeys.${defaultKey} points to missing key (${value})`,
      );
    }
  }

  const shadow = sprite?.shadow || {};
  for (const numericShadowField of [
    "groundOffset",
    "groundWidthPad",
    "airborneOffset",
    "airborneWidthPad",
  ]) {
    if (!isFiniteNumber(shadow[numericShadowField])) {
      issues.push(
        `invalid shadow.${numericShadowField} (${shadow[numericShadowField]})`,
      );
    }
  }

  if (!Array.isArray(shadow.airborneActions)) {
    issues.push("shadow.airborneActions is not an array");
  }

  const behavior = getPetBehaviorProfile(petId);
  for (const behaviorField of [
    "driftX",
    "driftY",
    "maxSpeedX",
    "maxSpeedY",
    "checklistPull",
  ]) {
    if (!isFiniteNumber(behavior?.[behaviorField])) {
      issues.push(
        `invalid behavior.${behaviorField} (${behavior?.[behaviorField]})`,
      );
    }
  }

  let totalFrames = 0;
  const flatFrames = Array.isArray(sprite?.frames) ? sprite.frames : [];

  for (const animationKey of animationKeys) {
    const animation = animations[animationKey];

    if (!Array.isArray(animation?.frames) || animation.frames.length === 0) {
      issues.push(`animation ${animationKey} has no frames`);
      continue;
    }

    if (!isFiniteNumber(animation.frameCount)) {
      warnings.push(`animation ${animationKey} missing frameCount`);
    } else if (Number(animation.frameCount) !== animation.frames.length) {
      warnings.push(
        `animation ${animationKey} frameCount mismatch (${animation.frameCount} != ${animation.frames.length})`,
      );
    }

    const computedTotalTicks = animation.frames.reduce(
      (sum, frame) => sum + Math.max(1, Number(frame?.ticks) || 1),
      0,
    );

    if (
      isFiniteNumber(animation.totalTicks) &&
      Number(animation.totalTicks) !== computedTotalTicks
    ) {
      warnings.push(
        `animation ${animationKey} totalTicks mismatch (${animation.totalTicks} != ${computedTotalTicks})`,
      );
    }

    animation.frames.forEach((frame, index) => {
      totalFrames += 1;

      const x = Number(frame?.x);
      const y = Number(frame?.y);
      const w = Number(frame?.w);
      const h = Number(frame?.h);
      const ticks = Number(frame?.ticks);

      if (!isFiniteNumber(x) || x < 0) {
        issues.push(`${animationKey}[${index}] invalid x (${frame?.x})`);
      }
      if (!isFiniteNumber(y) || y < 0) {
        issues.push(`${animationKey}[${index}] invalid y (${frame?.y})`);
      }
      if (!isFiniteNumber(w) || w <= 0) {
        issues.push(`${animationKey}[${index}] invalid w (${frame?.w})`);
      }
      if (!isFiniteNumber(h) || h <= 0) {
        issues.push(`${animationKey}[${index}] invalid h (${frame?.h})`);
      }
      if (!isFiniteNumber(ticks) || ticks <= 0) {
        issues.push(
          `${animationKey}[${index}] invalid ticks (${frame?.ticks})`,
        );
      }

      const actionKey = toActionKey(frame?.action || frame?.actionKey);
      if (frame?.actionKey && toActionKey(frame.actionKey) !== animationKey) {
        warnings.push(
          `${animationKey}[${index}] frame.actionKey differs from animation key (${frame.actionKey})`,
        );
      }

      if (actionKey && actionKey !== animationKey) {
        warnings.push(
          `${animationKey}[${index}] normalized action differs from animation key (${frame?.action})`,
        );
      }

      if (sheetRectSet.size) {
        const rectKey = `${x}|${y}|${w}|${h}`;
        if (!sheetRectSet.has(rectKey)) {
          issues.push(
            `${animationKey}[${index}] rect missing in sheet.json (${rectKey})`,
          );
        }
      }
    });
  }

  if (!flatFrames.length) {
    warnings.push("root frames strip is empty");
  } else {
    flatFrames.forEach((frame, index) => {
      const x = Number(frame?.x) || 0;
      const y = Number(frame?.y) || 0;
      const w = Number(frame?.w) || 0;
      const h = Number(frame?.h) || 0;
      const rectKey = `${x}|${y}|${w}|${h}`;
      if (sheetRectSet.size && !sheetRectSet.has(rectKey)) {
        issues.push(`frames[${index}] rect missing in sheet.json (${rectKey})`);
      }
    });
  }

  stats.push({
    petId,
    animations: animationKeys.length,
    frames: totalFrames,
    issues: issues.length,
    warnings: warnings.length,
  });

  if (issues.length) {
    allIssues.push({ petId, items: issues });
  }
  if (warnings.length) {
    allWarnings.push({ petId, items: warnings });
  }
}

const petDirs = fs
  .readdirSync(petsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const petDir of petDirs) {
  if (!PET_SPRITES[petDir]) {
    allWarnings.push({
      petId: petDir,
      items: ["directory exists but pet is not registered in PET_SPRITES"],
    });
  }
}

console.log("=== PET AUDIT SUMMARY ===");
for (const line of stats) {
  console.log(
    `${line.petId}: animations=${line.animations}, frames=${line.frames}, issues=${line.issues}, warnings=${line.warnings}`,
  );
}

if (allWarnings.length) {
  console.log("\n=== WARNINGS ===");
  for (const warningGroup of allWarnings) {
    for (const item of warningGroup.items) {
      console.log(`- [${warningGroup.petId}] ${item}`);
    }
  }
}

if (allIssues.length) {
  console.log("\n=== ISSUES ===");
  for (const issueGroup of allIssues) {
    for (const item of issueGroup.items) {
      console.log(`- [${issueGroup.petId}] ${item}`);
    }
  }
  process.exitCode = 1;
} else {
  console.log("\nNo blocking issues found.");
}
