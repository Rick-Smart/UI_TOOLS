import { PET_CATALOG } from "./petCatalog.js";

const PET_BEHAVIOR_PROFILES = {
  cat: {
    driftX: 0.0014,
    driftY: 0.001,
    maxSpeedX: 2.2,
    maxSpeedY: 1.6,
    checklistPull: 0.0024,
  },
  dog: {
    driftX: 0.002,
    driftY: 0.0013,
    maxSpeedX: 2.8,
    maxSpeedY: 2,
    checklistPull: 0.0032,
  },
  crow: {
    driftX: 0.0023,
    driftY: 0.0018,
    maxSpeedX: 3.1,
    maxSpeedY: 2.2,
    checklistPull: 0.003,
  },
  raccoon: {
    driftX: 0.0017,
    driftY: 0.0011,
    maxSpeedX: 2.5,
    maxSpeedY: 1.8,
    checklistPull: 0.0028,
  },
  dragonling: {
    driftX: 0.0025,
    driftY: 0.002,
    maxSpeedX: 3.3,
    maxSpeedY: 2.4,
    checklistPull: 0.0034,
  },
};

function getProfile(petId) {
  return PET_BEHAVIOR_PROFILES[petId] || PET_BEHAVIOR_PROFILES.cat;
}

function drawSparkle(ctx, x, y, size) {
  ctx.fillStyle = "#facc15";
  ctx.fillRect(x + size, y, size, size * 3);
  ctx.fillRect(x, y + size, size * 3, size);
}

function drawPixelSprite(
  ctx,
  spriteRows,
  palette,
  originX,
  originY,
  scale,
  blink,
) {
  for (let y = 0; y < spriteRows.length; y += 1) {
    const row = spriteRows[y];
    for (let x = 0; x < row.length; x += 1) {
      const colorIndex = Number(row[x]);
      if (!colorIndex) {
        continue;
      }

      let fill = palette[colorIndex];
      if (blink && colorIndex === 4) {
        fill = palette[3];
      }

      ctx.fillStyle = fill;
      ctx.fillRect(originX + x * scale, originY + y * scale, scale, scale);
    }
  }
}

function drawHeart(ctx, x, y, size) {
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(x + size, y, size, size);
  ctx.fillRect(x + size * 3, y, size, size);
  ctx.fillRect(x, y + size, size * 5, size);
  ctx.fillRect(x + size, y + size * 2, size * 3, size);
  ctx.fillRect(x + size * 2, y + size * 3, size, size);
}

export function createPetEngine(canvas, getState, getContext) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return {
      start: () => {},
      stop: () => {},
      handleViewportClick: () => {},
    };
  }

  let running = false;
  let frame = 0;
  let rafId = 0;
  let pettingUntil = 0;
  let position = { x: 180, y: 220 };
  let velocity = { x: 1.2, y: 0.9 };
  let lastBounds = { x: 0, y: 0, width: 64, height: 64 };

  function resizeCanvas() {
    const width = Math.max(320, window.innerWidth || 1280);
    const height = Math.max(220, window.innerHeight || 720);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function updateMotion(spriteWidth, spriteHeight, state) {
    const behavior = getContext() || {};
    const profile = getProfile(state.selectedPetId);
    const topSafeInset = Math.max(0, Number(behavior.topSafeInset || 0));
    const inCallHandling = String(behavior.pathname || "").includes(
      "/call-handling",
    );
    const checklistCompleted = Number(behavior.checklistCompleted || 0);
    const checklistTotal = Number(behavior.checklistTotal || 0);
    const checklistIncomplete = checklistTotal > checklistCompleted;
    const allTenStepsCompleted =
      checklistTotal >= 10 && checklistCompleted >= 10;

    if (inCallHandling && checklistIncomplete) {
      const targetX = 70 + Math.sin(frame / 70) * 28;
      const minTargetY = Math.max(24, topSafeInset + 18);
      const targetY = Math.max(
        minTargetY,
        Math.min(
          canvas.height - spriteHeight - 24,
          130 + Math.sin(frame / 62) * 40,
        ),
      );
      velocity.x += (targetX - position.x) * profile.checklistPull;
      velocity.y += (targetY - position.y) * (profile.checklistPull * 0.8);
    } else {
      velocity.x += Math.sin(frame / 130) * profile.driftX;
      velocity.y += Math.cos(frame / 150) * profile.driftY;
    }

    if (allTenStepsCompleted) {
      velocity.x += Math.sin(frame / 16) * 0.022;
      velocity.y += Math.cos(frame / 18) * 0.018;
    }

    position.x += velocity.x;
    position.y += velocity.y;

    const minX = 6;
    const minY = Math.max(6, topSafeInset + 6);
    const maxX = Math.max(minX, canvas.width - spriteWidth - 6);
    const maxY = Math.max(minY, canvas.height - spriteHeight - 6);

    if (position.x <= minX || position.x >= maxX) {
      velocity.x *= -1;
      position.x = Math.max(minX, Math.min(maxX, position.x));
    }

    if (position.y <= minY || position.y >= maxY) {
      velocity.y *= -1;
      position.y = Math.max(minY, Math.min(maxY, position.y));
    }

    const celebrationBoost = allTenStepsCompleted ? 1.45 : 1;
    velocity.x = Math.max(
      -profile.maxSpeedX * celebrationBoost,
      Math.min(profile.maxSpeedX * celebrationBoost, velocity.x),
    );
    velocity.y = Math.max(
      -profile.maxSpeedY * celebrationBoost,
      Math.min(profile.maxSpeedY * celebrationBoost, velocity.y),
    );

    return {
      allTenStepsCompleted,
    };
  }

  function render() {
    if (!running) {
      return;
    }

    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const state = getState();
    const pet = PET_CATALOG[state.selectedPetId] || PET_CATALOG.cat;
    const frameDuration = pet.frameDuration || 18;
    const frameIndex = Math.floor(frame / frameDuration) % pet.frames.length;
    const sprite = pet.frames[frameIndex] || pet.frames[0];

    const scale = 4;
    const spriteHeight = sprite.length * scale;
    const spriteWidth = (sprite[0]?.length || 0) * scale;

    const motionState = updateMotion(spriteWidth, spriteHeight, state);

    const bobScale = motionState.allTenStepsCompleted
      ? 5
      : Date.now() < pettingUntil
        ? 4
        : 2;
    const bob = Math.round(Math.sin(frame / 15) * bobScale);
    const shouldBlink = frame % 120 > 108;

    const originX = Math.round(position.x);
    const originY = Math.round(position.y + bob);

    lastBounds = {
      x: originX,
      y: originY,
      width: spriteWidth,
      height: spriteHeight,
    };

    ctx.fillStyle = "rgba(2, 6, 23, 0.18)";
    ctx.fillRect(
      originX + 8,
      originY + spriteHeight - 3,
      Math.max(20, spriteWidth - 16),
      4,
    );

    drawPixelSprite(
      ctx,
      sprite,
      pet.palette,
      originX,
      originY,
      scale,
      shouldBlink,
    );

    if (state.mood === "Excited" || motionState.allTenStepsCompleted) {
      const pulse = frame % 22 < 11;
      drawSparkle(
        ctx,
        originX - (pulse ? 10 : 4),
        originY + (pulse ? 8 : 2),
        2,
      );
      drawSparkle(
        ctx,
        originX + spriteWidth + (pulse ? 4 : -2),
        originY + (pulse ? 16 : 10),
        2,
      );

      if (motionState.allTenStepsCompleted) {
        drawSparkle(ctx, originX + spriteWidth / 2 - 6, originY - 16, 2);
        drawSparkle(ctx, originX + spriteWidth / 2 + 10, originY - 8, 2);
      }
    }

    if (Date.now() < pettingUntil) {
      drawHeart(ctx, originX + 14, originY - 16, 2);
      drawHeart(ctx, originX + spriteWidth - 26, originY - 12, 2);
    }

    frame += 1;
    rafId = window.requestAnimationFrame(render);
  }

  function start() {
    if (running) {
      return;
    }

    running = true;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    rafId = window.requestAnimationFrame(render);
  }

  function stop() {
    running = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    window.removeEventListener("resize", resizeCanvas);
  }

  function handleViewportClick(x, y) {
    const clickX = Number(x);
    const clickY = Number(y);
    if (!Number.isFinite(clickX) || !Number.isFinite(clickY)) {
      return;
    }

    const insideX =
      clickX >= lastBounds.x && clickX <= lastBounds.x + lastBounds.width;
    const insideY =
      clickY >= lastBounds.y && clickY <= lastBounds.y + lastBounds.height;

    if (insideX && insideY) {
      pettingUntil = Date.now() + 1400;
    }
  }

  return {
    start,
    stop,
    handleViewportClick,
  };
}
