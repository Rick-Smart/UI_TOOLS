# Pets Handoff Note (2026-03-03)

## Resume Here

- Emotion FX were tuned down (smaller icons and reduced burst density).
- Petting emotion trigger moved to edge-based behavior to avoid repeated firing.
- Negative emotion burst triggering was tightened so sequence transitions are less spammy.

## What to Verify First

- Pet one time and confirm only one burst is emitted per interaction.
- Confirm sequence endpoints (e.g., disappear/reappear flows) do not repeatedly emit negative bursts.
- Confirm icon size feels subtle and readable across pets.

## If We Continue Next Session

- Review `public/agent-pet/petEngine.js` trigger thresholds and cooldowns.
- Optionally add debug control for FX intensity (`off`, `low`, `normal`, `high`).
- Re-run lint/build before final polish pass.
