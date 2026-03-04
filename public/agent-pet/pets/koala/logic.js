export const koalaBehavior = {
  driftX: 0.0005,
  driftY: 0.00042,
  maxSpeedX: 1.2,
  maxSpeedY: 0.9,
  checklistPull: 0.0015,
  animationPools: {
    movement: ["movement", "climb"],
    idle: ["idle"],
    interaction: ["eat"],
    celebration: ["climb", "movement", "eat"],
  },
  playfulNature: {
    intervalMs: [6200, 13200],
    durationMs: [1100, 2200],
    activationChance: 0.56,
    actionKeys: ["eat", "idle", "climb"],
  },
  taskCompletion: {
    triggerChance: 0.88,
    durationMs: [1300, 2300],
    actionKeys: ["eat", "climb", "movement"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 2500,
      movement: 1200,
      playful: 1300,
      celebration: 1500,
      fallback: 1800,
    },
  },
};
