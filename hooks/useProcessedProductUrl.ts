"use client";

import { useEffect, useState } from "react";
import { getCachedProductImage } from "@/lib/bundle-image-cache";

/** Display URL for product with refined outer-background cutout. */
export function useProcessedProductUrl(sourceUrl: string | null): string | null {
  const [processed, setProcessed] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl) return;

    let cancelled = false;

    getCachedProductImage(sourceUrl)
      .then((img) => {
        if (!cancelled) setProcessed(img.src);
      })
      .catch(() => {
        if (!cancelled) setProcessed(sourceUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  if (!sourceUrl) return null;
  return processed;
}
