"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampPosition,
  clampScale,
  SCALE_STEP,
  type BundleTransforms,
  type LayerId,
} from "@/lib/bundle-editor";
import { getLayerBounds } from "@/lib/bundle-layout";
import type { BundleImages } from "@/lib/bundle-image-cache";
import { preloadBundleImages } from "@/lib/bundle-image-cache";
import { renderBundleCanvas } from "@/lib/export-bundle-canvas";

type BundleCanvasViewProps = {
  productAUrl: string;
  productBUrl: string;
  transforms: BundleTransforms;
  interactive?: boolean;
  selectedLayer?: LayerId;
  onSelectLayer?: (layer: LayerId) => void;
  onTransformsChange?: (
    update: BundleTransforms | ((prev: BundleTransforms) => BundleTransforms),
  ) => void;
  onBeginGesture?: () => void;
  onCommit?: () => void;
  onInteractingChange?: (interacting: boolean) => void;
  className?: string;
  borderStyle?: "solid" | "dashed";
};

function drawSelectionRing(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  canvasSize: number,
) {
  const pad = canvasSize * 0.008;
  ctx.save();
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1.5, canvasSize * 0.004);
  ctx.setLineDash([canvasSize * 0.012, canvasSize * 0.008]);
  ctx.strokeRect(
    bounds.x - pad,
    bounds.y - pad,
    bounds.width + pad * 2,
    bounds.height + pad * 2,
  );
  ctx.restore();
}

export default function BundleCanvasView({
  productAUrl,
  productBUrl,
  transforms,
  interactive = false,
  selectedLayer = "productA",
  onSelectLayer,
  onTransformsChange,
  onBeginGesture,
  onCommit,
  onInteractingChange,
  className = "",
  borderStyle = "solid",
}: BundleCanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<BundleImages | null>(null);
  const transformsRef = useRef(transforms);
  const selectedRef = useRef(selectedLayer);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    layer: LayerId;
    startX: number;
    startY: number;
    origin: BundleTransforms[LayerId];
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    transformsRef.current = transforms;
  }, [transforms]);

  useEffect(() => {
    selectedRef.current = selectedLayer;
  }, [selectedLayer]);

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
    const t = transformsRef.current;
    renderBundleCanvas(ctx, images, t, size);

    if (interactive && selectedRef.current) {
      const bounds = getLayerBounds(
        selectedRef.current,
        images,
        t,
        size,
      );
      drawSelectionRing(ctx, bounds, size);
    }
  }, [interactive]);

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
  }, [transforms, selectedLayer, schedulePaint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => schedulePaint());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [schedulePaint]);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (!interactive || !onTransformsChange) return;
    const images = imagesRef.current;
    if (!images) return;

    const layer = selectedRef.current;

    onSelectLayer?.(layer);
    onBeginGesture?.();
    onInteractingChange?.(true);
    setIsDragging(true);

    dragRef.current = {
      layer,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...transformsRef.current[layer] },
    };

    canvasRef.current?.setPointerCapture(event.pointerId);
    schedulePaint();
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!interactive || !onTransformsChange || !dragRef.current) return;
    const container = canvasRef.current;
    const drag = dragRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startX) / rect.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * 100;

    onTransformsChange((prev) => ({
      ...prev,
      [drag.layer]: {
        ...drag.origin,
        x: clampPosition(drag.origin.x + deltaX),
        y: clampPosition(drag.origin.y + deltaY),
      },
    }));
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!interactive) return;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    const hadInteraction = dragRef.current !== null;
    dragRef.current = null;
    setIsDragging(false);
    onInteractingChange?.(false);
    if (hadInteraction) onCommit?.();
    schedulePaint();
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!interactive || !onTransformsChange) return;
    event.preventDefault();
    onBeginGesture?.();
    const layer = selectedRef.current;
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    onTransformsChange((prev) => ({
      ...prev,
      [layer]: {
        ...prev[layer],
        scale: clampScale(prev[layer].scale + delta, layer),
      },
    }));
    onCommit?.();
    schedulePaint();
  };

  const cursorClass =
    interactive && isDragging
      ? "cursor-grabbing"
      : interactive
        ? "cursor-grab"
        : "";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-[#f5f5f5] ${
        borderStyle === "dashed" ? "border-dashed" : ""
      } ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={interactive && isDragging ? handlePointerMove : undefined}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={interactive ? handleWheel : undefined}
        className={`aspect-square w-full touch-none ${cursorClass}`}
        aria-label={interactive ? "Interactive bundle editor" : "Bundle preview"}
      />
      {interactive && (
        <p className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-zinc-500 shadow-sm backdrop-blur">
          Selected layer locked · Drag anywhere · Scroll to zoom
        </p>
      )}
    </div>
  );
}
