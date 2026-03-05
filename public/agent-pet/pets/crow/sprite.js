const FRAME_SIZE = 64;
const ROW_GAP = 8;

function frameAt(rowY, colIndex, action, actionKey, category, ticks = 6) {
  const safeCol = Math.max(0, Number(colIndex) || 0);
  return {
    x: safeCol * FRAME_SIZE,
    y: Math.max(0, Number(rowY) || 0),
    w: FRAME_SIZE,
    h: FRAME_SIZE,
    ticks,
    action,
    actionKey,
    category,
  };
}

function buildFramesByRow(rowY, count, action, actionKey, category, ticks = 6) {
  return Array.from({ length: count }, (_, offset) =>
    frameAt(rowY, offset, action, actionKey, category, ticks),
  );
}

function toAnimation(title, category, frames, averageTicks = 6) {
  const totalTicks = frames.reduce((sum, frame) => sum + frame.ticks, 0);
  return {
    title,
    category,
    playable: true,
    frameCount: frames.length,
    totalTicks,
    averageTicks,
    frames,
  };
}

const CROW_GROUPS = {
  "crow-bothered-ground": buildFramesByRow(
    0,
    6,
    "Crow Bothered Ground",
    "crow-bothered-ground",
    "interaction",
    6,
  ),
  "crow-idle-forward": buildFramesByRow(
    FRAME_SIZE + ROW_GAP,
    20,
    "Crow Idle Forward",
    "crow-idle-forward",
    "idle",
    6,
  ),
  "crow-idle-away": buildFramesByRow(
    (FRAME_SIZE + ROW_GAP) * 2,
    16,
    "Crow Idle Away",
    "crow-idle-away",
    "idle",
    6,
  ),
  "crow-fly-s": buildFramesByRow(
    (FRAME_SIZE + ROW_GAP) * 3,
    8,
    "Crow Fly S",
    "crow-fly-s",
    "movement",
    6,
  ),
  "crow-fly-w": buildFramesByRow(
    (FRAME_SIZE + ROW_GAP) * 4,
    8,
    "Crow Fly W",
    "crow-fly-w",
    "movement",
    6,
  ),
  "crow-fly-sw": buildFramesByRow(
    (FRAME_SIZE + ROW_GAP) * 5,
    8,
    "Crow Fly SW",
    "crow-fly-sw",
    "movement",
    6,
  ),
  "crow-fly-nw": buildFramesByRow(
    (FRAME_SIZE + ROW_GAP) * 6,
    8,
    "Crow Fly NW",
    "crow-fly-nw",
    "movement",
    6,
  ),
  "crow-fly-n": buildFramesByRow(
    (FRAME_SIZE + ROW_GAP) * 7,
    8,
    "Crow Fly N",
    "crow-fly-n",
    "movement",
    6,
  ),
};

const CROW_ANIMATIONS = {
  "crow-bothered-ground": toAnimation(
    "Crow Bothered Ground",
    "interaction",
    CROW_GROUPS["crow-bothered-ground"],
  ),
  "crow-idle-forward": toAnimation(
    "Crow Idle Forward",
    "idle",
    CROW_GROUPS["crow-idle-forward"],
  ),
  "crow-idle-away": toAnimation(
    "Crow Idle Away",
    "idle",
    CROW_GROUPS["crow-idle-away"],
  ),
  "crow-fly-s": toAnimation(
    "Crow Fly S",
    "movement",
    CROW_GROUPS["crow-fly-s"],
  ),
  "crow-fly-w": toAnimation(
    "Crow Fly W",
    "movement",
    CROW_GROUPS["crow-fly-w"],
  ),
  "crow-fly-sw": toAnimation(
    "Crow Fly SW",
    "movement",
    CROW_GROUPS["crow-fly-sw"],
  ),
  "crow-fly-nw": toAnimation(
    "Crow Fly NW",
    "movement",
    CROW_GROUPS["crow-fly-nw"],
  ),
  "crow-fly-n": toAnimation(
    "Crow Fly N",
    "movement",
    CROW_GROUPS["crow-fly-n"],
  ),
};

export const crowSprite = {
  name: "Crow",
  frameDuration: 6,
  sizeMultiplier: 0.43,
  atlas: {
    src: "/agent-pet/pets/crow/media/sheet.png",
    scale: 1,
    facing: "right",
  },
  shadow: {
    groundOffset: 0,
    groundAnchorRatio: 0.82,
    groundWidthPad: 20,
    airborneOffset: 22,
    airborneWidthPad: 6,
    airborneActions: [
      "Crow Fly S",
      "Crow Fly W",
      "Crow Fly SW",
      "Crow Fly NW",
      "Crow Fly N",
    ],
  },
  animations: CROW_ANIMATIONS,
  animationOrder: [
    "crow-idle-forward",
    "crow-idle-away",
    "crow-bothered-ground",
    "crow-fly-s",
    "crow-fly-w",
    "crow-fly-sw",
    "crow-fly-nw",
    "crow-fly-n",
  ],
  defaultAnimationKeys: {
    idle: "crow-idle-forward",
    movement: "crow-fly-w",
    interaction: "crow-bothered-ground",
    celebration: "crow-fly-nw",
  },
  frames: Object.values(CROW_GROUPS).flat(),
};
