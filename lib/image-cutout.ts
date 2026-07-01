import { CUTOUT_QUALITY } from "@/lib/cutout-quality";

const CARDINAL_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

const NEIGHBOR_OFFSETS = [
  ...CARDINAL_OFFSETS,
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

function channelSpread(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function minChannel(r: number, g: number, b: number): number {
  return Math.min(r, g, b);
}

function pixelMinAt(data: Uint8ClampedArray, idx: number): number {
  const i = idx * 4;
  return minChannel(data[i], data[i + 1], data[i + 2]);
}

function isStudioBackdrop(r: number, g: number, b: number): boolean {
  return (
    channelSpread(r, g, b) <= CUTOUT_QUALITY.studioWhiteSpread &&
    minChannel(r, g, b) >= CUTOUT_QUALITY.studioWhiteMin
  );
}

function isSoftBackdrop(r: number, g: number, b: number): boolean {
  return (
    channelSpread(r, g, b) <= CUTOUT_QUALITY.softWhiteSpread &&
    minChannel(r, g, b) >= CUTOUT_QUALITY.softWhiteMin
  );
}

function backdropWhiteness(r: number, g: number, b: number): number {
  if (!isSoftBackdrop(r, g, b)) return 0;
  const minC = minChannel(r, g, b);
  if (minC >= CUTOUT_QUALITY.studioWhiteMin) return 1;
  const range = CUTOUT_QUALITY.studioWhiteMin - CUTOUT_QUALITY.softWhiteMin;
  if (range <= 0) return 0;
  return (minC - CUTOUT_QUALITY.softWhiteMin) / range;
}

function hasNearbyForeground(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = CUTOUT_QUALITY.foregroundGuardRadius,
): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (
        pixelMinAt(data, ny * width + nx) <
        CUTOUT_QUALITY.foregroundGuardLuminance
      ) {
        return true;
      }
    }
  }
  return false;
}

/** True when the image already carries meaningful transparency (PNG cutout). */
export function imageHasTransparency(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): boolean {
  const total = width * height;
  let transparent = 0;
  let semi = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < CUTOUT_QUALITY.pngAlphaTransparent) transparent++;
      else if (alpha < 250) semi++;
      if (onBorder && alpha < 200) return true;
    }
  }

  return (
    transparent / total > CUTOUT_QUALITY.pngTransparencyRatio ||
    semi / total > CUTOUT_QUALITY.pngTransparencyRatio * 0.35
  );
}

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

/** Softens JPEG fringe pixels adjacent to removed backdrop (halos). */
function applyEdgeMatte(
  data: Uint8ClampedArray,
  outer: Uint8Array,
  width: number,
  height: number,
): void {
  const total = width * height;
  const dist = new Int8Array(total);
  dist.fill(-1);
  const queue: number[] = [];

  for (let idx = 0; idx < total; idx++) {
    if (!outer[idx]) continue;
    dist[idx] = 0;
    const x = idx % width;
    const y = (idx / width) | 0;
    for (const [dx, dy] of CARDINAL_OFFSETS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (!outer[nIdx] && dist[nIdx] === -1) {
        dist[nIdx] = 1;
        queue.push(nIdx);
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const d = dist[idx];
    if (d >= CUTOUT_QUALITY.edgeMatteRadius) continue;

    const x = idx % width;
    const y = (idx / width) | 0;
    for (const [dx, dy] of CARDINAL_OFFSETS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (outer[nIdx] || dist[nIdx] !== -1) continue;
      dist[nIdx] = d + 1;
      queue.push(nIdx);
    }
  }

  for (let idx = 0; idx < total; idx++) {
    const d = dist[idx];
    if (d <= 0 || d > CUTOUT_QUALITY.edgeMatteRadius) continue;

    const x = idx % width;
    const y = (idx / width) | 0;
    if (hasNearbyForeground(data, x, y, width, height)) continue;

    const i = idx * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const whiteness = backdropWhiteness(r, g, b);
    if (whiteness <= 0) continue;

    const distFactor = 1 - d / (CUTOUT_QUALITY.edgeMatteRadius + 1);
    const matte = whiteness * distFactor;
    const currentAlpha = data[i + 3];
    data[i + 3] = Math.round(currentAlpha * (1 - matte * 0.95));
  }
}

/** Removes white/gray RGB spill on semi-transparent edge pixels (anti-halo). */
export function defringeEdgePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const strength = CUTOUT_QUALITY.defringeStrength;
  const total = width * height;
  const touchesTransparent = new Uint8Array(total);

  for (let idx = 0; idx < total; idx++) {
    if (data[idx * 4 + 3] > 8) continue;
    const x = idx % width;
    const y = (idx / width) | 0;
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (data[nIdx * 4 + 3] > 8) touchesTransparent[nIdx] = 1;
    }
  }

  for (let idx = 0; idx < total; idx++) {
    const alpha = data[idx * 4 + 3];
    if (alpha === 0) continue;

    const x = idx % width;
    const y = (idx / width) | 0;
    const onEdge =
      touchesTransparent[idx] ||
      x === 0 ||
      y === 0 ||
      x === width - 1 ||
      y === height - 1;
    if (!onEdge && alpha >= 250) continue;

    const i = idx * 4;
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const a = alpha / 255;
    const minC = minChannel(r, g, b);
    const spread = channelSpread(r, g, b);

    if (spread > 40) continue;

    if (minC > 175 && alpha < 255) {
      const spill = ((minC - 175) / 80) * strength * (1 - a * 0.35);
      r = Math.max(0, Math.round(r * (1 - spill)));
      g = Math.max(0, Math.round(g * (1 - spill)));
      b = Math.max(0, Math.round(b * (1 - spill)));
    }

    if (minC > 200 && touchesTransparent[idx]) {
      const alphaPull = minC > 230 ? 0.55 : 0.35;
      const nextAlpha = Math.round(alpha * (1 - alphaPull * strength * (1 - a)));
      data[i + 3] = Math.max(0, nextAlpha);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

function knockoutStudioBackdrop(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const outer = floodOuterBackground(data, width, height);

  for (let idx = 0; idx < outer.length; idx++) {
    if (!outer[idx]) continue;
    data[idx * 4 + 3] = 0;
  }

  applyEdgeMatte(data, outer, width, height);
}

/** Full cutout pipeline for product / badge images. */
export function processImageCutout(
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

  const hasAlpha = imageHasTransparency(data, width, height);
  if (!hasAlpha) {
    knockoutStudioBackdrop(data, width, height);
  }

  defringeEdgePixels(data, width, height);
  ctx.putImageData(imageData, 0, 0);

  return addProcessingPadding(canvas);
}

export function addProcessingPadding(
  source: HTMLCanvasElement,
): HTMLCanvasElement {
  const pad = CUTOUT_QUALITY.processingPaddingPx;
  if (pad <= 0) return source;

  const out = document.createElement("canvas");
  out.width = source.width + pad * 2;
  out.height = source.height + pad * 2;
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(source, pad, pad);
  return out;
}

export function canvasToImage(
  canvas: HTMLCanvasElement,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to process product image."));
          return;
        }
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to process product image."));
        };
        img.src = url;
      },
      "image/png",
    );
  });
}
