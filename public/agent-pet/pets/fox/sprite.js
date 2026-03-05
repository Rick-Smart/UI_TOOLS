const FRAME_SIZE = 64;
const FRAMES_PER_ROW = 6;

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

function buildFramesByRow(
  rowIndex,
  action,
  actionKey,
  category,
  ticks = 6,
  frameCount = FRAMES_PER_ROW,
) {
  const rowY = rowIndex * FRAME_SIZE;
  const count = Math.max(1, Math.min(FRAMES_PER_ROW, Number(frameCount) || 1));
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

const FOX_GROUPS = {
  "fox-idle-stand": buildFramesByRow(
    0,
    "Fox Idle Stand",
    "fox-idle-stand",
    "idle",
    6,
  ),
  "fox-stand-to-stretch": buildFramesByRow(
    1,
    "Fox Stand To Stretch",
    "fox-stand-to-stretch",
    "interaction",
    6,
  ),
  "fox-stretch-to-stand": buildFramesByRow(
    2,
    "Fox Stretch To Stand",
    "fox-stretch-to-stand",
    "interaction",
    6,
  ),
  "fox-stand-to-lie": buildFramesByRow(
    3,
    "Fox Stand To Lie",
    "fox-stand-to-lie",
    "interaction",
    6,
  ),
  "fox-sleep-idle": buildFramesByRow(
    4,
    "Fox Sleep Idle",
    "fox-sleep-idle",
    "idle",
    6,
  ),
  "fox-lie-to-stand": buildFramesByRow(
    5,
    "Fox Lie To Stand",
    "fox-lie-to-stand",
    "interaction",
    6,
  ),
  "fox-walk": buildFramesByRow(6, "Fox Walk", "fox-walk", "movement", 6),
  "fox-inspect": buildFramesByRow(
    7,
    "Fox Inspect",
    "fox-inspect",
    "interaction",
    6,
  ),
};

const FOX_ANIMATIONS = {
  "fox-idle-stand": toAnimation(
    "Fox Idle Stand",
    "idle",
    FOX_GROUPS["fox-idle-stand"],
  ),
  "fox-stand-to-stretch": toAnimation(
    "Fox Stand To Stretch",
    "interaction",
    FOX_GROUPS["fox-stand-to-stretch"],
  ),
  "fox-stretch-to-stand": toAnimation(
    "Fox Stretch To Stand",
    "interaction",
    FOX_GROUPS["fox-stretch-to-stand"],
  ),
  "fox-stand-to-lie": toAnimation(
    "Fox Stand To Lie",
    "interaction",
    FOX_GROUPS["fox-stand-to-lie"],
  ),
  "fox-sleep-idle": toAnimation(
    "Fox Sleep Idle",
    "idle",
    FOX_GROUPS["fox-sleep-idle"],
  ),
  "fox-lie-to-stand": toAnimation(
    "Fox Lie To Stand",
    "interaction",
    FOX_GROUPS["fox-lie-to-stand"],
  ),
  "fox-walk": toAnimation("Fox Walk", "movement", FOX_GROUPS["fox-walk"]),
  "fox-inspect": toAnimation(
    "Fox Inspect",
    "interaction",
    FOX_GROUPS["fox-inspect"],
  ),
};

export const foxSprite = {
  name: "Fox",
  frameDuration: 6,
  sizeMultiplier: 0.4,
  atlas: {
    src: "/agent-pet/pets/fox/media/sheet.png",
    scale: 1,
    facing: "left",
  },
  shadow: {
    groundOffset: 1,
    groundWidthPad: 16,
    airborneOffset: 14,
    airborneWidthPad: 6,
    airborneActions: [],
  },
  animations: FOX_ANIMATIONS,
  animationOrder: [
    "fox-idle-stand",
    "fox-sleep-idle",
    "fox-walk",
    "fox-inspect",
    "fox-stand-to-stretch",
    "fox-stretch-to-stand",
    "fox-stand-to-lie",
    "fox-lie-to-stand",
  ],
  defaultAnimationKeys: {
    idle: "fox-idle-stand",
    movement: "fox-walk",
    interaction: "fox-inspect",
    celebration: "fox-stand-to-stretch",
  },
  frames: Object.values(FOX_GROUPS).flat(),
};
