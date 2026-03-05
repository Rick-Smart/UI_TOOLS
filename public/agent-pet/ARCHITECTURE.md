# Agent Pet Engine — Architecture

**Last updated:** 2026-03-05  
**Engine version:** post-refactor (petEngine.js ~1,059 lines)

---

## High-Level Overview

The pet engine is a self-contained canvas animation system embedded inside the AZDES UI Tools as an `<iframe>`. It renders a living companion that reacts to the agent's current route, checklist progress, and user interaction. No React, no bundler — plain ES modules served directly from `public/agent-pet/`.

Each animation frame the engine:

1. Reads app state (`getState`, `getContext`) injected at startup
2. Asks the **Behavior Coordinator** what animation to play and what effects to emit
3. Updates **Motion** (position, velocity, bouncing)
4. Steps the **Flock System** (fish school / bird boids)
5. Resolves the correct sprite frame from the **Atlas**
6. Emits and draws **Particles**
7. Draws shadow, optional prop (beaver log), main sprite, flock followers

---

## Module Map

```
public/agent-pet/
│
├── main.js                  Entry point — mounts canvas, wires state, starts engine
├── petState.js              Reads localStorage → { selectedPetId, points, mood, level }
├── petCatalog.js            Re-exports PET_SPRITES as PET_CATALOG
├── petEngine.js             ← Orchestrator. ~1,059 lines. One rAF loop.
│
├── core/
│   ├── behaviorCoordinator.js  All behavioral decisions (FSM, sequences, schedules)
│   ├── effectScheduler.js      7 particle-effect timing clocks (data-driven)
│   ├── flockSystem.js          Fish school + bird boid simulation + path traces
│   ├── motionController.js     Position/velocity physics + checklist milestone boosts
│   ├── atlasUtils.js           Atlas image cache, frame metrics, transformed draw
│   ├── particleSystem.js       Burst emit, tick update, canvas draw for particles
│   ├── animationSelector.js    Pure function — picks animation key from pools
│   ├── environmentFSM.js       Land/water environment state machine helpers
│   ├── sequenceManager.js      Multi-stage sequence definitions + runtime helpers
│   ├── rendering.js            drawAtlasFrame, drawPixelSprite
│   └── effectsSystem.js        (legacy — shared effect shape constants)
│
├── behaviors/
│   └── zones.js             Route → PET_ROUTE_ZONE mapping
│
└── pets/
    ├── index.js             Registry: petId → behaviorProfile, petId → plugin factory
    ├── sprites.js           Registry: petId → spriteDefinition (catalog)
    │
    ├── {petId}/
    │   ├── sprite.js        Sprite catalog entry (atlas src, shadow, animations map)
    │   ├── logic.js         Behavior profile (pools, physics tuning, effects config)
    │   ├── media/           sheet.png (sprite atlas)
    │   └── foragePlugin.js  (beaver only) — pet-specific behavior plugin
    │
    └── ...
```

---

## Data Flow — One Frame

```
getState() ──────────────┐
getContext() ────────────┤
                         ▼
                   petEngine.js  render()
                         │
                         ├─► [pet switch?] → coordinator.reset() + flockSystem.reset()
                         │
                         ├─► Fish species scoping (filter behaviorProfile pools)
                         │
                         ▼
              coordinator.step(inputs)
              ┌───────────────────────────────────────────────────────┐
              │  behaviorCoordinator.js                               │
              │                                                       │
              │  environmentFSM ──► allowed animation keys            │
              │  sequenceManager ──► active sequence stage            │
              │  animationSelector ──► selectedAnimationKey           │
              │  effectScheduler.step() ──► pendingEffects[]         │
              │  foragePlugin.step() ──► beaverLogCycleProp + effects │
              └───────────────────────────────────────────────────────┘
                         │
                         ▼
              updateMotionState()
              ┌───────────────────────────────┐
              │  motionController.js          │
              │  Physics: drift, bounce, pull │
              │  Milestone burst detection    │
              └───────────────────────────────┘
                         │
                         ▼
              flockSystem step (fish or bird boids)
              ┌───────────────────────────────┐
              │  flockSystem.js               │
              │  ensureFollowers              │
              │  stepLead / stepFollowers     │
              │  updateLeadPathTrace          │
              └───────────────────────────────┘
                         │
                         ▼
              Resolve frame index (atlasUtils.resolveFrameIndexByTicks)
                         │
                         ▼
              Emit pendingEffects → particleSystem.emitParticleBurst()
                         │
                         ▼
              DRAW ──────────────────────────────────────────────
              │  flockSystem.drawTraces (fish path bubble trails) │
              │  Shadow rectangle                                 │
              │  Beaver log prop (optional)                       │
              │  Main sprite (drawAtlasFrameTransformed or        │
              │               drawAtlasFrame or drawPixelSprite)  │
              │  Fish school followers (sorted by Y depth)        │
              │  particleSystem.drawParticles()  ← always drawn   │
              └───────────────────────────────────────────────────
                         │
                         ▼
              onDebugFrame callback (optional)
              frame += 1 → requestAnimationFrame(render)
```

---

## Module Responsibilities

### `petEngine.js` — Orchestrator

- Creates and holds: `coordinator`, `flockSystem`
- Owns: `position`, `velocity`, `facingDirection`, `activeAnimationKey`, `shadowLift`, `sceneEffectParticles`, `fishVariantSpeciesKey`, tilt smoothing vars
- Performs: fish species scoping, flock gating, shadow geometry, sprite flipping/tilt, debug callback
- Does **not** own: sequence state, environment state, scheduler clocks, boid state, animation pool state, effect timing — all delegated

### `core/behaviorCoordinator.js` — Brain

Single stateful object (`createBehaviorCoordinator`). Called once per frame, returns a `decision` object:

| return field                                                      | meaning                                          |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| `selectedAnimationKey`                                            | what animation to play                           |
| `locomotionAllowed`                                               | whether motion is permitted this frame           |
| `sequenceHiddenStage`                                             | hide the sprite (e.g. beaver underwater)         |
| `hasActiveSequence`                                               | suppress movement while in multi-stage sequence  |
| `pendingEffects[]`                                                | particle bursts to emit                          |
| `beaverLogCycleProp`                                              | log prop position/alpha/frame                    |
| `overrideTarget` / `overrideTargetPull`                           | motion target injected by coordinator            |
| `currentActionKey`                                                | normalized action key (for shadow airborne test) |
| `isBirdInFlightAction` / `isFlightBoidsPet`                       | boid gating                                      |
| `directionalFlightForceFlip` / `directionalFlightDisableTilt`     | sprite flip logic                                |
| `allowMovementByEnvironment`                                      | environment FSM gate                             |
| `beaverCycleWantsMovement` / `environmentTransitionForceMovement` | movement overrides                               |
| `animationReason`                                                 | debug: why this animation was selected           |

The coordinator internally delegates to:

- **`environmentFSM`** — determines land vs. water for beaver, restricts allowed keys
- **`sequenceManager`** — multi-stage sequences (ferret burrow, chameleon camo, beaver dive)
- **`animationSelector`** — pure pool/priority picker
- **`effectScheduler`** — all effect timing clocks
- **`foragePlugin`** (beaver) — 4-phase log-forage state machine

### `core/effectScheduler.js` — Particle Clocks

Stateful. Called inside coordinator. Owns 7 timing variables covering: sleep-Z bubbles, dive splash, dig dirt, wind trail, landing dust, fish bubble trail, fish turn ripple. Reads config entirely from `behaviorProfile.effects.*`. No pet-id hardcoding.

### `core/flockSystem.js` — Boid Simulation

Stateful (`createFlockSystem`). Manages:

- **Fish school**: N followers with boid forces + frame offsets + per-follower bubble timers
- **Bird boids**: single lead entity steered by boid forces (no followers drawn separately)
- **Path traces**: lead + per-follower bubble-trail point arrays

API: `ensureFollowers`, `stepLead`, `stepFollowers`, `getFollowers`, `updateLeadPathTrace`, `updateFollowerPathTraces`, `drawTraces`, `reset`

### `core/motionController.js` — Physics

Pure-ish function (no closure state, takes all state in, returns updated values). Handles:

- Drift + velocity cap
- Viewport bounce with padding zones
- `overrideTarget` pull (coordinator-directed movement)
- Route-zone positioning constraints
- Checklist milestone detection → emits `pendingMilestoneEmotionBursts`

### `core/atlasUtils.js` — Sprite Atlas

Stateless (module-level cache Map). Provides:

- `getAtlasImage(src)` — loads/caches `<img>` elements
- `getAtlasFrameMetrics(image, frameRect, src)` — pixel-walk for visible bounds (shadow geometry)
- `resolveFrameIndexByTicks(frames, tick, duration, opts)` — tick-based multi-duration frame index
- `drawAtlasFrameTransformed(ctx, image, rect, x, y, scale, {flipHorizontal, rotationRad})` — tilt/flip draw

### `core/particleSystem.js` — Particles

Pure functions for stateless particle lifecycle:

- `emitParticleBurst(particles, options, nextRandom)` — adds N particles with randomized velocity/color/life
- `updateParticles(particles, deltaMs)` — physics tick, prune dead
- `drawParticles(ctx, particles)` — renders each particle

### `core/sequenceManager.js` — Multi-Stage Sequences

Pure data + helper functions. `PET_SEQUENCE_RULES` defines multi-stage sequences for ferret, chameleon, beaver. The coordinator drives runtime execution; this module provides rule lookup and stage duration resolution.

### `core/animationSelector.js` — Animation Priority

Pure function. Picks an animation key given pools, weights, context flags (isPetting, wantsMovement, milestone boost, allTenSteps, playful beat). No side effects.

### `core/environmentFSM.js` — Environment State Machine

Pure helpers. Reads `behaviorProfile.environmentFSM` to determine allowed animation keys per environment (land/water) and transition specs.

### `behaviors/zones.js` — Route Zones

Maps the current `pathname` to a `PET_ROUTE_ZONE`:

| Zone            | Pathname pattern   | Pet behavior           |
| --------------- | ------------------ | ---------------------- |
| `LEFT_ASSIST`   | `/call-handling`   | Follows checklist pull |
| `RIGHT_SUMMARY` | `/work-search-log` | Roams right side       |
| `HEADER_PERCH`  | `/quick-reference` | Stays near top         |
| `BOTTOM_ROAM`   | Forms/calculators  | Bounded to bottom      |
| `ROAM_FREE`     | Everything else    | Full viewport bounce   |

---

## State Lifecycle — Pet Switch

When `state.selectedPetId` changes:

```
currentPetId = newId
reseedForPet(newId)          ← new PRNG seed from petId + timestamp
pendingMilestoneEmotionBursts = 0
sceneEffectParticles = []    ← clear particles
fishVariantSpeciesKey = ""   ← reset fish species rotation
fishVisualTiltRad = 0
birdVisualTiltRad = 0
coordinator.reset(newId, now)
flockSystem.reset()
```

---

## Sprite Format

Each pet's `sprite.js` exports an object matching this shape:

```js
{
  name: "Beaver",
  frameDuration: 6,           // ticks per frame (fallback if frame has no .ticks)
  sizeMultiplier: 1.0,        // optional — scales rendered size
  atlas: {
    src: "/agent-pet/pets/{id}/media/sheet.png",
    scale: 2,                 // unused by engine (engine uses DEFAULT_ATLAS_SCALE * PET_SIZE_MULTIPLIER)
    facing: "right"           // which direction the sprite naturally faces
  },
  shadow: {
    groundOffset: 1,          // px below sprite bottom
    groundWidthPad: 14,       // px narrower than sprite width
    airborneOffset: 14,
    airborneWidthPad: 4,
    airborneActions: [],      // actionKeys that trigger flight shadow lift
    transitionSpeed: 0.18,    // lerp speed for shadow lift
    groundAnchorRatio: null,  // optional: 0-1 ratio of spriteHeight for shadow Y anchor
    airborneAnchorRatio: null
  },
  frames: [...],              // flat array of all frames (fallback if no animations)
  animations: {
    "{animationKey}": {
      title: "Movement",      // human-readable (used in debug)
      category: "movement",   // "movement" | "idle" | "interaction" | "celebration"
      playable: true,
      holdOnLastFrame: false, // optional
      frames: [
        { x, y, w, h, ticks, action, actionKey, category }
      ]
    }
  }
}
```

---

## Behavior Profile Format

Each pet's `logic.js` exports a behavior profile. All fields are optional (engine defaults gracefully):

```js
{
  // ── Motion ──────────────────────────────────────────────────────────────
  capabilities: {
    propForage: true,    // activates beaver log-forage plugin
    schooling: true,     // activates fish school followers
  },
  driftX: 0.0006,        // horizontal acceleration per frame
  driftY: 0.00048,       // vertical acceleration per frame
  maxSpeedX: 1.3,
  maxSpeedY: 1.0,
  checklistPull: 0.0017, // pull force toward checklist zone
  animationFrameDurationMultiplier: 1.0, // scales frameDuration from sprite.js

  movementStyle: {
    mode: "arcdrift" | "naturalswim",  // optional alternate physics modes
    overrideRouteMotion: true,
    pathModel: "sinecruise",           // for naturalswim mode
  },

  // ── Animation Pools ─────────────────────────────────────────────────────
  animationPools: {
    movement: ["movement", "movement-water"],
    idle: ["idle"],
    interaction: ["bite"],
    celebration: ["movement-water-with-stick"],
  },
  animationPoolWeights: {       // optional per-key weights within a pool
    idle: { "idle-forward": 9, "idle-away": 1 },
  },

  // ── Playful Beat ────────────────────────────────────────────────────────
  playfulNature: {
    intervalMs: [5200, 10200],  // random range
    durationMs: [900, 1750],
    activationChance: 0.66,
    actionKeys: ["bite", "idle-water"],
  },

  // ── Task Completion ──────────────────────────────────────────────────────
  taskCompletion: {
    triggerChance: 0.94,
    durationMs: [1200, 2200],
    actionKeys: ["bite", "ascent"],
  },

  // ── State Machine Hold Times ─────────────────────────────────────────────
  stateMachine: {
    minHoldMsByReason: {
      idle: 1900, movement: 1150, playful: 1000, celebration: 1350, fallback: 1500
    },
  },

  // ── Environment FSM (beaver, etc.) ───────────────────────────────────────
  environmentFSM: {
    enabled: true,
    initial: "land",
    detector: {
      type: "y-threshold",
      thresholdRatio: 0.56,
      hysteresisPx: 20,
      above: "land",
      below: "water",
    },
    environments: {
      land: { allowedKeys: ["idle", "movement"], allowLocomotion: true },
      water: { allowedKeys: ["idle-water", "movement-water"], allowLocomotion: true },
    },
    transitions: [
      { from: "land", to: "water", key: "dive", durationMs: [460, 760] },
    ],
  },

  // ── Multi-Stage Sequences ────────────────────────────────────────────────
  // Defined in core/sequenceManager.js (PET_SEQUENCE_RULES), not in logic.js
  // The coordinator reads sequenceManager by petId.

  // ── Directional Flight (crow, seagull) ───────────────────────────────────
  directionalFlight: {
    enabled: true,
    minSpeed: 0.18,
    disableTilt: true,
    actionKeys: ["crow-fly-s", "crow-fly-w", ...],
    northKey: "crow-fly-n", southKey: "crow-fly-s",
    westKey:  "crow-fly-w",
    northWestKey: "crow-fly-nw", southWestKey: "crow-fly-sw",
    mirrorEast: true,
  },

  // ── Flight Boids (crow, seagull) ─────────────────────────────────────────
  inFlightBoids: {
    enabled: true,
    actionKeys: ["crow-fly-s", "crow-fly-w", ...],
  },
  boids: {
    neighborRadiusPx: 118, separationRadiusPx: 44,
    maxForce: 0.11,
    alignmentWeight: 0.86, cohesionWeight: 0.61, separationWeight: 1.05,
    edgeAvoidanceWeight: 1.08,
    minSpeed: 1.7, maxSpeed: 5.8, drag: 0.985,
    edgeAvoidanceMarginPx: 156, edgeAvoidanceMaxForce: 0.19,
  },

  // ── Fish Schooling ────────────────────────────────────────────────────────
  schooling: {
    sizeRange: [4, 7],               // number of followers
    followerScaleRange: [0.3, 0.55],
    followerMinVisualWidthPx: 15,
    useBoids: true,
    boidLeaderPullWeight: 0.4,
    boidEnforceMinSpeed: true,
    boidMaxForce: 0.085,
    boidAlignmentWeight: 0.9,
    boidCohesionWeight: 0.7,
    boidSeparationWeight: 1.4,
    minSpeed: 0.68,
  },

  // ── Particle Effects ─────────────────────────────────────────────────────
  // Each key corresponds to an effect type handled by effectScheduler.js
  effects: {
    sleepZ:      { enabled, color, count, cooldownMs, ... },
    diveSplash:  { enabled, color, colorSecondary, count, cooldownMs, originYOffsetRatio, ... },
    digDirt:     { enabled, color, count, ... },
    windTrail:   { enabled, color, count, cooldownMs, ... },
    landingDust: { enabled, color, count, cooldownMs, ... },
    bubbleTrail: { enabled, color, count, cooldownMs, ... },
    turnRipple:  { enabled, color, count, cooldownMs, ... },
    pathTrace:   { enabled, color, alpha, radius, fadeMs, maxPoints, ... },
  },

  // ── Locomotion Overrides ──────────────────────────────────────────────────
  locomotion: {
    forceAllowKeys: ["crow-fly-s"],   // always allow movement during these
    forceDenyKeys:  ["crow-idle-forward"],  // never allow movement during these
  },

  // ── Log Forage (beaver only — reads profile.logForage) ───────────────────
  logForage: {
    enabled: true,
    intervalMs: [18000, 32000],
    approachTimeoutMs: [3200, 5200],
    approachReachPx: 12,
    collectHoldMs: [900, 1600],
    departTimeoutMs: [2600, 4200],
    fadeInMs: [220, 460],
    fadeMs: [1300, 2200],
    edgeInsetX: 36, edgeBandWidth: 120,
    bottomBandHeight: 96, bottomUiClearancePx: 74,
    propFrame: { x: 32, y: 160, w: 32, h: 32 },
  },
}
```

---

## PRNG

The engine uses a deterministic Mulberry32 PRNG seeded per-pet per-session:

```js
randomState = hashStringSeed(`${petId}|${Date.now()}`);
```

All randomness (`nextRandom()`) flows through this single stream, ensuring reproducible — but session-unique — behavior per pet. `pickInRange([min, max])` is the convenience wrapper for range values.

---

## Integration Point — `main.js`

```js
const engine = createPetEngine(canvas, getState, getContext, {
  getTuning: () => tuningPanel.getTuning(),
  onDebugFrame: (data) => {
    /* update debug overlay */
  },
  onRuntimeError: ({ message, detail, petId }) => {
    /* log */
  },
});
engine.start();
```

The host page (`public/agent-pet/index.html`) communicates with the React app via `petBridge.js` (`src/utils/petBridge.js`), which posts `context` updates through the iframe.

---

## Sequence System

Three pets have multi-stage sequences defined in `core/sequenceManager.js`:

| Pet       | Sequence ID  | Stages                                               |
| --------- | ------------ | ---------------------------------------------------- |
| Ferret    | `burrow-hop` | dig → disappear → travel (hidden, relocate) → emerge |
| Chameleon | `camo-shift` | disappear → travel (hidden, relocate) → reappear     |
| Beaver    | `dive-hop`   | swim → dive → travel (hidden, relocate) → ascent     |

During a `hidden` stage, `sequenceHiddenStage = true` and the sprite is not drawn, but particles continue rendering.

---

## Adding New Features Checklist

| Feature type                     | Where to add                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| New particle effect              | Add config block to `behaviorProfile.effects`, add clock + handler to `effectScheduler.js`                   |
| New multi-stage sequence         | Add entry to `PET_SEQUENCE_RULES` in `sequenceManager.js`                                                    |
| New environment (land/water/air) | Add to `behaviorProfile.environmentFSM.environments`, update `environmentFSM.js` if new detector type needed |
| New movement physics mode        | Add to `motionController.js` (new `movementStyle.mode` branch)                                               |
| New directional flight pet       | Copy crow/seagull `directionalFlight` + `inFlightBoids` blocks into `logic.js`                               |
| New pet-specific behavior plugin | Create `pets/{id}/plugin.js`, register in `pets/index.js` `PET_PLUGINS`, handle in `behaviorCoordinator.js`  |
| New animation pool               | Add key to `behaviorProfile.animationPools`, add animation frames in `sprite.js`                             |
| New boid parameter               | Add to `behaviorProfile.boids`, read in `flockSystem.js`                                                     |
