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
