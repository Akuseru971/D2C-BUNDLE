import type { BundleTransforms, LayerId } from "@/lib/bundle-editor";
import { EXPORT_SIZE } from "@/lib/bundle-editor";
import type { BundleImageSet } from "@/lib/bundle-layout";
import {
  computeLogoBounds,
  computeProductBounds,
  getActiveProductCount,
} from "@/lib/bundle-layout";
import { drawOrientedImage } from "@/lib/canvas-layer-draw";
import { preloadBundleImages } from "@/lib/bundle-image-cache";
import { BUNDLE_BACKGROUND } from "@/lib/remove-white-background";

const PRODUCT_DRAW_ORDER: LayerId[] = ["productA", "productB", "productC"];

function drawProductLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  transform: BundleTransforms["productA"],
  canvasSize: number,
  activeProductCount: number,
) {
  const bounds = computeProductBounds(
    img,
    transform,
    canvasSize,
    activeProductCount,
  );
  drawOrientedImage(ctx, img, bounds, transform.rotation, {
    shadow: true,
    canvasSize,
  });
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  transform: BundleTransforms["logo"],
  canvasSize: number,
) {
  const bounds = computeLogoBounds(img, transform, canvasSize);
  drawOrientedImage(ctx, img, bounds, transform.rotation);
}

export function renderBundleCanvas(
  ctx: CanvasRenderingContext2D,
  images: BundleImageSet,
  transforms: BundleTransforms,
  canvasSize: number = EXPORT_SIZE,
) {
  const activeProductCount = getActiveProductCount(images);

  ctx.fillStyle = BUNDLE_BACKGROUND;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  for (const layer of PRODUCT_DRAW_ORDER) {
    const img = images[layer];
    if (!img) continue;
    drawProductLayer(
      ctx,
      img,
      transforms[layer],
      canvasSize,
      activeProductCount,
    );
  }

  if (images.logo) {
    drawLogo(ctx, images.logo, transforms.logo, canvasSize);
  }
}

export async function renderBundleToDataUrl(
  transforms: BundleTransforms,
  productAUrl?: string | null,
  productBUrl?: string | null,
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
