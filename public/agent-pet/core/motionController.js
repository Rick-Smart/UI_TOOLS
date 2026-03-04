export function updateMotionState({
  spriteWidth,
  spriteHeight,
  state,
  options = {},
  frame,
  canvas,
  position,
  velocity,
  lastChecklistCompleted,
  milestoneBoostUntil,
  pendingMilestoneEmotionBursts,
  getContext,
  getPetBehaviorProfile,
  resolveRouteZone,
  petRouteZones,
  checklistMilestones,
}) {
  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function wrapAngleRadians(value) {
    let next = Number(value) || 0;
    while (next > Math.PI) {
      next -= Math.PI * 2;
    }
    while (next < -Math.PI) {
      next += Math.PI * 2;
    }
    return next;
  }

  function lerpAngleRadians(from, to, t) {
    const delta = wrapAngleRadians(to - from);
    return from + delta * clamp01(t);
  }

  const allowMovement = options.allowMovement !== false;
  const speedMultiplier = Math.max(0.1, Number(options.speedMultiplier || 1));
  const overrideTarget = options.overrideTarget || null;
  const overridePull = Math.max(
    0.0008,
    Number(options.overrideTargetPull || 0.0032),
  );
  const behavior = getContext() || {};
  const profile = options.profile || getPetBehaviorProfile(state.selectedPetId);
  const topSafeInset = Math.max(0, Number(behavior.topSafeInset || 0));
  const routeZone = resolveRouteZone(behavior.pathname);
  const checklistCompleted = Number(behavior.checklistCompleted || 0);
  const checklistTotal = Number(behavior.checklistTotal || 0);
  const checklistIncomplete = checklistTotal > checklistCompleted;
  const allTenStepsCompleted = checklistTotal >= 10 && checklistCompleted >= 10;
  const movementStyle =
    profile?.movementStyle && typeof profile.movementStyle === "object"
      ? profile.movementStyle
      : {};
  const movementMode = String(movementStyle.mode || "").toLowerCase();
  const useArcDriftStyle = movementMode === "arcdrift";
  const useNaturalSwimStyle = movementMode === "naturalswim";
  const naturalPathModel = useNaturalSwimStyle
    ? String(movementStyle.pathModel || "").toLowerCase()
    : "";
  const useSineCruisePath =
    useNaturalSwimStyle &&
    movementStyle.overrideRouteMotion === true &&
    naturalPathModel === "sinecruise";
  const overrideRouteMotion =
    (useArcDriftStyle || useNaturalSwimStyle) &&
    movementStyle.overrideRouteMotion === true;

  let nextMilestoneBoostUntil = milestoneBoostUntil;
  let nextPendingMilestoneEmotionBursts = pendingMilestoneEmotionBursts;

  if (checklistCompleted > lastChecklistCompleted) {
    const hitMilestone = checklistMilestones.some(
      (milestone) =>
        checklistCompleted >= milestone && lastChecklistCompleted < milestone,
    );

    if (hitMilestone) {
      nextMilestoneBoostUntil = Date.now() + 1800;
      nextPendingMilestoneEmotionBursts += 1;
    }
  }

  const nextLastChecklistCompleted = checklistCompleted;

  if (!allowMovement) {
    velocity.x *= 0.78;
    velocity.y *= 0.78;
    return {
      allTenStepsCompleted,
      lastChecklistCompleted: nextLastChecklistCompleted,
      milestoneBoostUntil: nextMilestoneBoostUntil,
      pendingMilestoneEmotionBursts: nextPendingMilestoneEmotionBursts,
    };
  }

  if (
    overrideTarget &&
    Number.isFinite(overrideTarget.x) &&
    Number.isFinite(overrideTarget.y)
  ) {
    velocity.x +=
      (overrideTarget.x - position.x) * (overridePull * speedMultiplier);
    velocity.y +=
      (overrideTarget.y - position.y) * (overridePull * speedMultiplier);
  } else if (overrideRouteMotion && useNaturalSwimStyle) {
    const phaseOffset = Number(movementStyle.phaseOffset || 0);
    const swimDrag = Math.max(
      0.9,
      Math.min(0.995, Number(movementStyle.swimDrag ?? 0.972)),
    );
    const baseThrust = Math.max(
      0.0002,
      Number(movementStyle.baseThrust ?? 0.016),
    );
    const coastThrottle = Math.max(
      0.08,
      Math.min(0.98, Number(movementStyle.coastThrottle ?? 0.42)),
    );
    const burstPeriodFrames = Math.max(
      90,
      Number(movementStyle.burstPeriodFrames ?? 220),
    );
    const burstSharpness = Math.max(
      0.8,
      Number(movementStyle.burstSharpness ?? 2.2),
    );
    const wiggleAmplitude = Math.max(
      0,
      Number(movementStyle.wiggleAmplitude ?? 0.012),
    );
    const wigglePeriodFrames = Math.max(
      20,
      Number(movementStyle.wigglePeriodFrames ?? 38),
    );
    const weaveStrength = Math.max(0, Number(movementStyle.weaveStrength ?? 0));
    const weavePeriodFrames = Math.max(
      40,
      Number(movementStyle.weavePeriodFrames ?? 260),
    );
    const weaveThrottleBlend = Math.max(
      0,
      Math.min(1, Number(movementStyle.weaveThrottleBlend ?? 0.65)),
    );
    const noiseTurnStrength = Math.max(
      0,
      Number(movementStyle.noiseTurnStrength ?? 0.05),
    );
    const noisePeriodFrames = Math.max(
      80,
      Number(movementStyle.noisePeriodFrames ?? 420),
    );
    const steerBlend = Math.max(
      0,
      Math.min(1, Number(movementStyle.steerBlend ?? 0.1)),
    );
    const maxTurnRateRad = Math.max(
      0.002,
      Math.min(Math.PI / 6, Number(movementStyle.maxTurnRateRad ?? 0.06)),
    );
    const targetPull = Math.max(0, Number(movementStyle.targetPull ?? 0.0017));
    const targetPullLateralWeight = Math.max(
      0,
      Number(movementStyle.targetPullLateralWeight ?? 1),
    );
    const targetPullForwardWeight = Math.max(
      0,
      Number(movementStyle.targetPullForwardWeight ?? 0.25),
    );
    const backwardPullFactor = Math.max(
      0,
      Math.min(1, Number(movementStyle.backwardPullFactor ?? 0.08)),
    );
    const minCruiseSpeed = Math.max(
      0,
      Number(movementStyle.minCruiseSpeed ?? 0.18),
    );
    const minCruiseCorrection = Math.max(
      0,
      Math.min(1.5, Number(movementStyle.minCruiseCorrection ?? 0.35)),
    );
    const scaleBaseThrustWithMultiplier =
      movementStyle.scaleBaseThrustWithMultiplier !== false;
    const scaleTargetPullWithMultiplier =
      movementStyle.scaleTargetPullWithMultiplier !== false;
    const scaleMinCruiseWithMultiplier =
      movementStyle.scaleMinCruiseWithMultiplier !== false;
    const thrustMultiplier = scaleBaseThrustWithMultiplier
      ? speedMultiplier
      : 1;
    const targetPullMultiplier = scaleTargetPullWithMultiplier
      ? speedMultiplier
      : 1;
    const roamPeriodX = Math.max(
      120,
      Number(movementStyle.roamPeriodFramesX ?? 1280),
    );
    const roamPeriodY = Math.max(
      120,
      Number(movementStyle.roamPeriodFramesY ?? 980),
    );

    const horizontalMargin = Math.max(24, Number(movementStyle.marginX ?? 42));
    const verticalMargin = Math.max(18, Number(movementStyle.marginY ?? 34));
    const minTargetX = horizontalMargin;
    const maxTargetX = Math.max(
      minTargetX,
      canvas.width - spriteWidth - horizontalMargin,
    );
    const minTargetY = Math.max(topSafeInset + verticalMargin, verticalMargin);
    const maxTargetY = Math.max(
      minTargetY,
      canvas.height - spriteHeight - verticalMargin,
    );

    if (naturalPathModel === "sinecruise") {
      const centerYRatio = Math.max(
        0.2,
        Math.min(0.85, Number(movementStyle.centerYRatio ?? 0.58)),
      );
      const sinePeriodFrames = Math.max(
        90,
        Number(movementStyle.sinePeriodFrames ?? 360),
      );
      const sineAmplitudePx = Math.max(
        8,
        Number(
          movementStyle.sineAmplitudePx ?? Math.min(88, canvas.height * 0.17),
        ),
      );
      const sineAmplitudeVariance = Math.max(
        0,
        Math.min(0.9, Number(movementStyle.sineAmplitudeVariance ?? 0.35)),
      );
      const sineAmplitudeModPeriodFrames = Math.max(
        120,
        Number(movementStyle.sineAmplitudeModPeriodFrames ?? 1320),
      );
      const sineCenterDriftPx = Math.max(
        0,
        Number(movementStyle.sineCenterDriftPx ?? 26),
      );
      const sineCenterDriftPeriodFrames = Math.max(
        180,
        Number(movementStyle.sineCenterDriftPeriodFrames ?? 1760),
      );
      const sineLaneJitterPx = Math.max(
        0,
        Number(movementStyle.sineLaneJitterPx ?? 0),
      );
      const sineLaneJitterPeriodFrames = Math.max(
        90,
        Number(movementStyle.sineLaneJitterPeriodFrames ?? 640),
      );
      const sinePhaseWobbleStrength = Math.max(
        0,
        Math.min(Math.PI, Number(movementStyle.sinePhaseWobbleStrength ?? 0)),
      );
      const sinePhaseWobblePeriodFrames = Math.max(
        120,
        Number(movementStyle.sinePhaseWobblePeriodFrames ?? 900),
      );
      const verticalTrackPull = Math.max(
        0.0006,
        Number(movementStyle.verticalTrackPull ?? 0.0048),
      );
      const verticalVelocityMatch = Math.max(
        0,
        Math.min(1.2, Number(movementStyle.verticalVelocityMatch ?? 0.22)),
      );
      const verticalKickStrength = Math.max(
        0,
        Number(movementStyle.verticalKickStrength ?? 0.04),
      );
      const verticalKickThreshold = Math.max(
        0.005,
        Number(movementStyle.verticalKickThreshold ?? 0.03),
      );
      const horizontalCruiseAccel = Math.max(
        0.002,
        Number(movementStyle.horizontalCruiseAccel ?? 0.06),
      );
      const horizontalCruiseSpeed = Math.max(
        0.05,
        Number(movementStyle.horizontalCruiseSpeed ?? minCruiseSpeed),
      );
      const horizontalDeadzone = Math.max(
        0.02,
        Number(movementStyle.horizontalDeadzone ?? 0.09),
      );
      const randomBurstStrength = Math.max(
        0,
        Number(movementStyle.randomBurstStrength ?? 0.24),
      );
      const randomBurstThreshold = Math.max(
        0,
        Math.min(0.98, Number(movementStyle.randomBurstThreshold ?? 0.74)),
      );
      const randomBurstSharpness = Math.max(
        0.6,
        Number(movementStyle.randomBurstSharpness ?? 2.4),
      );
      const randomBurstPeriodFrames = Math.max(
        90,
        Number(movementStyle.randomBurstPeriodFrames ?? 460),
      );
      const turnBurstStrength = Math.max(
        0,
        Number(movementStyle.turnBurstStrength ?? 0.2),
      );
      const turnBurstEdgeWeight = Math.max(
        0,
        Number(movementStyle.turnBurstEdgeWeight ?? 0.42),
      );
      const reverseTurnBurstWeight = Math.max(
        0,
        Math.min(1, Number(movementStyle.reverseTurnBurstWeight ?? 0.42)),
      );

      const centerY = Math.max(
        minTargetY,
        Math.min(maxTargetY, canvas.height * centerYRatio),
      );

      const amplitudeNoiseRaw =
        Math.sin(frame / sineAmplitudeModPeriodFrames + phaseOffset * 0.81) *
          0.5 +
        Math.sin(
          frame / (sineAmplitudeModPeriodFrames * 0.43) + phaseOffset * 1.37,
        ) *
          0.35 +
        Math.sin(
          frame / (sineAmplitudeModPeriodFrames * 0.21) + phaseOffset * 2.11,
        ) *
          0.15;
      const amplitudeNoise = Math.max(-1, Math.min(1, amplitudeNoiseRaw));
      const dynamicAmplitude =
        sineAmplitudePx * (1 + sineAmplitudeVariance * amplitudeNoise);

      const centerDriftSignal =
        Math.sin(frame / sineCenterDriftPeriodFrames + phaseOffset * 0.57) *
          0.66 +
        Math.sin(
          frame / (sineCenterDriftPeriodFrames * 0.49) + phaseOffset * 1.16,
        ) *
          0.34;
      const laneJitterSignal =
        Math.sin(frame / sineLaneJitterPeriodFrames + phaseOffset * 1.41) *
          0.56 +
        Math.sin(
          frame / (sineLaneJitterPeriodFrames * 0.37) + phaseOffset * 2.31,
        ) *
          0.44;
      const dynamicCenterY = Math.max(
        minTargetY,
        Math.min(
          maxTargetY,
          centerY +
            centerDriftSignal * sineCenterDriftPx +
            laneJitterSignal * sineLaneJitterPx,
        ),
      );

      const sineOmega = (Math.PI * 2) / Math.max(1, sinePeriodFrames);
      const phaseWobbleSignal =
        Math.sin(frame / sinePhaseWobblePeriodFrames + phaseOffset * 0.73) *
          0.62 +
        Math.sin(
          frame / (sinePhaseWobblePeriodFrames * 0.45) + phaseOffset * 1.69,
        ) *
          0.38;
      const sinePhase =
        frame * sineOmega +
        phaseOffset +
        phaseWobbleSignal * sinePhaseWobbleStrength;
      const sineTargetY =
        dynamicCenterY + Math.sin(sinePhase) * dynamicAmplitude;
      const nextFrame = frame + 1;
      const nextAmplitudeNoiseRaw =
        Math.sin(
          nextFrame / sineAmplitudeModPeriodFrames + phaseOffset * 0.81,
        ) *
          0.5 +
        Math.sin(
          nextFrame / (sineAmplitudeModPeriodFrames * 0.43) +
            phaseOffset * 1.37,
        ) *
          0.35 +
        Math.sin(
          nextFrame / (sineAmplitudeModPeriodFrames * 0.21) +
            phaseOffset * 2.11,
        ) *
          0.15;
      const nextAmplitudeNoise = Math.max(
        -1,
        Math.min(1, nextAmplitudeNoiseRaw),
      );
      const nextDynamicAmplitude =
        sineAmplitudePx * (1 + sineAmplitudeVariance * nextAmplitudeNoise);
      const nextCenterDriftSignal =
        Math.sin(nextFrame / sineCenterDriftPeriodFrames + phaseOffset * 0.57) *
          0.66 +
        Math.sin(
          nextFrame / (sineCenterDriftPeriodFrames * 0.49) + phaseOffset * 1.16,
        ) *
          0.34;
      const nextLaneJitterSignal =
        Math.sin(nextFrame / sineLaneJitterPeriodFrames + phaseOffset * 1.41) *
          0.56 +
        Math.sin(
          nextFrame / (sineLaneJitterPeriodFrames * 0.37) + phaseOffset * 2.31,
        ) *
          0.44;
      const nextDynamicCenterY = Math.max(
        minTargetY,
        Math.min(
          maxTargetY,
          centerY +
            nextCenterDriftSignal * sineCenterDriftPx +
            nextLaneJitterSignal * sineLaneJitterPx,
        ),
      );
      const nextPhaseWobbleSignal =
        Math.sin(nextFrame / sinePhaseWobblePeriodFrames + phaseOffset * 0.73) *
          0.62 +
        Math.sin(
          nextFrame / (sinePhaseWobblePeriodFrames * 0.45) + phaseOffset * 1.69,
        ) *
          0.38;
      const nextSinePhase =
        nextFrame * sineOmega +
        phaseOffset +
        nextPhaseWobbleSignal * sinePhaseWobbleStrength;
      const nextSineTargetY =
        nextDynamicCenterY + Math.sin(nextSinePhase) * nextDynamicAmplitude;
      const sineTargetVY = nextSineTargetY - sineTargetY;
      const clampedTargetY = Math.max(
        minTargetY,
        Math.min(maxTargetY, sineTargetY),
      );

      const edgeBuffer = Math.max(10, horizontalMargin * 0.35);
      let direction = velocity.x >= 0 ? 1 : -1;
      if (Math.abs(velocity.x) < horizontalDeadzone) {
        direction = position.x < (minTargetX + maxTargetX) * 0.5 ? 1 : -1;
      }
      if (position.x <= minTargetX + edgeBuffer) {
        direction = 1;
      } else if (position.x >= maxTargetX - edgeBuffer) {
        direction = -1;
      }

      const velocityDirection = Math.sign(velocity.x) || direction;
      const reversingDirection = velocityDirection !== direction;
      const edgeDistance = Math.min(
        position.x - minTargetX,
        maxTargetX - position.x,
      );
      const edgeTurnFactor = clamp01(
        (edgeBuffer * 1.8 - edgeDistance) / (edgeBuffer * 1.8),
      );

      const randomBurstSignalRaw =
        Math.sin(frame / randomBurstPeriodFrames + phaseOffset * 0.67) * 0.57 +
        Math.sin(
          frame / (randomBurstPeriodFrames * 0.49) + phaseOffset * 1.23,
        ) *
          0.31 +
        Math.sin(
          frame / (randomBurstPeriodFrames * 0.21) + phaseOffset * 2.03,
        ) *
          0.12;
      const randomBurstSignal = clamp01(0.5 + 0.5 * randomBurstSignalRaw);
      const randomBurstGate = clamp01(
        (randomBurstSignal - randomBurstThreshold) /
          Math.max(0.02, 1 - randomBurstThreshold),
      );
      const randomBurstFactor = Math.pow(randomBurstGate, randomBurstSharpness);
      const randomBurstMultiplier = 1 + randomBurstStrength * randomBurstFactor;

      const turnBurstTrigger = Math.max(
        reversingDirection ? reverseTurnBurstWeight : 0,
        edgeTurnFactor * turnBurstEdgeWeight,
      );
      const turnBurstMultiplier = 1 + turnBurstStrength * turnBurstTrigger;

      const burstCycle =
        0.5 + 0.5 * Math.sin(frame / burstPeriodFrames + phaseOffset);
      const burstFactor = Math.pow(clamp01(burstCycle), burstSharpness);
      const throttle = coastThrottle + (1 - coastThrottle) * burstFactor;

      velocity.x *= swimDrag;
      velocity.y *= swimDrag;

      const desiredVX =
        direction *
        horizontalCruiseSpeed *
        throttle *
        randomBurstMultiplier *
        turnBurstMultiplier;
      velocity.x +=
        (desiredVX - velocity.x) * horizontalCruiseAccel * thrustMultiplier;
      velocity.y +=
        (clampedTargetY - position.y) *
        verticalTrackPull *
        targetPullMultiplier;
      velocity.y +=
        (sineTargetVY - velocity.y) *
        verticalVelocityMatch *
        targetPullMultiplier;

      const weaveSignal = Math.sin(
        frame / weavePeriodFrames + phaseOffset * 0.9,
      );
      const weaveEnvelope =
        weaveThrottleBlend + (1 - weaveThrottleBlend) * throttle;
      const weaveForce = weaveSignal * weaveStrength * weaveEnvelope;
      velocity.y += weaveForce * speedMultiplier;

      if (Math.abs(velocity.y) < verticalKickThreshold) {
        const liftSign = Math.sign(Math.cos(sinePhase)) || 1;
        velocity.y += liftSign * verticalKickStrength * targetPullMultiplier;
      }

      const nextSpeed = Math.hypot(velocity.x, velocity.y);
      const minSpeed =
        minCruiseSpeed * (scaleMinCruiseWithMultiplier ? speedMultiplier : 1);
      if (nextSpeed < minSpeed && minSpeed > 0) {
        velocity.x += direction * (minSpeed - nextSpeed) * minCruiseCorrection;
      }
    } else {
      const roamX01 =
        clamp01(
          0.5 +
            0.5 *
              Math.sin(frame / roamPeriodX + phaseOffset) *
              (0.82 + 0.18 * Math.sin(frame / (roamPeriodX * 0.47))),
        ) || 0.5;
      const roamY01 =
        clamp01(
          0.5 +
            0.5 *
              Math.sin(frame / roamPeriodY + phaseOffset * 1.3) *
              (0.8 + 0.2 * Math.sin(frame / (roamPeriodY * 0.53))),
        ) || 0.5;

      const targetX = minTargetX + (maxTargetX - minTargetX) * roamX01;
      const targetY = minTargetY + (maxTargetY - minTargetY) * roamY01;

      const toTargetX = targetX - position.x;
      const toTargetY = targetY - position.y;
      const desiredHeading = Math.atan2(toTargetY, toTargetX || 0.0001);

      const currentSpeed = Math.hypot(velocity.x, velocity.y);
      const currentHeading =
        currentSpeed > 0.0001
          ? Math.atan2(velocity.y, velocity.x)
          : desiredHeading;

      const noiseSignal =
        Math.sin(frame / noisePeriodFrames + phaseOffset) * 0.68 +
        Math.sin(frame / (noisePeriodFrames * 0.46) + phaseOffset * 1.8) * 0.32;
      const noisyDesiredHeading =
        desiredHeading + noiseSignal * noiseTurnStrength * Math.PI;
      const headingDelta = wrapAngleRadians(
        noisyDesiredHeading - currentHeading,
      );
      const limitedHeading =
        currentHeading +
        Math.max(-maxTurnRateRad, Math.min(maxTurnRateRad, headingDelta));
      const heading = lerpAngleRadians(
        currentHeading,
        limitedHeading,
        steerBlend,
      );

      const forwardX = Math.cos(heading);
      const forwardY = Math.sin(heading);
      const sideX = -forwardY;
      const sideY = forwardX;

      const burstCycle =
        0.5 + 0.5 * Math.sin(frame / burstPeriodFrames + phaseOffset);
      const burstFactor = Math.pow(clamp01(burstCycle), burstSharpness);
      const throttle = coastThrottle + (1 - coastThrottle) * burstFactor;

      velocity.x *= swimDrag;
      velocity.y *= swimDrag;
      velocity.x += forwardX * baseThrust * throttle * thrustMultiplier;
      velocity.y += forwardY * baseThrust * throttle * thrustMultiplier;

      const sideError = toTargetX * sideX + toTargetY * sideY;
      const forwardErrorRaw = toTargetX * forwardX + toTargetY * forwardY;
      const forwardError =
        forwardErrorRaw >= 0
          ? forwardErrorRaw
          : forwardErrorRaw * backwardPullFactor;
      velocity.x +=
        sideX *
        sideError *
        targetPull *
        targetPullLateralWeight *
        targetPullMultiplier;
      velocity.y +=
        sideY *
        sideError *
        targetPull *
        targetPullLateralWeight *
        targetPullMultiplier;
      velocity.x +=
        forwardX *
        forwardError *
        targetPull *
        targetPullForwardWeight *
        targetPullMultiplier;
      velocity.y +=
        forwardY *
        forwardError *
        targetPull *
        targetPullForwardWeight *
        targetPullMultiplier;

      const wiggle =
        Math.sin(frame / wigglePeriodFrames + phaseOffset * 1.1) *
        wiggleAmplitude *
        (0.65 + 0.35 * throttle);
      velocity.x += sideX * wiggle * speedMultiplier;
      velocity.y += sideY * wiggle * speedMultiplier;

      const weaveSignal = Math.sin(
        frame / weavePeriodFrames + phaseOffset * 0.9,
      );
      const weaveEnvelope =
        weaveThrottleBlend + (1 - weaveThrottleBlend) * throttle;
      const weaveForce = weaveSignal * weaveStrength * weaveEnvelope;
      velocity.x += sideX * weaveForce * speedMultiplier;
      velocity.y += sideY * weaveForce * speedMultiplier;

      const nextSpeed = Math.hypot(velocity.x, velocity.y);
      const minSpeed =
        minCruiseSpeed * (scaleMinCruiseWithMultiplier ? speedMultiplier : 1);
      if (nextSpeed < minSpeed && minSpeed > 0) {
        velocity.x += forwardX * (minSpeed - nextSpeed) * minCruiseCorrection;
        velocity.y += forwardY * (minSpeed - nextSpeed) * minCruiseCorrection;
      }
    }
  } else if (overrideRouteMotion && useArcDriftStyle) {
    const phaseOffset = Number(movementStyle.phaseOffset || 0);
    const centerYRatio = Math.max(
      0.2,
      Math.min(0.85, Number(movementStyle.centerYRatio ?? 0.58)),
    );
    const verticalAmplitudePx = Math.max(
      10,
      Number(
        movementStyle.verticalAmplitudePx ?? Math.min(90, canvas.height * 0.18),
      ),
    );
    const verticalPeriodFrames = Math.max(
      60,
      Number(movementStyle.verticalPeriodFrames ?? 210),
    );
    const verticalPull = Math.max(
      0.0002,
      Number(movementStyle.verticalPull ?? 0.0021),
    );
    const horizontalBias = Number(movementStyle.horizontalBias ?? 0.0011);
    const horizontalPeriodFrames = Math.max(
      80,
      Number(movementStyle.horizontalPeriodFrames ?? 240),
    );

    const targetY =
      Math.max(
        topSafeInset + 20,
        Math.min(
          canvas.height - spriteHeight - 20,
          centerYRatio * canvas.height,
        ),
      ) +
      Math.sin(frame / verticalPeriodFrames + phaseOffset) *
        verticalAmplitudePx;

    velocity.x +=
      Math.sin(frame / horizontalPeriodFrames + phaseOffset * 0.65) *
      horizontalBias *
      speedMultiplier;
    velocity.y += (targetY - position.y) * (verticalPull * speedMultiplier);
  } else if (routeZone === petRouteZones.LEFT_ASSIST && checklistIncomplete) {
    const targetX = 70 + Math.sin(frame / 70) * 28;
    const minTargetY = Math.max(24, topSafeInset + 18);
    const targetY = Math.max(
      minTargetY,
      Math.min(
        canvas.height - spriteHeight - 24,
        130 + Math.sin(frame / 62) * 40,
      ),
    );
    velocity.x += (targetX - position.x) * profile.checklistPull;
    velocity.y +=
      (targetY - position.y) * (profile.checklistPull * 0.7 * speedMultiplier);
  } else if (routeZone === petRouteZones.BOTTOM_ROAM) {
    const targetY = Math.max(
      topSafeInset + 22,
      canvas.height - spriteHeight - 26,
    );
    const targetX =
      canvas.width * 0.5 +
      Math.sin(frame / 80) * Math.min(260, canvas.width * 0.26);
    velocity.x += (targetX - position.x) * (0.0012 * speedMultiplier);
    velocity.y += (targetY - position.y) * (0.0021 * speedMultiplier);
  } else if (routeZone === petRouteZones.RIGHT_SUMMARY) {
    const targetX = Math.max(
      80,
      canvas.width - spriteWidth - 120 + Math.sin(frame / 95) * 22,
    );
    const targetY = Math.max(
      topSafeInset + 24,
      Math.min(canvas.height - spriteHeight - 30, canvas.height * 0.56),
    );
    velocity.x += (targetX - position.x) * (0.0015 * speedMultiplier);
    velocity.y += (targetY - position.y) * (0.0013 * speedMultiplier);
  } else if (routeZone === petRouteZones.HEADER_PERCH) {
    const targetY = Math.max(topSafeInset + 18, 30 + Math.sin(frame / 75) * 8);
    const targetX =
      canvas.width * 0.5 +
      Math.sin(frame / 105) * Math.min(220, canvas.width * 0.2);
    velocity.x += (targetX - position.x) * (0.0013 * speedMultiplier);
    velocity.y += (targetY - position.y) * (0.002 * speedMultiplier);
  } else {
    velocity.x += Math.sin(frame / 130) * profile.driftX * speedMultiplier;
    velocity.y += Math.cos(frame / 150) * profile.driftY * speedMultiplier;
  }

  if (allTenStepsCompleted) {
    velocity.x += Math.sin(frame / 16) * (0.012 * speedMultiplier);
    velocity.y += Math.cos(frame / 18) * (0.01 * speedMultiplier);
  }

  if (Date.now() < nextMilestoneBoostUntil) {
    velocity.x += Math.sin(frame / 12) * (0.009 * speedMultiplier);
    velocity.y += Math.cos(frame / 14) * (0.008 * speedMultiplier);
  }

  position.x += velocity.x;
  position.y += velocity.y;

  const minX = 6;
  const minY = Math.max(6, topSafeInset + 6);
  const maxX = Math.max(minX, canvas.width - spriteWidth - 6);
  const maxY = Math.max(minY, canvas.height - spriteHeight - 6);

  if (position.x <= minX || position.x >= maxX) {
    const edgeTurnDamping = Math.max(
      0.35,
      Math.min(1, Number(movementStyle.edgeTurnDamping ?? 1)),
    );
    position.x = Math.max(minX, Math.min(maxX, position.x));

    if (useSineCruisePath) {
      const wallExitSpeed = Math.max(
        0.08,
        Number(
          movementStyle.wallExitSpeed ??
            Math.max(
              0.42,
              Number(movementStyle.horizontalCruiseSpeed ?? 0.8) * 0.55,
            ),
        ),
      );
      const wallTurnBlend = Math.max(
        0,
        Math.min(1, Number(movementStyle.wallTurnBlend ?? 0.28)),
      );
      const wallTurnMinExitSpeedRatio = Math.max(
        0,
        Math.min(1, Number(movementStyle.wallTurnMinExitSpeedRatio ?? 0.34)),
      );
      const reboundBase = Math.max(wallExitSpeed, Math.abs(velocity.x) * 0.35);
      const minExitSpeed = wallExitSpeed * wallTurnMinExitSpeedRatio;

      if (position.x <= minX + 0.001) {
        const blended = velocity.x + (reboundBase - velocity.x) * wallTurnBlend;
        velocity.x = Math.max(minExitSpeed, blended);
      } else if (position.x >= maxX - 0.001) {
        const blended =
          velocity.x + (-reboundBase - velocity.x) * wallTurnBlend;
        velocity.x = Math.min(-minExitSpeed, blended);
      }
    } else {
      velocity.x *= -edgeTurnDamping;
    }
  }

  if (position.y <= minY || position.y >= maxY) {
    const edgeTurnDamping = Math.max(
      0.35,
      Math.min(1, Number(movementStyle.edgeTurnDamping ?? 1)),
    );
    velocity.y *= -edgeTurnDamping;
    position.y = Math.max(minY, Math.min(maxY, position.y));
  }

  if (useSineCruisePath) {
    const wallExitSpeed = Math.max(
      0.08,
      Number(
        movementStyle.wallExitSpeed ??
          Math.max(
            0.42,
            Number(movementStyle.horizontalCruiseSpeed ?? 0.8) * 0.55,
          ),
      ),
    );
    const stallRecoverySpeed = Math.max(
      0.08,
      Number(movementStyle.stallRecoverySpeed ?? wallExitSpeed * 0.68),
    );
    const vxFloor = Math.max(
      0,
      Number(movementStyle.vxFloor ?? stallRecoverySpeed),
    );

    if (Math.abs(velocity.x) < stallRecoverySpeed) {
      const awayDirection =
        position.x <= minX + 1
          ? 1
          : position.x >= maxX - 1
            ? -1
            : position.x < (minX + maxX) * 0.5
              ? 1
              : -1;
      velocity.x = awayDirection * stallRecoverySpeed;
    }

    if (vxFloor > 0) {
      const maxVxCap =
        profile.maxSpeedX * (allTenStepsCompleted ? 1.2 : 1) * speedMultiplier;
      const effectiveVxFloor = Math.min(vxFloor, Math.max(0, maxVxCap));
      if (Math.abs(velocity.x) < effectiveVxFloor) {
        const floorDirection =
          Math.sign(velocity.x) || (position.x < (minX + maxX) * 0.5 ? 1 : -1);
        velocity.x = floorDirection * effectiveVxFloor;
      }
    }
  }

  const celebrationBoost = allTenStepsCompleted ? 1.2 : 1;
  velocity.x = Math.max(
    -profile.maxSpeedX * celebrationBoost * speedMultiplier,
    Math.min(
      profile.maxSpeedX * celebrationBoost * speedMultiplier,
      velocity.x,
    ),
  );
  velocity.y = Math.max(
    -profile.maxSpeedY * celebrationBoost * speedMultiplier,
    Math.min(
      profile.maxSpeedY * celebrationBoost * speedMultiplier,
      velocity.y,
    ),
  );

  return {
    allTenStepsCompleted,
    lastChecklistCompleted: nextLastChecklistCompleted,
    milestoneBoostUntil: nextMilestoneBoostUntil,
    pendingMilestoneEmotionBursts: nextPendingMilestoneEmotionBursts,
  };
}
