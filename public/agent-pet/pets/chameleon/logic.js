export const chameleonBehavior = {
  driftX: 0.000275,
  driftY: 0.000225,
  maxSpeedX: 0.6,
  maxSpeedY: 0.475,
  checklistPull: 0.0008,
  animationPools: {
    movement: ["movement"],
    idle: ["idle"],
    interaction: ["tongue"],
    celebration: ["tongue", "movement"],
  },
  playfulNature: {
    intervalMs: [6200, 13000],
    durationMs: [1100, 2200],
    activationChance: 0.62,
    actionKeys: ["tongue", "idle", "reappear"],
  },
  taskCompletion: {
    triggerChance: 0.9,
    durationMs: [1200, 2300],
    actionKeys: ["tongue", "movement", "reappear"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 2400,
      movement: 1200,
      playful: 1300,
      celebration: 1450,
      fallback: 1800,
    },
  },
};
