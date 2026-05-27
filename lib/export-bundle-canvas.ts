import type { BundleTransforms } from "@/lib/bundle-editor";
import { EXPORT_SIZE } from "@/lib/bundle-editor";
import { getCachedProductImage } from "@/lib/bundle-image-cache";
import {
  drawPremiumPlus,
  plusRadiusForCanvas,
} from "@/lib/plus-symbol-draw";
import { BUNDLE_BACKGROUND } from "@/lib/remove-white-background";

function drawProductLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  transform: BundleTransforms["productA"],
  maxHeightRatio: number,
  canvasSize: number,
) {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const maxHeight = canvasSize * maxHeightRatio * transform.scale;
  const ratio = img.width / img.height;
  let drawHeight = maxHeight;
  let drawWidth = drawHeight * ratio;

  const maxWidth = canvasSize * 0.85 * transform.scale;
  if (drawWidth > maxWidth) {
    drawWidth = maxWidth;
    drawHeight = drawWidth / ratio;
  }

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
  ctx.shadowBlur = canvasSize * 0.024;
  ctx.shadowOffsetY = canvasSize * 0.008;
  ctx.drawImage(
    img,
    centerX - drawWidth / 2,
    centerY - drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
}

export function renderBundleCanvas(
  ctx: CanvasRenderingContext2D,
  imgA: HTMLImageElement,
  imgB: HTMLImageElement,
  transforms: BundleTransforms,
  canvasSize: number = EXPORT_SIZE,
) {
  ctx.fillStyle = BUNDLE_BACKGROUND;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  drawProductLayer(ctx, imgA, transforms.productA, 0.34, canvasSize);

  const plusX = (transforms.plus.x / 100) * canvasSize;
  const plusY = (transforms.plus.y / 100) * canvasSize;
  const plusR = plusRadiusForCanvas(canvasSize, transforms.plus.scale);
  drawPremiumPlus(ctx, plusX, plusY, plusR);

  drawProductLayer(ctx, imgB, transforms.productB, 0.34, canvasSize);
}

export async function renderBundleToDataUrl(
  productAUrl: string,
  productBUrl: string,
  transforms: BundleTransforms,
): Promise<string> {
  const [imgA, imgB] = await Promise.all([
    getCachedProductImage(productAUrl),
    getCachedProductImage(productBUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  renderBundleCanvas(ctx, imgA, imgB, transforms);
  return canvas.toDataURL("image/png");
}
