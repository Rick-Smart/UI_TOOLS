export const redPandaBehavior = {
  driftX: 0.00065,
  driftY: 0.0005,
  maxSpeedX: 1.35,
  maxSpeedY: 1,
  checklistPull: 0.0016,
  animationPools: {
    movement: ["movement"],
    idle: ["idle", "idle2", "sleep"],
    interaction: ["attack"],
    celebration: ["attack", "movement"],
  },
  playfulNature: {
    intervalMs: [5600, 10800],
    durationMs: [1000, 1800],
    activationChance: 0.64,
    actionKeys: ["attack", "idle2", "sleep"],
  },
  taskCompletion: {
    triggerChance: 0.92,
    durationMs: [1200, 2200],
    actionKeys: ["attack", "movement"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 2200,
      movement: 1100,
      playful: 1150,
      celebration: 1450,
      fallback: 1650,
    },
  },
};
