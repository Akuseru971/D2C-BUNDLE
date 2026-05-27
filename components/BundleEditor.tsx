"use client";

import { useState } from "react";
import BundleCanvasView from "@/components/BundleCanvasView";
import {
  LAYER_LABELS,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  type BundleTransforms,
  type LayerId,
  clampScale,
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
  const [selectedLayer, setSelectedLayer] = useState<LayerId>("productA");

  const updateLayerScale = (value: number) => {
    onTransformsChange((prev) => ({
      ...prev,
      [selectedLayer]: {
        ...prev[selectedLayer],
        scale: clampScale(value),
      },
    }));
  };

  const zoomSelected = (direction: "in" | "out") => {
    onBeginGesture();
    const delta = direction === "in" ? SCALE_STEP : -SCALE_STEP;
    onTransformsChange((prev) => ({
      ...prev,
      [selectedLayer]: {
        ...prev[selectedLayer],
        scale: clampScale(prev[selectedLayer].scale + delta),
      },
    }));
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
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium disabled:opacity-40"
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
            onChange={(e) => updateLayerScale(parseFloat(e.target.value))}
            onPointerUp={onCommit}
            onTouchEnd={onCommit}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
          />
          <button
            type="button"
            onClick={() => zoomSelected("in")}
            disabled={selected.scale >= MAX_SCALE}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium disabled:opacity-40"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <BundleCanvasView
        productAUrl={productAUrl}
        productBUrl={productBUrl}
        transforms={transforms}
        interactive
        selectedLayer={selectedLayer}
        onSelectLayer={setSelectedLayer}
        onTransformsChange={onTransformsChange}
        onBeginGesture={onBeginGesture}
        onCommit={onCommit}
        onInteractingChange={onInteractingChange}
        borderStyle="dashed"
      />
    </div>
  );
}
