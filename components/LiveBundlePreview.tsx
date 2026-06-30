"use client";

import BundleCanvasView from "@/components/BundleCanvasView";
import type { BundleTransforms } from "@/lib/bundle-editor";

type LiveBundlePreviewProps = {
  productAUrl?: string | null;
  productBUrl?: string | null;
  productCUrl?: string | null;
  logoUrl?: string | null;
  backgroundUrl?: string | null;
  transforms: BundleTransforms;
  isInteracting?: boolean;
  className?: string;
};

export default function LiveBundlePreview({
  productAUrl = null,
  productBUrl = null,
  productCUrl = null,
  logoUrl = null,
  backgroundUrl = null,
  transforms,
  isInteracting = false,
  className = "",
}: LiveBundlePreviewProps) {
  return (
    <div className={`relative ${className}`}>
      <BundleCanvasView
        productAUrl={productAUrl}
        productBUrl={productBUrl}
        productCUrl={productCUrl}
        logoUrl={logoUrl}
        backgroundUrl={backgroundUrl}
        transforms={transforms}
        interactive={false}
        className={isInteracting ? "opacity-95" : ""}
      />
      {isInteracting && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3">
          <span className="rounded-full bg-zinc-900/75 px-3 py-1 text-[10px] font-medium tracking-wide text-white uppercase">
            Updating…
          </span>
        </div>
      )}
    </div>
  );
}
