/** Unified bundle canvas / editor background — must match export. */
export const BUNDLE_BACKGROUND = "#ffffff";

const WHITE_THRESHOLD = 238;
const WHITE_SOFTNESS = 22;
const MAX_CHANNEL_SPREAD = 28;

/** Only near-pure studio white is treated as removable background. */
const STUDIO_WHITE_MIN = 248;
const STUDIO_WHITE_SPREAD = 14;

const CARDINAL_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

/**
 * Makes near-white / off-white backgrounds transparent so products sit on a
 * uniform canvas without visible white rectangles.
 */
export function knockOutWhiteBackground(
  source: HTMLImageElement | HTMLCanvasElement,
): HTMLCanvasElement {
  const width = source.width;
  const height = source.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D not available.");

  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    const lightness = Math.min(r, g, b);

    if (spread > MAX_CHANNEL_SPREAD) continue;

    if (lightness >= WHITE_THRESHOLD) {
      data[i + 3] = 0;
    } else if (lightness > WHITE_THRESHOLD - WHITE_SOFTNESS) {
      const t = (WHITE_THRESHOLD - lightness) / WHITE_SOFTNESS;
      data[i + 3] = Math.round(data[i + 3] * t);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function canvasToImage(
  canvas: HTMLCanvasElement,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to process product image."));
    img.src = canvas.toDataURL("image/png");
  });
}

export async function processProductImage(
  source: HTMLImageElement,
): Promise<HTMLImageElement> {
  const canvas = knockOutOuterWhiteBackground(source, { trim: false });
  return canvasToImage(canvas);
}

const BLACK_THRESHOLD = 40;
const BLACK_SOFTNESS = 25;

/** Removes dark/black backdrops (e.g. WMF logo source on black). */
export function knockOutBlackBackground(
  source: HTMLImageElement | HTMLCanvasElement,
): HTMLCanvasElement {
  const width = source.width;
  const height = source.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D not available.");

  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const darkness = Math.max(r, g, b);

    if (darkness <= BLACK_THRESHOLD) {
      data[i + 3] = 0;
    } else if (darkness <= BLACK_THRESHOLD + BLACK_SOFTNESS) {
      const t = (darkness - BLACK_THRESHOLD) / BLACK_SOFTNESS;
      data[i + 3] = Math.round(data[i + 3] * t);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function processLogoImage(
  source: HTMLImageElement,
): Promise<HTMLImageElement> {
  const canvas = knockOutBlackBackground(source);
  return canvasToImage(canvas);
}

function channelSpread(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function minChannel(r: number, g: number, b: number): number {
  return Math.min(r, g, b);
}

/** Near-pure neutral studio backdrop — not metal, not specular highlights. */
function isStudioBackdrop(r: number, g: number, b: number): boolean {
  return (
    channelSpread(r, g, b) <= STUDIO_WHITE_SPREAD &&
    minChannel(r, g, b) >= STUDIO_WHITE_MIN
  );
}

/**
 * Flood-fill from image borders through studio white only.
 * Metal, reflections and internal whites are never reached.
 */
function floodOuterBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const total = width * height;
  const outer = new Uint8Array(total);
  const queue: number[] = [];

  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (outer[idx]) return;
    const i = idx * 4;
    if (!isStudioBackdrop(data[i], data[i + 1], data[i + 2])) return;
    outer[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx / width) | 0;
    for (const [dx, dy] of CARDINAL_OFFSETS) {
      tryPush(x + dx, y + dy);
    }
  }

  return outer;
}

/**
 * Removes only the outer white matte connected to the image edges (flood fill).
 * Product pixels are never modified — only marked backdrop becomes transparent.
 */
export function knockOutOuterWhiteBackground(
  source: HTMLImageElement | HTMLCanvasElement,
  options?: { trim?: boolean },
): HTMLCanvasElement {
  const width = source.width;
  const height = source.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D not available.");

  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const outer = floodOuterBackground(data, width, height);

  for (let idx = 0; idx < outer.length; idx++) {
    if (!outer[idx]) continue;
    data[idx * 4 + 3] = 0;
  }

  ctx.putImageData(imageData, 0, 0);
  return options?.trim === false ? canvas : trimTransparentEdges(canvas);
}

/** Crops fully transparent margins after outer-white removal. */
function trimTransparentEdges(
  source: HTMLCanvasElement,
): HTMLCanvasElement {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;

  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);
  const alphaThreshold = 8;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > alphaThreshold) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) return source;

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return out;
}

/** Badge: preserve artwork, remove outer white matte only. */
export async function processBadgeImage(
  source: HTMLImageElement,
): Promise<HTMLImageElement> {
  const canvas = knockOutOuterWhiteBackground(source);
  return canvasToImage(canvas);
}
