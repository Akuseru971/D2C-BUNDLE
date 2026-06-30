export type LayerId =
  | "productA"
  | "productB"
  | "productC"
  | "logo"
  | "background";

export type LayerTransform = {
  x: number;
  y: number;
  scale: number;
  /** Rotation in degrees, clockwise. */
  rotation: number;
};

export type BundleTransforms = Record<LayerId, LayerTransform>;

const INACTIVE_LAYER: LayerTransform = {
  x: 50,
  y: 50,
  scale: 1,
  rotation: 0,
};

const DEFAULT_LOGO: LayerTransform = {
  x: 88,
  y: 14,
  scale: 0.575,
  rotation: 0,
};

const DEFAULT_BACKGROUND: LayerTransform = {
  x: 50,
  y: 50,
  scale: 1,
  rotation: 0,
};

const TWO_PRODUCT_POSITIONS: LayerTransform[] = [
  { x: 50, y: 30, scale: 1, rotation: 0 },
  { x: 50, y: 70, scale: 1, rotation: 0 },
];

const THREE_PRODUCT_POSITIONS: LayerTransform[] = [
  { x: 50, y: 22, scale: 1, rotation: 0 },
  { x: 50, y: 50, scale: 1, rotation: 0 },
  { x: 50, y: 78, scale: 1, rotation: 0 },
];

const PRODUCT_LAYER_IDS: LayerId[] = ["productA", "productB", "productC"];

export function getActiveProductLayers(
  productAUrl?: string | null,
  productBUrl?: string | null,
  productCUrl?: string | null,
): LayerId[] {
  const layers: LayerId[] = [];
  if (productAUrl) layers.push("productA");
  if (productBUrl) layers.push("productB");
  if (productCUrl) layers.push("productC");
  return layers;
}

export function getDefaultTransforms(
  activeProducts: LayerId[],
  hasBackground = false,
): BundleTransforms {
  const transforms: BundleTransforms = {
    productA: { ...INACTIVE_LAYER },
    productB: { ...INACTIVE_LAYER },
    productC: { ...INACTIVE_LAYER },
    logo: { ...DEFAULT_LOGO },
    background: { ...DEFAULT_BACKGROUND },
  };

  if (activeProducts.length === 0 && !hasBackground) {
    return transforms;
  }

  if (activeProducts.length === 1) {
    transforms[activeProducts[0]] = { x: 50, y: 50, scale: 1, rotation: 0 };
    return transforms;
  }

  const positions =
    activeProducts.length >= 3
      ? THREE_PRODUCT_POSITIONS
      : TWO_PRODUCT_POSITIONS;

  activeProducts.forEach((layer, index) => {
    transforms[layer] = {
      ...(positions[index] ?? positions[positions.length - 1]),
    };
  });

  return transforms;
}

export const LAYER_LABELS: Record<LayerId, string> = {
  productA: "Product A",
  productB: "Product B",
  productC: "Product C",
  logo: "Logo",
  background: "Background",
};

export const MIN_SCALE = 0.35;
export const MIN_SCALE_LOGO = 0.2;
export const MAX_SCALE = 4;
export const SCALE_STEP = 0.05;

export const MIN_ROTATION = -180;
export const MAX_ROTATION = 180;
export const ROTATION_STEP = 1;
export const ROTATION_BUTTON_STEP = 15;
/** Degrees within which rotation snaps to 0° or ±90°. */
export const ROTATION_SNAP_THRESHOLD = 7;

const ROTATION_SNAP_ANGLES = [0, 90, -90] as const;

export const EXPORT_SIZE = 1500;

export function clampScale(scale: number, layer?: LayerId): number {
  const min = layer === "logo" ? MIN_SCALE_LOGO : MIN_SCALE;
  return Math.min(MAX_SCALE, Math.max(min, scale));
}

export function clampPosition(value: number): number {
  return Math.min(95, Math.max(5, value));
}

export function clampRotation(degrees: number): number {
  let value = degrees % 360;
  if (value > 180) value -= 360;
  if (value < -180) value += 360;
  return Math.min(MAX_ROTATION, Math.max(MIN_ROTATION, value));
}

/** Clamps then lightly snaps to 0° or ±90° when close. */
export function applyRotation(degrees: number): number {
  const clamped = clampRotation(degrees);
  let snapped = clamped;
  let nearestDist = ROTATION_SNAP_THRESHOLD + 1;

  for (const angle of ROTATION_SNAP_ANGLES) {
    const dist = Math.abs(clamped - angle);
    if (dist <= ROTATION_SNAP_THRESHOLD && dist < nearestDist) {
      snapped = angle;
      nearestDist = dist;
    }
  }

  return snapped;
}

export const CANVAS_CENTER = { x: 50, y: 50 } as const;

export function getEditorLayerOrder(
  activeProducts: LayerId[],
  hasLogo: boolean,
  hasBackground: boolean,
): LayerId[] {
  const layers: LayerId[] = [];
  if (hasBackground) layers.push("background");
  layers.push(...activeProducts);
  if (hasLogo) layers.push("logo");
  return layers;
}

export function isProductLayer(layer: LayerId): boolean {
  return PRODUCT_LAYER_IDS.includes(layer);
}

export function getActiveLayers(
  productAUrl?: string | null,
  productBUrl?: string | null,
  productCUrl?: string | null,
  logoUrl?: string | null,
  backgroundUrl?: string | null,
): LayerId[] {
  return getEditorLayerOrder(
    getActiveProductLayers(productAUrl, productBUrl, productCUrl),
    Boolean(logoUrl),
    Boolean(backgroundUrl),
  );
}

export function getDefaultTransformForLayer(
  layer: LayerId,
  activeProducts: LayerId[],
): LayerTransform {
  if (layer === "logo") return { ...DEFAULT_LOGO };
  if (layer === "background") return { ...DEFAULT_BACKGROUND };

  const index = activeProducts.indexOf(layer);
  if (index === -1) return { ...INACTIVE_LAYER };

  if (activeProducts.length === 1) {
    return { x: 50, y: 50, scale: 1, rotation: 0 };
  }

  const positions =
    activeProducts.length >= 3
      ? THREE_PRODUCT_POSITIONS
      : TWO_PRODUCT_POSITIONS;

  return { ...(positions[index] ?? positions[positions.length - 1]) };
}

/** Keeps existing layer transforms; applies defaults only to newly added layers. */
export function mergeTransformsForNewLayers(
  current: BundleTransforms,
  previousActive: LayerId[],
  nextActive: LayerId[],
  activeProducts: LayerId[],
): BundleTransforms {
  const merged: BundleTransforms = {
    productA: { ...current.productA },
    productB: { ...current.productB },
    productC: { ...current.productC },
    logo: { ...current.logo },
    background: { ...current.background },
  };

  for (const layer of nextActive) {
    if (!previousActive.includes(layer)) {
      merged[layer] = getDefaultTransformForLayer(layer, activeProducts);
    }
  }

  return merged;
}
