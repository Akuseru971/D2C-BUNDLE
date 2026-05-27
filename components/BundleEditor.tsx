"use client";

import { useCallback, useRef, useState } from "react";
import PlusSymbol from "@/components/PlusSymbol";
import {
  clampPosition,
  clampScale,
  LAYER_LABELS,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  type BundleTransforms,
  type LayerId,
} from "@/lib/bundle-editor";

type BundleEditorProps = {
  productAUrl: string;
  productBUrl: string;
  transforms: BundleTransforms;
  onTransformsChange: (
    transforms: BundleTransforms | ((prev: BundleTransforms) => BundleTransforms),
  ) => void;
  onBeginGesture: () => void;
  onCommit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onInteractingChange?: (interacting: boolean) => void;
};

function layerStyle(
  transform: BundleTransforms[LayerId],
  isDragging: boolean,
) {
  return {
    left: `${transform.x}%`,
    top: `${transform.y}%`,
    transform: `translate(-50%, -50%) scale(${transform.scale})`,
    transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  };
}

export default function BundleEditor({
  productAUrl,
  productBUrl,
  transforms,
  onTransformsChange,
  onBeginGesture,
  onCommit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onInteractingChange,
}: BundleEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerId>("productA");
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    layer: LayerId;
    startX: number;
    startY: number;
    origin: BundleTransforms[LayerId];
  } | null>(null);

  const scheduleTransformUpdate = useCallback(
    (update: (prev: BundleTransforms) => BundleTransforms) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        onTransformsChange(update);
      });
    },
    [onTransformsChange],
  );

  const updateLayer = useCallback(
    (layer: LayerId, patch: Partial<BundleTransforms[LayerId]>) => {
      scheduleTransformUpdate((prev) => ({
        ...prev,
        [layer]: {
          ...prev[layer],
          ...patch,
          ...(patch.scale !== undefined
            ? { scale: clampScale(patch.scale) }
            : {}),
          ...(patch.x !== undefined ? { x: clampPosition(patch.x) } : {}),
          ...(patch.y !== undefined ? { y: clampPosition(patch.y) } : {}),
        },
      }));
    },
    [scheduleTransformUpdate],
  );

  const handlePointerDown = (
    event: React.PointerEvent,
    layer: LayerId,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedLayer(layer);
    setIsDragging(true);
    onInteractingChange?.(true);
    onBeginGesture();
    dragRef.current = {
      layer,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...transforms[layer] },
    };
    canvasRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const container = canvasRef.current;
    if (!drag || !container) return;

    const rect = container.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startX) / rect.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * 100;

    scheduleTransformUpdate((prev) => ({
      ...prev,
      [drag.layer]: {
        ...drag.origin,
        x: clampPosition(drag.origin.x + deltaX),
        y: clampPosition(drag.origin.y + deltaY),
      },
    }));
  };

  const endInteraction = (event: React.PointerEvent) => {
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    const wasDragging = isDragging;
    setIsDragging(false);
    onInteractingChange?.(false);
    dragRef.current = null;
    if (wasDragging) onCommit();
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    updateLayer(selectedLayer, {
      scale: transforms[selectedLayer].scale + delta,
    });
  };

  const handleScaleSlider = (value: number) => {
    updateLayer(selectedLayer, { scale: value });
  };

  const handleScaleCommit = () => {
    onCommit();
  };

  const zoomSelected = (direction: "in" | "out") => {
    onBeginGesture();
    const delta = direction === "in" ? SCALE_STEP : -SCALE_STEP;
    updateLayer(selectedLayer, {
      scale: transforms[selectedLayer].scale + delta,
    });
    onCommit();
  };

  const selected = transforms[selectedLayer];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 4 10l5-5M4 10h11a5 5 0 015 5v1" />
          </svg>
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l5-5-5-5M20 10H9a5 5 0 00-5 5v1" />
          </svg>
          Redo
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Reset layout
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["productA", "plus", "productB"] as LayerId[]).map((layer) => (
          <button
            key={layer}
            type="button"
            onClick={() => setSelectedLayer(layer)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
              selectedLayer === layer
                ? "bg-zinc-900 text-white shadow-md"
                : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {LAYER_LABELS[layer]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600">
            Scale — {LAYER_LABELS[selectedLayer]}
          </span>
          <span className="text-xs tabular-nums text-zinc-500">
            {Math.round(selected.scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => zoomSelected("out")}
            disabled={selected.scale <= MIN_SCALE}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium transition hover:bg-white disabled:opacity-40"
            aria-label="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={SCALE_STEP}
            value={selected.scale}
            onPointerDown={onBeginGesture}
            onChange={(e) => handleScaleSlider(parseFloat(e.target.value))}
            onPointerUp={handleScaleCommit}
            onTouchEnd={handleScaleCommit}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
          />
          <button
            type="button"
            onClick={() => zoomSelected("in")}
            disabled={selected.scale >= MAX_SCALE}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium transition hover:bg-white disabled:opacity-40"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerMove={isDragging ? handlePointerMove : undefined}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        className={`relative mx-auto aspect-square w-full overflow-hidden rounded-2xl border-2 bg-[#f5f5f5] touch-none ${
          isDragging
            ? "cursor-grabbing border-zinc-400"
            : "border-zinc-200 border-dashed"
        }`}
      >
        <p className="pointer-events-none absolute left-3 top-3 z-30 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-zinc-500 shadow-sm backdrop-blur">
          Drag to move · Scroll to zoom
        </p>

        <div
          onPointerDown={(e) => handlePointerDown(e, "productA")}
          style={layerStyle(transforms.productA, isDragging)}
          className={`absolute z-10 max-h-[38%] max-w-[88%] cursor-grab select-none will-change-transform ${
            selectedLayer === "productA"
              ? "z-20 ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#f5f5f5]"
              : "hover:ring-1 hover:ring-zinc-300"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productAUrl}
            alt="Product A"
            draggable={false}
            className="pointer-events-none max-h-[280px] w-auto max-w-full object-contain drop-shadow-lg"
          />
        </div>

        <div
          onPointerDown={(e) => handlePointerDown(e, "plus")}
          style={layerStyle(transforms.plus, isDragging)}
          className={`absolute z-20 flex cursor-grab select-none items-center justify-center will-change-transform ${
            selectedLayer === "plus"
              ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#f5f5f5] rounded-full"
              : "hover:ring-1 hover:ring-zinc-300 rounded-full"
          }`}
        >
          <PlusSymbol scale={transforms.plus.scale} className="pointer-events-none" />
        </div>

        <div
          onPointerDown={(e) => handlePointerDown(e, "productB")}
          style={layerStyle(transforms.productB, isDragging)}
          className={`absolute z-10 max-h-[38%] max-w-[88%] cursor-grab select-none will-change-transform ${
            selectedLayer === "productB"
              ? "z-20 ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#f5f5f5]"
              : "hover:ring-1 hover:ring-zinc-300"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productBUrl}
            alt="Product B"
            draggable={false}
            className="pointer-events-none max-h-[280px] w-auto max-w-full object-contain drop-shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
