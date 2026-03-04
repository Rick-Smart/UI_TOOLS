export const raccoonBehavior = {
  driftX: 0.00065,
  driftY: 0.0005,
  maxSpeedX: 1.35,
  maxSpeedY: 1,
  checklistPull: 0.0016,
  animationPools: {
    movement: ["movement"],
    idle: ["idle", "sleep"],
    interaction: ["play"],
    celebration: ["play", "movement"],
  },
  playfulNature: {
    intervalMs: [7000, 15000],
    durationMs: [900, 1500],
    activationChance: 0.45,
    actionKeys: ["play", "movement"],
  },
  taskCompletion: {
    triggerChance: 0.8,
    durationMs: [1100, 1800],
    actionKeys: ["play", "movement"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 2400,
      movement: 1050,
      playful: 1100,
      celebration: 1350,
      fallback: 1700,
    },
  },
};
