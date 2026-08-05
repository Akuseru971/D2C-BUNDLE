"use client";

import { useEffect, useState } from "react";
import {
  getCachedLogo,
  getCachedProductImage,
} from "@/lib/bundle-image-cache";
import {
  DEFAULT_CUTOUT_ENABLED,
  DEFAULT_WHITE_EXPAND_PX,
} from "@/lib/image-processing-options";

type ProcessedImageKind = "product" | "logo" | "background";

/** Display URL with optional cutout and white-background expansion. */
export function useProcessedImageUrl(
  sourceUrl: string | null,
  kind: ProcessedImageKind,
  cutoutEnabled = DEFAULT_CUTOUT_ENABLED,
  whiteExpandPx = DEFAULT_WHITE_EXPAND_PX,
): string | null {
  const [processed, setProcessed] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl || kind === "background") return;

    let cancelled = false;
    const settings = { cutoutEnabled, whiteExpandPx };
    const loader =
      kind === "logo"
        ? getCachedLogo(sourceUrl, settings)
        : getCachedProductImage(sourceUrl, settings);

    loader
      .then((img) => {
        if (!cancelled) setProcessed(img.src);
      })
      .catch(() => {
        if (!cancelled) setProcessed(sourceUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceUrl, kind, cutoutEnabled, whiteExpandPx]);

  if (!sourceUrl) return null;
  if (kind === "background") return sourceUrl;
  return processed;
}
