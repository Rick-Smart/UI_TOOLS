# Pet Authoring Guide

**Last updated:** 2026-03-05

Step-by-step instructions for adding a new pet or new sprite assets to the existing lineup. Follow every step in order — skipping any will result in the pet either not rendering or not appearing in the picker.

---

## Overview of Files Per Pet

Every pet requires exactly these files:

```
public/agent-pet/pets/{petId}/
  sprite.js        ← Sprite catalog entry (atlas path, shadow config, animation map)
  logic.js         ← Behavior profile (physics, pools, effects, capabilities)
  media/
    sheet.png      ← Sprite atlas (single PNG, all animation frames on a grid)
```

Optional (only for pets with custom behavior plugins):

```
  {id}Plugin.js    ← Pet-specific behavior plugin (e.g. beaver's foragePlugin.js)
```

---

## Step 1 — Prepare the Sprite Atlas

The engine renders from a single **sprite atlas** (spritesheet PNG). All animation frames for a pet must live on one sheet.

### Atlas conventions

| Rule                   | Detail                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Format                 | PNG with transparency (RGBA)                                                                                                   |
| Grid                   | Frames are not required to be uniform — each frame stores its own `x, y, w, h`                                                 |
| Facing                 | Sprite should face **right** by default (engine will flip for "left" movement). Document this in `sprite.js` as `atlas.facing` |
| Recommended frame size | 32×32 px or 64×64 px per frame at 1× (engine scales up via `DEFAULT_ATLAS_SCALE × PET_SIZE_MULTIPLIER`)                        |
| Sheet path             | `/agent-pet/pets/{petId}/media/sheet.png`                                                                                      |

### Importing sheets

Use the `crawl-import-sheets.ps1` script to scan a source folder of individual PNGs and pack them, or place the pre-built atlas manually. The sprite import manifest (`imports/sprite_import_manifest.json`) tracks all imported assets.

---

## Step 2 — Create `sprite.js`

Located at `pets/{petId}/sprite.js`. This is the **catalog entry** that the engine uses for rendering.

```js
// pets/my-pet/sprite.js
export const myPetSprite = {
  name: "My Pet", // Display name
  frameDuration: 6, // Default ticks per frame (1 tick ≈ 16.7ms at 60fps)
  sizeMultiplier: 1.0, // Optional: scale relative to other pets (default 1)

  atlas: {
    src: "/agent-pet/pets/my-pet/media/sheet.png",
    facing: "right", // Natural facing direction of the art
  },

  shadow: {
    groundOffset: 1, // px below the bottom of the visible sprite pixels
    groundWidthPad: 14, // how many px narrower than sprite width the shadow is
    airborneOffset: 14, // additional Y drop when airborne
    airborneWidthPad: 4,
    airborneActions: [], // list of actionKeys that trigger the airborne shadow state
    transitionSpeed: 0.18, // 0–1 lerp speed for shadow lift transitions
    // groundAnchorRatio: 0.9  // optional: override shadow Y anchor as ratio of spriteHeight
    // airborneAnchorRatio: 0.5
  },

  // frames: [] is only needed for pixel-art pets (no atlas). For atlas pets, omit it
  // or leave it as an empty array — the engine uses animations[] instead.

  animations: {
    // Key = animationKey (used throughout behavior profile + coordinator)
    // Must be lowercase-hyphen: "my-action-name"
    idle: {
      title: "Idle",
      category: "idle", // "idle" | "movement" | "interaction" | "celebration"
      playable: true,
      frames: [
        {
          x: 0,
          y: 0,
          w: 32,
          h: 32,
          ticks: 8,
          action: "Idle",
          actionKey: "idle",
          category: "idle",
        },
        {
          x: 32,
          y: 0,
          w: 32,
          h: 32,
          ticks: 8,
          action: "Idle",
          actionKey: "idle",
          category: "idle",
        },
        {
          x: 64,
          y: 0,
          w: 32,
          h: 32,
          ticks: 8,
          action: "Idle",
          actionKey: "idle",
          category: "idle",
        },
      ],
    },
    movement: {
      title: "Movement",
      category: "movement",
      playable: true,
      frames: [
        {
          x: 0,
          y: 32,
          w: 32,
          h: 32,
          ticks: 6,
          action: "Movement",
          actionKey: "movement",
          category: "movement",
        },
        {
          x: 32,
          y: 32,
          w: 32,
          h: 32,
          ticks: 6,
          action: "Movement",
          actionKey: "movement",
          category: "movement",
        },
        {
          x: 64,
          y: 32,
          w: 32,
          h: 32,
          ticks: 6,
          action: "Movement",
          actionKey: "movement",
          category: "movement",
        },
        {
          x: 96,
          y: 32,
          w: 32,
          h: 32,
          ticks: 6,
          action: "Movement",
          actionKey: "movement",
          category: "movement",
        },
      ],
    },
    // Add more animations following the same pattern...
  },
};
```

### Frame object fields

| Field       | Type   | Required | Notes                                                        |
| ----------- | ------ | -------- | ------------------------------------------------------------ |
| `x`         | number | ✅       | Left edge on the atlas sheet (pixels)                        |
| `y`         | number | ✅       | Top edge on the atlas sheet (pixels)                         |
| `w`         | number | ✅       | Frame width (pixels)                                         |
| `h`         | number | ✅       | Frame height (pixels)                                        |
| `ticks`     | number | ✅       | How many render ticks to hold this frame                     |
| `action`    | string | ✅       | Human-readable action name (e.g. "Movement")                 |
| `actionKey` | string | ✅       | Normalized key (lowercase-hyphen, matches animation map key) |
| `category`  | string | ✅       | Same category as the parent animation                        |

### Common `ticks` values

| Ticks | Approximate hold      |
| ----- | --------------------- |
| 4     | ~67ms — fast/snappy   |
| 6     | ~100ms — normal speed |
| 8     | ~133ms — relaxed      |
| 12    | ~200ms — slow/sleepy  |

---

## Step 3 — Create `logic.js`

Located at `pets/{petId}/logic.js`. This is the **behavior profile** — all tuning lives here and no pet-specific logic belongs in the core modules.

### Minimal profile (ground-walking pet, no special features)

```js
// pets/my-pet/logic.js
export const myPetBehavior = {
  driftX: 0.0006, // horizontal acceleration — controls how eagerly it moves
  driftY: 0.00048, // vertical acceleration
  maxSpeedX: 1.3, // pixels per frame
  maxSpeedY: 1.0,
  checklistPull: 0.0017, // pull force toward the checklist/form zone

  animationPools: {
    movement: ["movement"],
    idle: ["idle"],
    interaction: ["interaction"], // played when petting or during petting boosts
    celebration: ["movement"], // played on checklist milestone
  },

  playfulNature: {
    intervalMs: [6000, 12000], // how often to do a playful beat
    durationMs: [900, 1600], // how long the beat lasts
    activationChance: 0.6, // 0–1 probability of triggering when interval fires
    actionKeys: ["interaction", "idle"], // animations to pick from
  },

  taskCompletion: {
    triggerChance: 0.9,
    durationMs: [1200, 2000],
    actionKeys: ["movement", "interaction"],
  },

  stateMachine: {
    minHoldMsByReason: {
      idle: 2000,
      movement: 1200,
      playful: 1000,
      celebration: 1400,
      fallback: 1600,
    },
  },

  shadow: {
    // optional overrides — if omitted, sprite.js shadow config is used directly
  },
};
```

### Adding physics tuning

```js
// Slower, floatier pet
driftX: 0.0003,
driftY: 0.00025,
maxSpeedX: 0.9,
maxSpeedY: 0.7,
animationFrameDurationMultiplier: 1.3,  // slows all animations by 30%
```

### Adding particle effects

Add an `effects` block. Each key must match an effect handled by `effectScheduler.js`. Currently supported effects:

```js
effects: {
  // Floating Z bubbles during idle/sleep
  sleepZ: {
    enabled: true,
    color: "#a5b4fc",
    count: 3,
    cooldownMs: 1800,
    originXRatio: 0.7,  // X position as ratio of spriteWidth
    originYRatio: 0.2,  // Y position as ratio of spriteHeight
    velocityY: [-1.2, -0.4],
    velocityX: [-0.3, 0.3],
    lifespanMs: [900, 1600],
    radius: [3, 5],
  },

  // Splash when entering water
  diveSplash: {
    enabled: true,
    color: "#5da8c6",
    colorSecondary: "#98cee2",
    count: 24,
    cooldownMs: 520,
    originYOffsetRatio: 0.84,
  },

  // Dirt kicked up while digging
  digDirt: {
    enabled: true,
    color: "#a16207",
    colorSecondary: "#854d0e",
    count: 14,
    cooldownMs: 0,
  },

  // Wind streak during flight
  windTrail: {
    enabled: true,
    color: "rgba(186,230,253,0.55)",
    count: 5,
    cooldownMs: 120,
  },

  // Dust puff on landing from air
  landingDust: {
    enabled: true,
    color: "#d4c5a0",
    count: 10,
    cooldownMs: 400,
  },

  // Bubbles trailing behind fish
  bubbleTrail: {
    enabled: true,
    color: "rgba(186,230,253,0.7)",
    count: 2,
    cooldownMs: 280,
  },

  // Ripple when fish turns direction
  turnRipple: {
    enabled: true,
    color: "rgba(147,210,240,0.55)",
    count: 8,
    cooldownMs: 340,
  },

  // Bubble trail behind each fish follower
  pathTrace: {
    enabled: true,
    color: "rgba(147,210,240,0.45)",
    radius: 2.5,
    alpha: 0.45,
    fadeMs: 1200,
    maxPoints: 18,
    recordIntervalMs: 60,
  },
},
```

### Adding an Environment FSM (land/water pet)

```js
environmentFSM: {
  enabled: true,
  initial: "land",
  detector: {
    type: "y-threshold",
    thresholdRatio: 0.56,   // 0–1 ratio of canvas height — below this = water
    hysteresisPx: 20,        // prevents rapid flickering at boundary
    above: "land",
    below: "water",
  },
  environments: {
    land: {
      allowedKeys: ["idle", "movement", "jump"],
      allowLocomotion: true,
    },
    water: {
      allowedKeys: ["idle-water", "movement-water", "dive"],
      allowLocomotion: true,
    },
  },
  transitions: [
    { from: "land",  to: "water", key: "dive",   durationMs: [460, 760] },
    { from: "water", to: "land",  key: "ascent", durationMs: [460, 760] },
  ],
},
```

### Adding directional flight (bird)

```js
inFlightBoids: {
  enabled: true,
  actionKeys: ["my-pet-fly-s", "my-pet-fly-w", "my-pet-fly-nw", "my-pet-fly-sw", "my-pet-fly-n"],
},
boids: {
  neighborRadiusPx: 120,
  separationRadiusPx: 44,
  maxForce: 0.11,
  alignmentWeight: 0.86,
  cohesionWeight: 0.61,
  separationWeight: 1.05,
  edgeAvoidanceWeight: 1.08,
  minSpeed: 1.7,
  maxSpeed: 5.8,
  drag: 0.985,
  edgeAvoidanceMarginPx: 156,
  edgeAvoidanceMaxForce: 0.19,
},
directionalFlight: {
  enabled: true,
  minSpeed: 0.18,
  disableTilt: true,
  actionKeys: ["my-pet-fly-s", "my-pet-fly-w", "my-pet-fly-nw", "my-pet-fly-sw", "my-pet-fly-n"],
  northKey:     "my-pet-fly-n",
  southKey:     "my-pet-fly-s",
  westKey:      "my-pet-fly-w",
  northWestKey: "my-pet-fly-nw",
  southWestKey: "my-pet-fly-sw",
  mirrorEast:   true,    // mirror west animations for east movement
},
animationPools: {
  movement:    ["my-pet-fly-w", "my-pet-fly-s", "my-pet-fly-sw", "my-pet-fly-nw", "my-pet-fly-n"],
  idle:        ["my-pet-idle"],
  interaction: ["my-pet-bothered"],
  celebration: ["my-pet-fly-nw", "my-pet-fly-sw"],
},
locomotion: {
  forceAllowKeys: ["my-pet-fly-s", "my-pet-fly-w", "my-pet-fly-sw", "my-pet-fly-nw", "my-pet-fly-n"],
  forceDenyKeys:  ["my-pet-idle"],
},
```

---

## Step 4 — Register the Pet

### 4a. Register in `pets/sprites.js`

```js
// Add import at the top
import { myPetSprite } from "./my-pet/sprite.js";

// Add to PET_SPRITES object
export const PET_SPRITES = {
  // ...existing pets...
  "my-pet": myPetSprite,
};
```

### 4b. Register in `pets/index.js`

```js
// Add import at the top
import { myPetBehavior } from "./my-pet/logic.js";

// Add to PET_BEHAVIOR_PROFILES
const PET_BEHAVIOR_PROFILES = {
  // ...existing profiles...
  "my-pet": myPetBehavior,
};
```

> The `petId` key used here must match exactly in both registries and must match any references in `sequenceManager.js` if the pet has sequences.

---

## Step 5 — (Optional) Add a Multi-Stage Sequence

If the pet needs a disappear/reappear or teleport sequence, add it to `core/sequenceManager.js`:

```js
export const PET_SEQUENCE_RULES = {
  // ...existing rules...
  "my-pet": {
    id: "my-sequence",
    startChance: 0.4, // probability each check window
    checkWindowMs: [3000, 5000], // how often to check
    cooldownMs: [12000, 20000], // minimum gap between sequences
    stages: [
      { name: "prepare", animationKey: "my-prepare-anim", loops: 1 },
      { name: "vanish", animationKey: "my-vanish-anim", loops: 1 },
      {
        name: "travel",
        hidden: true, // sprite is hidden during this stage
        holdMs: [400, 900],
        relocate: true, // engine moves pet to a new random position
      },
      { name: "appear", animationKey: "my-appear-anim", loops: 1 },
    ],
  },
};
```

Stage fields:

| Field                 | Type                 | Notes                                                          |
| --------------------- | -------------------- | -------------------------------------------------------------- |
| `name`                | string               | Identifier for debug logging                                   |
| `animationKey`        | string               | Animation to play during this stage                            |
| `loops`               | number or [min, max] | How many animation loops before advancing                      |
| `holdMs`              | [min, max]           | Additional hold time (optional)                                |
| `hidden`              | boolean              | If true, sprite is not drawn                                   |
| `relocate`            | boolean              | If true, engine will pick a new position during this stage     |
| `requiredEnvironment` | string or string[]   | Only start this stage if environment matches                   |
| `sequenceOnly`        | boolean              | If true, this animation key cannot be played outside sequences |

---

## Step 6 — (Optional) Add a Behavior Plugin

For complex pet-specific behaviors that go beyond what the behavior profile config can express (like beaver's log-forage 4-phase state machine), create a plugin:

```js
// pets/my-pet/myPlugin.js
export function createMyPlugin({ canvas, nextRandom, pickInRange }) {
  // internal state...

  function step({
    now,
    behaviorProfile,
    position,
    lastBounds,
    currentActionKey,
    movementActive,
    atlasImage,
  }) {
    // returns { pendingEffects: [], myPropState: null, wantsMovement: false }
  }

  function reset() {
    // clear all internal state
  }

  return { step, reset };
}
```

Register in `pets/index.js`:

```js
import { createMyPlugin } from "./my-pet/myPlugin.js";

const PET_PLUGINS = {
  beaver: createForagePlugin,
  "my-pet": createMyPlugin, // add here
};
```

The coordinator (`behaviorCoordinator.js`) already calls `getPetPlugin(petId)` and invokes `.step()` each frame. Review the beaver plugin integration in `behaviorCoordinator.js` to understand what fields the coordinator reads back from the plugin result.

---

## Step 7 — Verify

1. Start dev server: `npm run dev`
2. Open `http://localhost:5173/agent-pet/` (or click the pet panel in the UI)
3. Open browser DevTools console — watch for any import or runtime errors
4. Switch to your new pet in the pet picker
5. Check that:
   - Sprite renders at the correct scale
   - Movement animations play and the pet bounces around
   - Idle animation plays when the pet stops
   - Shadow appears and follows the sprite
   - Particles fire (if configured)
   - Petting (clicking the sprite) triggers `pettingUntil` and pauses movement
6. Open the debug/tuning panel (enabled in `main.js` by setting `shouldShowDebugOverlay()` to `true`) to inspect: `animationKey`, `reason`, `speed`, `routeZone`, `frameIndex`

---

## Animating Existing Pets — Adding New Animations

To add a new animation to an existing pet without adding a whole new pet:

1. Add frames to the sprite atlas sheet (`media/sheet.png`)
2. Add the animation entry to `pets/{petId}/sprite.js` under `animations`
3. Add the new `animationKey` to the appropriate pool(s) in `pets/{petId}/logic.js` (`animationPools.movement`, `.idle`, `.interaction`, or `.celebration`)
4. If the animation should only play during sequences: add `sequenceOnly: true` in the sprite entry and reference the key in a sequence stage in `sequenceManager.js`
5. If the animation triggers airborne shadow: add the `actionKey` to `sprite.shadow.airborneActions`

---

## animationKey Naming Convention

Animation keys must be **lowercase and hyphen-separated**. The engine normalizes all keys through `toActionKey()`:

```
"My Movement"  →  "my-movement"
"IDLE_WATER"   →  "idle-water"
"fly S"        →  "fly-s"
```

Keys must be **consistent** across:

- `sprite.js` animations map keys
- Each frame's `actionKey` field
- `logic.js` pool arrays
- `logic.js` directional flight / inFlightBoids / locomotion arrays
- Any sequence stage `animationKey` references
- Any effect `actionKey` trigger references in `effectScheduler.js`

---

## Asset Checklist

Before opening a PR for a new pet, verify all items:

- [ ] `media/sheet.png` committed
- [ ] `sprite.js` — all animations have correct `x/y/w/h` coordinates on the sheet
- [ ] `sprite.js` — every frame has `ticks`, `action`, `actionKey`, `category`
- [ ] `logic.js` — all animation pool keys exist in `sprite.js animations`
- [ ] `pets/sprites.js` — import + entry added
- [ ] `pets/index.js` — import + entry added
- [ ] `sequenceManager.js` — entry added (if sequences used)
- [ ] `pets/index.js` PET_PLUGINS — plugin registered (if plugin used)
- [ ] Dev server: no console errors
- [ ] Pet is visible and animating in the pet iframe
- [ ] Switching away and back resets cleanly (no leftover particles, no frozen state)
