import type { BundleTransforms } from "@/lib/bundle-editor";
import { EXPORT_SIZE } from "@/lib/bundle-editor";
import type { BundleImageSet } from "@/lib/bundle-layout";
import {
  computeLogoBounds,
  computeProductBounds,
} from "@/lib/bundle-layout";
import { preloadBundleImages } from "@/lib/bundle-image-cache";
import { BUNDLE_BACKGROUND } from "@/lib/remove-white-background";

function drawProductLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  transform: BundleTransforms["productA"],
  canvasSize: number,
  hasProductC: boolean,
) {
  const bounds = computeProductBounds(img, transform, canvasSize, hasProductC);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
  ctx.shadowBlur = canvasSize * 0.024;
  ctx.shadowOffsetY = canvasSize * 0.008;
  ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  transform: BundleTransforms["logo"],
  canvasSize: number,
) {
  const bounds = computeLogoBounds(img, transform, canvasSize);
  ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
}

export function renderBundleCanvas(
  ctx: CanvasRenderingContext2D,
  images: BundleImageSet,
  transforms: BundleTransforms,
  canvasSize: number = EXPORT_SIZE,
) {
  const hasProductC = Boolean(images.productC);

  ctx.fillStyle = BUNDLE_BACKGROUND;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  drawProductLayer(
    ctx,
    images.productA,
    transforms.productA,
    canvasSize,
    hasProductC,
  );
  drawProductLayer(
    ctx,
    images.productB,
    transforms.productB,
    canvasSize,
    hasProductC,
  );

  if (images.productC) {
    drawProductLayer(
      ctx,
      images.productC,
      transforms.productC,
      canvasSize,
      true,
    );
  }

  if (images.logo) {
    drawLogo(ctx, images.logo, transforms.logo, canvasSize);
  }
}

export async function renderBundleToDataUrl(
  productAUrl: string,
  productBUrl: string,
  transforms: BundleTransforms,
  productCUrl?: string | null,
  logoUrl?: string | null,
): Promise<string> {
  const images = await preloadBundleImages(
    productAUrl,
    productBUrl,
    productCUrl,
    logoUrl,
  );

  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  renderBundleCanvas(ctx, images, transforms);
  return canvas.toDataURL("image/png");
}
