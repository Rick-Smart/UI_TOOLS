# Pet Animation Systems

**Last updated:** 2026-03-05  
Reference for every animation playback technique available in the pet engine. All of these work on any pet without touching core engine code — they are authored entirely in `sprite.js` and `logic.js`.

---

## Table of Contents

1. [Standard Looping](#1-standard-looping)
2. [Per-Frame Variable Speed](#2-per-frame-variable-speed)
3. [Hold on Last Frame](#3-hold-on-last-frame)
4. [Segmented Playback — forward, pingpong, hold](#4-segmented-playback)
5. [Multi-Stage Sequences](#5-multi-stage-sequences)
6. [Behavior Pools — when animations are chosen](#6-behavior-pools)
7. [Playful Beats](#7-playful-beats)
8. [Task Completion Burst](#8-task-completion-burst)
9. [Environment FSM Gating](#9-environment-fsm-gating)

---

## 1. Standard Looping

**What it does:** Plays all frames in order, wraps at the end, loops indefinitely.  
**Where to use:** Movement, idle breathing, ambient animations.

```js
// sprite.js
"fox-walk": {
  title: "Fox Walk",
  category: "movement",
  playable: true,
  frames: [
    { x: 0,   y: 384, w: 64, h: 64, ticks: 6, action: "Fox Walk", actionKey: "fox-walk", category: "movement" },
    { x: 64,  y: 384, w: 64, h: 64, ticks: 6, action: "Fox Walk", actionKey: "fox-walk", category: "movement" },
    { x: 128, y: 384, w: 64, h: 64, ticks: 6, action: "Fox Walk", actionKey: "fox-walk", category: "movement" },
    { x: 192, y: 384, w: 64, h: 64, ticks: 6, action: "Fox Walk", actionKey: "fox-walk", category: "movement" },
  ],
},
```

**How it works:**  
The engine advances `activeAnimationTick` by `deltaMs / (1000/60)` each frame — normalised to 60fps ticks. At 60fps this is exactly 1 per frame, at 30fps it is ~2, at 120fps it is ~0.5. `resolveFrameIndexByTicks` walks the frame array by accumulated ticks and wraps with `% totalTicks`, so animation speed is consistent across all frame rates.

**Common `ticks` values:**

| Ticks | Approx hold | Feel          |
| ----- | ----------- | ------------- |
| 4     | ~67ms       | Fast / snappy |
| 6     | ~100ms      | Normal        |
| 8     | ~133ms      | Relaxed       |
| 12    | ~200ms      | Slow / sleepy |
| 24    | ~400ms      | Very slow     |

---

## 2. Per-Frame Variable Speed

**What it does:** Each frame holds for a different number of ticks, giving slow-in, slow-out, or accent beats within one animation.  
**Where to use:** Jump arcs, snappy interactions, breathing cycles.

```js
"fox-inspect": {
  title: "Fox Inspect",
  category: "interaction",
  playable: true,
  frames: [
    { x: 0,   y: 448, w: 64, h: 64, ticks: 10, action: "Fox Inspect", actionKey: "fox-inspect", category: "interaction" }, // slow start — head lowers
    { x: 64,  y: 448, w: 64, h: 64, ticks: 6,  action: "Fox Inspect", actionKey: "fox-inspect", category: "interaction" },
    { x: 128, y: 448, w: 64, h: 64, ticks: 6,  action: "Fox Inspect", actionKey: "fox-inspect", category: "interaction" },
    { x: 192, y: 448, w: 64, h: 64, ticks: 4,  action: "Fox Inspect", actionKey: "fox-inspect", category: "interaction" }, // fast sniff
    { x: 256, y: 448, w: 64, h: 64, ticks: 4,  action: "Fox Inspect", actionKey: "fox-inspect", category: "interaction" },
    { x: 320, y: 448, w: 64, h: 64, ticks: 10, action: "Fox Inspect", actionKey: "fox-inspect", category: "interaction" }, // slow settle
  ],
},
```

Mix any combination — `ticks` can vary per frame, including the same frame appearing multiple times in the array with different ticks values.

---

## 3. Hold on Last Frame

**What it does:** When the animation reaches its final frame it freezes there instead of looping. The coordinator then decides when to move to the next animation (based on sequence stage completion or min-hold time).  
**Where to use:** Transition-out poses, sequence entry/exit animations.

```js
"fox-stand-to-lie": {
  title: "Fox Stand To Lie",
  category: "interaction",
  playable: true,
  holdOnLastFrame: true,   // ← add this
  frames: [
    { x: 0,   y: 192, w: 64, h: 64, ticks: 6, ... },
    { x: 64,  y: 192, w: 64, h: 64, ticks: 6, ... },
    { x: 128, y: 192, w: 64, h: 64, ticks: 6, ... },
    { x: 192, y: 192, w: 64, h: 64, ticks: 6, ... },
    { x: 256, y: 192, w: 64, h: 64, ticks: 8, ... }, // ← freezes here
  ],
},
```

**Note:** Without `holdOnLastFrame`, the animation loops. With it, it exits cleanly to the last pose and waits. Pair this with the sequence system for controlled multi-step flows.

---

## 4. Segmented Playback

**What it does:** Divides one animation's frames into named segments, each independently controlling which frames play, in what order, and for how many cycles.  
**Where to use:** Any animation that has a distinct intro → loop → outro structure. No new sprite frames required — segments reference existing frame indices.

### Segment fields

| Field             | Type                        | Required | Description                                                                  |
| ----------------- | --------------------------- | -------- | ---------------------------------------------------------------------------- |
| `frameIndices`    | number[]                    | ✅       | Which frame indices (0-based) from the animation's `frames` array to include |
| `mode`            | `"forward"` \| `"pingpong"` | ✅       | Playback direction (see below)                                               |
| `loops`           | number                      | ✅       | How many complete cycles of this segment to play                             |
| `holdOnLastFrame` | boolean                     | ❌       | If true on the last segment, freezes at the final frame instead of looping   |

### Modes

**`"forward"`** — plays `frameIndices` in listed order, once per loop.  
`[0, 1, 2]` × 2 loops → `0, 1, 2, 0, 1, 2`

**`"pingpong"`** — seamless bounce, inner frames reflected.  
`[3, 4, 5]` × 3 loops → `3, 4, 5, 4,  3, 4, 5, 4,  3, 4, 5, 4`  
Always exits at the start of the range (frame 3 in this example).

> For a 2-frame range, pingpong degrades to a simple forward loop. For a 1-frame range, it holds that frame.

> **Where `segments` lives:** `segments` is defined on the animation entry in `sprite.js`, alongside `frames`. Nothing in `logic.js` needs to change to use segmented playback.

### Example — Fox Inspect with head-lower → sniff loop → head-raise

```js
// sprite.js
"fox-inspect": {
  title: "Fox Inspect",
  category: "interaction",
  playable: true,
  segments: [
    // Intro: head lowers (frames 0–2, plays once)
    { frameIndices: [0, 1, 2], mode: "forward",  loops: 1 },
    // Loop: sniff back and forth (frames 3–5, 3 full pingpong cycles)
    { frameIndices: [3, 4, 5], mode: "pingpong", loops: 3 },
    // Outro: head rises back to standing (frames 2–0, plays once, then freezes)
    { frameIndices: [2, 1, 0], mode: "forward",  loops: 1, holdOnLastFrame: true },
  ],
  frames: [
    { x: 0,   y: 448, w: 64, h: 64, ticks: 8, ... }, // 0 — head up
    { x: 64,  y: 448, w: 64, h: 64, ticks: 6, ... }, // 1
    { x: 128, y: 448, w: 64, h: 64, ticks: 6, ... }, // 2 — head midway
    { x: 192, y: 448, w: 64, h: 64, ticks: 5, ... }, // 3 — head down, sniff start
    { x: 256, y: 448, w: 64, h: 64, ticks: 5, ... }, // 4
    { x: 320, y: 448, w: 64, h: 64, ticks: 5, ... }, // 5 — sniff far end
  ],
},
```

### Exiting the ping-pong from the far end instead

By default `pingpong` always exits at `frameIndices[0]`. To exit from `frameIndices[last]`, walk across it manually after the loop:

```js
segments: [
  { frameIndices: [0, 1, 2],    mode: "forward",  loops: 1 },  // intro
  { frameIndices: [3, 4, 5],    mode: "pingpong", loops: 3 },  // exits at 3
  { frameIndices: [4, 5],       mode: "forward",  loops: 1 },  // walk to far end
  { frameIndices: [4, 3, 2, 1, 0], mode: "forward", loops: 1, holdOnLastFrame: true }, // outro from 5
],
```

### Infinite loop of just a subset of frames

Leave out the outro segment — the last segment loops forever:

```js
segments: [
  { frameIndices: [0, 1, 2], mode: "forward",  loops: 1 },   // intro plays once
  { frameIndices: [3, 4, 5], mode: "pingpong", loops: 1 },   // this loops forever
],
```

The engine loops the last segment indefinitely when there is no further segment to advance to.

### Combining with `logic.js` pool hold time

The coordinator's `stateMachine.minHoldMsByReason` controls the minimum duration the behavior system holds an animation. For segmented animations with a fixed total duration (intro + N loops + outro), set the min hold to at least the expected total so the coordinator doesn't cut it short:

```js
// logic.js
stateMachine: {
  minHoldMsByReason: {
    interaction: 3500,   // enough for the full inspect sequence
  },
},
```

---

## 5. Multi-Stage Sequences

**What it does:** A scripted, multi-step behavior that locks the animation pipeline, optionally hides the sprite, and moves the pet to a new position — all driven by the coordinator. Used for dramatic "teleport" moments.  
**Where to use:** Ferret burrow-hop, chameleon camo-shift, beaver dive-hop. Any pet where you want a fully choreographed disappear → travel → reappear.

Defined in `core/sequenceManager.js` under `PET_SEQUENCE_RULES`:

```js
// core/sequenceManager.js
"my-pet": {
  id: "my-sequence",
  startChance: 0.4,              // probability on each check window
  checkWindowMs: [3000, 5000],   // ms between eligibility checks
  cooldownMs: [12000, 20000],    // minimum gap between sequences
  stages: [
    { name: "prepare", animationKey: "my-prepare", loops: 1 },
    { name: "vanish",  animationKey: "my-vanish",  loops: 1 },
    {
      name: "travel",
      hidden: true,              // sprite is NOT drawn during this stage
      holdMs: [400, 900],        // random travel pause
      relocate: true,            // engine picks a new canvas position
    },
    { name: "appear", animationKey: "my-appear", loops: 1 },
  ],
},
```

### Stage fields

| Field                 | Type                | Notes                                                                   |
| --------------------- | ------------------- | ----------------------------------------------------------------------- |
| `name`                | string              | Debug label                                                             |
| `animationKey`        | string              | Animation to play (must exist in `sprite.js animations`)                |
| `loops`               | number \| [min,max] | Loop count (supports random range)                                      |
| `holdMs`              | [min, max]          | Extra hold time after animation completes                               |
| `hidden`              | boolean             | If true, sprite is not drawn (particles still render)                   |
| `relocate`            | boolean             | If true, pet moves to a new random canvas position                      |
| `requiredEnvironment` | string \| string[]  | Only start this stage if environment FSM matches                        |
| `sequenceOnly`        | boolean             | If false (default true), this animation can also play outside sequences |

### How sequences interact with segments

Sequence stages reference a top-level `animationKey`. That animation can itself have `segments` defined, so the animation within a sequence stage also benefits from all the segmented playback modes above.

---

## 6. Behavior Pools

**What it does:** Governs which animation plays under each context (moving, idle, interaction, celebration). The coordinator picks from these pools based on current state.  
**Where to configure:** `logic.js` → `animationPools`

```js
// logic.js
animationPools: {
  movement:    ["fox-walk"],
  idle:        ["fox-idle-stand", "fox-sleep-idle"],
  interaction: ["fox-inspect", "fox-stand-to-stretch"],
  celebration: ["fox-stand-to-stretch", "fox-walk"],
},
```

### Optional per-key weights

Control how often each animation is chosen from a pool:

```js
animationPoolWeights: {
  idle: {
    "fox-idle-stand": 8,   // plays 8× more often than fox-sleep-idle
    "fox-sleep-idle": 1,
  },
},
```

### Locomotion gates

Control which animations allow/deny physical movement regardless of context:

```js
locomotion: {
  forceAllowKeys: ["fox-walk"],       // always allow movement during these
  forceDenyKeys:  ["fox-stand-to-lie", "fox-lie-to-stand"], // never allow movement during these
},
```

---

## 7. Playful Beats

**What it does:** Fires an interaction animation on a random timer interval while the pet is active. Creates "surprised" or "investigate" moments without any user input.  
**Where to configure:** `logic.js` → `playfulNature`

```js
// logic.js
playfulNature: {
  intervalMs:       [6000, 12000], // how long between beats
  durationMs:       [900, 1750],   // how long the beat lasts before returning to pool
  activationChance: 0.66,          // 0–1 probability of firing when interval fires
  actionKeys:       ["fox-inspect", "fox-stand-to-stretch"],
},
```

A playful beat interrupts idle or movement, plays one of its `actionKeys`, then the behavior system resumes normal pool selection. The `durationMs` window controls the minimum time the animation gets to play.

---

## 8. Task Completion Burst

**What it does:** Fires a celebration animation when `triggerTaskCompletionEmotionBurst()` is called by the host app (e.g. when the agent completes a checklist step).  
**Where to configure:** `logic.js` → `taskCompletion`

```js
// logic.js
taskCompletion: {
  triggerChance: 0.94,           // probability of firing on each burst signal
  durationMs:   [1200, 2200],   // how long the celebration plays
  actionKeys:   ["fox-stand-to-stretch", "fox-walk"],
},
```

The engine also auto-triggers milestone boosts at checklist steps 3, 6, and 10, which temporarily increases movement speed in addition to the emotion burst.

---

## 9. Environment FSM Gating

**What it does:** Restricts which animations are allowed based on the pet's current detected environment (land vs. water, etc.). Automatically fires transition animations when the environment changes.  
**Where to configure:** `logic.js` → `environmentFSM`

```js
// logic.js
environmentFSM: {
  enabled: true,
  initial: "land",
  detector: {
    type: "y-threshold",
    thresholdRatio: 0.56,  // canvas Y ratio — below this = water
    hysteresisPx: 20,
    above: "land",
    below: "water",
  },
  environments: {
    land:  { allowedKeys: ["idle", "movement", "jump"], allowLocomotion: true },
    water: { allowedKeys: ["idle-water", "movement-water"], allowLocomotion: true },
  },
  transitions: [
    { from: "land",  to: "water", key: "dive",   durationMs: [460, 760] },
    { from: "water", to: "land",  key: "ascent", durationMs: [460, 760] },
  ],
},
```

Transition animations (e.g. `"dive"`) can be `sequenceOnly: true` so they never play outside this controlled context.

---

## Quick Decision Guide

| Goal                                           | Tool                                        |
| ---------------------------------------------- | ------------------------------------------- |
| Play all frames in order, looping              | Standard loop (Section 1)                   |
| Some frames faster/slower than others          | Per-frame `ticks` (Section 2)               |
| End on a specific pose and wait                | `holdOnLastFrame` (Section 3)               |
| Intro → hold/loop a subset → outro             | `segments` (Section 4)                      |
| Ping-pong between specific frames              | `segments` + `mode: "pingpong"` (Section 4) |
| Disappear, teleport, reappear                  | Multi-stage sequence (Section 5)            |
| Control which animations play in which context | Behavior pools (Section 6)                  |
| Spontaneous "look around" moments              | Playful beats (Section 7)                   |
| React to checklist completion                  | Task completion (Section 8)                 |
| Different animations on land vs. water         | Environment FSM (Section 9)                 |
