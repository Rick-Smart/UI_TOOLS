import { useEffect, useMemo, useRef } from "react";

const PREVIEW_SPRITES = {
  cat: {
    frameDuration: 14,
    palette: ["#00000000", "#ffbf69", "#8d5524", "#1f2937", "#fef3c7"],
    frames: [
      [
        "0011111100",
        "0112222110",
        "1122442211",
        "1122222211",
        "0112222110",
        "0011111100",
        "0001101100",
        "0011000110",
        "0011001100",
        "0000110000",
      ],
      [
        "0011111100",
        "0112222110",
        "1122442211",
        "1122222211",
        "0112222110",
        "0011111100",
        "0001101100",
        "0011000110",
        "0011011000",
        "0001100000",
      ],
    ],
  },
  dog: {
    frameDuration: 16,
    palette: ["#00000000", "#d4a373", "#7f5539", "#1f2937", "#faedcd"],
    frames: [
      [
        "0011111100",
        "0112222110",
        "1122442211",
        "1122222211",
        "0112222110",
        "0011111110",
        "0001101110",
        "0011000110",
        "0011000110",
        "0000000000",
      ],
      [
        "0011111100",
        "0112222110",
        "1122442211",
        "1122222211",
        "0112222110",
        "0011111111",
        "0011100110",
        "0011000110",
        "0011000110",
        "0000000000",
      ],
    ],
  },
  crow: {
    frameDuration: 12,
    palette: ["#00000000", "#111827", "#334155", "#0f172a", "#facc15"],
    frames: [
      [
        "0001111000",
        "0012222100",
        "0122242210",
        "1222222221",
        "0122222210",
        "0012222100",
        "0001111000",
        "0001101100",
        "0011000110",
        "0011000110",
      ],
      [
        "0011111100",
        "1122222211",
        "1222242221",
        "1122222211",
        "0012222100",
        "0001221000",
        "0001111000",
        "0001101100",
        "0011000110",
        "0011000110",
      ],
    ],
  },
  raccoon: {
    frameDuration: 14,
    palette: ["#00000000", "#94a3b8", "#475569", "#0f172a", "#e2e8f0"],
    frames: [
      [
        "0011111100",
        "0112333210",
        "1123444321",
        "1123333321",
        "0112222210",
        "0011111100",
        "0001101100",
        "0011000110",
        "0011000110",
        "0022200000",
      ],
      [
        "0011111100",
        "0112333210",
        "1123444321",
        "1123333321",
        "0112222210",
        "0011111100",
        "0001101100",
        "0011000110",
        "0011000110",
        "0000222200",
      ],
    ],
  },
  dragonling: {
    frameDuration: 12,
    palette: ["#00000000", "#34d399", "#065f46", "#0f172a", "#a7f3d0"],
    frames: [
      [
        "0001111100",
        "0012222210",
        "0122242221",
        "1222222221",
        "0122222210",
        "0012222110",
        "0001111220",
        "0001101220",
        "0011000110",
        "0011000110",
      ],
      [
        "0011111110",
        "1122222221",
        "1222242221",
        "1122222211",
        "0012222110",
        "0001222110",
        "0001111220",
        "0001101220",
        "0011000110",
        "0011000110",
      ],
    ],
  },
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

function PetSpritePreview({ petId }) {
  const canvasRef = useRef(null);
  const spriteData = useMemo(() => {
    return PREVIEW_SPRITES[petId] || PREVIEW_SPRITES.cat;
  }, [petId]);

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

    const render = () => {
      if (!isActive) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const frameIndex =
        Math.floor(frame / spriteData.frameDuration) % spriteData.frames.length;
      const sprite = spriteData.frames[frameIndex] || spriteData.frames[0];
      const shouldBlink = frame % 110 > 100;

      drawSprite(ctx, sprite, spriteData.palette, shouldBlink);

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
