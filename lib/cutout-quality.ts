/**
 * Tunable cutout / render quality knobs.
 * Adjust these values to fine-tune detouring without touching core logic.
 */
export const CUTOUT_QUALITY = {
  /** Flood-fill: min RGB channel for pure studio backdrop pixels. */
  studioWhiteMin: 245,
  /** Flood-fill: max R/G/B spread for neutral white backdrop. */
  studioWhiteSpread: 18,
  /** Edge matte: softer near-white fringe (JPEG anti-alias). */
  softWhiteMin: 220,
  softWhiteSpread: 24,
  /** How many px inward from removed backdrop to refine alpha. */
  edgeMatteRadius: 4,
  /** Pixels darker than this nearby = product metal / detail (protected). */
  foregroundGuardLuminance: 210,
  foregroundGuardRadius: 2,
  /** White RGB spill removal on semi-transparent edge pixels (0–1). */
  defringeStrength: 0.82,
  /** Transparent padding added after processing (prevents clipped edges on resize). */
  processingPaddingPx: 4,
  /** PNG: alpha below this counts as transparent when detecting cutouts. */
  pngAlphaTransparent: 16,
  /** Fraction of transparent pixels to treat image as pre-cut PNG. */
  pngTransparencyRatio: 0.015,
} as const;

export const RENDER_QUALITY = {
  imageSmoothingQuality: "high" as const,
  /** Product drop shadow — subtle contact shadow, preserves in-image shadows. */
  productShadowOpacity: 0.1,
  productShadowBlurRatio: 0.022,
  productShadowOffsetRatio: 0.007,
} as const;
