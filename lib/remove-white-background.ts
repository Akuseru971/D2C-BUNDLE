/** Unified bundle canvas / editor background — must match export. */
export const BUNDLE_BACKGROUND = "#f5f5f5";

const WHITE_THRESHOLD = 238;
const WHITE_SOFTNESS = 22;
/** Ignore near-white pixels only when R,G,B are similar (neutral background). */
const MAX_CHANNEL_SPREAD = 28;

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
  const canvas = knockOutWhiteBackground(source);
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
