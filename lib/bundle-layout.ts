import type { BundleTransforms, LayerId, LayerTransform } from "@/lib/bundle-editor";
import { plusRadiusForCanvas } from "@/lib/plus-symbol-draw";

export const PRODUCT_MAX_HEIGHT_RATIO = 0.34;
export const PRODUCT_MAX_WIDTH_RATIO = 0.85;

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

function pointInBounds(px: number, py: number, b: LayerBounds): boolean {
  return (
    px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height
  );
}

/** Hit-test from topmost layer to bottom. */
export function hitTestLayer(
  px: number,
  py: number,
  imgA: HTMLImageElement,
  imgB: HTMLImageElement,
  transforms: BundleTransforms,
  canvasSize: number,
): LayerId | null {
  const boundsB = computeProductBounds(imgB, transforms.productB, canvasSize);
  const boundsPlus = computePlusBounds(transforms.plus, canvasSize);
  const boundsA = computeProductBounds(imgA, transforms.productA, canvasSize);

  if (pointInBounds(px, py, boundsB)) return "productB";
  if (pointInBounds(px, py, boundsPlus)) return "plus";
  if (pointInBounds(px, py, boundsA)) return "productA";
  return null;
}

export function getLayerBounds(
  layer: LayerId,
  imgA: HTMLImageElement,
  imgB: HTMLImageElement,
  transforms: BundleTransforms,
  canvasSize: number,
): LayerBounds {
  switch (layer) {
    case "productA":
      return computeProductBounds(imgA, transforms.productA, canvasSize);
    case "productB":
      return computeProductBounds(imgB, transforms.productB, canvasSize);
    case "plus":
      return computePlusBounds(transforms.plus, canvasSize);
  }
}
