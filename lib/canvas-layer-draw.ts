import type { LayerBounds } from "@/lib/bundle-layout";
import { configureHighQualityCanvas } from "@/lib/canvas-render-quality";
import { RENDER_QUALITY } from "@/lib/cutout-quality";
import {
  drawTransformHandles,
  type TransformHandleId,
} from "@/lib/canvas-transform-handles";

export function drawOrientedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  bounds: LayerBounds,
  rotationDegrees: number,
  options?: { shadow?: boolean; canvasSize?: number },
) {
  configureHighQualityCanvas(ctx);
  ctx.save();

  if (options?.shadow && options.canvasSize) {
    const canvasSize = options.canvasSize;
    ctx.shadowColor = `rgba(0, 0, 0, ${RENDER_QUALITY.productShadowOpacity})`;
    ctx.shadowBlur = canvasSize * RENDER_QUALITY.productShadowBlurRatio;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = canvasSize * RENDER_QUALITY.productShadowOffsetRatio;
  }

  ctx.translate(bounds.centerX, bounds.centerY);
  ctx.rotate((rotationDegrees * Math.PI) / 180);
  ctx.drawImage(
    img,
    -bounds.width / 2,
    -bounds.height / 2,
    bounds.width,
    bounds.height,
  );
  ctx.restore();
}

export function drawOrientedSelectionRing(
  ctx: CanvasRenderingContext2D,
  bounds: LayerBounds,
  rotationDegrees: number,
  canvasSize: number,
) {
  const pad = canvasSize * 0.008;
  ctx.save();
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1.5, canvasSize * 0.004);
  ctx.setLineDash([canvasSize * 0.012, canvasSize * 0.008]);
  ctx.translate(bounds.centerX, bounds.centerY);
  ctx.rotate((rotationDegrees * Math.PI) / 180);
  ctx.strokeRect(
    -bounds.width / 2 - pad,
    -bounds.height / 2 - pad,
    bounds.width + pad * 2,
    bounds.height + pad * 2,
  );
  ctx.restore();
}

export function drawOrientedSelection(
  ctx: CanvasRenderingContext2D,
  bounds: LayerBounds,
  rotationDegrees: number,
  canvasSize: number,
  activeHandle: TransformHandleId | null = null,
  showHandles = true,
) {
  drawOrientedSelectionRing(ctx, bounds, rotationDegrees, canvasSize);
  if (showHandles) {
    drawTransformHandles(ctx, bounds, rotationDegrees, canvasSize, activeHandle);
  }
}
