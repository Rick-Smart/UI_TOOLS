export const ferretBehavior = {
  driftX: 0.0007,
  driftY: 0.0005,
  maxSpeedX: 1.4,
  maxSpeedY: 1,
  checklistPull: 0.0017,
  animationPools: {
    movement: ["movement", "jump"],
    idle: ["idle", "idle2", "sleep"],
    interaction: ["dig"],
    celebration: ["dig", "movement"],
  },
  playfulNature: {
    intervalMs: [4700, 9300],
    durationMs: [900, 1600],
    activationChance: 0.74,
    actionKeys: ["dig", "idle2", "sleep", "emerge"],
  },
  taskCompletion: {
    triggerChance: 0.95,
    durationMs: [1200, 2100],
    actionKeys: ["dig", "emerge", "disappear"],
  },
  stateMachine: {
    minHoldMsByReason: {
      idle: 1700,
      movement: 950,
      playful: 900,
      celebration: 1200,
      fallback: 1300,
    },
  },
  effects: {
    digDirt: {
      enabled: true,
      color: "#8d6b4e",
      colorSecondary: "#b3906f",
      count: 7,
      intervalMs: [120, 220],
    },
  },
};
