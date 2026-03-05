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
 * Build the ordered list of frame indices for one segment's playback.
 *
 * mode "forward"  — plays frameIndices once (or N times for loops > 1)
 * mode "pingpong" — seamless bounce: [0,1,2,1] repeating, always exits at
 *                   the start of the range after N full cycles.
 *                   For a 2-element range this degrades to forward looping.
 *                   For a 1-element range this holds on that frame.
 */
function buildSegmentSequence(frames, frameIndices, mode, loops, defaultDuration) {
  const n = Math.max(1, Math.round(Number(loops) || 1));
  const indices = (Array.isArray(frameIndices) ? frameIndices : []).map((i) =>
    Math.max(0, Math.min(frames.length - 1, Number(i) || 0)),
  );
  if (!indices.length) return [];

  if (mode === "pingpong") {
    if (indices.length === 1) {
      // single frame — just hold it
      return Array.from({ length: n }, () => indices[0]).flat();
    }
    // Seamless unit: fwd + inner-reverse (exclude both turnaround endpoints).
    // e.g. [3,4,5] → unit = [3,4,5,4], looped gives [3,4,5,4, 3,4,5,4, …]
    const reversed = [...indices].reverse();
    const returnInner = reversed.slice(1, -1); // exclude first (far end) and last (near end)
    const unit = [...indices, ...returnInner];
    return Array.from({ length: n }, () => unit).flat();
  }

  // "forward" (default)
  return Array.from({ length: n }, () => indices).flat();
}

/**
 * Resolve frame index using an explicit segments definition.
 * Segments are walked in order; the animation proceeds through each segment's
 * full tick budget before advancing to the next.
 * The last segment loops (or holds, if holdOnLastFrame / seg.holdOnLastFrame).
 */
function resolveSegmentedFrame(frames, segments, tickCount, defaultDuration, holdOnLastFrame) {
  let elapsed = 0;

  for (let si = 0; si < segments.length; si += 1) {
    const seg = segments[si];
    const isLast = si === segments.length - 1;
    const mode = String(seg.mode || "forward");
    const loops = Math.max(1, Number(seg.loops) || 1);
    const sequence = buildSegmentSequence(frames, seg.frameIndices, mode, loops, defaultDuration);
    if (!sequence.length) continue;

    const segTicks = sequence.reduce(
      (sum, fi) => sum + Math.max(1, Number(frames[fi]?.ticks) || defaultDuration),
      0,
    );
    const segEnd = elapsed + segTicks;
    const holdThis = isLast && (holdOnLastFrame || Boolean(seg.holdOnLastFrame));

    if (tickCount < segEnd || holdThis) {
      if (holdThis && tickCount >= segEnd) {
        return sequence[sequence.length - 1];
      }
      const localTick = tickCount - elapsed;
      let acc = 0;
      for (const fi of sequence) {
        acc += Math.max(1, Number(frames[fi]?.ticks) || defaultDuration);
        if (localTick < acc) return fi;
      }
      return sequence[sequence.length - 1];
    }

    if (isLast) {
      // Past all segments with no hold — loop the last segment
      const localTick = (tickCount - elapsed) % segTicks;
      let acc = 0;
      for (const fi of sequence) {
        acc += Math.max(1, Number(frames[fi]?.ticks) || defaultDuration);
        if (localTick < acc) return fi;
      }
      return sequence[sequence.length - 1];
    }

    elapsed = segEnd;
  }

  return 0;
}

/**
 * Resolve which frame index to display given accumulated animation ticks.
 *
 * Standard mode (no segments): plays frames in order, loops, with optional
 * per-frame variable duration via frameRect.ticks and holdOnLastFrame.
 *
 * Segmented mode (options.segments present): plays named segments in sequence,
 * each with its own frameIndices subset, playback mode, and loop count.
 * Segment modes:
 *   "forward"  — play frameIndices once (or loops times)
 *   "pingpong" — seamless bounce between frameIndices, N full cycles
 * The last segment loops forever unless holdOnLastFrame or seg.holdOnLastFrame
 * is set, in which case it freezes on the final frame.
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

  if (Array.isArray(options.segments) && options.segments.length) {
    return resolveSegmentedFrame(frames, options.segments, tickCount, defaultDuration, holdOnLastFrame);
  }

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
