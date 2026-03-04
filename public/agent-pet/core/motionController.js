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
  const useArcDriftStyle =
    String(movementStyle.mode || "").toLowerCase() === "arcdrift";
  const overrideRouteMotion =
    useArcDriftStyle && movementStyle.overrideRouteMotion === true;

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
  } else if (overrideRouteMotion) {
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
    velocity.x *= -edgeTurnDamping;
    position.x = Math.max(minX, Math.min(maxX, position.x));
  }

  if (position.y <= minY || position.y >= maxY) {
    const edgeTurnDamping = Math.max(
      0.35,
      Math.min(1, Number(movementStyle.edgeTurnDamping ?? 1)),
    );
    velocity.y *= -edgeTurnDamping;
    position.y = Math.max(minY, Math.min(maxY, position.y));
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
