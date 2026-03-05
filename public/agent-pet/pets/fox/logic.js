export const foxBehavior = {
  driftX: 0.00078,
  driftY: 0.00052,
  maxSpeedX: 1.48,
  maxSpeedY: 1.02,
  checklistPull: 0.0016,
  animationPools: {
    movement: ["fox-walk"],
    idle: ["fox-idle-stand", "fox-sleep-idle"],
    interaction: [
      "fox-inspect",
      "fox-stand-to-stretch",
      "fox-stretch-to-stand",
      "fox-stand-to-lie",
      "fox-lie-to-stand",
    ],
    celebration: ["fox-inspect", "fox-stand-to-stretch"],
  },
  animationPoolWeights: {
    idle: {
      "fox-idle-stand": 9,
      "fox-sleep-idle": 1,
    },
  },
  playfulNature: {
    intervalMs: [5000, 9600],
    durationMs: [900, 1700],
    activationChance: 0.66,
    actionKeys: ["fox-inspect", "fox-stand-to-stretch", "fox-stretch-to-stand"],
  },
  taskCompletion: {
    triggerChance: 0.9,
    durationMs: [1050, 1950],
    actionKeys: ["fox-inspect", "fox-walk", "fox-lie-to-stand"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 1600,
      movement: 900,
      playful: 900,
      celebration: 1200,
      fallback: 1250,
    },
  },
};
