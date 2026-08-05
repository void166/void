export type BackgroundCanvasConfig = {
  text: string;
  ghostCopies: number;
  ghostScale: number;
  ghostOffset: number;
  ghostOpacity: number;
  grainStrength: number;
};

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawWordmark(ctx: CanvasRenderingContext2D, width: number, height: number, config: BackgroundCanvasConfig) {
  const cx = width / 2;
  const cy = height / 2;
  const targetWidth = width * 0.92;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = height * 0.42;
  const buildFont = (size: number) =>
    `900 ${size}px "Helvetica Neue", Arial, "Segoe UI", system-ui, sans-serif`;

  ctx.font = buildFont(fontSize);
  const measured = ctx.measureText(config.text).width;
  if (measured > 0) {
    fontSize *= targetWidth / measured;
  }
  ctx.font = buildFont(fontSize);

  const random = mulberry32(1337);
  for (let i = config.ghostCopies; i >= 1; i--) {
    const scale = 1 + config.ghostScale * (0.5 + i / config.ghostCopies);
    const angle = (i / config.ghostCopies) * Math.PI * 2 + random() * 0.5;
    const dist = config.ghostOffset * (0.6 + random() * 0.8);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.6;

    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.scale(scale, scale);
    ctx.font = buildFont(fontSize);
    ctx.lineWidth = Math.max(1, fontSize * 0.012);
    ctx.strokeStyle = `rgba(255,255,255,${config.ghostOpacity})`;
    ctx.strokeText(config.text, 0, 0);
    ctx.restore();
  }

  ctx.fillStyle = "#d2d2d2";
  ctx.fillText(config.text, cx, cy);
  ctx.restore();
}

function applyFilmGrain(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const amount = strength * 255;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() * 2 - 1) * amount;
    data[i] = clampByte(data[i] + grain);
    data[i + 1] = clampByte(data[i + 1] + grain);
    data[i + 2] = clampByte(data[i + 2] + grain);
  }
  ctx.putImageData(imageData, 0, 0);
}

function clampByte(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

export function buildBackgroundCanvas(width: number, height: number, config: BackgroundCanvasConfig): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#060606";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawWordmark(ctx, canvas.width, canvas.height, config);
  applyFilmGrain(ctx, canvas.width, canvas.height, config.grainStrength);

  return canvas;
}
