export type LayerId = "productA" | "plus" | "productB" | "wmfLogo";

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
  wmfLogo: { x: 90, y: 10, scale: 1 },
};

export const LAYER_LABELS: Record<LayerId, string> = {
  productA: "Product A",
  plus: "Plus symbol",
  productB: "Product B",
  wmfLogo: "WMF Logo",
};

export const MIN_SCALE = 0.35;
export const MIN_SCALE_LOGO = 0.15;
export const MAX_SCALE = 2.5;
export const SCALE_STEP = 0.05;

export const EXPORT_SIZE = 1024;

export const WMF_LOGO_SRC = "/wmf-logo.png";

export function clampScale(scale: number, layer?: LayerId): number {
  const min = layer === "wmfLogo" ? MIN_SCALE_LOGO : MIN_SCALE;
  return Math.min(MAX_SCALE, Math.max(min, scale));
}

export function clampPosition(value: number): number {
  return Math.min(95, Math.max(5, value));
}

/** Center of the bundle canvas (for centering controls). */
export const CANVAS_CENTER = { x: 50, y: 50 } as const;
