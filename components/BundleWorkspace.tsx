"use client";

import { useEffect, useMemo, useState } from "react";
import BundleEditor from "@/components/BundleEditor";
import LiveBundlePreview from "@/components/LiveBundlePreview";
import { useTransformHistory } from "@/hooks/useTransformHistory";
import {
  EXPORT_SIZE,
  getActiveProductLayers,
  getDefaultTransforms,
} from "@/lib/bundle-editor";
import { renderBundleToDataUrl } from "@/lib/export-bundle-canvas";
import { preloadBundleImages } from "@/lib/bundle-image-cache";

type BundleWorkspaceProps = {
  productAUrl?: string | null;
  productBUrl?: string | null;
  productCUrl?: string | null;
  logoUrl?: string | null;
  backgroundUrl?: string | null;
  onEditUploads: () => void;
};

export default function BundleWorkspace({
  productAUrl = null,
  productBUrl = null,
  productCUrl = null,
  logoUrl = null,
  backgroundUrl = null,
  onEditUploads,
}: BundleWorkspaceProps) {
  const activeProducts = useMemo(
    () => getActiveProductLayers(productAUrl, productBUrl, productCUrl),
    [productAUrl, productBUrl, productCUrl],
  );
  const hasBackground = Boolean(backgroundUrl);

  const layoutKey = useMemo(
    () =>
      [
        productAUrl ?? "",
        productBUrl ?? "",
        productCUrl ?? "",
        logoUrl ?? "",
        backgroundUrl ?? "",
      ].join("|"),
    [productAUrl, productBUrl, productCUrl, logoUrl, backgroundUrl],
  );

  const [isInteracting, setIsInteracting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    transforms,
    setTransforms,
    beginGesture,
    commitTransforms,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useTransformHistory(getDefaultTransforms(activeProducts, hasBackground));

  useEffect(() => {
    resetHistory(
      getDefaultTransforms(
        getActiveProductLayers(productAUrl, productBUrl, productCUrl),
        Boolean(backgroundUrl),
      ),
    );
  }, [layoutKey, productAUrl, productBUrl, productCUrl, backgroundUrl, resetHistory]);

  const handleReset = () => {
    resetHistory(getDefaultTransforms(activeProducts, hasBackground));
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await preloadBundleImages(
        productAUrl,
        productBUrl,
        productCUrl,
        logoUrl,
        backgroundUrl,
      );
      const href = await renderBundleToDataUrl(
        transforms,
        productAUrl,
        productBUrl,
        productCUrl,
        logoUrl,
        backgroundUrl,
      );

      const link = document.createElement("a");
      link.href = href;
      link.download = `bundle-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Compose your bundle</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Position your products, logo, and background on the canvas. The preview
          matches the downloaded image.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="order-1 lg:order-2 lg:sticky lg:top-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Preview
          </p>
          <LiveBundlePreview
            productAUrl={productAUrl}
            productBUrl={productBUrl}
            productCUrl={productCUrl}
            logoUrl={logoUrl}
            backgroundUrl={backgroundUrl}
            transforms={transforms}
            isInteracting={isInteracting}
            className="shadow-md"
          />
          <p className="mt-2 text-center text-xs text-zinc-500">
            Export format: {EXPORT_SIZE} × {EXPORT_SIZE} px (1:1)
          </p>
        </div>

        <div className="order-2 lg:order-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Adjust elements
          </p>
          <BundleEditor
            productAUrl={productAUrl}
            productBUrl={productBUrl}
            productCUrl={productCUrl}
            logoUrl={logoUrl}
            backgroundUrl={backgroundUrl}
            transforms={transforms}
            onTransformsChange={setTransforms}
            onBeginGesture={beginGesture}
            onCommit={commitTransforms}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onReset={handleReset}
            onInteractingChange={setIsInteracting}
          />
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-400">
        Keyboard: Ctrl+Z undo · Ctrl+Shift+Z redo
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {isExporting ? "Preparing download…" : "Download PNG"}
        </button>
        <button
          type="button"
          onClick={onEditUploads}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          Change images
        </button>
      </div>
    </section>
  );
}
