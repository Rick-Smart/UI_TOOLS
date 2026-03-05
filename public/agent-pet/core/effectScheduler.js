// effectScheduler.js
// Data-driven particle effect scheduler.
// Reads effect configs from the active pet's behavior profile and emits
// pendingEffects[] each frame. Zero petId hardcoding — all effects are
// gated solely on their profile config block being present and enabled.
//
// Also owns previousActionKey and previousVelocityX because only effects
// need to compare current vs. previous frame values.
//
// createEffectScheduler({ nextRandom, pickInRange })
// → { step(context) → pendingEffects[], reset() }

export function createEffectScheduler({ nextRandom, pickInRange }) {
  // ── Timing clocks ────────────────────────────────────────────────────────
  let sleepZNextAt = 0;
  let diveSplashCooldownUntil = 0;
  let digDirtNextAt = 0;
  let windTrailNextAt = 0;
  let landingDustCooldownUntil = 0;
  let bubbleTrailNextAt = 0;
  let turnRippleCooldownUntil = 0;

  // ── Previous-frame values ────────────────────────────────────────────────
  let previousActionKey = "";
  let previousVelocityX = 0;

  /**
   * @param {object} ctx
   * @param {number}   ctx.now
   * @param {string}   ctx.currentActionKey
   * @param {boolean}  ctx.isAnimationFirstFrame
   * @param {boolean}  ctx.movementActive
   * @param {string}   ctx.facingDirection        "left"|"right"
   * @param {boolean}  ctx.isFlightBoidsPet
   * @param {boolean}  ctx.isBirdAirborneAction
   * @param {boolean}  ctx.isBirdIdleAction
   * @param {object}   ctx.behaviorProfile
   * @param {Array}    ctx.followers              Flock follower objects (mutated: f.bubbleNextAt)
   * @param {object}   ctx.lastBounds             { width, height }
   * @param {number}   ctx.velocityX
   * @returns {Array} pendingEffects[]
   */
  function step({
    now,
    currentActionKey,
    isAnimationFirstFrame,
    movementActive,
    facingDirection,
    isFlightBoidsPet,
    isBirdAirborneAction,
    isBirdIdleAction,
    behaviorProfile,
    followers,
    lastBounds,
    velocityX,
  }) {
    const pendingEffects = [];
    const wasBirdAirborneAction = /flight|flap|glide/.test(previousActionKey);
    const spriteW = Math.max(24, Number(lastBounds?.width) || 64);
    const spriteH = Math.max(24, Number(lastBounds?.height) || 64);
    const effects = behaviorProfile?.effects || {};

    // ── Sleep Z ─────────────────────────────────────────────────────────────
    const sleepZCfg = effects.sleepZ || {};
    const isSleepAction = /(^|-)sleep($|-)|snooze|nap/.test(currentActionKey);
    if (
      sleepZCfg.enabled !== false &&
      Object.keys(sleepZCfg).length > 0 &&
      isSleepAction &&
      now >= sleepZNextAt
    ) {
      pendingEffects.push({
        count: Number(sleepZCfg.count || 2),
        originXRatio: 0.5,
        originYRatio: 0.12,
        color: String(sleepZCfg.color || "#8a6fe8"),
        colorSecondary: String(sleepZCfg.colorSecondary || "#c5b8f8"),
        glyphs: Array.isArray(sleepZCfg.glyphs) ? sleepZCfg.glyphs : ["z", "Z"],
        speedRange: sleepZCfg.speedRange || [8, 22],
        sizeRange: sleepZCfg.sizeRange || [4, 7],
        lifeRange: sleepZCfg.lifeRange || [760, 1560],
        gravityRange: sleepZCfg.gravityRange || [-22, -8],
        dragRange: sleepZCfg.dragRange || [0.95, 0.985],
        spreadX: sleepZCfg.spreadX || [-8, 8],
        spreadY: sleepZCfg.spreadY || [-4, 2],
        angleRange: sleepZCfg.angleRange || [-Math.PI * 0.7, -Math.PI * 0.3],
      });
      sleepZNextAt =
        now +
        Math.max(
          150,
          Math.round(pickInRange(sleepZCfg.intervalMs || [460, 820])),
        );
    }

    // ── Dive splash ──────────────────────────────────────────────────────────
    const diveCfg = effects.diveSplash || {};
    if (
      diveCfg.enabled !== false &&
      Object.keys(diveCfg).length > 0 &&
      currentActionKey === "dive" &&
      isAnimationFirstFrame &&
      now >= diveSplashCooldownUntil
    ) {
      const yRatio = Math.max(
        0,
        Math.min(1.4, Number(diveCfg.originYOffsetRatio ?? 0.82)),
      );
      pendingEffects.push({
        count: Number(diveCfg.count || 14),
        originXRatio: 0.5,
        originYRatio: yRatio,
        color: String(diveCfg.color || "#5da8c6"),
        colorSecondary: String(diveCfg.colorSecondary || "#9ad0e4"),
        speedRange: diveCfg.speedRange || [34, 94],
        sizeRange: diveCfg.sizeRange || [2, 5],
        lifeRange: diveCfg.lifeRange || [360, 860],
        gravityRange: diveCfg.gravityRange || [160, 280],
        dragRange: diveCfg.dragRange || [0.88, 0.95],
        spreadX: diveCfg.spreadX || [-14, 14],
        spreadY: diveCfg.spreadY || [-3, 5],
        angleRange: diveCfg.angleRange || [-Math.PI * 0.95, -Math.PI * 0.05],
      });
      diveSplashCooldownUntil =
        now + Math.max(220, Number(diveCfg.cooldownMs || 560));
    }

    // ── Dig dirt ─────────────────────────────────────────────────────────────
    const dirtCfg = effects.digDirt || {};
    if (
      dirtCfg.enabled !== false &&
      Object.keys(dirtCfg).length > 0 &&
      /dig|disappear|emerge/.test(currentActionKey) &&
      now >= digDirtNextAt
    ) {
      pendingEffects.push({
        count: Number(dirtCfg.count || 7),
        originXRatio: 0.5,
        originYRatio: 0.86,
        color: String(dirtCfg.color || "#8d6b4e"),
        colorSecondary: String(dirtCfg.colorSecondary || "#b3906f"),
        speedRange: dirtCfg.speedRange || [24, 76],
        sizeRange: dirtCfg.sizeRange || [2.2, 5.8],
        lifeRange: dirtCfg.lifeRange || [420, 1020],
        gravityRange: dirtCfg.gravityRange || [200, 330],
        dragRange: dirtCfg.dragRange || [0.9, 0.96],
        spreadX: dirtCfg.spreadX || [-10, 10],
        spreadY: dirtCfg.spreadY || [-2, 4],
        angleRange: dirtCfg.angleRange || [-Math.PI * 0.9, -Math.PI * 0.1],
      });
      digDirtNextAt =
        now +
        Math.max(80, Math.round(pickInRange(dirtCfg.intervalMs || [120, 220])));
    }

    // ── Wind trail (airborne birds) ──────────────────────────────────────────
    const windCfg = effects.windTrail || {};
    if (
      isFlightBoidsPet &&
      windCfg.enabled !== false &&
      Object.keys(windCfg).length > 0 &&
      isBirdAirborneAction &&
      movementActive &&
      now >= windTrailNextAt
    ) {
      const dirSign = facingDirection === "left" ? 1 : -1;
      pendingEffects.push({
        count: Number(windCfg.count || 5),
        originXRatio: dirSign < 0 ? 0.18 : 0.82,
        originYRatio: 0.45,
        color: String(windCfg.color || "#d8ecf7"),
        colorSecondary: String(windCfg.colorSecondary || "#bfe2f3"),
        speedRange: windCfg.speedRange || [16, 42],
        sizeRange: windCfg.sizeRange || [1.8, 3.6],
        lifeRange: windCfg.lifeRange || [220, 520],
        gravityRange: windCfg.gravityRange || [18, 60],
        dragRange: windCfg.dragRange || [0.9, 0.96],
        spreadX: windCfg.spreadX || [-6, 6],
        spreadY: windCfg.spreadY || [-4, 4],
        angleRange:
          dirSign < 0
            ? [-Math.PI * 0.05, Math.PI * 0.18]
            : [Math.PI * 0.82, Math.PI * 1.05],
      });
      windTrailNextAt =
        now +
        Math.max(80, Math.round(pickInRange(windCfg.intervalMs || [120, 200])));
    }

    // ── Landing dust (birds touching down) ───────────────────────────────────
    const landingCfg = effects.landingDust || {};
    if (
      isFlightBoidsPet &&
      landingCfg.enabled !== false &&
      Object.keys(landingCfg).length > 0 &&
      wasBirdAirborneAction &&
      isBirdIdleAction &&
      isAnimationFirstFrame &&
      now >= landingDustCooldownUntil
    ) {
      pendingEffects.push({
        count: Number(landingCfg.count || 7),
        originXRatio: 0.5,
        originYRatio: 0.92,
        color: String(landingCfg.color || "#d9c9ad"),
        colorSecondary: String(landingCfg.colorSecondary || "#efe1c9"),
        speedRange: landingCfg.speedRange || [20, 56],
        sizeRange: landingCfg.sizeRange || [1.8, 4.2],
        lifeRange: landingCfg.lifeRange || [280, 760],
        gravityRange: landingCfg.gravityRange || [180, 290],
        dragRange: landingCfg.dragRange || [0.9, 0.96],
        spreadX: landingCfg.spreadX || [-10, 10],
        spreadY: landingCfg.spreadY || [-2, 2],
        angleRange: landingCfg.angleRange || [-Math.PI * 0.95, -Math.PI * 0.05],
      });
      landingDustCooldownUntil =
        now + Math.max(300, Number(landingCfg.cooldownMs || 760));
    }

    // ── Bubble trail (fish schooling) ────────────────────────────────────────
    const bubbleCfg = effects.bubbleTrail || {};
    const isFishMovementAction = /movement/.test(currentActionKey);
    if (
      bubbleCfg.enabled !== false &&
      Object.keys(bubbleCfg).length > 0 &&
      movementActive &&
      isFishMovementAction &&
      now >= bubbleTrailNextAt
    ) {
      pendingEffects.push({
        count: Number(bubbleCfg.count || 4),
        originXRatio: 0.35,
        originYRatio: 0.68,
        color: String(bubbleCfg.color || "#9dd8ea"),
        colorSecondary: String(bubbleCfg.colorSecondary || "#d3f0fb"),
        speedRange: bubbleCfg.speedRange || [12, 30],
        sizeRange: bubbleCfg.sizeRange || [1.4, 3],
        lifeRange: bubbleCfg.lifeRange || [520, 1200],
        gravityRange: bubbleCfg.gravityRange || [-45, -15],
        dragRange: bubbleCfg.dragRange || [0.92, 0.98],
        spreadX: bubbleCfg.spreadX || [-8, 8],
        spreadY: bubbleCfg.spreadY || [-2, 3],
        angleRange: bubbleCfg.angleRange || [-Math.PI * 0.7, -Math.PI * 0.3],
      });
      bubbleTrailNextAt =
        now +
        Math.max(
          80,
          Math.round(pickInRange(bubbleCfg.intervalMs || [130, 220])),
        );

      // Follower bubbles
      if (Array.isArray(followers) && followers.length) {
        const followerInterval = bubbleCfg.followerIntervalMs || [260, 520];
        const followerCount = Math.max(
          1,
          Math.round(Number(bubbleCfg.followerCount || 2)),
        );
        for (const f of followers) {
          if (now < Number(f?.bubbleNextAt || 0)) continue;
          const fScale = Math.max(0.55, Number(f?.scale || 0.78));
          pendingEffects.push({
            count: followerCount,
            originX: Number(f?.x || 0) + spriteW * fScale * 0.35,
            originY: Number(f?.y || 0) + spriteH * fScale * 0.68,
            color: String(bubbleCfg.color || "#9dd8ea"),
            colorSecondary: String(bubbleCfg.colorSecondary || "#d3f0fb"),
            speedRange: bubbleCfg.followerSpeedRange || [10, 24],
            sizeRange: bubbleCfg.followerSizeRange || [1.1, 2.3],
            lifeRange: bubbleCfg.followerLifeRange || [460, 980],
            gravityRange: bubbleCfg.gravityRange || [-45, -15],
            dragRange: bubbleCfg.dragRange || [0.92, 0.98],
            spreadX: bubbleCfg.followerSpreadX || [-6, 6],
            spreadY: bubbleCfg.followerSpreadY || [-2, 2],
            angleRange: bubbleCfg.angleRange || [
              -Math.PI * 0.7,
              -Math.PI * 0.3,
            ],
          });
          f.bubbleNextAt =
            now + Math.max(140, Math.round(pickInRange(followerInterval)));
        }
      }
    }

    // ── Turn ripple (fish pivot) ──────────────────────────────────────────────
    const rippleCfg = effects.turnRipple || {};
    const pivotDetected =
      Math.abs(previousVelocityX) > 0.08 &&
      Math.abs(velocityX) > 0.08 &&
      Math.sign(previousVelocityX) !== Math.sign(velocityX);
    if (
      rippleCfg.enabled !== false &&
      Object.keys(rippleCfg).length > 0 &&
      pivotDetected &&
      now >= turnRippleCooldownUntil
    ) {
      pendingEffects.push({
        count: Number(rippleCfg.count || 8),
        originXRatio: 0.5,
        originYRatio: 0.56,
        color: String(rippleCfg.color || "#7ec7de"),
        colorSecondary: String(rippleCfg.colorSecondary || "#b5e3f2"),
        speedRange: rippleCfg.speedRange || [18, 52],
        sizeRange: rippleCfg.sizeRange || [1.6, 3.8],
        lifeRange: rippleCfg.lifeRange || [260, 620],
        gravityRange: rippleCfg.gravityRange || [0, 24],
        dragRange: rippleCfg.dragRange || [0.9, 0.96],
        spreadX: rippleCfg.spreadX || [-6, 6],
        spreadY: rippleCfg.spreadY || [-3, 3],
        angleRange:
          previousVelocityX > 0
            ? [Math.PI * 0.65, Math.PI * 1.1]
            : [-Math.PI * 0.1, Math.PI * 0.35],
      });
      turnRippleCooldownUntil =
        now + Math.max(220, Number(rippleCfg.cooldownMs || 520));
    }

    // ── Update previous-frame tracking ───────────────────────────────────────
    previousActionKey = currentActionKey;
    previousVelocityX = Number(velocityX) || 0;

    return pendingEffects;
  }

  function reset() {
    sleepZNextAt = 0;
    diveSplashCooldownUntil = 0;
    digDirtNextAt = 0;
    windTrailNextAt = 0;
    landingDustCooldownUntil = 0;
    bubbleTrailNextAt = 0;
    turnRippleCooldownUntil = 0;
    previousActionKey = "";
    previousVelocityX = 0;
  }

  return { step, reset };
}
