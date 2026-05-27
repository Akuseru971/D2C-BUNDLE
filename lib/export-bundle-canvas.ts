import type { BundleTransforms } from "@/lib/bundle-editor";
import { EXPORT_SIZE } from "@/lib/bundle-editor";
import {
  computeProductBounds,
  PRODUCT_MAX_HEIGHT_RATIO,
} from "@/lib/bundle-layout";
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
  canvasSize: number,
) {
  const bounds = computeProductBounds(img, transform, canvasSize);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
  ctx.shadowBlur = canvasSize * 0.024;
  ctx.shadowOffsetY = canvasSize * 0.008;
  ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
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

  drawProductLayer(ctx, imgA, transforms.productA, canvasSize);

  const plusX = (transforms.plus.x / 100) * canvasSize;
  const plusY = (transforms.plus.y / 100) * canvasSize;
  const plusR = plusRadiusForCanvas(canvasSize, transforms.plus.scale);
  drawPremiumPlus(ctx, plusX, plusY, plusR);

  drawProductLayer(ctx, imgB, transforms.productB, canvasSize);
}

export { PRODUCT_MAX_HEIGHT_RATIO };

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
