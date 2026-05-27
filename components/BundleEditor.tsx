"use client";

import { useCallback, useRef, useState } from "react";
import {
  clampPosition,
  clampScale,
  DEFAULT_TRANSFORMS,
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
};

function layerStyle(transform: BundleTransforms[LayerId]) {
  return {
    left: `${transform.x}%`,
    top: `${transform.y}%`,
    transform: `translate(-50%, -50%) scale(${transform.scale})`,
  };
}

export default function BundleEditor({
  productAUrl,
  productBUrl,
  transforms,
  onTransformsChange,
}: BundleEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerId>("productA");
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    layer: LayerId;
    startX: number;
    startY: number;
    origin: BundleTransforms[LayerId];
  } | null>(null);

  const updateLayer = useCallback(
    (layer: LayerId, patch: Partial<BundleTransforms[LayerId]>) => {
      onTransformsChange((prev) => ({
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
    [onTransformsChange],
  );

  const handlePointerDown = (
    event: React.PointerEvent,
    layer: LayerId,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedLayer(layer);
    setIsDragging(true);
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
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    dragRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    updateLayer(selectedLayer, {
      scale: transforms[selectedLayer].scale + delta,
    });
  };

  const zoomSelected = (direction: "in" | "out") => {
    const delta = direction === "in" ? SCALE_STEP : -SCALE_STEP;
    updateLayer(selectedLayer, {
      scale: transforms[selectedLayer].scale + delta,
    });
  };

  const resetLayout = () => {
    onTransformsChange(DEFAULT_TRANSFORMS);
    setSelectedLayer("productA");
  };

  const selected = transforms[selectedLayer];

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Adjust layout</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Drag each element to reposition. Select a layer, then zoom with the
            buttons or mouse wheel.
          </p>
        </div>
        <button
          type="button"
          onClick={resetLayout}
          className="self-start rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
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
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              selectedLayer === layer
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {LAYER_LABELS[layer]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
        <span className="text-xs font-medium text-zinc-600">
          Zoom — {LAYER_LABELS[selectedLayer]}:
        </span>
        <button
          type="button"
          onClick={() => zoomSelected("out")}
          disabled={selected.scale <= MIN_SCALE}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 disabled:opacity-40"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="min-w-12 text-center text-xs tabular-nums text-zinc-600">
          {Math.round(selected.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomSelected("in")}
          disabled={selected.scale >= MAX_SCALE}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 disabled:opacity-40"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      <div
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerMove={isDragging ? handlePointerMove : undefined}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-[#f5f5f5] touch-none ${
          isDragging ? "cursor-grabbing" : "cursor-default"
        }`}
      >
        <div
          onPointerDown={(e) => handlePointerDown(e, "productA")}
          style={layerStyle(transforms.productA)}
          className={`absolute z-10 max-h-[34%] max-w-[85%] cursor-grab select-none ${
            selectedLayer === "productA"
              ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#f5f5f5]"
              : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productAUrl}
            alt="Product A"
            draggable={false}
            className="max-h-[260px] w-auto max-w-full object-contain drop-shadow-md pointer-events-none"
          />
        </div>

        <div
          onPointerDown={(e) => handlePointerDown(e, "plus")}
          style={layerStyle(transforms.plus)}
          className={`absolute z-20 flex cursor-grab select-none items-center justify-center ${
            selectedLayer === "plus"
              ? "rounded-full ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#f5f5f5]"
              : ""
          }`}
        >
          <div
            className="flex items-center justify-center rounded-full bg-zinc-900 shadow-md pointer-events-none"
            style={{
              width: `${72 * transforms.plus.scale}px`,
              height: `${72 * transforms.plus.scale}px`,
            }}
          >
            <span
              className="font-light text-white"
              style={{ fontSize: `${32 * transforms.plus.scale}px`, lineHeight: 1 }}
            >
              +
            </span>
          </div>
        </div>

        <div
          onPointerDown={(e) => handlePointerDown(e, "productB")}
          style={layerStyle(transforms.productB)}
          className={`absolute z-10 max-h-[34%] max-w-[85%] cursor-grab select-none ${
            selectedLayer === "productB"
              ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#f5f5f5]"
              : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productBUrl}
            alt="Product B"
            draggable={false}
            className="max-h-[260px] w-auto max-w-full object-contain drop-shadow-md pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
