"use client";

import { useEffect, useState } from "react";
import {
  getCachedLogo,
  getCachedProductImage,
} from "@/lib/bundle-image-cache";
import { DEFAULT_CUTOUT_ENABLED } from "@/lib/image-processing-options";

type ProcessedImageKind = "product" | "logo" | "background";

/** Display URL with optional background cutout for upload previews. */
export function useProcessedImageUrl(
  sourceUrl: string | null,
  kind: ProcessedImageKind,
  cutoutEnabled = DEFAULT_CUTOUT_ENABLED,
): string | null {
  const [processed, setProcessed] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl || kind === "background") return;

    let cancelled = false;

    const loader =
      kind === "logo"
        ? getCachedLogo(sourceUrl, cutoutEnabled)
        : getCachedProductImage(sourceUrl, cutoutEnabled);

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
  }, [sourceUrl, kind, cutoutEnabled]);

  if (!sourceUrl) return null;
  if (kind === "background") return sourceUrl;
  return processed;
}
