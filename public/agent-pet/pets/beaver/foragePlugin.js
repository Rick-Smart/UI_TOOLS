// foragePlugin.js
// Beaver-specific log forage behavior plugin.
// Implements the 4-phase approach → collect → depart → fade cycle,
// completely isolated from every other pet and from the coordinator.
//
// Contract: createForagePlugin({ canvas, nextRandom, pickInRange })
// → { step(inputs) → result | null, reset() }
//
// result = {
//   phase,               "approach"|"collect"|"depart"|"fade"
//   animationKeyOverride, string — override the coordinator's playful key slot
//   overrideTarget,      { x, y } | null — position for motionController to path toward
//   overrideTargetPull,  number
//   wantsMovement,       boolean
//   prop,                object | null — floating log sprite state for rendering
// }

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

export function createForagePlugin({ canvas, nextRandom, pickInRange }) {
  let phase = "";
  let nextAt = 0;
  let phaseUntil = 0;
  let target = null;
  let departTarget = null;
  let actionKey = "";
  let prop = null;
  let fadeStartedAt = 0;

  function scheduleNext(profile, now) {
    const forage = profile?.logForage || {};
    nextAt =
      now +
      Math.max(
        6000,
        Math.round(pickInRange(forage.intervalMs || [20000, 36000])),
      );
  }

  function resetCycle(profile, now) {
    phase = "";
    phaseUntil = 0;
    target = null;
    departTarget = null;
    actionKey = "";
    prop = null;
    fadeStartedAt = 0;
    scheduleNext(profile, now);
  }

  function startCycle({ profile, now, topSafeInset, lastBounds }) {
    const forage = profile?.logForage || {};
    const propFrame = forage.propFrame || { x: 32, y: 160, w: 32, h: 32 };
    const edgeInsetX = Math.max(20, Number(forage.edgeInsetX || 36));
    const edgeBandWidth = Math.max(56, Number(forage.edgeBandWidth || 120));
    const spawnBottomBandHeight = Math.max(
      40,
      Number(forage.bottomBandHeight || 96),
    );
    const bottomUiClearancePx = Math.max(
      0,
      Number(forage.bottomUiClearancePx || 74),
    );
    const spriteW = Math.max(24, Number(lastBounds?.width) || 64);
    const spriteH = Math.max(24, Number(lastBounds?.height) || 64);

    const minX = edgeInsetX;
    const maxX = Math.max(minX, canvas.width - edgeInsetX - propFrame.w);
    const leftBandMax = Math.min(maxX, edgeInsetX + edgeBandWidth);
    const rightBandMin = Math.max(minX, maxX - edgeBandWidth);
    const spawnBandMinY = Math.max(
      topSafeInset + 16,
      canvas.height - spawnBottomBandHeight - bottomUiClearancePx,
    );
    const spawnBandMaxY = Math.max(
      spawnBandMinY,
      canvas.height - 24 - propFrame.h,
    );

    const useLeft = nextRandom() < 0.5;
    const logX = useLeft
      ? minX + nextRandom() * Math.max(0, leftBandMax - minX)
      : rightBandMin + nextRandom() * Math.max(0, maxX - rightBandMin);
    const logY =
      spawnBandMinY + nextRandom() * Math.max(0, spawnBandMaxY - spawnBandMinY);

    const departX = useLeft
      ? Math.max(minX, rightBandMin - spriteW * 0.5)
      : Math.min(maxX, leftBandMax + spriteW * 0.5);
    const departY = Math.max(
      topSafeInset + 12,
      Math.min(canvas.height - spriteH - 12, logY - 8),
    );

    const fadeInDurationMs = Math.max(
      120,
      Math.round(pickInRange(forage.fadeInMs || [220, 460])),
    );

    prop = {
      propFrame,
      x: logX,
      y: logY,
      alpha: 0,
      fadeInStartedAt: now,
      fadeInUntil: now + fadeInDurationMs,
    };
    target = { x: logX, y: logY };
    departTarget = { x: departX, y: departY };
    phase = "approach";
    actionKey = "movement-water";
    fadeStartedAt = 0;
    phaseUntil =
      now +
      Math.max(
        2200,
        Math.round(pickInRange(forage.approachTimeoutMs || [3200, 5200])),
      );
  }

  /**
   * @param {object} inputs
   * @param {number}  inputs.now
   * @param {object}  inputs.profile         Pet behavior profile
   * @param {object}  inputs.position        { x, y }
   * @param {object}  inputs.lastBounds      { x, y, width, height }
   * @param {number}  inputs.topSafeInset
   * @param {boolean} inputs.forceFreeze
   * @param {string}  inputs.forcedAnimationKey
   * @param {boolean} inputs.isPetting
   * @param {boolean} inputs.hasActiveSequence
   * @returns {object|null}
   */
  function step({
    now,
    profile,
    position,
    lastBounds,
    topSafeInset,
    forceFreeze,
    forcedAnimationKey,
    isPetting,
    hasActiveSequence,
  }) {
    const forage = profile?.logForage;
    if (!forage?.enabled) {
      if (phase) resetCycle(profile, now);
      return null;
    }

    if (!nextAt) scheduleNext(profile, now);

    const cycleBlocked =
      forceFreeze ||
      Boolean(forcedAnimationKey) ||
      isPetting ||
      hasActiveSequence;
    if (!phase && !cycleBlocked && now >= nextAt) {
      startCycle({ profile, now, topSafeInset, lastBounds });
    }

    if (!phase) return null;

    const spriteW = Math.max(24, Number(lastBounds?.width) || 64);
    const spriteH = Math.max(24, Number(lastBounds?.height) || 64);
    const centerX = position.x + spriteW * 0.5;
    const centerY = position.y + spriteH * 0.5;

    // Update prop fade-in alpha
    if (prop && phase !== "fade") {
      const fadeInStart = Number(prop.fadeInStartedAt || 0);
      const fadeInUntil = Number(prop.fadeInUntil || 0);
      const fadeInDuration = Math.max(1, fadeInUntil - fadeInStart);
      prop.alpha =
        fadeInUntil > fadeInStart && now < fadeInUntil
          ? clamp01((now - fadeInStart) / fadeInDuration)
          : 1;
    }

    // ── Phase state machine ───────────────────────────────────────────────
    if (phase === "approach" && target) {
      actionKey = "movement-water";
      const reachPx = Math.max(8, Number(forage.approachReachPx || 12));
      const distToLog = Math.hypot(target.x - centerX, target.y - centerY);
      if (distToLog <= reachPx) {
        phase = "collect";
        actionKey = "idle-water";
        phaseUntil =
          now +
          Math.max(
            600,
            Math.round(pickInRange(forage.collectHoldMs || [900, 1600])),
          );
      } else if (now >= phaseUntil) {
        phaseUntil =
          now +
          Math.max(
            900,
            Math.round(pickInRange(forage.approachRetryMs || [900, 1600])),
          );
      }
    } else if (phase === "collect") {
      actionKey = "idle-water";
      if (now >= phaseUntil) {
        phase = "depart";
        actionKey = "movement-water-with-stick";
        phaseUntil =
          now +
          Math.max(
            1800,
            Math.round(pickInRange(forage.departTimeoutMs || [2600, 4200])),
          );
      }
    } else if (phase === "depart" && departTarget) {
      actionKey = "movement-water-with-stick";
      const departDist = Math.hypot(
        departTarget.x - centerX,
        departTarget.y - centerY,
      );
      if (departDist <= 28 || now >= phaseUntil) {
        phase = "fade";
        fadeStartedAt = now;
        phaseUntil =
          now +
          Math.max(800, Math.round(pickInRange(forage.fadeMs || [1300, 2200])));
      }
    } else if (phase === "fade") {
      if (prop) {
        const fadeDuration = Math.max(1, phaseUntil - fadeStartedAt);
        prop.alpha = clamp01(1 - (now - fadeStartedAt) / fadeDuration);
      }
      if (now >= phaseUntil) {
        resetCycle(profile, now);
      }
    }

    // Phase may have cleared via resetCycle above
    if (!phase) return null;

    // ── Build result ──────────────────────────────────────────────────────
    const wantsMovement =
      phase === "approach" ||
      phase === "collect" ||
      phase === "depart" ||
      phase === "fade";

    let overrideTarget = null;
    let overrideTargetPull = 0.0038;
    if ((phase === "approach" || phase === "collect") && target) {
      overrideTarget = {
        x: target.x - spriteW * 0.5,
        y: target.y - spriteH * 0.5,
      };
      overrideTargetPull = 0.0062;
    } else if ((phase === "depart" || phase === "fade") && departTarget) {
      overrideTarget = {
        x: departTarget.x - spriteW * 0.5,
        y: departTarget.y - spriteH * 0.5,
      };
    }

    return {
      phase,
      animationKeyOverride: actionKey || null,
      overrideTarget,
      overrideTargetPull,
      wantsMovement,
      prop,
    };
  }

  function reset() {
    phase = "";
    nextAt = 0;
    phaseUntil = 0;
    target = null;
    departTarget = null;
    actionKey = "";
    prop = null;
    fadeStartedAt = 0;
  }

  return { step, reset };
}
