import type { BundleTransforms, LayerId, LayerTransform } from "@/lib/bundle-editor";

export const PRODUCT_MAX_HEIGHT_RATIO_TWO = 0.34;
export const PRODUCT_MAX_HEIGHT_RATIO_THREE = 0.26;
export const PRODUCT_MAX_WIDTH_RATIO = 0.85;
export const BADGE_MAX_WIDTH_RATIO = 0.34;

export type LayerBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

function productHeightRatio(hasProductC: boolean): number {
  return hasProductC
    ? PRODUCT_MAX_HEIGHT_RATIO_THREE
    : PRODUCT_MAX_HEIGHT_RATIO_TWO;
}

export function computeProductBounds(
  img: HTMLImageElement,
  transform: LayerTransform,
  canvasSize: number,
  hasProductC: boolean,
): LayerBounds {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const maxHeight =
    canvasSize * productHeightRatio(hasProductC) * transform.scale;
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

export type BundleImageSet = {
  productA: HTMLImageElement;
  productB: HTMLImageElement;
  productC: HTMLImageElement | null;
  badge: HTMLImageElement;
};

export function getLayerBounds(
  layer: LayerId,
  images: BundleImageSet,
  transforms: BundleTransforms,
  canvasSize: number,
): LayerBounds | null {
  const hasProductC = Boolean(images.productC);

  switch (layer) {
    case "productA":
      return computeProductBounds(
        images.productA,
        transforms.productA,
        canvasSize,
        hasProductC,
      );
    case "productB":
      return computeProductBounds(
        images.productB,
        transforms.productB,
        canvasSize,
        hasProductC,
      );
    case "productC":
      if (!images.productC) return null;
      return computeProductBounds(
        images.productC,
        transforms.productC,
        canvasSize,
        true,
      );
    case "badge":
      return computeBadgeBounds(images.badge, transforms.badge, canvasSize);
  }
}
