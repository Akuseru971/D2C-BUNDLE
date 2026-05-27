"use client";

import { useEffect, useState } from "react";
import BundleEditor from "@/components/BundleEditor";
import LiveBundlePreview from "@/components/LiveBundlePreview";
import { useTransformHistory } from "@/hooks/useTransformHistory";
import { getDefaultTransforms } from "@/lib/bundle-editor";
import { renderBundleToDataUrl } from "@/lib/export-bundle-canvas";
import { preloadBundleImages } from "@/lib/bundle-image-cache";

type GeneratedResultProps = {
  aiImageUrl: string;
  productAUrl: string;
  productBUrl: string;
  productCUrl?: string | null;
  onGenerateAgain: () => void;
};

export default function GeneratedResult({
  aiImageUrl,
  productAUrl,
  productBUrl,
  productCUrl = null,
  onGenerateAgain,
}: GeneratedResultProps) {
  const hasProductC = Boolean(productCUrl);
  const [activePreview, setActivePreview] = useState<"edited" | "ai">("edited");
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
  } = useTransformHistory(getDefaultTransforms(hasProductC));

  useEffect(() => {
    resetHistory(getDefaultTransforms(hasProductC));
  }, [hasProductC, resetHistory]);

  const handleReset = () => {
    resetHistory(getDefaultTransforms(hasProductC));
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await preloadBundleImages(productAUrl, productBUrl, productCUrl);
      const href =
        activePreview === "ai"
          ? aiImageUrl
          : await renderBundleToDataUrl(
              productAUrl,
              productBUrl,
              transforms,
              productCUrl,
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Generated bundle</h2>
          <p className="mt-1 text-sm text-zinc-500">
            WYSIWYG editor — what you see while editing matches the preview.
          </p>
        </div>
        <div className="mt-2 flex gap-2 sm:mt-0">
          <button
            type="button"
            onClick={() => setActivePreview("edited")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activePreview === "edited"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Your layout
          </button>
          <button
            type="button"
            onClick={() => setActivePreview("ai")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activePreview === "ai"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            AI preview
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="order-1 lg:order-2 lg:sticky lg:top-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Live preview
          </p>
          {activePreview === "edited" ? (
            <LiveBundlePreview
              productAUrl={productAUrl}
              productBUrl={productBUrl}
              productCUrl={productCUrl}
              transforms={transforms}
              isInteracting={isInteracting}
              className="shadow-md"
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aiImageUrl}
                alt="AI generated bundle"
                className="aspect-square w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="order-2 lg:order-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Adjust elements
          </p>
          <BundleEditor
            productAUrl={productAUrl}
            productBUrl={productBUrl}
            productCUrl={productCUrl}
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
          {isExporting ? "Preparing download…" : "Download Image"}
        </button>
        <button
          type="button"
          onClick={onGenerateAgain}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          Generate Again
        </button>
      </div>
    </section>
  );
}
