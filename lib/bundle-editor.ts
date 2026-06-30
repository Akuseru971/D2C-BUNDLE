import { MAX_PRODUCT_ELEMENTS } from "@/lib/constants";

export type ProductLayerId = `product${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;

export type LayerId = ProductLayerId | "logo" | "background";

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

export const PRODUCT_LAYER_IDS: ProductLayerId[] = Array.from(
  { length: MAX_PRODUCT_ELEMENTS },
  (_, index) => getProductLayerId(index),
);

export function getProductLayerId(index: number): ProductLayerId {
  return `product${index + 1}` as ProductLayerId;
}

export function getProductIndex(layer: ProductLayerId): number {
  return parseInt(layer.replace("product", ""), 10) - 1;
}

export function createEmptyTransforms(): BundleTransforms {
  const transforms = {} as BundleTransforms;
  for (const layer of PRODUCT_LAYER_IDS) {
    transforms[layer] = { ...INACTIVE_LAYER };
  }
  transforms.logo = { ...DEFAULT_LOGO };
  transforms.background = { ...DEFAULT_BACKGROUND };
  return transforms;
}

export function getActiveProductLayers(
  productUrls: ReadonlyArray<string | null | undefined>,
): ProductLayerId[] {
  const layers: ProductLayerId[] = [];
  for (let index = 0; index < productUrls.length && index < MAX_PRODUCT_ELEMENTS; index++) {
    if (productUrls[index]) layers.push(getProductLayerId(index));
  }
  return layers;
}

function getGridLayout(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 1, rows: 2 };
  if (count === 3) return { cols: 1, rows: 3 };
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

export function getProductPositions(count: number): LayerTransform[] {
  if (count === 1) return [{ x: 50, y: 50, scale: 1, rotation: 0 }];
  if (count === 2) return TWO_PRODUCT_POSITIONS.map((position) => ({ ...position }));
  if (count === 3) return THREE_PRODUCT_POSITIONS.map((position) => ({ ...position }));

  const { cols, rows } = getGridLayout(count);
  const padX = 8;
  const padY = 8;
  const cellWidth = (100 - 2 * padX) / cols;
  const cellHeight = (100 - 2 * padY) / rows;
  const positions: LayerTransform[] = [];

  for (let index = 0; index < count; index++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    positions.push({
      x: padX + (col + 0.5) * cellWidth,
      y: padY + (row + 0.5) * cellHeight,
      scale: 1,
      rotation: 0,
    });
  }

  return positions;
}

export function getDefaultTransforms(
  activeProducts: ProductLayerId[],
  hasBackground = false,
): BundleTransforms {
  const transforms = createEmptyTransforms();

  if (activeProducts.length === 0 && !hasBackground) {
    return transforms;
  }

  const positions = getProductPositions(activeProducts.length);
  activeProducts.forEach((layer, index) => {
    transforms[layer] = { ...(positions[index] ?? positions[positions.length - 1]) };
  });

  return transforms;
}

export function getLayerLabel(layer: LayerId): string {
  if (layer === "logo") return "Logo";
  if (layer === "background") return "Background";
  const index = getProductIndex(layer);
  return `Product ${index + 1}`;
}

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
  activeProducts: ProductLayerId[],
  hasLogo: boolean,
  hasBackground: boolean,
): LayerId[] {
  const layers: LayerId[] = [];
  if (hasBackground) layers.push("background");
  layers.push(...activeProducts);
  if (hasLogo) layers.push("logo");
  return layers;
}

export function isProductLayer(layer: LayerId): layer is ProductLayerId {
  return PRODUCT_LAYER_IDS.includes(layer as ProductLayerId);
}

export function getActiveLayers(
  productUrls: ReadonlyArray<string | null | undefined>,
  logoUrl?: string | null,
  backgroundUrl?: string | null,
): LayerId[] {
  return getEditorLayerOrder(
    getActiveProductLayers(productUrls),
    Boolean(logoUrl),
    Boolean(backgroundUrl),
  );
}

export function getDefaultTransformForLayer(
  layer: LayerId,
  activeProducts: ProductLayerId[],
): LayerTransform {
  if (layer === "logo") return { ...DEFAULT_LOGO };
  if (layer === "background") return { ...DEFAULT_BACKGROUND };

  const index = activeProducts.indexOf(layer);
  if (index === -1) return { ...INACTIVE_LAYER };

  const positions = getProductPositions(activeProducts.length);
  return { ...(positions[index] ?? positions[positions.length - 1]) };
}

/** Keeps existing layer transforms; applies defaults only to newly added layers. */
export function mergeTransformsForNewLayers(
  current: BundleTransforms,
  previousActive: LayerId[],
  nextActive: LayerId[],
  activeProducts: ProductLayerId[],
): BundleTransforms {
  const merged = createEmptyTransforms();
  for (const layer of [...PRODUCT_LAYER_IDS, "logo", "background"] as LayerId[]) {
    merged[layer] = { ...current[layer] };
  }

  for (const layer of nextActive) {
    if (!previousActive.includes(layer)) {
      merged[layer] = getDefaultTransformForLayer(layer, activeProducts);
    }
  }

  return merged;
}
