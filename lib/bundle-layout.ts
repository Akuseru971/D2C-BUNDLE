import type { BundleTransforms, LayerId, LayerTransform } from "@/lib/bundle-editor";

export const PRODUCT_MAX_HEIGHT_RATIO_ONE = 0.78;
export const PRODUCT_MAX_HEIGHT_RATIO_TWO = 0.34;
export const PRODUCT_MAX_HEIGHT_RATIO_THREE = 0.26;
export const PRODUCT_MAX_WIDTH_RATIO = 0.85;
export const PRODUCT_MAX_WIDTH_RATIO_ONE = 0.95;
export const LOGO_MAX_WIDTH_RATIO = 0.17;

export type LayerBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export function computeBackgroundBounds(
  img: HTMLImageElement,
  transform: LayerTransform,
  canvasSize: number,
): LayerBounds {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const imgAspect = img.width / img.height;

  let coverWidth: number;
  let coverHeight: number;
  if (imgAspect >= 1) {
    coverHeight = canvasSize;
    coverWidth = coverHeight * imgAspect;
  } else {
    coverWidth = canvasSize;
    coverHeight = coverWidth / imgAspect;
  }

  const drawWidth = coverWidth * transform.scale;
  const drawHeight = coverHeight * transform.scale;

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
  productA: HTMLImageElement | null;
  productB: HTMLImageElement | null;
  productC: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  background: HTMLImageElement | null;
};

export function getActiveProductCount(images: BundleImageSet): number {
  return [images.productA, images.productB, images.productC].filter(Boolean)
    .length;
}

function productHeightRatio(activeProductCount: number): number {
  if (activeProductCount >= 3) return PRODUCT_MAX_HEIGHT_RATIO_THREE;
  if (activeProductCount === 2) return PRODUCT_MAX_HEIGHT_RATIO_TWO;
  return PRODUCT_MAX_HEIGHT_RATIO_ONE;
}

function productWidthRatio(activeProductCount: number): number {
  return activeProductCount === 1
    ? PRODUCT_MAX_WIDTH_RATIO_ONE
    : PRODUCT_MAX_WIDTH_RATIO;
}

export function computeProductBounds(
  img: HTMLImageElement,
  transform: LayerTransform,
  canvasSize: number,
  activeProductCount: number,
): LayerBounds {
  const centerX = (transform.x / 100) * canvasSize;
  const centerY = (transform.y / 100) * canvasSize;
  const maxHeight =
    canvasSize * productHeightRatio(activeProductCount) * transform.scale;
  const ratio = img.width / img.height;
  let drawHeight = maxHeight;
  let drawWidth = drawHeight * ratio;

  const maxWidth =
    canvasSize * productWidthRatio(activeProductCount) * transform.scale;
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

export function getLayerBounds(
  layer: LayerId,
  images: BundleImageSet,
  transforms: BundleTransforms,
  canvasSize: number,
): LayerBounds | null {
  const activeProductCount = getActiveProductCount(images);

  switch (layer) {
    case "productA":
      if (!images.productA) return null;
      return computeProductBounds(
        images.productA,
        transforms.productA,
        canvasSize,
        activeProductCount,
      );
    case "productB":
      if (!images.productB) return null;
      return computeProductBounds(
        images.productB,
        transforms.productB,
        canvasSize,
        activeProductCount,
      );
    case "productC":
      if (!images.productC) return null;
      return computeProductBounds(
        images.productC,
        transforms.productC,
        canvasSize,
        activeProductCount,
      );
    case "logo":
      if (!images.logo) return null;
      return computeLogoBounds(images.logo, transforms.logo, canvasSize);
    case "background":
      if (!images.background) return null;
      return computeBackgroundBounds(
        images.background,
        transforms.background,
        canvasSize,
      );
  }
}

/** Top-most layer first (matches draw order: background, products, logo). */
function getHitTestLayerOrder(images: BundleImageSet): LayerId[] {
  const layers: LayerId[] = [];
  if (images.background) layers.push("background");
  if (images.productA) layers.push("productA");
  if (images.productB) layers.push("productB");
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
