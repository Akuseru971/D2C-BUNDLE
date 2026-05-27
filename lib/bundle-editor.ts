export type LayerId = "productA" | "productB" | "productC" | "badge";

export type LayerTransform = {
  x: number;
  y: number;
  scale: number;
};

export type BundleTransforms = Record<LayerId, LayerTransform>;

const DEFAULT_TWO_PRODUCTS: BundleTransforms = {
  productA: { x: 50, y: 30, scale: 1 },
  productB: { x: 50, y: 70, scale: 1 },
  productC: { x: 50, y: 50, scale: 1 },
  badge: { x: 88, y: 14, scale: 1.15 },
};

const DEFAULT_THREE_PRODUCTS: BundleTransforms = {
  productA: { x: 50, y: 22, scale: 1 },
  productB: { x: 50, y: 50, scale: 1 },
  productC: { x: 50, y: 78, scale: 1 },
  badge: { x: 88, y: 14, scale: 1.15 },
};

export function getDefaultTransforms(hasProductC: boolean): BundleTransforms {
  const base = hasProductC ? DEFAULT_THREE_PRODUCTS : DEFAULT_TWO_PRODUCTS;
  return {
    productA: { ...base.productA },
    productB: { ...base.productB },
    productC: { ...base.productC },
    badge: { ...base.badge },
  };
}

/** @deprecated Use getDefaultTransforms(false) */
export const DEFAULT_TRANSFORMS = DEFAULT_TWO_PRODUCTS;

export const LAYER_LABELS: Record<LayerId, string> = {
  productA: "Product A",
  productB: "Product B",
  productC: "Product C",
  badge: "Promo badge",
};

export const MIN_SCALE = 0.35;
export const MIN_SCALE_BADGE = 0.2;
export const MAX_SCALE = 2.5;
export const SCALE_STEP = 0.05;

export const EXPORT_SIZE = 1024;

export const BUNDLE_BADGE_SRC = "/bundle-badge.png";

export function clampScale(scale: number, layer?: LayerId): number {
  const min = layer === "badge" ? MIN_SCALE_BADGE : MIN_SCALE;
  return Math.min(MAX_SCALE, Math.max(min, scale));
}

export function clampPosition(value: number): number {
  return Math.min(95, Math.max(5, value));
}

export const CANVAS_CENTER = { x: 50, y: 50 } as const;

export function getProductLayerOrder(hasProductC: boolean): LayerId[] {
  return hasProductC
    ? ["productA", "productB", "productC", "badge"]
    : ["productA", "productB", "badge"];
}
