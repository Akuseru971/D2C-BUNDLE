/** Per-slot image processing preferences for bundle composition. */
export type ImageProcessingOptions = {
  productCutouts: ReadonlyArray<boolean>;
  productWhiteExpand: ReadonlyArray<number>;
  logoCutout: boolean;
  logoWhiteExpand: number;
};

export type SlotProcessingSettings = {
  cutoutEnabled: boolean;
  whiteExpandPx: number;
};

export const DEFAULT_CUTOUT_ENABLED = true;
export const DEFAULT_WHITE_EXPAND_PX = 0;
export const MAX_WHITE_EXPAND_PX = 200;
export const WHITE_EXPAND_STEP_PX = 4;

export function createDefaultProductCutouts(
  count: number,
  enabled = DEFAULT_CUTOUT_ENABLED,
): boolean[] {
  return Array.from({ length: count }, () => enabled);
}

export function createDefaultProductWhiteExpand(count: number): number[] {
  return Array.from({ length: count }, () => DEFAULT_WHITE_EXPAND_PX);
}

export function needsImageProcessing(settings: SlotProcessingSettings): boolean {
  return settings.cutoutEnabled || settings.whiteExpandPx > 0;
}
