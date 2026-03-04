export const jackRussellBehavior = {
  driftX: 0.00075,
  driftY: 0.00045,
  maxSpeedX: 1.45,
  maxSpeedY: 1,
  checklistPull: 0.0017,
  animationPools: {
    movement: ["movement", "movement-ball", "dash"],
    idle: ["idle", "sit-idle", "sleep"],
    interaction: ["bark", "playful", "bite"],
    celebration: ["playful", "movement-ball", "dash-ball"],
  },
  playfulNature: {
    intervalMs: [4600, 9000],
    durationMs: [900, 1650],
    activationChance: 0.76,
    actionKeys: ["playful", "bark", "sit-idle", "bite"],
  },
  taskCompletion: {
    triggerChance: 0.96,
    durationMs: [1100, 2100],
    actionKeys: ["playful", "bark", "movement-ball"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 1600,
      movement: 900,
      playful: 850,
      celebration: 1200,
      fallback: 1250,
    },
  },
};
