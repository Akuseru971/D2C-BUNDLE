/** Unified bundle canvas / editor background — must match export. */
export const BUNDLE_BACKGROUND = "#ffffff";

import {
  canvasToImage,
  processImageCutout,
} from "@/lib/image-cutout";

export { canvasToImage } from "@/lib/image-cutout";

const BLACK_THRESHOLD = 40;
const BLACK_SOFTNESS = 25;

export async function processProductImage(
  source: HTMLImageElement,
): Promise<HTMLImageElement> {
  const canvas = processImageCutout(source);
  return canvasToImage(canvas);
}

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

/** Badge: outer white matte removal + edge refinement + trim. */
export async function processBadgeImage(
  source: HTMLImageElement,
): Promise<HTMLImageElement> {
  const canvas = trimTransparentEdges(processImageCutout(source));
  return canvasToImage(canvas);
}

/** @deprecated Legacy global knockout — prefer processImageCutout. */
export function knockOutWhiteBackground(
  source: HTMLImageElement | HTMLCanvasElement,
): HTMLCanvasElement {
  return processImageCutout(source);
}

/** @deprecated Use processImageCutout — kept for compatibility. */
export function knockOutOuterWhiteBackground(
  source: HTMLImageElement | HTMLCanvasElement,
  options?: { trim?: boolean },
): HTMLCanvasElement {
  const canvas = processImageCutout(source);
  if (options?.trim === false) return canvas;
  return trimTransparentEdges(canvas);
}

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
