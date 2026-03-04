# AZDES Pet System Roadmap

## Goals

- Keep the pet as a lightweight morale feature that never blocks workflow.
- Reward normal task completion behavior without creating gaming pressure.
- Make pet behavior context-aware by page and checklist state.
- Replace placeholder sprites with recognizably accurate animal sprites.

## Current Baseline (as of today)

- Rewards are granted from daily synopsis capture flow in src/utils/dailySynopsisMemory.js.
- Pet unlock/progress/state logic lives in src/utils/petBridge.js.
- Overlay host is mounted globally in src/components/layout/PageTemplate/PageTemplate.jsx.
- Runtime movement logic is in public/agent-pet/petEngine.js.
- Top bar controls are in src/components/layout/TopBar/TopBar.jsx.

## Phase 1: Stabilize and Instrument (Now)

- Add non-intrusive debug telemetry (dev-only) for:
  - reward applied
  - unlock triggered
  - pet selected
  - pet shown/dismissed
- Add a compact internal troubleshooting checklist to README or an ops note.
- Keep unlock policy simple while testing reliability.

Success criteria:

- No UI blocking.
- No duplicate rewards for same interaction ID.
- Predictable pet visibility behavior after unlock and selection.

## Phase 2: Behavior Zones and Page Anchors

### Behavior model

Define a behavior zone map by route:

- calm-center: loiter near lower-middle, low movement.
- left-assist: bias left rail while checklist incomplete.
- right-summary: bias right side near result/readout areas.
- header-perch: stay near top safe inset, reduced vertical drift.
- bottom-roam: stay near the bottom band to avoid form/input interference.
- roam-free: full area movement.

Suggested route defaults:

- /call-handling -> left-assist while checklist incomplete, roam-free after completion.
- /work-search-log -> right-summary.
- /quick-reference -> header-perch.
- calculators/pages with forms -> bottom-roam.
- home page -> roam-free with occasional edge perches.

### Task-aware behavior

On Call Handling:

- When checklist steps are actively being completed, increase attentiveness:
  - tighter orbit near checklist area
  - brief celebratory burst on step completion milestones (3, 6, 10)
- When all steps complete, transition to celebratory roam pattern for short duration.

On synopsis capture:

- Trigger a short mood animation (sparkles/hearts) based on reward strength.

Implementation approach:

- Extend context payload from host to iframe with:
  - routeZone
  - taskState (idle, active, completed)
  - optional anchor points (x,y) if available
- Keep all heavy logic in public/agent-pet/petEngine.js to avoid React rerender churn.

## Phase 3: Progression Rules (Later)

- Move from pure stars/points to mixed criteria:
  - consistent tool usage
  - completed interactions
  - streaks
  - quality indicators
- Introduce soft caps and decay-resistant progression.
- Add optional unlock tiers for mythical pets.

## Sprite Overhaul Plan

## Problem

Current sprites are stylized placeholders and not visually faithful to requested animals.

## Quality target

- At first glance, each sprite must read as the requested animal silhouette.
- Distinct species traits must be obvious:
  - Cat: ear shape, tail posture, feline face spacing.
  - Dog: muzzle shape, ear droop/upright profile, chest stance.
  - Crow: beak profile, wing silhouette, leg proportions.
  - Raccoon: mask pattern, ringed tail.
  - Dragonling: wing/horn silhouette and tail tip identity.

## Sprite production pipeline

1. Approve art direction:
   - Cute pixel companion style, 16x16 or 20x20 base grid.
2. Produce silhouette-first drafts in monochrome.
3. Lock species readability before color work.
4. Add limited palette and 2-4 frame idle/walk cycles.
5. Run in-engine readability check at real runtime scale.
6. Tune per-species animation cadence and movement personality.

## Technical notes

- Keep sprite definitions centralized in public/agent-pet/petCatalog.js.
- Keep preview sprites synchronized with runtime sprites (single source if possible).
- Avoid duplicating sprite datasets between React preview and iframe runtime.
- Keep per-pet behavior logic in dedicated pet folders.
- Keep global/shared behavior logic in dedicated global behavior modules.
- Keep pet runtime code isolated under public/agent-pet as much as possible.

## Architecture Guardrails (Agreed)

- Per-pet logic lives in public/agent-pet/pets/{petId}/
  - species-specific movement tuning
  - species-specific future animations/reactions
- Global behavior logic lives in public/agent-pet/behaviors/
  - route-zone resolution
  - shared task-aware hooks
  - milestone/reaction policy
- Shared runtime rendering helpers live in public/agent-pet/core/
  - sprite draw helpers
  - effect helpers (sparkle/hearts)
- The main app should only host/embed and publish context; pet internals should stay in agent-pet runtime files.

## Optional improvement (recommended)

- Replace duplicated preview sprite data in src/components/integrations/PetSpritePreview.jsx
  with an importable shared module consumed by both preview and runtime.

## Open Decisions to Confirm Later

- Final sprite grid size: 16x16 vs 20x20.
- Maximum frame count per pet (performance and authoring cost).
- Whether dragonling should remain always available in test mode.
- Whether each route should have one strict zone or weighted multi-zone behavior.

## Next Implementation Slice

1. Add routeZone + taskState context fields from host.
2. Introduce zone resolver table in pet engine.
3. Implement one strong example: Call Handling left-assist with milestone reactions.
4. Swap in improved cat and dog sprites first, then complete species set.
