import { RENDER_QUALITY } from "@/lib/cutout-quality";

/** Enables high-quality image scaling on a 2D canvas context. */
export function configureHighQualityCanvas(
  ctx: CanvasRenderingContext2D,
): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = RENDER_QUALITY.imageSmoothingQuality;
}
