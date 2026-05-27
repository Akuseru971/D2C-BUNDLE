import type { BundleTransforms, LayerId, LayerTransform } from "@/lib/bundle-editor";

export const PRODUCT_MAX_HEIGHT_RATIO_TWO = 0.34;
export const PRODUCT_MAX_HEIGHT_RATIO_THREE = 0.26;
export const PRODUCT_MAX_WIDTH_RATIO = 0.85;
export const LOGO_MAX_WIDTH_RATIO = 0.17;

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

export function computeLogoBounds(
  img: HTMLImageElement,
  transform: LayerTransform,
  canvasSize: number,
): LayerBounds {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const maxWidth = canvasSize * LOGO_MAX_WIDTH_RATIO * transform.scale;
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
  logo: HTMLImageElement | null;
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
    case "logo":
      if (!images.logo) return null;
      return computeLogoBounds(images.logo, transforms.logo, canvasSize);
  }
}

/** Top-most layer first (matches draw order: products then logo on top). */
function getHitTestLayerOrder(images: BundleImageSet): LayerId[] {
  const layers: LayerId[] = ["productA", "productB"];
  if (images.productC) layers.push("productC");
  if (images.logo) layers.push("logo");
  return layers.reverse();
}

export function pointInRotatedBounds(
  x: number,
  y: number,
  bounds: LayerBounds,
  rotationDegrees: number,
): boolean {
  const rad = (-rotationDegrees * Math.PI) / 180;
  const dx = x - bounds.centerX;
  const dy = y - bounds.centerY;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  return (
    localX >= -halfW &&
    localX <= halfW &&
    localY >= -halfH &&
    localY <= halfH
  );
}

export function pickLayerAtPoint(
  x: number,
  y: number,
  images: BundleImageSet,
  transforms: BundleTransforms,
  canvasSize: number,
): LayerId | null {
  for (const layer of getHitTestLayerOrder(images)) {
    const bounds = getLayerBounds(layer, images, transforms, canvasSize);
    if (
      bounds &&
      pointInRotatedBounds(x, y, bounds, transforms[layer].rotation)
    ) {
      return layer;
    }
  }
  return null;
}
