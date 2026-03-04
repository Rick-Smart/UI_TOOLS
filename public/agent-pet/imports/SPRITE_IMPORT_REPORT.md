# Sprite Import Report

Generated from: `public/agent-pet/imports/new_pets_sprite_sheets`

## Summary

- Ready packs (PNG + JSON): **9**
- Partial packs (missing PNG or JSON): **3**
- Total packs discovered: **12**

## Pack Status

| Pack       | PNG | JSON | Sheet   | Frames | Cell  | Status  |
| ---------- | --- | ---- | ------- | -----: | ----- | ------- |
| Beaver     | ✅  | ✅   | 128x352 |     44 | 32x32 | ready   |
| Chameleon  | ✅  | ✅   | 512x224 |     56 | 64x32 | ready   |
| Dog        | ✅  | ✅   | 256x320 |     80 | 32x32 | ready   |
| Ferret     | ✅  | ✅   | 256x288 |     72 | 32x32 | ready   |
| Fish       | ✅  | ✅   | 512x768 |    192 | 64x32 | ready   |
| Koala      | ✅  | ✅   | 384x128 |     48 | 32x32 | ready   |
| Pidgeon    | ✅  | ✅   | 128x128 |     16 | 32x32 | ready   |
| Raccoon    | ✅  | ❌   | 256x128 |      0 | n/a   | partial |
| Red_Panda  | ✅  | ✅   | 256x224 |     56 | 32x32 | ready   |
| Seagull    | ❌  | ✅   | n/a     |     56 | 32x32 | partial |
| Sphynx_Cat | ✅  | ✅   | 256x288 |     72 | 32x32 | ready   |
| Wolf       | ✅  | ❌   | 256x224 |      0 | n/a   | partial |

## Action Group Coverage (from JSON frame names)

- **Sphynx_Cat**: `Clean`, `Idle`, `IdleSit`, `Jump`, `Lick`, `Paw`, `Run`, `Sleep`, `Walk`
- **Dog**: `Bark`, `Bite`, `Dash`, `Dash- Ball`, `Idle`, `Movement`, `Movement- Ball`, `Playful`, `Sit Idle`, `Sleep`
- **Pidgeon**: `Flight`, `Idle`, `Movement`, `Peck`
- **Red_Panda**: `Attack`, `Damage`, `Death`, `Idle`, `Idle2`, `Movement`, `Sleep`

## Suggested Runtime Mapping

This mapping aligns imported art to current runtime pets while preserving existing pet IDs:

- `cat` → `Sphynx_Cat`
- `dog` → `Dog`
- `crow` → `Pidgeon` (closest available bird)
- `raccoon` → `Raccoon` (PNG-only for now; needs frame map)
- `dragonling` → `Red_Panda` (temporary fallback until dragon asset exists)

## Blocking Items

- **Raccoon**: missing JSON atlas metadata.
- **Wolf**: missing JSON atlas metadata.
- **Seagull**: missing PNG sprite sheet.

## Recommended Next Step

Create a conversion script that reads each atlas JSON and outputs normalized frame sets into per-pet folders under `public/agent-pet/pets/<pet>/` while keeping raw imports unchanged in `public/agent-pet/imports/`.
