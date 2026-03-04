export const wolfBehavior = {
  driftX: 0.00075,
  driftY: 0.0005,
  maxSpeedX: 1.45,
  maxSpeedY: 1,
  checklistPull: 0.0017,
  animationPools: {
    movement: ["idle"],
    idle: ["idle"],
    interaction: ["idle"],
    celebration: ["idle"],
  },
  playfulNature: {
    intervalMs: [7600, 15500],
    durationMs: [900, 1500],
    activationChance: 0.42,
    actionKeys: ["idle"],
  },
  taskCompletion: {
    triggerChance: 0.78,
    durationMs: [1100, 1700],
    actionKeys: ["idle"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 2100,
      movement: 1000,
      playful: 1000,
      celebration: 1300,
      fallback: 1500,
    },
  },
};
