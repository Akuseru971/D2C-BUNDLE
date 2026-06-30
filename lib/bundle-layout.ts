import type {
  BundleTransforms,
  LayerId,
  LayerTransform,
  ProductLayerId,
} from "@/lib/bundle-editor";
import { PRODUCT_LAYER_IDS } from "@/lib/bundle-editor";

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
  products: Partial<Record<ProductLayerId, HTMLImageElement>>;
  logo: HTMLImageElement | null;
  background: HTMLImageElement | null;
};

export function getActiveProductLayersFromImages(
  images: BundleImageSet,
): ProductLayerId[] {
  return PRODUCT_LAYER_IDS.filter((layer) => Boolean(images.products[layer]));
}

export function getActiveProductCount(images: BundleImageSet): number {
  return getActiveProductLayersFromImages(images).length;
}

function productHeightRatio(activeProductCount: number): number {
  if (activeProductCount <= 1) return PRODUCT_MAX_HEIGHT_RATIO_ONE;
  if (activeProductCount === 2) return PRODUCT_MAX_HEIGHT_RATIO_TWO;
  if (activeProductCount === 3) return PRODUCT_MAX_HEIGHT_RATIO_THREE;
  if (activeProductCount <= 4) return 0.22;
  if (activeProductCount <= 6) return 0.18;
  if (activeProductCount <= 9) return 0.14;
  if (activeProductCount <= 12) return 0.11;
  return 0.09;
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

  if (isProductLayer(layer)) {
    const img = images.products[layer];
    if (!img) return null;
    return computeProductBounds(
      img,
      transforms[layer],
      canvasSize,
      activeProductCount,
    );
  }

  if (layer === "logo") {
    if (!images.logo) return null;
    return computeLogoBounds(images.logo, transforms.logo, canvasSize);
  }

  if (layer === "background") {
    if (!images.background) return null;
    return computeBackgroundBounds(
      images.background,
      transforms.background,
      canvasSize,
    );
  }

  return null;
}

function isProductLayer(layer: LayerId): layer is ProductLayerId {
  return layer.startsWith("product");
}

/** Top-most layer first (matches draw order: background, products, logo). */
function getHitTestLayerOrder(images: BundleImageSet): LayerId[] {
  const layers: LayerId[] = [];
  if (images.background) layers.push("background");
  for (const layer of PRODUCT_LAYER_IDS) {
    if (images.products[layer]) layers.push(layer);
  }
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
