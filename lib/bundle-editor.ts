export type LayerId = "productA" | "plus" | "productB" | "badge";

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
  badge: { x: 88, y: 14, scale: 1.15 },
};

export const LAYER_LABELS: Record<LayerId, string> = {
  productA: "Product A",
  plus: "Plus symbol",
  productB: "Product B",
  badge: "Promo badge",
};

export const MIN_SCALE = 0.35;
export const MIN_SCALE_BADGE = 0.2;
export const MAX_SCALE = 2.5;
export const SCALE_STEP = 0.05;

export const EXPORT_SIZE = 1024;

/** Top-right promotional badge (replace file in /public to update artwork). */
export const BUNDLE_BADGE_SRC = "/bundle-badge.png";

export function clampScale(scale: number, layer?: LayerId): number {
  const min = layer === "badge" ? MIN_SCALE_BADGE : MIN_SCALE;
  return Math.min(MAX_SCALE, Math.max(min, scale));
}

export function clampPosition(value: number): number {
  return Math.min(95, Math.max(5, value));
}

/** Center of the bundle canvas (for centering controls). */
export const CANVAS_CENTER = { x: 50, y: 50 } as const;
