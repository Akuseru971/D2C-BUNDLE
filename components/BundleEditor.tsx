"use client";

import { useState } from "react";
import BundleCanvasView from "@/components/BundleCanvasView";
import {
  CANVAS_CENTER,
  getActiveProductLayers,
  getEditorLayerOrder,
  LAYER_LABELS,
  MAX_SCALE,
  MIN_SCALE,
  MIN_SCALE_LOGO,
  MAX_ROTATION,
  MIN_ROTATION,
  ROTATION_BUTTON_STEP,
  ROTATION_STEP,
  SCALE_STEP,
  type BundleTransforms,
  type LayerId,
  applyRotation,
  clampScale,
} from "@/lib/bundle-editor";

type BundleEditorProps = {
  productAUrl?: string | null;
  productBUrl?: string | null;
  productCUrl?: string | null;
  logoUrl?: string | null;
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
  productAUrl = null,
  productBUrl = null,
  productCUrl = null,
  logoUrl = null,
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
  const activeProducts = getActiveProductLayers(
    productAUrl,
    productBUrl,
    productCUrl,
  );
  const hasLogo = Boolean(logoUrl);
  const layerOrder = getEditorLayerOrder(activeProducts, hasLogo);
  const [selectedLayer, setSelectedLayer] = useState<LayerId>(
    () => layerOrder[0] ?? "productA",
  );

  const activeLayer = layerOrder.includes(selectedLayer)
    ? selectedLayer
    : (layerOrder[0] ?? "productA");

  const minScale = activeLayer === "logo" ? MIN_SCALE_LOGO : MIN_SCALE;

  const updateLayerScale = (value: number) => {
    onTransformsChange((prev) => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        scale: clampScale(value, activeLayer),
      },
    }));
  };

  const zoomSelected = (direction: "in" | "out") => {
    onBeginGesture();
    const delta = direction === "in" ? SCALE_STEP : -SCALE_STEP;
    onTransformsChange((prev) => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        scale: clampScale(prev[activeLayer].scale + delta, activeLayer),
      },
    }));
    onCommit();
  };

  const centerSelected = () => {
    onBeginGesture();
    onTransformsChange((prev) => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        x: CANVAS_CENTER.x,
        y: CANVAS_CENTER.y,
      },
    }));
    onCommit();
  };

  const updateLayerRotation = (value: number) => {
    onTransformsChange((prev) => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        rotation: applyRotation(value),
      },
    }));
  };

  const rotateSelected = (direction: "left" | "right") => {
    onBeginGesture();
    const delta =
      direction === "right" ? ROTATION_BUTTON_STEP : -ROTATION_BUTTON_STEP;
    onTransformsChange((prev) => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        rotation: applyRotation(prev[activeLayer].rotation + delta),
      },
    }));
    onCommit();
  };

  const resetRotation = () => {
    onBeginGesture();
    onTransformsChange((prev) => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        rotation: 0,
      },
    }));
    onCommit();
  };

  const selected = transforms[activeLayer];

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
          onClick={centerSelected}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Center
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
        {layerOrder.map((layer) => (
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

      {!hasLogo && (
        <p className="text-xs text-zinc-500">
          Upload a logo above to enable the Logo layer in the editor.
        </p>
      )}

      <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600">
            Scale — {LAYER_LABELS[activeLayer]}
          </span>
          <span className="text-xs tabular-nums text-zinc-500">
            {Math.round(selected.scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => zoomSelected("out")}
            disabled={selected.scale <= minScale}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium disabled:opacity-40"
            aria-label="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            min={minScale}
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

      <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600">
            Rotation — {LAYER_LABELS[activeLayer]} (snaps at 0° / ±90°)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums text-zinc-500">
              {Math.round(selected.rotation)}°
            </span>
            {selected.rotation !== 0 && (
              <button
                type="button"
                onClick={resetRotation}
                className="text-[10px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => rotateSelected("left")}
            disabled={selected.rotation <= MIN_ROTATION}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium disabled:opacity-40"
            aria-label="Rotate counter-clockwise"
            title="−15°"
          >
            ↺
          </button>
          <input
            type="range"
            min={MIN_ROTATION}
            max={MAX_ROTATION}
            step={ROTATION_STEP}
            value={selected.rotation}
            onPointerDown={onBeginGesture}
            onChange={(e) => updateLayerRotation(parseFloat(e.target.value))}
            onPointerUp={onCommit}
            onTouchEnd={onCommit}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
          />
          <button
            type="button"
            onClick={() => rotateSelected("right")}
            disabled={selected.rotation >= MAX_ROTATION}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium disabled:opacity-40"
            aria-label="Rotate clockwise"
            title="+15°"
          >
            ↻
          </button>
        </div>
      </div>

      <BundleCanvasView
        productAUrl={productAUrl}
        productBUrl={productBUrl}
        productCUrl={productCUrl}
        logoUrl={logoUrl}
        transforms={transforms}
        interactive
        selectedLayer={activeLayer}
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
