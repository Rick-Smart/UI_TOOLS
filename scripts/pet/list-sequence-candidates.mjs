import { PET_SPRITES } from "../../public/agent-pet/pets/sprites.js";

const KEYWORDS = [
  "dig",
  "dive",
  "disappear",
  "reappear",
  "emerge",
  "ascent",
  "descent",
  "jump",
  "swim",
  "burrow",
  "tunnel",
];

function toActionKey(actionName) {
  return String(actionName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function hasKeyword(value) {
  return KEYWORDS.some((kw) => value.includes(kw));
}

console.log("=== SEQUENCE CANDIDATE ANIMATIONS ===");
for (const [petId, sprite] of Object.entries(PET_SPRITES)) {
  const animations = sprite?.animations || {};
  const keys = Object.keys(animations);
  const candidates = [];

  for (const key of keys) {
    const cycle = animations[key];
    const normalizedKey = toActionKey(key);
    const titleKey = toActionKey(cycle?.title || "");
    const frameActionKey = toActionKey(cycle?.frames?.[0]?.action || "");

    if (
      hasKeyword(normalizedKey) ||
      hasKeyword(titleKey) ||
      hasKeyword(frameActionKey)
    ) {
      candidates.push({
        key,
        title: cycle?.title || key,
        category: cycle?.category || "n/a",
        playable: cycle?.playable !== false,
        frameCount: Array.isArray(cycle?.frames) ? cycle.frames.length : 0,
        totalTicks: Number(cycle?.totalTicks || 0),
      });
    }
  }

  if (!candidates.length) {
    continue;
  }

  console.log(`\n[${petId}]`);
  for (const candidate of candidates) {
    console.log(
      `- ${candidate.key} | title=${candidate.title} | category=${candidate.category} | playable=${candidate.playable} | frames=${candidate.frameCount} | ticks=${candidate.totalTicks}`,
    );
  }
}

console.log("\n=== LIKELY CHOREOGRAPHY CHAINS ===");
for (const [petId, sprite] of Object.entries(PET_SPRITES)) {
  const keys = new Set(Object.keys(sprite?.animations || {}));

  const chains = [];

  if (
    keys.has("dig") &&
    keys.has("disappear") &&
    (keys.has("reappear") || keys.has("emerge"))
  ) {
    chains.push(
      "dig -> disappear -> delay/relocate -> " +
        (keys.has("reappear") ? "reappear" : "emerge"),
    );
  }

  if (
    keys.has("dive") &&
    keys.has("disappear") &&
    (keys.has("reappear") || keys.has("emerge"))
  ) {
    chains.push(
      "dive -> disappear -> delay/relocate -> " +
        (keys.has("reappear") ? "reappear" : "emerge"),
    );
  }

  if (keys.has("disappear") && (keys.has("reappear") || keys.has("emerge"))) {
    chains.push(
      "disappear -> delay/relocate -> " +
        (keys.has("reappear") ? "reappear" : "emerge"),
    );
  }

  if (keys.has("dive") && keys.has("ascent")) {
    chains.push("dive -> hidden travel -> ascent");
  }

  if (chains.length) {
    console.log(`\n[${petId}]`);
    for (const chain of chains) {
      console.log(`- ${chain}`);
    }
  }
}
