"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampPosition,
  applyRotation,
  clampScale,
  SCALE_STEP,
  type BundleTransforms,
  type LayerId,
  type LayerTransform,
} from "@/lib/bundle-editor";
import {
  angleFromCenter,
  distanceFromCenter,
  getScaleHandleCursor,
  hitTestTransformHandle,
  type TransformHandleId,
} from "@/lib/canvas-transform-handles";
import { drawOrientedSelection } from "@/lib/canvas-layer-draw";
import {
  getLayerBounds,
  pickLayerAtPoint,
  pointInRotatedBounds,
} from "@/lib/bundle-layout";
import type { BundleImageSet } from "@/lib/bundle-layout";
import { preloadBundleImages } from "@/lib/bundle-image-cache";
import { renderBundleCanvas } from "@/lib/export-bundle-canvas";

type BundleCanvasViewProps = {
  productAUrl?: string | null;
  productBUrl?: string | null;
  productCUrl?: string | null;
  logoUrl?: string | null;
  backgroundUrl?: string | null;
  transforms: BundleTransforms;
  interactive?: boolean;
  primaryLayer?: LayerId;
  selectedLayers?: LayerId[];
  selectionLocked?: boolean;
  onSelectLayer?: (layer: LayerId, options: { additive: boolean }) => void;
  onTransformsChange?: (
    update: BundleTransforms | ((prev: BundleTransforms) => BundleTransforms),
  ) => void;
  onBeginGesture?: () => void;
  onCommit?: () => void;
  onInteractingChange?: (interacting: boolean) => void;
  className?: string;
  borderStyle?: "solid" | "dashed";
};

type GestureMode = "move" | "scale" | "rotate";

type DragState = {
  layers: LayerId[];
  transformLayer: LayerId;
  mode: GestureMode;
  startClientX: number;
  startClientY: number;
  startCanvasX: number;
  startCanvasY: number;
  origins: Partial<Record<LayerId, LayerTransform>>;
  origin: LayerTransform;
  startDistFromCenter: number;
  startAngleRad: number;
  handleId: TransformHandleId | null;
};

function getCanvasPoint(
  event: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
): { x: number; y: number; size: number } {
  const rect = canvas.getBoundingClientRect();
  const size = rect.width;
  return {
    x: ((event.clientX - rect.left) / rect.width) * size,
    y: ((event.clientY - rect.top) / rect.height) * size,
    size,
  };
}

export default function BundleCanvasView({
  productAUrl = null,
  productBUrl = null,
  productCUrl = null,
  logoUrl = null,
  backgroundUrl = null,
  transforms,
  interactive = false,
  primaryLayer = "productA",
  selectedLayers = ["productA"],
  selectionLocked = false,
  onSelectLayer,
  onTransformsChange,
  onBeginGesture,
  onCommit,
  onInteractingChange,
  className = "",
  borderStyle = "solid",
}: BundleCanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<BundleImageSet | null>(null);
  const transformsRef = useRef(transforms);
  const primaryRef = useRef(primaryLayer);
  const selectedLayersRef = useRef(selectedLayers);
  const selectionLockedRef = useRef(selectionLocked);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const handleHighlightRef = useRef<TransformHandleId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<TransformHandleId | null>(
    null,
  );

  useEffect(() => {
    transformsRef.current = transforms;
  }, [transforms]);

  useEffect(() => {
    primaryRef.current = primaryLayer;
  }, [primaryLayer]);

  useEffect(() => {
    selectedLayersRef.current = selectedLayers;
  }, [selectedLayers]);

  useEffect(() => {
    selectionLockedRef.current = selectionLocked;
  }, [selectionLocked]);

  const updateCanvasCursor = useCallback(
    (
      handle: TransformHandleId | null,
      mode: GestureMode | null,
      rotation: number,
    ) => {
      const canvas = canvasRef.current;
      if (!canvas || !interactive) return;

      if (mode === "move" || (mode === "rotate" && isDragging)) {
        canvas.style.cursor = "grabbing";
        return;
      }
      if (mode === "scale" && handle) {
        canvas.style.cursor = getScaleHandleCursor(handle, rotation);
        return;
      }
      if (mode === "rotate") {
        canvas.style.cursor = "grab";
        return;
      }
      if (handle === "rotate") {
        canvas.style.cursor = "grab";
        return;
      }
      if (handle?.startsWith("scale")) {
        canvas.style.cursor = getScaleHandleCursor(handle, rotation);
        return;
      }
      canvas.style.cursor = "default";
    },
    [interactive, isDragging],
  );

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

    if (interactive) {
      const layers = selectedLayersRef.current;
      const primary = primaryRef.current;
      for (const layer of layers) {
        const bounds = getLayerBounds(layer, images, t, size);
        if (!bounds) continue;
        const isPrimary = layer === primary;
        drawOrientedSelection(
          ctx,
          bounds,
          t[layer].rotation,
          size,
          isPrimary ? handleHighlightRef.current : null,
          isPrimary,
        );
      }
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
    preloadBundleImages(
      productAUrl,
      productBUrl,
      productCUrl,
      logoUrl,
      backgroundUrl,
    ).then(
      (images) => {
        if (!cancelled) {
          imagesRef.current = images;
          schedulePaint();
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [productAUrl, productBUrl, productCUrl, logoUrl, backgroundUrl, schedulePaint]);

  useEffect(() => {
    schedulePaint();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [transforms, primaryLayer, selectedLayers, hoveredHandle, schedulePaint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => schedulePaint());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [schedulePaint]);

  const resolveHoverHandle = useCallback(
    (canvasX: number, canvasY: number, size: number): TransformHandleId | null => {
      const images = imagesRef.current;
      const layer = primaryRef.current;
      if (!images || !layer) return null;
      const bounds = getLayerBounds(
        layer,
        images,
        transformsRef.current,
        size,
      );
      if (!bounds) return null;
      return hitTestTransformHandle(
        canvasX,
        canvasY,
        bounds,
        transformsRef.current[layer].rotation,
        size,
      );
    },
    [],
  );

  const findSelectedLayerAtPoint = useCallback(
    (
      canvasX: number,
      canvasY: number,
      images: BundleImageSet,
      size: number,
      layers: LayerId[],
    ): LayerId | null => {
      for (const layer of [...layers].reverse()) {
        const bounds = getLayerBounds(
          layer,
          images,
          transformsRef.current,
          size,
        );
        if (
          bounds &&
          pointInRotatedBounds(
            canvasX,
            canvasY,
            bounds,
            transformsRef.current[layer].rotation,
          )
        ) {
          return layer;
        }
      }
      return null;
    },
    [],
  );

  const handlePointerDown = (event: React.PointerEvent) => {
    if (!interactive || !onTransformsChange) return;
    const images = imagesRef.current;
    const canvas = canvasRef.current;
    if (!images || !canvas) return;

    const { x: canvasX, y: canvasY, size } = getCanvasPoint(event, canvas);
    const additive = event.ctrlKey || event.metaKey;
    const primary = primaryRef.current;
    const selected = selectedLayersRef.current;
    const locked = selectionLockedRef.current;

    const layerAtPoint = pickLayerAtPoint(
      canvasX,
      canvasY,
      images,
      transformsRef.current,
      size,
    );

    const primaryBounds = getLayerBounds(
      primary,
      images,
      transformsRef.current,
      size,
    );

    let handleId: TransformHandleId | null = null;
    if (primaryBounds) {
      handleId = hitTestTransformHandle(
        canvasX,
        canvasY,
        primaryBounds,
        transformsRef.current[primary].rotation,
        size,
      );
    }

    if (additive && layerAtPoint && !handleId) {
      onSelectLayer?.(layerAtPoint, { additive: true });
      schedulePaint();
      return;
    }

    let layer = primary;
    let mode: GestureMode = "move";

    if (handleId === "rotate") {
      mode = "rotate";
      layer = primary;
    } else if (handleId?.startsWith("scale")) {
      mode = "scale";
      layer = primary;
    } else if (locked) {
      layer = primary;
      mode = "move";
    } else {
      const hitSelected = findSelectedLayerAtPoint(
        canvasX,
        canvasY,
        images,
        size,
        selected,
      );

      if (hitSelected) {
        layer = hitSelected;
      } else if (layerAtPoint) {
        layer = layerAtPoint;
        onSelectLayer?.(layerAtPoint, { additive: false });
      } else {
        return;
      }

      const bounds = getLayerBounds(
        layer,
        images,
        transformsRef.current,
        size,
      );
      if (
        !bounds ||
        !pointInRotatedBounds(
          canvasX,
          canvasY,
          bounds,
          transformsRef.current[layer].rotation,
        )
      ) {
        return;
      }
      mode = "move";
    }

    const bounds = getLayerBounds(
      layer,
      images,
      transformsRef.current,
      size,
    );
    if (!bounds) return;

    const moveLayers =
      mode === "move"
        ? selected.length > 1 && (locked || selected.includes(layer))
          ? selected
          : [layer]
        : [layer];

    const origins: Partial<Record<LayerId, LayerTransform>> = {};
    for (const moveLayer of moveLayers) {
      origins[moveLayer] = { ...transformsRef.current[moveLayer] };
    }

    onBeginGesture?.();
    onInteractingChange?.(true);
    setIsDragging(true);
    handleHighlightRef.current = handleId;

    const origin = { ...transformsRef.current[layer] };
    dragRef.current = {
      layers: moveLayers,
      transformLayer: layer,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCanvasX: canvasX,
      startCanvasY: canvasY,
      origins,
      origin,
      startDistFromCenter: distanceFromCenter(canvasX, canvasY, bounds),
      startAngleRad: angleFromCenter(canvasX, canvasY, bounds),
      handleId,
    };

    updateCanvasCursor(
      handleId,
      mode,
      transformsRef.current[layer].rotation,
    );
    canvas.setPointerCapture(event.pointerId);
    schedulePaint();
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    if (!canvas || !images) return;

    const { x: canvasX, y: canvasY, size } = getCanvasPoint(event, canvas);
    const drag = dragRef.current;

    if (!interactive || !onTransformsChange || !drag) {
      if (!interactive) return;
      const handle = resolveHoverHandle(canvasX, canvasY, size);
      setHoveredHandle(handle);
      handleHighlightRef.current = handle;
      const layer = primaryRef.current;
      updateCanvasCursor(
        handle,
        null,
        transformsRef.current[layer].rotation,
      );
      schedulePaint();
      return;
    }

    const bounds = getLayerBounds(
      drag.transformLayer,
      images,
      {
        ...transformsRef.current,
        [drag.transformLayer]: drag.origin,
      },
      size,
    );
    if (!bounds) return;

    if (drag.mode === "scale") {
      const dist = distanceFromCenter(canvasX, canvasY, bounds);
      const ratio =
        drag.startDistFromCenter > 0 ? dist / drag.startDistFromCenter : 1;
      onTransformsChange((prev) => ({
        ...prev,
        [drag.transformLayer]: {
          ...drag.origin,
          scale: clampScale(drag.origin.scale * ratio, drag.transformLayer),
        },
      }));
    } else if (drag.mode === "rotate") {
      const angle = angleFromCenter(canvasX, canvasY, bounds);
      const deltaDeg = ((angle - drag.startAngleRad) * 180) / Math.PI;
      onTransformsChange((prev) => ({
        ...prev,
        [drag.transformLayer]: {
          ...drag.origin,
          rotation: applyRotation(drag.origin.rotation + deltaDeg),
        },
      }));
    } else {
      const rect = canvas.getBoundingClientRect();
      const deltaX = ((event.clientX - drag.startClientX) / rect.width) * 100;
      const deltaY = ((event.clientY - drag.startClientY) / rect.height) * 100;
      onTransformsChange((prev) => {
        const next = { ...prev };
        for (const moveLayer of drag.layers) {
          const layerOrigin = drag.origins[moveLayer];
          if (!layerOrigin) continue;
          next[moveLayer] = {
            ...layerOrigin,
            x: clampPosition(layerOrigin.x + deltaX),
            y: clampPosition(layerOrigin.y + deltaY),
          };
        }
        return next;
      });
    }
    schedulePaint();
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    const hadInteraction = dragRef.current !== null;
    dragRef.current = null;
    setIsDragging(false);
    handleHighlightRef.current = hoveredHandle;
    onInteractingChange?.(false);
    if (hadInteraction) onCommit?.();

    if (canvas) {
      const { x, y, size } = getCanvasPoint(event, canvas);
      const handle = resolveHoverHandle(x, y, size);
      setHoveredHandle(handle);
      handleHighlightRef.current = handle;
      updateCanvasCursor(
        handle,
        null,
        transformsRef.current[primaryRef.current].rotation,
      );
    }
    schedulePaint();
  };

  const handlePointerLeave = () => {
    if (dragRef.current) return;
    setHoveredHandle(null);
    handleHighlightRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "default";
    schedulePaint();
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!interactive || !onTransformsChange) return;
    event.preventDefault();
    onBeginGesture?.();
    const layer = primaryRef.current;
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

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white ${
        borderStyle === "dashed" ? "border-dashed" : ""
      } ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={interactive ? handlePointerLeave : undefined}
        onWheel={interactive ? handleWheel : undefined}
        className="aspect-square w-full touch-none"
        aria-label={interactive ? "Interactive bundle editor" : "Bundle preview"}
      />
      {interactive && (
        <p className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-zinc-500 shadow-sm backdrop-blur">
          Ctrl+click: multi-select · Product tab locks · Corners: resize
        </p>
      )}
    </div>
  );
}
