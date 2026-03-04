export function drawSparkle(ctx, x, y, size) {
  ctx.fillStyle = "#facc15";
  ctx.fillRect(x + size, y, size, size * 3);
  ctx.fillRect(x, y + size, size * 3, size);
}

export function drawPixelSprite(
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

export function drawHeart(ctx, x, y, size) {
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(x + size, y, size, size);
  ctx.fillRect(x + size * 3, y, size, size);
  ctx.fillRect(x, y + size, size * 5, size);
  ctx.fillRect(x + size, y + size * 2, size * 3, size);
  ctx.fillRect(x + size * 2, y + size * 3, size, size);
}

export function drawAtlasFrame(
  ctx,
  image,
  frameRect,
  originX,
  originY,
  scale,
  flipHorizontal = false,
) {
  if (!image || !frameRect) {
    return;
  }

  const sourceWidth = Number(frameRect.w) || 0;
  const sourceHeight = Number(frameRect.h) || 0;
  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const destWidth = sourceWidth * scale;
  const destHeight = sourceHeight * scale;

  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (flipHorizontal) {
    ctx.translate(originX + destWidth, originY);
    ctx.scale(-1, 1);
    ctx.drawImage(
      image,
      Number(frameRect.x) || 0,
      Number(frameRect.y) || 0,
      sourceWidth,
      sourceHeight,
      0,
      0,
      destWidth,
      destHeight,
    );
    ctx.restore();
    return;
  }

  ctx.drawImage(
    image,
    Number(frameRect.x) || 0,
    Number(frameRect.y) || 0,
    sourceWidth,
    sourceHeight,
    originX,
    originY,
    destWidth,
    destHeight,
  );
  ctx.restore();
}
