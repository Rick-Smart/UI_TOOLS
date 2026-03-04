export function emitSceneEffectBurst({
  sceneEffectParticles,
  options = {},
  nextRandom,
  resolveValueRange,
}) {
  const nextParticles = Array.isArray(sceneEffectParticles)
    ? sceneEffectParticles.slice()
    : [];
  const count = Math.max(1, Math.round(Number(options.count || 8)));
  const originX = Number(options.originX || 0);
  const originY = Number(options.originY || 0);
  const speedMin = Number(options.speedRange?.[0] ?? 30);
  const speedMax = Number(options.speedRange?.[1] ?? 90);
  const sizeMin = Number(options.sizeRange?.[0] ?? 2.5);
  const sizeMax = Number(options.sizeRange?.[1] ?? 5.5);
  const gravityMin = Number(options.gravityRange?.[0] ?? 90);
  const gravityMax = Number(options.gravityRange?.[1] ?? 180);
  const dragMin = Number(options.dragRange?.[0] ?? 0.9);
  const dragMax = Number(options.dragRange?.[1] ?? 0.97);
  const lifeMin = Number(options.lifeRange?.[0] ?? 380);
  const lifeMax = Number(options.lifeRange?.[1] ?? 980);
  const spreadXMin = Number(options.spreadX?.[0] ?? -8);
  const spreadXMax = Number(options.spreadX?.[1] ?? 8);
  const spreadYMin = Number(options.spreadY?.[0] ?? -6);
  const spreadYMax = Number(options.spreadY?.[1] ?? 6);
  const angleMin = Number(options.angleRange?.[0] ?? -Math.PI * 0.85);
  const angleMax = Number(options.angleRange?.[1] ?? -Math.PI * 0.15);
  const colorPrimary = String(options.color || "#7ab8d4");
  const colorSecondary = String(options.colorSecondary || colorPrimary);
  const glyphChoices = Array.isArray(options.glyphs)
    ? options.glyphs.map((glyph) => String(glyph || "").trim()).filter(Boolean)
    : [];
  const isGlyphBurst = glyphChoices.length > 0;

  for (let index = 0; index < count; index += 1) {
    const chooseSecondary = nextRandom() > 0.58;
    const speed = resolveValueRange([speedMin, speedMax], nextRandom());
    const angle = resolveValueRange([angleMin, angleMax], nextRandom());
    const glyph = isGlyphBurst
      ? glyphChoices[
          Math.floor(nextRandom() * glyphChoices.length) % glyphChoices.length
        ]
      : "";
    nextParticles.push({
      x: originX + resolveValueRange([spreadXMin, spreadXMax], nextRandom()),
      y: originY + resolveValueRange([spreadYMin, spreadYMax], nextRandom()),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: resolveValueRange([gravityMin, gravityMax], nextRandom()),
      drag: resolveValueRange([dragMin, dragMax], nextRandom()),
      ageMs: 0,
      lifeMs: Math.max(
        120,
        resolveValueRange([lifeMin, lifeMax], nextRandom()),
      ),
      size: Math.max(1.2, resolveValueRange([sizeMin, sizeMax], nextRandom())),
      rotation: resolveValueRange([-0.6, 0.6], nextRandom()),
      spin: resolveValueRange([-2.2, 2.2], nextRandom()),
      color: chooseSecondary ? colorSecondary : colorPrimary,
      glyph,
    });
  }

  return nextParticles.length > 220
    ? nextParticles.slice(nextParticles.length - 220)
    : nextParticles;
}

export function updateSceneEffectParticles({ sceneEffectParticles, deltaMs }) {
  if (!sceneEffectParticles.length) {
    return sceneEffectParticles;
  }

  const dt = Math.max(0, deltaMs) / 1000;
  return sceneEffectParticles.filter((particle) => {
    particle.ageMs += deltaMs;
    if (particle.ageMs >= particle.lifeMs) {
      return false;
    }

    particle.vx *= particle.drag;
    particle.vy = particle.vy * particle.drag + particle.gravity * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.rotation += particle.spin * dt;
    return true;
  });
}

export function drawSceneEffectParticles({
  ctx,
  sceneEffectParticles,
  clamp01,
}) {
  if (!sceneEffectParticles.length) {
    return;
  }

  for (const particle of sceneEffectParticles) {
    const lifeProgress = clamp01(particle.ageMs / Math.max(1, particle.lifeMs));
    const alpha = clamp01(1 - lifeProgress);
    if (alpha <= 0.01) {
      continue;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.fillStyle = particle.color;

    if (particle.glyph) {
      const fontSize = Math.max(8, particle.size * 2.4);
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(particle.glyph), 0, 0);
      ctx.restore();
      continue;
    }

    const size = Math.max(1, particle.size * (1 - lifeProgress * 0.25));
    ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
    ctx.restore();
  }
}
