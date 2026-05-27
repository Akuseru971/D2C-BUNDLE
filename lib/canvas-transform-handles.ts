import type { LayerBounds } from "@/lib/bundle-layout";

export type TransformHandleId =
  | "scale-tl"
  | "scale-tr"
  | "scale-br"
  | "scale-bl"
  | "rotate";

export type TransformHandle = {
  id: TransformHandleId;
  x: number;
  y: number;
};

const HANDLE_RADIUS_RATIO = 0.014;
const ROTATE_STEM_RATIO = 0.055;

function localToCanvas(
  localX: number,
  localY: number,
  bounds: LayerBounds,
  rotationDegrees: number,
): { x: number; y: number } {
  const rad = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: bounds.centerX + localX * cos - localY * sin,
    y: bounds.centerY + localX * sin + localY * cos,
  };
}

export function getTransformHandles(
  bounds: LayerBounds,
  rotationDegrees: number,
  canvasSize: number,
): TransformHandle[] {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const stem = canvasSize * ROTATE_STEM_RATIO;

  const corners: { id: TransformHandleId; lx: number; ly: number }[] = [
    { id: "scale-tl", lx: -halfW, ly: -halfH },
    { id: "scale-tr", lx: halfW, ly: -halfH },
    { id: "scale-br", lx: halfW, ly: halfH },
    { id: "scale-bl", lx: -halfW, ly: halfH },
  ];

  const handles = corners.map(({ id, lx, ly }) => {
    const p = localToCanvas(lx, ly, bounds, rotationDegrees);
    return { id, x: p.x, y: p.y };
  });

  const rotateLocal = localToCanvas(0, -halfH - stem, bounds, rotationDegrees);
  handles.push({ id: "rotate", x: rotateLocal.x, y: rotateLocal.y });

  return handles;
}

export function getHandleHitRadius(canvasSize: number): number {
  return Math.max(12, canvasSize * HANDLE_RADIUS_RATIO * 2.2);
}

export function hitTestTransformHandle(
  x: number,
  y: number,
  bounds: LayerBounds,
  rotationDegrees: number,
  canvasSize: number,
): TransformHandleId | null {
  const radius = getHandleHitRadius(canvasSize);
  const radiusSq = radius * radius;

  const handles = getTransformHandles(bounds, rotationDegrees, canvasSize);
  const rotateHandle = handles.find((h) => h.id === "rotate");
  const cornerHandles = handles.filter((h) => h.id !== "rotate");

  if (rotateHandle) {
    const rdx = x - rotateHandle.x;
    const rdy = y - rotateHandle.y;
    if (rdx * rdx + rdy * rdy <= radiusSq * 1.15) {
      return "rotate";
    }
  }

  for (const handle of cornerHandles) {
    const dx = x - handle.x;
    const dy = y - handle.y;
    if (dx * dx + dy * dy <= radiusSq) {
      return handle.id;
    }
  }

  return null;
}

export function drawTransformHandles(
  ctx: CanvasRenderingContext2D,
  bounds: LayerBounds,
  rotationDegrees: number,
  canvasSize: number,
  activeHandle: TransformHandleId | null = null,
) {
  const halfH = bounds.height / 2;
  const stem = canvasSize * ROTATE_STEM_RATIO;
  const handleSize = Math.max(7, canvasSize * HANDLE_RADIUS_RATIO);

  const handles = getTransformHandles(bounds, rotationDegrees, canvasSize);

  ctx.save();
  ctx.translate(bounds.centerX, bounds.centerY);
  ctx.rotate((rotationDegrees * Math.PI) / 180);

  ctx.setLineDash([]);
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1, canvasSize * 0.0025);
  ctx.beginPath();
  ctx.moveTo(0, -halfH);
  ctx.lineTo(0, -halfH - stem);
  ctx.stroke();

  ctx.restore();

  for (const handle of handles) {
    const isActive = handle.id === activeHandle;
    const isRotate = handle.id === "rotate";
    const size = isRotate ? handleSize * 1.15 : handleSize;

    ctx.beginPath();
    if (isRotate) {
      ctx.arc(handle.x, handle.y, size, 0, Math.PI * 2);
    } else {
      ctx.rect(handle.x - size, handle.y - size, size * 2, size * 2);
    }
    ctx.fillStyle = isActive ? "#18181b" : "#ffffff";
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, canvasSize * 0.003);
    ctx.strokeStyle = "#18181b";
    ctx.stroke();
  }
}

/** CSS cursor for a scale corner given layer rotation (degrees). */
export function getScaleHandleCursor(
  handleId: TransformHandleId,
  rotationDegrees: number,
): string {
  const cornerIndex =
    handleId === "scale-tl"
      ? 0
      : handleId === "scale-tr"
        ? 1
        : handleId === "scale-br"
          ? 2
          : 3;
  const quarterTurns =
    Math.round((rotationDegrees + cornerIndex * 90) / 90) % 4;
  const cursors = ["nwse-resize", "nesw-resize", "nwse-resize", "nesw-resize"];
  return cursors[((quarterTurns % 4) + 4) % 4];
}

export function distanceFromCenter(
  x: number,
  y: number,
  bounds: LayerBounds,
): number {
  const dx = x - bounds.centerX;
  const dy = y - bounds.centerY;
  return Math.hypot(dx, dy);
}

export function angleFromCenter(
  x: number,
  y: number,
  bounds: LayerBounds,
): number {
  return Math.atan2(y - bounds.centerY, x - bounds.centerX);
}
