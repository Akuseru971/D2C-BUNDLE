"use client";

import { useMemo, useState } from "react";
import BundleCanvasView from "@/components/BundleCanvasView";
import {
  CANVAS_CENTER,
  getActiveProductLayers,
  getEditorLayerOrder,
  isProductLayer,
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
  backgroundUrl?: string | null;
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
  backgroundUrl = null,
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
  const hasBackground = Boolean(backgroundUrl);
  const layerOrder = getEditorLayerOrder(
    activeProducts,
    hasLogo,
    hasBackground,
  );
  const [selectedLayer, setSelectedLayer] = useState<LayerId>(
    () => layerOrder[0] ?? "productA",
  );
  const [lockedLayer, setLockedLayer] = useState<LayerId | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<LayerId[]>(() =>
    layerOrder[0] ? [layerOrder[0]] : [],
  );

  const activeLayer = layerOrder.includes(selectedLayer)
    ? selectedLayer
    : (layerOrder[0] ?? "productA");

  const effectiveLockedLayer =
    lockedLayer && layerOrder.includes(lockedLayer) ? lockedLayer : null;

  const validSelectedLayers = useMemo(() => {
    const next = selectedLayers.filter((layer) => layerOrder.includes(layer));
    return next.length > 0 ? next : layerOrder[0] ? [layerOrder[0]] : [];
  }, [selectedLayers, layerOrder]);

  const primaryLayer = effectiveLockedLayer ?? activeLayer;

  const handleTabSelect = (layer: LayerId) => {
    setSelectedLayer(layer);
    setSelectedLayers([layer]);
    setLockedLayer(isProductLayer(layer) ? layer : null);
  };

  const handleCanvasSelect = (layer: LayerId, options: { additive: boolean }) => {
    if (options.additive) {
      setSelectedLayers((prev) => {
        const next = prev.includes(layer)
          ? prev.filter((item) => item !== layer)
          : [...prev, layer];
        if (next.length > 0) return next;
        return effectiveLockedLayer ? [effectiveLockedLayer] : [layer];
      });
      return;
    }

    if (!effectiveLockedLayer) {
      setSelectedLayer(layer);
      setSelectedLayers([layer]);
    }
  };

  const minScale = primaryLayer === "logo" ? MIN_SCALE_LOGO : MIN_SCALE;

  const updateLayerScale = (value: number) => {
    onTransformsChange((prev) => ({
      ...prev,
      [primaryLayer]: {
        ...prev[primaryLayer],
        scale: clampScale(value, primaryLayer),
      },
    }));
  };

  const zoomSelected = (direction: "in" | "out") => {
    onBeginGesture();
    const delta = direction === "in" ? SCALE_STEP : -SCALE_STEP;
    onTransformsChange((prev) => ({
      ...prev,
      [primaryLayer]: {
        ...prev[primaryLayer],
        scale: clampScale(prev[primaryLayer].scale + delta, primaryLayer),
      },
    }));
    onCommit();
  };

  const centerSelected = () => {
    onBeginGesture();
    onTransformsChange((prev) => ({
      ...prev,
      [primaryLayer]: {
        ...prev[primaryLayer],
        x: CANVAS_CENTER.x,
        y: CANVAS_CENTER.y,
      },
    }));
    onCommit();
  };

  const updateLayerRotation = (value: number) => {
    onTransformsChange((prev) => ({
      ...prev,
      [primaryLayer]: {
        ...prev[primaryLayer],
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
      [primaryLayer]: {
        ...prev[primaryLayer],
        rotation: applyRotation(prev[primaryLayer].rotation + delta),
      },
    }));
    onCommit();
  };

  const resetRotation = () => {
    onBeginGesture();
    onTransformsChange((prev) => ({
      ...prev,
      [primaryLayer]: {
        ...prev[primaryLayer],
        rotation: 0,
      },
    }));
    onCommit();
  };

  const selected = transforms[primaryLayer];

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
            onClick={() => handleTabSelect(layer)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
              primaryLayer === layer
                ? "bg-zinc-900 text-white shadow-md"
                : selectedLayers.includes(layer)
                  ? "border border-zinc-900 bg-zinc-100 text-zinc-900"
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
            Scale — {LAYER_LABELS[primaryLayer]}
            {effectiveLockedLayer && (
              <span className="ml-1 text-[10px] font-normal text-zinc-400">
                (locked)
              </span>
            )}
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
            Rotation — {LAYER_LABELS[primaryLayer]} (snaps at 0° / ±90°)
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
        backgroundUrl={backgroundUrl}
        transforms={transforms}
        interactive
        primaryLayer={primaryLayer}
        selectedLayers={validSelectedLayers}
        selectionLocked={effectiveLockedLayer !== null}
        onSelectLayer={handleCanvasSelect}
        onTransformsChange={onTransformsChange}
        onBeginGesture={onBeginGesture}
        onCommit={onCommit}
        onInteractingChange={onInteractingChange}
        borderStyle="dashed"
      />
    </div>
  );
}
