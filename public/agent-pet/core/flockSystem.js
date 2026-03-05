// flockSystem.js
// Stateful boid / schooling system for fish and bird-in-flight pets.
// Extracted from petEngine.js. Owns all flock state (followers, path traces).
// The engine creates one instance per session: createFlockSystem({ canvas, nextRandom })

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function limitVector(vx, vy, maxMag) {
  const mag = Math.hypot(vx, vy);
  if (mag <= maxMag || mag <= 0.0001) {
    return { x: vx, y: vy };
  }
  const r = maxMag / mag;
  return { x: vx * r, y: vy * r };
}

export function createFlockSystem({ canvas, nextRandom }) {
  // ── Follower state ────────────────────────────────────────────────────────
  let followers = [];
  let targetCount = 0;
  let traceSeed = 0;

  // ── Path trace state ──────────────────────────────────────────────────────
  let leadPathPoints = [];
  let leadPathLastAt = 0;
  let followerPathTraces = [];

  // ── Internal helpers ──────────────────────────────────────────────────────

  function buildBoidForces({
    entityX,
    entityY,
    entityVX,
    entityVY,
    peers, // array of { x, y, vx, vy }
    boidNeighborRadius,
    boidSeparationRadius,
    boidMaxForce,
    boidAlignmentWeight,
    boidCohesionWeight,
    boidSeparationWeight,
    desiredSpeed,
  }) {
    let alignX = 0;
    let alignY = 0;
    let cohesionX = 0;
    let cohesionY = 0;
    let separationX = 0;
    let separationY = 0;
    let separationSamples = 0;
    let neighbors = 0;

    for (const peer of peers) {
      const dx = Number(peer.x) - entityX;
      const dy = Number(peer.y) - entityY;
      const dist = Math.hypot(dx, dy) || 0.0001;
      if (dist <= boidNeighborRadius) {
        neighbors += 1;
        alignX += Number(peer.vx || 0);
        alignY += Number(peer.vy || 0);
        cohesionX += Number(peer.x || 0);
        cohesionY += Number(peer.y || 0);
      }
      if (dist <= boidSeparationRadius) {
        separationX += (entityX - Number(peer.x)) / dist;
        separationY += (entityY - Number(peer.y)) / dist;
        separationSamples += 1;
      }
    }

    let forceX = 0;
    let forceY = 0;

    if (neighbors > 0) {
      alignX /= neighbors;
      alignY /= neighbors;
      cohesionX = cohesionX / neighbors - entityX;
      cohesionY = cohesionY / neighbors - entityY;

      const alignLen = Math.hypot(alignX, alignY) || 0;
      if (alignLen > 0.0001) {
        const dAX = (alignX / alignLen) * desiredSpeed - entityVX;
        const dAY = (alignY / alignLen) * desiredSpeed - entityVY;
        const steer = limitVector(dAX, dAY, boidMaxForce);
        forceX += steer.x * boidAlignmentWeight;
        forceY += steer.y * boidAlignmentWeight;
      }

      const cohLen = Math.hypot(cohesionX, cohesionY) || 0;
      if (cohLen > 0.0001) {
        const dCX = (cohesionX / cohLen) * desiredSpeed - entityVX;
        const dCY = (cohesionY / cohLen) * desiredSpeed - entityVY;
        const steer = limitVector(dCX, dCY, boidMaxForce);
        forceX += steer.x * boidCohesionWeight;
        forceY += steer.y * boidCohesionWeight;
      }
    }

    if (separationSamples > 0) {
      const avgSX = separationX / separationSamples;
      const avgSY = separationY / separationSamples;
      const sepLen = Math.hypot(avgSX, avgSY) || 0;
      if (sepLen > 0.0001) {
        const dSX = (avgSX / sepLen) * desiredSpeed - entityVX;
        const dSY = (avgSY / sepLen) * desiredSpeed - entityVY;
        const steer = limitVector(dSX, dSY, boidMaxForce);
        forceX += steer.x * boidSeparationWeight;
        forceY += steer.y * boidSeparationWeight;
      }
    }

    return { forceX, forceY };
  }

  function buildEdgeForce({
    x,
    y,
    vx,
    vy,
    minX,
    maxX,
    minY,
    maxY,
    edgeMargin,
    edgeAvoidanceMaxForce,
    boidEdgeAvoidanceWeight,
    desiredSpeed,
    dt,
  }) {
    const edgePushX =
      1 -
      clamp01((x - minX) / Math.max(1, edgeMargin)) -
      (1 - clamp01((maxX - x) / Math.max(1, edgeMargin)));
    const edgePushY =
      1 -
      clamp01((y - minY) / Math.max(1, edgeMargin)) -
      (1 - clamp01((maxY - y) / Math.max(1, edgeMargin)));
    const edgeLen = Math.hypot(edgePushX, edgePushY);
    if (edgeLen <= 0.0001) {
      return { forceX: 0, forceY: 0 };
    }
    const dEX = (edgePushX / edgeLen) * desiredSpeed - vx;
    const dEY = (edgePushY / edgeLen) * desiredSpeed - vy;
    const steer = limitVector(dEX, dEY, edgeAvoidanceMaxForce * dt);
    return {
      forceX: steer.x * boidEdgeAvoidanceWeight,
      forceY: steer.y * boidEdgeAvoidanceWeight,
    };
  }

  function readBoidConfig(boidConfig, spriteWidth) {
    return {
      neighborRadius: Math.max(
        spriteWidth,
        Number(boidConfig?.neighborRadiusPx ?? 136),
      ),
      separationRadius: Math.max(
        spriteWidth * 0.4,
        Number(boidConfig?.separationRadiusPx ?? 48),
      ),
      maxForceBase: Math.max(0.001, Number(boidConfig?.maxForce ?? 0.13)),
      alignmentWeight: Math.max(0, Number(boidConfig?.alignmentWeight ?? 0.9)),
      cohesionWeight: Math.max(0, Number(boidConfig?.cohesionWeight ?? 0.7)),
      separationWeight: Math.max(
        0,
        Number(boidConfig?.separationWeight ?? 1.15),
      ),
      edgeAvoidanceWeight: Math.max(
        0,
        Number(boidConfig?.edgeAvoidanceWeight ?? 0.9),
      ),
      minSpeed: Math.max(0.05, Number(boidConfig?.minSpeed ?? 1.25)),
      maxSpeed: Math.max(0.1, Number(boidConfig?.maxSpeed ?? 8.625)),
      drag: clamp01(Number(boidConfig?.drag ?? 0.992)),
      edgeMargin: Math.max(
        spriteWidth * 0.85,
        Number(boidConfig?.edgeAvoidanceMarginPx ?? 140),
      ),
      edgeAvoidanceMaxForce: Math.max(
        0.001,
        Number(boidConfig?.edgeAvoidanceMaxForce ?? 0.16),
      ),
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Ensure followers array matches the desired school size.
   * Call once per frame before stepFollowers.
   */
  function ensureFollowers({
    leadX,
    leadY,
    spriteWidth,
    schoolConfig,
    boidConfig,
  }) {
    const sizeRange = Array.isArray(schoolConfig?.sizeRange)
      ? schoolConfig.sizeRange
      : [3, 6];
    const minTotal = Math.max(1, Math.round(Number(sizeRange[0] ?? 3)));
    const maxTotal = Math.max(minTotal, Math.round(Number(sizeRange[1] ?? 6)));
    if (targetCount < minTotal || targetCount > maxTotal) {
      targetCount =
        minTotal +
        Math.floor(nextRandom() * Math.max(1, maxTotal - minTotal + 1));
    }
    const desired = Math.max(0, targetCount - 1);
    if (followers.length === desired) {
      return;
    }

    const radius = Math.max(spriteWidth * 1.4, 40);
    const fr = Array.isArray(boidConfig?.followerScaleRange)
      ? boidConfig.followerScaleRange
      : [0.34, 0.48];
    const minScale = Math.max(0.2, Math.min(0.95, Number(fr[0] ?? 0.34)));
    const maxScale = Math.max(minScale, Math.min(0.95, Number(fr[1] ?? 0.48)));
    const initSpeed = Math.max(0.35, Number(boidConfig?.minSpeed ?? 1.25));

    while (followers.length < desired) {
      const idx = followers.length;
      const angle = (Math.PI * 2 * (idx + 1)) / Math.max(1, desired);
      const dist = radius * (0.55 + nextRandom() * 0.45);
      followers.push({
        traceId: ++traceSeed,
        x: leadX + Math.cos(angle) * dist,
        y: leadY + Math.sin(angle) * dist * 0.55,
        vx: Math.cos(angle) * initSpeed,
        vy: Math.sin(angle) * initSpeed * 0.5,
        frameOffset: Math.floor(nextRandom() * 24),
        scale: minScale + nextRandom() * Math.max(0, maxScale - minScale),
        bubbleNextAt: 0,
      });
    }
    if (followers.length > desired) {
      followers.length = desired;
    }
  }

  /**
   * Apply boid physics to all follower entities.
   * Mutates followers in place.
   */
  function stepFollowers({
    leadX,
    leadY,
    leadVX,
    leadVY,
    spriteWidth,
    spriteHeight,
    deltaMs,
    boidConfig,
  }) {
    if (!followers.length) {
      return;
    }
    const dt = Math.max(0.5, Math.min(1.15, deltaMs / 16.666));
    const cfg = readBoidConfig(boidConfig, spriteWidth);
    const boidMaxForce = cfg.maxForceBase * dt;

    const minX = -spriteWidth * 0.8;
    const maxX = canvas.width - spriteWidth * 0.2;
    const minY = 12;
    const maxY = canvas.height - spriteHeight - 8;

    for (let i = 0; i < followers.length; i += 1) {
      const fish = followers[i];
      const speed = Math.hypot(fish.vx, fish.vy);
      const desiredSpeed = Math.max(
        cfg.minSpeed,
        Math.min(cfg.maxSpeed, speed),
      );

      // Build peer list: all other followers + lead
      const peers = [
        { x: leadX, y: leadY, vx: leadVX, vy: leadVY },
        ...followers.filter((_, j) => j !== i),
      ];

      const { forceX: boidFX, forceY: boidFY } = buildBoidForces({
        entityX: fish.x,
        entityY: fish.y,
        entityVX: fish.vx,
        entityVY: fish.vy,
        peers,
        boidNeighborRadius: cfg.neighborRadius,
        boidSeparationRadius: cfg.separationRadius,
        boidMaxForce,
        boidAlignmentWeight: cfg.alignmentWeight,
        boidCohesionWeight: cfg.cohesionWeight,
        boidSeparationWeight: cfg.separationWeight,
        desiredSpeed,
      });

      const { forceX: edgeFX, forceY: edgeFY } = buildEdgeForce({
        x: fish.x,
        y: fish.y,
        vx: fish.vx,
        vy: fish.vy,
        minX,
        maxX,
        minY,
        maxY,
        edgeMargin: cfg.edgeMargin,
        edgeAvoidanceMaxForce: cfg.edgeAvoidanceMaxForce,
        boidEdgeAvoidanceWeight: cfg.edgeAvoidanceWeight,
        desiredSpeed,
        dt,
      });

      const netForce = limitVector(
        boidFX + edgeFX,
        boidFY + edgeFY,
        boidMaxForce * 2,
      );
      fish.vx += netForce.x;
      fish.vy += netForce.y;
      fish.vx *= cfg.drag;
      fish.vy *= cfg.drag;

      const nextSpeed = Math.hypot(fish.vx, fish.vy);
      if (nextSpeed > cfg.maxSpeed) {
        const r = cfg.maxSpeed / Math.max(0.0001, nextSpeed);
        fish.vx *= r;
        fish.vy *= r;
      } else if (nextSpeed < cfg.minSpeed) {
        const baseX = Math.abs(fish.vx) > 0.02 ? fish.vx : leadX - fish.x;
        const baseY =
          Math.abs(fish.vy) > 0.02 ? fish.vy : (leadY - fish.y) * 0.7;
        const dirLen = Math.hypot(baseX, baseY) || 1;
        fish.vx = (baseX / dirLen) * cfg.minSpeed;
        fish.vy = (baseY / dirLen) * cfg.minSpeed;
      }

      // Update facing for rendering
      const vel = Math.hypot(fish.vx, fish.vy);
      if (vel > 0.03) {
        fish.facingVX = fish.vx / vel;
        fish.facingVY = fish.vy / vel;
      }

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;
      fish.y = Math.max(minY, Math.min(maxY, fish.y));
      fish.x = Math.max(minX, Math.min(maxX, fish.x));
    }
  }

  /**
   * Apply boid physics to the lead entity (fish or bird).
   * Mutates position and velocity objects in place.
   */
  function stepLead({
    position,
    velocity,
    spriteWidth,
    spriteHeight,
    deltaMs,
    boidConfig,
  }) {
    const dt = Math.max(0.5, Math.min(1.15, deltaMs / 16.666));
    const cfg = readBoidConfig(boidConfig, spriteWidth);
    const boidMaxForce = cfg.maxForceBase * dt;

    const minX = -spriteWidth * 0.8;
    const maxX = canvas.width - spriteWidth * 0.2;
    const minY = 12;
    const maxY = canvas.height - spriteHeight - 8;

    const speed = Math.hypot(velocity.x, velocity.y);
    const desiredSpeed = Math.max(cfg.minSpeed, Math.min(cfg.maxSpeed, speed));

    const { forceX: boidFX, forceY: boidFY } = buildBoidForces({
      entityX: position.x,
      entityY: position.y,
      entityVX: velocity.x,
      entityVY: velocity.y,
      peers: followers.map((f) => ({ x: f.x, y: f.y, vx: f.vx, vy: f.vy })),
      boidNeighborRadius: cfg.neighborRadius,
      boidSeparationRadius: cfg.separationRadius,
      boidMaxForce,
      boidAlignmentWeight: cfg.alignmentWeight,
      boidCohesionWeight: cfg.cohesionWeight,
      boidSeparationWeight: cfg.separationWeight,
      desiredSpeed,
    });

    const { forceX: edgeFX, forceY: edgeFY } = buildEdgeForce({
      x: position.x,
      y: position.y,
      vx: velocity.x,
      vy: velocity.y,
      minX,
      maxX,
      minY,
      maxY,
      edgeMargin: cfg.edgeMargin,
      edgeAvoidanceMaxForce: cfg.edgeAvoidanceMaxForce,
      boidEdgeAvoidanceWeight: cfg.edgeAvoidanceWeight,
      desiredSpeed,
      dt,
    });

    const netForce = limitVector(
      boidFX + edgeFX,
      boidFY + edgeFY,
      boidMaxForce * 2,
    );
    velocity.x += netForce.x;
    velocity.y += netForce.y;
    velocity.x *= cfg.drag;
    velocity.y *= cfg.drag;

    const nextSpeed = Math.hypot(velocity.x, velocity.y);
    if (nextSpeed > cfg.maxSpeed) {
      const r = cfg.maxSpeed / nextSpeed;
      velocity.x *= r;
      velocity.y *= r;
    } else if (nextSpeed < cfg.minSpeed) {
      const fallbackX =
        Math.abs(velocity.x) > 0.02 ? velocity.x : (nextRandom() - 0.5) * 2;
      const fallbackY =
        Math.abs(velocity.y) > 0.02 ? velocity.y : (nextRandom() - 0.5) * 2;
      const dirLen = Math.hypot(fallbackX, fallbackY) || 1;
      velocity.x = (fallbackX / dirLen) * cfg.minSpeed;
      velocity.y = (fallbackY / dirLen) * cfg.minSpeed;
    }

    position.x += velocity.x * dt;
    position.y += velocity.y * dt;

    const boundarySpeed = Math.max(cfg.minSpeed * 0.35, 0.12);
    if (position.x <= minX || position.x >= maxX) {
      position.x = Math.max(minX, Math.min(maxX, position.x));
      velocity.x =
        position.x <= minX
          ? Math.max(velocity.x, boundarySpeed)
          : Math.min(velocity.x, -boundarySpeed);
    }
    if (position.y <= minY || position.y >= maxY) {
      position.y = Math.max(minY, Math.min(maxY, position.y));
      velocity.y =
        position.y <= minY
          ? Math.max(velocity.y, boundarySpeed)
          : Math.min(velocity.y, -boundarySpeed);
    }
  }

  // ── Path trace ────────────────────────────────────────────────────────────

  function updateLeadPathTrace({ enabled, x, y, now, config = {} }) {
    if (!enabled) {
      if (leadPathPoints.length) {
        leadPathPoints = [];
      }
      leadPathLastAt = 0;
      return;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }
    const sampleEvery = Math.max(16, Number(config.sampleEveryMs ?? 32));
    const maxPts = Math.max(20, Math.round(Number(config.maxPoints ?? 420)));
    if (leadPathPoints.length && now - leadPathLastAt < sampleEvery) {
      return;
    }
    leadPathLastAt = now;
    leadPathPoints.push({ x, y });
    if (leadPathPoints.length > maxPts) {
      leadPathPoints.splice(0, leadPathPoints.length - maxPts);
    }
  }

  function updateFollowerPathTraces({
    enabled,
    now,
    config = {},
    spriteWidth,
    spriteHeight,
  }) {
    if (!enabled || !followers.length) {
      if (followerPathTraces.length) {
        followerPathTraces = [];
      }
      return;
    }
    const sampleEvery = Math.max(
      12,
      Number(config.followerSampleEveryMs ?? config.sampleEveryMs ?? 32),
    );
    const maxPts = Math.max(
      16,
      Math.round(Number(config.followerMaxPoints ?? config.maxPoints ?? 420)),
    );
    const tracesById = new Map(
      followerPathTraces
        .filter((t) => Number.isFinite(t?.id))
        .map((t) => [t.id, t]),
    );
    const nextTraces = [];

    for (let i = 0; i < followers.length; i += 1) {
      const f = followers[i];
      if (!Number.isFinite(f.traceId)) {
        f.traceId = ++traceSeed;
      }
      const traceId = Number(f.traceId);
      const trace = tracesById.get(traceId) || {
        id: traceId,
        points: [],
        lastAt: 0,
      };
      if (
        trace.points.length &&
        now - Number(trace.lastAt || 0) < sampleEvery
      ) {
        continue;
      }
      const fScale = Math.max(0.45, Number(f?.scale || 0.78));
      const px = Number(f?.x || 0) + spriteWidth * fScale * 0.5;
      const py = Number(f?.y || 0) + spriteHeight * fScale * 0.5;
      if (!Number.isFinite(px) || !Number.isFinite(py)) {
        continue;
      }
      trace.lastAt = now;
      trace.points.push({ x: px, y: py });
      if (trace.points.length > maxPts) {
        trace.points.splice(0, trace.points.length - maxPts);
      }
      nextTraces.push(trace);
    }
    followerPathTraces = nextTraces;
  }

  function drawTraces(ctx, config = {}) {
    if (!ctx) {
      return;
    }
    const lineWidth = Math.max(1, Number(config.lineWidth ?? 2));
    const strokeColor = String(config.color || "rgba(157, 216, 234, 0.82)");
    const fadeTail = config.fadeTail !== false;

    // Draw follower traces first (behind lead trace)
    if (followerPathTraces.length) {
      const baseHue = Number(config.followerTraceBaseHue ?? 160);
      const hueSpread = Math.max(
        16,
        Number(config.followerTraceHueSpread ?? 130),
      );
      const alphaBase = clamp01(Number(config.followerTraceAlpha ?? 0.72));
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(1, Number(config.followerLineWidth ?? 1.4));

      for (let i = 0; i < followerPathTraces.length; i += 1) {
        const pts = followerPathTraces[i]?.points;
        if (!Array.isArray(pts) || pts.length < 2) {
          continue;
        }
        const hue =
          (baseHue + (i / Math.max(1, followerPathTraces.length)) * hueSpread) %
          360;
        ctx.strokeStyle = `hsla(${hue}, 78%, 70%, ${alphaBase})`;
        if (fadeTail) {
          const total = pts.length - 1;
          for (let j = 1; j < pts.length; j += 1) {
            ctx.globalAlpha = clamp01((j / Math.max(1, total)) * alphaBase);
            ctx.beginPath();
            ctx.moveTo(pts[j - 1].x, pts[j - 1].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        } else {
          ctx.globalAlpha = alphaBase;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let j = 1; j < pts.length; j += 1)
            ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Lead trace
    if (leadPathPoints.length >= 2) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      if (fadeTail) {
        const total = leadPathPoints.length - 1;
        for (let i = 1; i < leadPathPoints.length; i += 1) {
          ctx.globalAlpha = clamp01((i / Math.max(1, total)) * 0.9);
          ctx.beginPath();
          ctx.moveTo(leadPathPoints[i - 1].x, leadPathPoints[i - 1].y);
          ctx.lineTo(leadPathPoints[i].x, leadPathPoints[i].y);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(leadPathPoints[0].x, leadPathPoints[0].y);
        for (let i = 1; i < leadPathPoints.length; i += 1) {
          ctx.lineTo(leadPathPoints[i].x, leadPathPoints[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset() {
    followers = [];
    targetCount = 0;
    leadPathPoints = [];
    leadPathLastAt = 0;
    followerPathTraces = [];
  }

  return {
    ensureFollowers,
    stepFollowers,
    stepLead,
    updateLeadPathTrace,
    updateFollowerPathTraces,
    drawTraces,
    reset,
    getFollowers: () => followers,
  };
}
