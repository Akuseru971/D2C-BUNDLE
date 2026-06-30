/** Unified bundle canvas / editor background — must match export. */
export const BUNDLE_BACKGROUND = "#ffffff";

const WHITE_THRESHOLD = 238;
const WHITE_SOFTNESS = 22;
/** Neutral near-white background (strict — avoids specular highlights on metal). */
const MAX_CHANNEL_SPREAD = 28;
const BACKGROUND_WHITE_MIN = 230;
/**
 * Pixels darker than this nearby indicate metal / product detail.
 * White reflections on cutlery always sit next to darker metal.
 */
const FOREGROUND_LUMINANCE = 200;
const FOREGROUND_GUARD_RADIUS = 2;

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

function pixelMinAt(
  data: Uint8ClampedArray,
  idx: number,
): number {
  const i = idx * 4;
  return minChannel(data[i], data[i + 1], data[i + 2]);
}

/** Strict neutral studio background — not specular white on metal. */
function isBackgroundWhite(r: number, g: number, b: number): boolean {
  return (
    channelSpread(r, g, b) <= MAX_CHANNEL_SPREAD &&
    minChannel(r, g, b) >= BACKGROUND_WHITE_MIN
  );
}

function hasNearbyForeground(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = FOREGROUND_GUARD_RADIUS,
): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (
        pixelMinAt(data, ny * width + nx) < FOREGROUND_LUMINANCE
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Flood-fill from image borders through background white only.
 * Stops at product edges and specular highlights (adjacent metal/detail).
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
    if (!isBackgroundWhite(data[i], data[i + 1], data[i + 2])) return;
    if (hasNearbyForeground(data, x, y, width, height)) return;
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

/** Remove marked background; never touch pixels near product metal/highlights. */
function applyOuterKnockout(
  data: Uint8ClampedArray,
  outer: Uint8Array,
  width: number,
  height: number,
): void {
  const total = outer.length;

  for (let idx = 0; idx < total; idx++) {
    if (!outer[idx]) continue;
    const x = idx % width;
    const y = (idx / width) | 0;
    if (hasNearbyForeground(data, x, y, width, height)) continue;
    data[idx * 4 + 3] = 0;
  }
}

/**
 * One-pixel halo between background and product, only where no metal is nearby.
 */
function cleanIsolatedHalo(
  data: Uint8ClampedArray,
  outer: Uint8Array,
  width: number,
  height: number,
): void {
  const total = outer.length;
  const touchesOuter = new Uint8Array(total);

  for (let idx = 0; idx < total; idx++) {
    if (outer[idx]) continue;
    const x = idx % width;
    const y = (idx / width) | 0;
    for (const [dx, dy] of CARDINAL_OFFSETS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (outer[ny * width + nx]) {
        touchesOuter[idx] = 1;
        break;
      }
    }
  }

  for (let idx = 0; idx < total; idx++) {
    if (!touchesOuter[idx] || outer[idx]) continue;
    const x = idx % width;
    const y = (idx / width) | 0;
    if (hasNearbyForeground(data, x, y, width, height)) continue;
    const i = idx * 4;
    if (!isBackgroundWhite(data[i], data[i + 1], data[i + 2])) continue;
    data[i + 3] = 0;
  }
}

/**
 * Removes only the outer white matte connected to the image edges (flood fill).
 * Preserves internal whites and specular highlights on cutlery / metal.
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
  applyOuterKnockout(data, outer, width, height);
  cleanIsolatedHalo(data, outer, width, height);

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
