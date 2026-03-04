export const sphynxCatBehavior = {
  driftX: 0.00065,
  driftY: 0.00048,
  maxSpeedX: 1.35,
  maxSpeedY: 1,
  checklistPull: 0.0016,
  animationPools: {
    movement: ["walk", "run", "jump"],
    idle: ["idle", "idlesit", "sleep"],
    interaction: ["clean", "paw", "lick"],
    celebration: ["run", "paw", "jump"],
  },
  playfulNature: {
    intervalMs: [5200, 9800],
    durationMs: [950, 1700],
    activationChance: 0.72,
    actionKeys: ["paw", "lick", "idlesit", "clean"],
  },
  taskCompletion: {
    triggerChance: 0.95,
    durationMs: [1200, 2200],
    actionKeys: ["clean", "paw", "run"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 2300,
      movement: 1100,
      playful: 1200,
      celebration: 1500,
      fallback: 1700,
    },
  },
};
