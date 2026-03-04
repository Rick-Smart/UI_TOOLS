import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public/agent-pet/pets");

const PETS = [
  { id: "sphynx-cat", name: "Sphynx Cat", bird: false },
  { id: "jack-russell", name: "Jack Russell", bird: false },
  { id: "pidgeon", name: "Pidgeon", bird: true },
  { id: "red-panda", name: "Red Panda", bird: false },
  { id: "beaver", name: "Beaver", bird: false },
  { id: "chameleon", name: "Chameleon", bird: false },
  { id: "ferret", name: "Ferret", bird: false },
  { id: "fish", name: "Fish", bird: false },
  { id: "koala", name: "Koala", bird: false },
  { id: "raccoon", name: "Raccoon", bird: false },
  { id: "seagull", name: "Seagull", bird: true },
  { id: "wolf", name: "Wolf", bird: false },
];

const BEHAVIOR_BY_ID = {
  "sphynx-cat": {
    driftX: 0.00065,
    driftY: 0.00048,
    maxSpeedX: 1.35,
    maxSpeedY: 1.0,
    checklistPull: 0.0016,
  },
  "jack-russell": {
    driftX: 0.00075,
    driftY: 0.00045,
    maxSpeedX: 1.45,
    maxSpeedY: 1.0,
    checklistPull: 0.0017,
  },
  pidgeon: {
    driftX: 0.00085,
    driftY: 0.0006,
    maxSpeedX: 1.55,
    maxSpeedY: 1.1,
    checklistPull: 0.0015,
  },
  "red-panda": {
    driftX: 0.00065,
    driftY: 0.0005,
    maxSpeedX: 1.35,
    maxSpeedY: 1.0,
    checklistPull: 0.0016,
  },
  beaver: {
    driftX: 0.0006,
    driftY: 0.00048,
    maxSpeedX: 1.3,
    maxSpeedY: 1.0,
    checklistPull: 0.0017,
  },
  chameleon: {
    driftX: 0.00055,
    driftY: 0.00045,
    maxSpeedX: 1.2,
    maxSpeedY: 0.95,
    checklistPull: 0.0016,
  },
  ferret: {
    driftX: 0.0007,
    driftY: 0.0005,
    maxSpeedX: 1.4,
    maxSpeedY: 1.0,
    checklistPull: 0.0017,
  },
  fish: {
    driftX: 0.0006,
    driftY: 0.0006,
    maxSpeedX: 1.2,
    maxSpeedY: 1.0,
    checklistPull: 0.0015,
  },
  koala: {
    driftX: 0.0005,
    driftY: 0.00042,
    maxSpeedX: 1.2,
    maxSpeedY: 0.9,
    checklistPull: 0.0015,
  },
  raccoon: {
    driftX: 0.00065,
    driftY: 0.0005,
    maxSpeedX: 1.35,
    maxSpeedY: 1.0,
    checklistPull: 0.0016,
  },
  seagull: {
    driftX: 0.0009,
    driftY: 0.00065,
    maxSpeedX: 1.6,
    maxSpeedY: 1.15,
    checklistPull: 0.0015,
  },
  wolf: {
    driftX: 0.00075,
    driftY: 0.0005,
    maxSpeedX: 1.45,
    maxSpeedY: 1.0,
    checklistPull: 0.0017,
  },
};

function toCamel(id) {
  return id.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function toActionKey(actionName) {
  return (
    String(actionName || "idle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-") || "idle"
  );
}

function readSheet(id) {
  const sheetPath = path.join(root, id, "media", "sheet.json");
  const raw = fs.readFileSync(sheetPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function parseFrames(framesObject) {
  const parsed = [];

  for (const [key, value] of Object.entries(framesObject || {})) {
    const match = key.match(/\(([^)]+)\)\s*(\d+)\.ase$/);
    const action = match ? String(match[1]).trim() : "Idle";
    const index = match ? Number(match[2]) : parsed.length;
    const rect = value?.frame || {};
    const duration = Number(value?.duration) || 100;

    parsed.push({
      key,
      action,
      index,
      x: Number(rect.x) || 0,
      y: Number(rect.y) || 0,
      w: Number(rect.w) || 32,
      h: Number(rect.h) || 32,
      ticks: Math.max(4, Math.round(duration / 16)),
    });
  }

  return parsed;
}

function classifyAction(action) {
  const normalized = String(action || "").toLowerCase();

  if (/death|damage|disappear/.test(normalized)) {
    return "negative";
  }

  if (/sleep|idle|sit|rest/.test(normalized)) {
    return "idle";
  }

  if (
    /movement|walk|run|flight|flap|glide|dash|swim|ascent|dive|climb|jump/.test(
      normalized,
    )
  ) {
    return "movement";
  }

  if (
    /lick|peck|bark|bite|eat|clean|paw|tongue|dig|playful|attack/.test(
      normalized,
    )
  ) {
    return "interaction";
  }

  return "special";
}

function buildAnimationCycles(parsed) {
  const groups = new Map();

  for (const frame of parsed) {
    if (!groups.has(frame.action)) {
      groups.set(frame.action, []);
    }
    groups.get(frame.action).push(frame);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => a.index - b.index);
  }

  const cycles = [];
  for (const [action, frames] of groups.entries()) {
    const category = classifyAction(action);
    const key = toActionKey(action);
    const cycleFrames = frames.map((entry) => ({
      x: entry.x,
      y: entry.y,
      w: entry.w,
      h: entry.h,
      ticks: entry.ticks,
      action,
      actionKey: key,
      category,
    }));

    const totalTicks = cycleFrames.reduce(
      (sum, frame) => sum + Math.max(1, Number(frame.ticks) || 1),
      0,
    );

    cycles.push({
      key,
      title: action,
      category,
      playable: category !== "negative",
      frameCount: cycleFrames.length,
      totalTicks,
      averageTicks: cycleFrames.length
        ? Math.round(totalTicks / cycleFrames.length)
        : 0,
      frames: cycleFrames,
    });
  }

  cycles.sort((a, b) => a.title.localeCompare(b.title));
  return cycles;
}

function pickDefaultCycle(cycles, preferredCategories) {
  for (const category of preferredCategories) {
    const found = cycles.find(
      (cycle) => cycle.playable && cycle.category === category,
    );
    if (found) {
      return found;
    }
  }

  return cycles.find((cycle) => cycle.playable) || cycles[0] || null;
}

function buildDefaultFrameStrip(cycles) {
  const movementCycle = pickDefaultCycle(cycles, ["movement"]);
  const idleCycle = pickDefaultCycle(cycles, [
    "idle",
    "special",
    "interaction",
  ]);
  const strip = [];

  if (movementCycle) {
    strip.push(...movementCycle.frames.slice(0, 8));
  }

  if (idleCycle && idleCycle.key !== movementCycle?.key) {
    strip.push(...idleCycle.frames.slice(0, 8));
  }

  if (!strip.length) {
    const fallback = cycles[0];
    if (fallback) {
      strip.push(...fallback.frames.slice(0, 12));
    }
  }

  return strip;
}

for (const pet of PETS) {
  const sheet = readSheet(pet.id);
  const parsed = parseFrames(sheet.frames);
  const cycles = buildAnimationCycles(parsed);
  const selectedFrames = buildDefaultFrameStrip(cycles);
  const first = selectedFrames[0] || { w: 32, h: 32 };
  const scale = Math.max(1, first.w >= 64 ? 1 : 2);

  const spriteVar = `${toCamel(pet.id)}Sprite`;
  const behaviorVar = `${toCamel(pet.id)}Behavior`;

  const spriteContent = `export const ${spriteVar} = ${JSON.stringify(
    {
      name: pet.name,
      frameDuration: 6,
      atlas: {
        src: `/agent-pet/pets/${pet.id}/media/sheet.png`,
        scale,
        facing: "right",
      },
      shadow: {
        groundOffset: 1,
        groundWidthPad: 14,
        airborneOffset: 14,
        airborneWidthPad: 4,
        airborneActions: pet.bird ? ["Flight", "Flap", "Glide", "Glide 2"] : [],
      },
      animations: Object.fromEntries(
        cycles.map((cycle) => [
          cycle.key,
          {
            title: cycle.title,
            category: cycle.category,
            playable: cycle.playable,
            frameCount: cycle.frameCount,
            totalTicks: cycle.totalTicks,
            averageTicks: cycle.averageTicks,
            frames: cycle.frames,
          },
        ]),
      ),
      animationOrder: cycles.map((cycle) => cycle.key),
      defaultAnimationKeys: {
        idle:
          pickDefaultCycle(cycles, ["idle", "special", "interaction"])?.key ||
          null,
        movement:
          pickDefaultCycle(cycles, ["movement", "interaction"])?.key || null,
        interaction:
          pickDefaultCycle(cycles, ["interaction", "special"])?.key || null,
        celebration:
          pickDefaultCycle(cycles, ["movement", "interaction", "special"])
            ?.key || null,
      },
      frames: selectedFrames,
    },
    null,
    2,
  )};\n`;

  const behaviorContent = `export const ${behaviorVar} = ${JSON.stringify(
    BEHAVIOR_BY_ID[pet.id],
    null,
    2,
  )};\n`;

  fs.writeFileSync(path.join(root, pet.id, "sprite.js"), spriteContent, "utf8");
  fs.writeFileSync(
    path.join(root, pet.id, "logic.js"),
    behaviorContent,
    "utf8",
  );
}

console.log("generated modules for all imported pets");

const spriteImportLines = PETS.map(
  (pet) => `import { ${toCamel(pet.id)}Sprite } from "./${pet.id}/sprite.js";`,
).join("\n");

const spriteRegistryLines = PETS.map(
  (pet) => `  "${pet.id}": ${toCamel(pet.id)}Sprite,`,
).join("\n");

const spriteRegistryContent = `${spriteImportLines}\n\nexport const PET_SPRITES = {\n${spriteRegistryLines}\n};\n`;

fs.writeFileSync(path.join(root, "sprites.js"), spriteRegistryContent, "utf8");

const behaviorImportLines = PETS.map(
  (pet) => `import { ${toCamel(pet.id)}Behavior } from "./${pet.id}/logic.js";`,
).join("\n");

const behaviorRegistryLines = PETS.map(
  (pet) => `  "${pet.id}": ${toCamel(pet.id)}Behavior,`,
).join("\n");

const behaviorRegistryContent = `${behaviorImportLines}\n\nconst PET_BEHAVIOR_PROFILES = {\n${behaviorRegistryLines}\n};\n\nconst DEFAULT_PET_ID = Object.keys(PET_BEHAVIOR_PROFILES)[0];\n\nexport function getPetBehaviorProfile(petId) {\n  return PET_BEHAVIOR_PROFILES[petId] || PET_BEHAVIOR_PROFILES[DEFAULT_PET_ID];\n}\n`;

fs.writeFileSync(path.join(root, "index.js"), behaviorRegistryContent, "utf8");
