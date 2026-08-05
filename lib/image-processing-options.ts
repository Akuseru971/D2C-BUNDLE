/** Per-slot background removal (détourage) preferences for bundle composition. */
export type ImageProcessingOptions = {
  productCutouts: ReadonlyArray<boolean>;
  logoCutout: boolean;
};

export const DEFAULT_CUTOUT_ENABLED = true;

export function createDefaultProductCutouts(
  count: number,
  enabled = DEFAULT_CUTOUT_ENABLED,
): boolean[] {
  return Array.from({ length: count }, () => enabled);
}
