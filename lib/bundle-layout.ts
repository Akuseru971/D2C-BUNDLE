import type { BundleTransforms, LayerId, LayerTransform } from "@/lib/bundle-editor";
import { plusRadiusForCanvas } from "@/lib/plus-symbol-draw";

export const PRODUCT_MAX_HEIGHT_RATIO = 0.34;
export const PRODUCT_MAX_WIDTH_RATIO = 0.85;
/** Promo badge — larger default for top-right visibility */
export const BADGE_MAX_WIDTH_RATIO = 0.34;

export type LayerBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export function computeProductBounds(
  img: HTMLImageElement,
  transform: LayerTransform,
  canvasSize: number,
): LayerBounds {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const maxHeight = canvasSize * PRODUCT_MAX_HEIGHT_RATIO * transform.scale;
  const ratio = img.width / img.height;
  let drawHeight = maxHeight;
  let drawWidth = drawHeight * ratio;

  const maxWidth = canvasSize * PRODUCT_MAX_WIDTH_RATIO * transform.scale;
  if (drawWidth > maxWidth) {
    drawWidth = maxWidth;
    drawHeight = drawWidth / ratio;
  }

  return {
    x: centerX - drawWidth / 2,
    y: centerY - drawHeight / 2,
    width: drawWidth,
    height: drawHeight,
    centerX,
    centerY,
  };
}

export function computePlusBounds(
  transform: LayerTransform,
  canvasSize: number,
): LayerBounds {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const radius = plusRadiusForCanvas(canvasSize, transform.scale);
  const size = radius * 2;

  return {
    x: centerX - radius,
    y: centerY - radius,
    width: size,
    height: size,
    centerX,
    centerY,
  };
}

export function computeBadgeBounds(
  img: HTMLImageElement,
  transform: LayerTransform,
  canvasSize: number,
): LayerBounds {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const maxWidth = canvasSize * BADGE_MAX_WIDTH_RATIO * transform.scale;
  const ratio = img.width / img.height;
  const drawWidth = maxWidth;
  const drawHeight = drawWidth / ratio;

  return {
    x: centerX - drawWidth / 2,
    y: centerY - drawHeight / 2,
    width: drawWidth,
    height: drawHeight,
    centerX,
    centerY,
  };
}

function pointInBounds(px: number, py: number, b: LayerBounds): boolean {
  return (
    px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height
  );
}

export type BundleImageSet = {
  productA: HTMLImageElement;
  productB: HTMLImageElement;
  badge: HTMLImageElement;
};

export function getLayerBounds(
  layer: LayerId,
  images: BundleImageSet,
  transforms: BundleTransforms,
  canvasSize: number,
): LayerBounds {
  switch (layer) {
    case "productA":
      return computeProductBounds(images.productA, transforms.productA, canvasSize);
    case "productB":
      return computeProductBounds(images.productB, transforms.productB, canvasSize);
    case "plus":
      return computePlusBounds(transforms.plus, canvasSize);
    case "badge":
      return computeBadgeBounds(images.badge, transforms.badge, canvasSize);
  }
}

export function hitTestLayer(
  px: number,
  py: number,
  images: BundleImageSet,
  transforms: BundleTransforms,
  canvasSize: number,
): LayerId | null {
  const boundsBadge = computeBadgeBounds(
    images.badge,
    transforms.badge,
    canvasSize,
  );
  const boundsB = computeProductBounds(
    images.productB,
    transforms.productB,
    canvasSize,
  );
  const boundsPlus = computePlusBounds(transforms.plus, canvasSize);
  const boundsA = computeProductBounds(
    images.productA,
    transforms.productA,
    canvasSize,
  );

  if (pointInBounds(px, py, boundsBadge)) return "badge";
  if (pointInBounds(px, py, boundsB)) return "productB";
  if (pointInBounds(px, py, boundsPlus)) return "plus";
  if (pointInBounds(px, py, boundsA)) return "productA";
  return null;
}
