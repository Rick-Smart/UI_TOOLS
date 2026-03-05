// atlasUtils.js
// Atlas sprite sheet utilities: image caching, frame metrics, frame index resolution,
// and transformed draw (with flip + rotation). Extracted from petEngine.js.

const ATLAS_IMAGE_CACHE = new Map();
const ATLAS_FRAME_METRICS_CACHE = new Map();
let frameMetricsCanvas = null;
let frameMetricsContext = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * Resolve which frame index to display given accumulated animation ticks.
 * Supports per-frame variable duration via frameRect.ticks and holdOnLastFrame.
 */
export function resolveFrameIndexByTicks(
  frames,
  tickCount,
  defaultDuration = 6,
  options = {},
) {
  if (!Array.isArray(frames) || !frames.length) {
    return 0;
  }
  const holdOnLastFrame = Boolean(options.holdOnLastFrame);
  const totalTicks = frames.reduce(
    (sum, f) => sum + Math.max(1, Number(f?.ticks) || defaultDuration),
    0,
  );
  if (!totalTicks) {
    return 0;
  }
  if (holdOnLastFrame && tickCount >= totalTicks) {
    return frames.length - 1;
  }
  const pointer = tickCount % totalTicks;
  let elapsed = 0;
  for (let i = 0; i < frames.length; i += 1) {
    elapsed += Math.max(1, Number(frames[i]?.ticks) || defaultDuration);
    if (pointer < elapsed) {
      return i;
    }
  }
  return 0;
}

/**
 * Load (or retrieve from cache) the Image for an atlas src path.
 * Handles /agent-pet/ relative paths when running inside the iframe.
 */
export function getAtlasImage(src) {
  if (!src) {
    return null;
  }
  let resolved = src;
  if (typeof src === "string" && src.startsWith("/agent-pet/")) {
    resolved = new URL(
      `./${src.replace(/^\/agent-pet\//, "")}`,
      window.location.href,
    ).toString();
  }
  const cached = ATLAS_IMAGE_CACHE.get(resolved);
  if (cached) {
    return cached;
  }
  const img = new Image();
  img.src = resolved;
  ATLAS_IMAGE_CACHE.set(resolved, img);
  return img;
}

/**
 * Compute and cache the visible (non-transparent) pixel bounding box for a
 * given frame rect within an atlas image. Used for shadow placement and
 * precise collision bounding.
 * Returns null if the image is not yet loaded or the rect is empty.
 */
export function getAtlasFrameMetrics(image, frameRect, atlasSrc) {
  if (!image || !frameRect || !atlasSrc) {
    return null;
  }
  const w = Number(frameRect.w) || 0;
  const h = Number(frameRect.h) || 0;
  if (!w || !h) {
    return null;
  }

  const key = `${atlasSrc}|${frameRect.x}|${frameRect.y}|${w}|${h}`;
  const cached = ATLAS_FRAME_METRICS_CACHE.get(key);
  if (cached) {
    return cached;
  }

  if (!frameMetricsCanvas) {
    frameMetricsCanvas = document.createElement("canvas");
    frameMetricsContext = frameMetricsCanvas.getContext("2d", {
      willReadFrequently: true,
    });
  }
  if (!frameMetricsContext) {
    return null;
  }

  frameMetricsCanvas.width = w;
  frameMetricsCanvas.height = h;
  frameMetricsContext.clearRect(0, 0, w, h);
  frameMetricsContext.drawImage(
    image,
    Number(frameRect.x) || 0,
    Number(frameRect.y) || 0,
    w,
    h,
    0,
    0,
    w,
    h,
  );

  const data = frameMetricsContext.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] <= 8) {
        continue;
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const result =
    maxX >= minX && maxY >= minY
      ? {
          hasVisiblePixels: true,
          minX,
          maxX,
          minY,
          maxY,
          visibleWidth: maxX - minX + 1,
          visibleHeight: maxY - minY + 1,
        }
      : {
          hasVisiblePixels: false,
          minX: 0,
          maxX: w - 1,
          minY: 0,
          maxY: h - 1,
          visibleWidth: w,
          visibleHeight: h,
        };

  ATLAS_FRAME_METRICS_CACHE.set(key, result);
  return result;
}

/**
 * Draw an atlas frame with optional horizontal flip and rotation.
 * Extends rendering.js's drawAtlasFrame with tilt/rotation support
 * required by fish and bird directional visuals.
 */
export function drawAtlasFrameTransformed(
  ctx,
  image,
  frameRect,
  originX,
  originY,
  scale,
  options = {},
) {
  if (!image || !frameRect) {
    return;
  }
  const sw = Number(frameRect.w) || 0;
  const sh = Number(frameRect.h) || 0;
  if (!sw || !sh) {
    return;
  }

  const dw = sw * scale;
  const dh = sh * scale;
  const flipH = Boolean(options.flipHorizontal);
  const rotRad = Number(options.rotationRad || 0);

  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(originX + dw * 0.5, originY + dh * 0.5);
  if (Math.abs(rotRad) > 0.0001) {
    ctx.rotate(rotRad);
  }
  if (flipH) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    image,
    Number(frameRect.x) || 0,
    Number(frameRect.y) || 0,
    sw,
    sh,
    -dw * 0.5,
    -dh * 0.5,
    dw,
    dh,
  );
  ctx.restore();
}
