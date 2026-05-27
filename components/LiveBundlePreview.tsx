"use client";

import { useCallback, useEffect, useRef } from "react";
import type { BundleTransforms } from "@/lib/bundle-editor";
import { renderBundleCanvas } from "@/lib/export-bundle-canvas";
import { preloadBundleImages } from "@/lib/bundle-image-cache";

type LiveBundlePreviewProps = {
  productAUrl: string;
  productBUrl: string;
  transforms: BundleTransforms;
  isInteracting?: boolean;
  className?: string;
};

export default function LiveBundlePreview({
  productAUrl,
  productBUrl,
  transforms,
  isInteracting = false,
  className = "",
}: LiveBundlePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<[HTMLImageElement, HTMLImageElement] | null>(null);
  const rafRef = useRef<number | null>(null);
  const transformsRef = useRef(transforms);

  useEffect(() => {
    transformsRef.current = transforms;
  }, [transforms]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    if (!canvas || !images) return;

    const size = canvas.clientWidth || 400;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(size * dpr);

    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderBundleCanvas(ctx, images[0], images[1], transformsRef.current, size);
  }, []);

  const schedulePaint = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paint();
    });
  }, [paint]);

  useEffect(() => {
    let cancelled = false;
    preloadBundleImages(productAUrl, productBUrl).then((images) => {
      if (!cancelled) {
        imagesRef.current = images;
        schedulePaint();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productAUrl, productBUrl, schedulePaint]);

  useEffect(() => {
    schedulePaint();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [transforms, schedulePaint]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-[#f5f5f5] shadow-inner ${className}`}
    >
      <canvas
        ref={canvasRef}
        className={`aspect-square w-full transition-opacity duration-150 ${
          isInteracting ? "opacity-95" : "opacity-100"
        }`}
        aria-label="Live bundle preview"
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
