# Agent Pet Sprite Spec

## Purpose

Use this spec to add or replace pet sprites from external sources while keeping runtime behavior stable and code organized.

## Where Sprite Files Live

- One folder per pet under `public/agent-pet/pets/{petId}/`
- Required file name: `sprite.js`
- Current pets:
  - `cat`
  - `dog`
  - `crow`
  - `raccoon`
  - `dragonling`

## Required Export Shape

Each `sprite.js` must export one object with this structure:

```js
export const catSprite = {
  name: "Cat",
  frameDuration: 16,
  palette: ["#00000000", "#ffbf69", "#8d5524", "#1f2937", "#fef3c7"],
  frames: [
    ["0001000000010000", "0011100000111000", "..."],
    ["0001000000010000", "0011100000111000", "..."],
  ],
};
```

## Field Rules

- `name`
  - Human-readable display name.
- `frameDuration`
  - Number of engine ticks each frame is held.
  - Typical range: `12` to `22`.
- `palette`
  - Index `0` must be transparent: `#00000000`.
  - Remaining colors are used by numeric pixel values in frame rows.
- `frames`
  - Array of animation frames.
  - Each frame is an array of equal-length strings.
  - Each character must be a numeric palette index (`0-9`).

## Grid and Animation Guidance

- Recommended grid: `16x16` (current runtime scale assumes this size).
- Recommended frame count: `2` to `4` for idle/walk loop.
- Keep all frames the same width/height.
- Avoid visual jitter by keeping feet/ground contact in consistent rows.

## Species Readability Requirements

A sprite is acceptable only if silhouette is immediately recognizable:

- Cat: pointed ears, feline tail silhouette.
- Dog: muzzle shape, ear profile distinct from cat.
- Crow: beak-forward head and avian body posture.
- Raccoon: visible mask contrast and ringed tail suggestion.
- Dragonling: wing/horn silhouette and non-mammal tail identity.

## Integration Steps

1. Replace the target file in `public/agent-pet/pets/{petId}/sprite.js`.
2. Confirm the export name still matches existing import usage in `public/agent-pet/pets/sprites.js`.
3. Run:
   - `npm run build`
   - `npm run lint`
4. Validate in app:
   - Top bar selection preview displays correctly.
   - In-world pet renders correctly.
   - Animation loops without distortion.

## Optional Asset Pre-Check

Before coding, verify each candidate sprite sheet has:

- A transparent background layer.
- Even frame dimensions.
- Clear silhouette at small size.
- License/usage terms appropriate for internal project use.

## Troubleshooting

- Pet appears as fallback shape:
  - Likely malformed frame data or failed dynamic import path.
- Distorted render:
  - Frame row lengths are inconsistent.
- Wrong colors:
  - Palette index mapping does not match frame digits.
- Flickering feet/body:
  - Ground contact rows differ too much between frames.
