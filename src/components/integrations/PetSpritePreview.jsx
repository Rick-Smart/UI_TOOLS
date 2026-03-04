import { useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_SPRITE = {
  frameDuration: 16,
  palette: ["#00000000", "#60a5fa", "#1e3a8a", "#0f172a", "#dbeafe"],
  frames: [
    [
      "0001111000",
      "0012222100",
      "0122442210",
      "1222222221",
      "0122222210",
      "0012222100",
      "0001111000",
      "0001101100",
      "0011000110",
      "0011000110",
    ],
  ],
};

function drawSprite(ctx, sprite, palette, blink) {
  const scale = 2;
  const offsetX = 2;
  const offsetY = 2;

  for (let y = 0; y < sprite.length; y += 1) {
    const row = sprite[y];

    for (let x = 0; x < row.length; x += 1) {
      const colorIndex = Number(row[x]);
      if (!colorIndex) {
        continue;
      }

      let color = palette[colorIndex];
      if (blink && colorIndex === 4) {
        color = palette[3];
      }

      ctx.fillStyle = color;
      ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
    }
  }
}

function drawAtlasPreview(ctx, image, frameRect) {
  if (!image || !frameRect) {
    return;
  }

  const width = Number(frameRect.w) || 0;
  const height = Number(frameRect.h) || 0;
  if (!width || !height) {
    return;
  }

  const maxSize = 20;
  const scale = Math.max(1, Math.floor(maxSize / Math.max(width, height)));
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const offsetX = Math.max(0, Math.floor((24 - drawWidth) / 2));
  const offsetY = Math.max(0, Math.floor((24 - drawHeight) / 2));

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    Number(frameRect.x) || 0,
    Number(frameRect.y) || 0,
    width,
    height,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
  );
}

function PetSpritePreview({ petId }) {
  const canvasRef = useRef(null);
  const [runtimeCatalog, setRuntimeCatalog] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadCatalog() {
      try {
        const module = await import("/agent-pet/petCatalog.js");
        if (!isActive) {
          return;
        }

        setRuntimeCatalog(module.PET_CATALOG || null);
      } catch {
        if (!isActive) {
          return;
        }

        setRuntimeCatalog(null);
      }
    }

    loadCatalog();

    return () => {
      isActive = false;
    };
  }, []);

  const spriteData = useMemo(() => {
    if (!runtimeCatalog) {
      return FALLBACK_SPRITE;
    }

    const defaultPetId = Object.keys(runtimeCatalog)[0];
    return (
      runtimeCatalog[petId] || runtimeCatalog[defaultPetId] || FALLBACK_SPRITE
    );
  }, [petId, runtimeCatalog]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      return;
    }

    let isActive = true;
    let frame = 0;
    let atlasImage = null;

    const atlasEnabled = Boolean(
      spriteData?.atlas?.src &&
      Array.isArray(spriteData?.frames) &&
      typeof spriteData.frames[0] === "object",
    );

    if (atlasEnabled) {
      atlasImage = new Image();
      atlasImage.src = spriteData.atlas.src;
    }

    const render = () => {
      if (!isActive) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const frameIndex =
        Math.floor(frame / (spriteData.frameDuration || 12)) %
        spriteData.frames.length;
      const sprite = spriteData.frames[frameIndex] || spriteData.frames[0];

      if (atlasEnabled) {
        if (atlasImage?.complete) {
          drawAtlasPreview(ctx, atlasImage, sprite);
        }
      } else {
        const shouldBlink = frame % 110 > 100;
        drawSprite(ctx, sprite, spriteData.palette, shouldBlink);
      }

      frame += 1;
      window.requestAnimationFrame(render);
    };

    window.requestAnimationFrame(render);

    return () => {
      isActive = false;
    };
  }, [spriteData]);

  return (
    <canvas
      ref={canvasRef}
      className="pet-choice-sprite"
      width={24}
      height={24}
      aria-hidden="true"
    />
  );
}

export default PetSpritePreview;
