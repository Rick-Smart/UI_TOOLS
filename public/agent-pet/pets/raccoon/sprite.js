const FRAME_SIZE = 32;

function buildRowFrames(y, count, action, actionKey, category, ticks = 6) {
  return Array.from({ length: count }, (_, index) => ({
    x: index * FRAME_SIZE,
    y,
    w: FRAME_SIZE,
    h: FRAME_SIZE,
    ticks,
    action,
    actionKey,
    category,
  }));
}

const IDLE_FRAMES = buildRowFrames(0, 8, "Idle", "idle", "idle");
const MOVEMENT_FRAMES = buildRowFrames(
  32,
  8,
  "Movement",
  "movement",
  "movement",
);
const PLAY_FRAMES = buildRowFrames(64, 4, "Play", "play", "interaction");
const SLEEP_FRAMES = buildRowFrames(96, 4, "Sleep", "sleep", "idle", 10);

const ANIMATIONS = {
  idle: {
    title: "Idle",
    category: "idle",
    playable: true,
    frameCount: IDLE_FRAMES.length,
    totalTicks: IDLE_FRAMES.reduce((sum, frame) => sum + frame.ticks, 0),
    averageTicks: 6,
    frames: IDLE_FRAMES,
  },
  movement: {
    title: "Movement",
    category: "movement",
    playable: true,
    frameCount: MOVEMENT_FRAMES.length,
    totalTicks: MOVEMENT_FRAMES.reduce((sum, frame) => sum + frame.ticks, 0),
    averageTicks: 6,
    frames: MOVEMENT_FRAMES,
  },
  play: {
    title: "Play",
    category: "interaction",
    playable: true,
    frameCount: PLAY_FRAMES.length,
    totalTicks: PLAY_FRAMES.reduce((sum, frame) => sum + frame.ticks, 0),
    averageTicks: 6,
    frames: PLAY_FRAMES,
  },
  sleep: {
    title: "Sleep",
    category: "idle",
    playable: true,
    holdOnLastFrame: true,
    frameCount: SLEEP_FRAMES.length,
    totalTicks: SLEEP_FRAMES.reduce((sum, frame) => sum + frame.ticks, 0),
    averageTicks: 10,
    frames: SLEEP_FRAMES,
  },
};

export const raccoonSprite = {
  name: "Raccoon",
  frameDuration: 6,
  atlas: {
    src: "/agent-pet/pets/raccoon/media/sheet.png",
    scale: 2,
    facing: "right",
  },
  shadow: {
    groundOffset: 1,
    groundWidthPad: 14,
    airborneOffset: 14,
    airborneWidthPad: 4,
    airborneActions: [],
  },
  animations: ANIMATIONS,
  animationOrder: ["movement", "idle", "play", "sleep"],
  defaultAnimationKeys: {
    idle: "idle",
    movement: "movement",
    interaction: "play",
    celebration: "play",
  },
  frames: [...IDLE_FRAMES, ...MOVEMENT_FRAMES, ...PLAY_FRAMES, ...SLEEP_FRAMES],
};
