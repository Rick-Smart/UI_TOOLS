// particleSystem.js
// Canonical particle system for all scene effects (sparkles, bubbles, dust, sleep-Z, etc.)
// Supersedes the internal engine particle code and effectsSystem.js.
// Particle format: { x, y, vx, vy, gravity, drag, ageMs, lifeMs, size, rotation, spin, color, glyph }

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function resolveRange(range, rand) {
  if (Array.isArray(range) && range.length >= 2) {
    const min = Number(range[0]) || 0;
    const max = Number(range[1]) || min;
    return max <= min ? min : min + (max - min) * rand;
  }
  return Number(range) || 0;
}

/**
 * Emit a burst of particles. Returns a new array (original is not mutated).
 * @param {Array} particles  existing particle array
 * @param {Object} options   burst configuration (see field list below)
 * @param {Function} nextRandom  seeded random fn () => [0,1)
 * @returns {Array} updated particle array (capped at 240)
 *
 * options fields (all optional):
 *   count, originX, originY, color, colorSecondary,
 *   speedRange, sizeRange, lifeRange, gravityRange, dragRange,
 *   spreadX, spreadY, angleRange, glyphs
 */
export function emitParticleBurst(particles, options = {}, nextRandom) {
  const base = Array.isArray(particles) ? particles.slice() : [];
  const count = Math.max(0, Math.round(Number(options.count ?? 0)));
  if (!count) {
    return base;
  }

  const originX = Number(options.originX ?? 0);
  const originY = Number(options.originY ?? 0);
  const colorA = String(options.color || "#9dd8ea");
  const colorB = String(options.colorSecondary || colorA);
  const glyphs = Array.isArray(options.glyphs)
    ? options.glyphs.map((g) => String(g || "").trim()).filter(Boolean)
    : null;

  const spreadX = options.spreadX || [0, 0];
  const spreadY = options.spreadY || [0, 0];
  const speedRange = options.speedRange || [10, 30];
  const angleRange = options.angleRange || [0, Math.PI * 2];
  const sizeRange = options.sizeRange || [1.6, 3.4];
  const lifeRange = options.lifeRange || [300, 800];
  const gravityRange = options.gravityRange || [0, 0];
  const dragRange = options.dragRange || [0.92, 0.98];

  for (let i = 0; i < count; i += 1) {
    const angle = resolveRange(angleRange, nextRandom());
    const speed = Math.max(0, resolveRange(speedRange, nextRandom()));
    const life = Math.max(60, resolveRange(lifeRange, nextRandom()));
    const drag = clamp01(resolveRange(dragRange, nextRandom()));
    const gravity = resolveRange(gravityRange, nextRandom());
    const size = Math.max(0.4, resolveRange(sizeRange, nextRandom()));
    const color = nextRandom() < 0.5 ? colorA : colorB;
    const glyph = glyphs?.length
      ? String(glyphs[Math.floor(nextRandom() * glyphs.length)] || "")
      : "";
    const hasGlyph = glyph.length > 0;

    base.push({
      x: originX + resolveRange(spreadX, nextRandom()),
      y: originY + resolveRange(spreadY, nextRandom()),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity,
      drag: Math.max(0.75, drag),
      ageMs: 0,
      lifeMs: life,
      size,
      rotation: hasGlyph ? resolveRange([-0.6, 0.6], nextRandom()) : 0,
      spin: hasGlyph ? resolveRange([-2.2, 2.2], nextRandom()) : 0,
      color,
      glyph,
    });
  }

  return base.length > 240 ? base.slice(base.length - 240) : base;
}

/**
 * Advance all particles by deltaMs. Returns a new filtered array.
 * @param {Array} particles
 * @param {number} deltaMs
 * @returns {Array}
 */
export function updateParticles(particles, deltaMs) {
  if (!Array.isArray(particles) || !particles.length) {
    return particles;
  }
  const dt = Math.max(0, Number(deltaMs) || 16.67) / 1000;
  const updated = [];

  for (const p of particles) {
    const nextAge = p.ageMs + deltaMs;
    if (nextAge >= p.lifeMs) {
      continue;
    }
    const drag = Math.max(0.75, Math.min(1, p.drag));
    const dragFactor = Math.pow(drag, dt * 60);
    const nextVX = p.vx * dragFactor;
    const nextVY = p.vy * dragFactor + p.gravity * dt;
    updated.push({
      ...p,
      ageMs: nextAge,
      vx: nextVX,
      vy: nextVY,
      x: p.x + nextVX * dt,
      y: p.y + nextVY * dt,
      rotation: p.rotation + p.spin * dt,
    });
  }
  return updated;
}

/**
 * Render all particles to a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} particles
 */
export function drawParticles(ctx, particles) {
  if (!ctx || !Array.isArray(particles) || !particles.length) {
    return;
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const p of particles) {
    const alpha = clamp01(1 - p.ageMs / Math.max(1, p.lifeMs));
    if (alpha <= 0.01) {
      continue;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    if (p.rotation) {
      ctx.rotate(p.rotation);
    }
    ctx.fillStyle = p.color;

    if (p.glyph) {
      const fontSize = Math.max(8, p.size * 2.4);
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(p.glyph, 0, 0);
    } else {
      const size = Math.max(1, p.size * (1 - (p.ageMs / p.lifeMs) * 0.25));
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}
