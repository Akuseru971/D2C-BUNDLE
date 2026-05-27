"use client";

import { useEffect, useState } from "react";
import BundleEditor from "@/components/BundleEditor";
import {
  DEFAULT_TRANSFORMS,
  type BundleTransforms,
} from "@/lib/bundle-editor";
import { renderBundleToDataUrl } from "@/lib/export-bundle-canvas";

type GeneratedResultProps = {
  aiImageUrl: string;
  productAUrl: string;
  productBUrl: string;
  onGenerateAgain: () => void;
};

export default function GeneratedResult({
  aiImageUrl,
  productAUrl,
  productBUrl,
  onGenerateAgain,
}: GeneratedResultProps) {
  const [activePreview, setActivePreview] = useState<"ai" | "edited">("edited");
  const [transforms, setTransforms] = useState<BundleTransforms>(DEFAULT_TRANSFORMS);
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const dataUrl = await renderBundleToDataUrl(
          productAUrl,
          productBUrl,
          transforms,
        );
        if (!cancelled) setEditedPreviewUrl(dataUrl);
      } catch {
        /* preview update is best-effort */
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [transforms, productAUrl, productBUrl]);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const href =
        activePreview === "ai"
          ? aiImageUrl
          : await renderBundleToDataUrl(
              productAUrl,
              productBUrl,
              transforms,
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

  const displayImage =
    activePreview === "ai" ? aiImageUrl : editedPreviewUrl ?? aiImageUrl;

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Generated bundle</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Drag and zoom each element, then download your final composition.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setActivePreview("edited")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            activePreview === "edited"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Your layout
        </button>
        <button
          type="button"
          onClick={() => setActivePreview("ai")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            activePreview === "ai"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          AI preview
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt="Bundle preview"
          className="mx-auto aspect-square w-full max-w-md object-contain"
        />
      </div>

      <BundleEditor
        productAUrl={productAUrl}
        productBUrl={productBUrl}
        transforms={transforms}
        onTransformsChange={setTransforms}
      />

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
