export type LayerId = "productA" | "plus" | "productB";

export type LayerTransform = {
  /** Horizontal position as % of canvas width (element center). */
  x: number;
  /** Vertical position as % of canvas height (element center). */
  y: number;
  /** Uniform scale multiplier. */
  scale: number;
};

export type BundleTransforms = Record<LayerId, LayerTransform>;

export const DEFAULT_TRANSFORMS: BundleTransforms = {
  productA: { x: 50, y: 28, scale: 1 },
  plus: { x: 50, y: 50, scale: 1 },
  productB: { x: 50, y: 72, scale: 1 },
};

export const LAYER_LABELS: Record<LayerId, string> = {
  productA: "Product A",
  plus: "Plus symbol",
  productB: "Product B",
};

export const MIN_SCALE = 0.35;
export const MAX_SCALE = 2.5;
export const SCALE_STEP = 0.05;

export const EXPORT_SIZE = 1024;

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function clampPosition(value: number): number {
  return Math.min(95, Math.max(5, value));
}
