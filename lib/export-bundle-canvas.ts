import {
  type BundleTransforms,
  EXPORT_SIZE,
  type LayerId,
} from "@/lib/bundle-editor";

const BACKGROUND = "#f5f5f5";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for export."));
    img.src = src;
  });
}

function drawProductLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  transform: BundleTransforms[LayerId],
  maxHeightRatio: number,
) {
  const centerX = (transform.x / 100) * EXPORT_SIZE;
  const centerY = (transform.y / 100) * EXPORT_SIZE;
  const maxHeight = EXPORT_SIZE * maxHeightRatio * transform.scale;
  const ratio = img.width / img.height;
  let drawHeight = maxHeight;
  let drawWidth = drawHeight * ratio;

  const maxWidth = EXPORT_SIZE * 0.85 * transform.scale;
  if (drawWidth > maxWidth) {
    drawWidth = maxWidth;
    drawHeight = drawWidth / ratio;
  }

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(
    img,
    centerX - drawWidth / 2,
    centerY - drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
}

function drawPlusSymbol(
  ctx: CanvasRenderingContext2D,
  transform: BundleTransforms["plus"],
) {
  const centerX = (transform.x / 100) * EXPORT_SIZE;
  const centerY = (transform.y / 100) * EXPORT_SIZE;
  const radius = EXPORT_SIZE * 0.045 * transform.scale;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#0a0a0a";
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(2, radius * 0.14);
  ctx.lineCap = "round";

  const arm = radius * 0.42;
  ctx.beginPath();
  ctx.moveTo(centerX - arm, centerY);
  ctx.lineTo(centerX + arm, centerY);
  ctx.moveTo(centerX, centerY - arm);
  ctx.lineTo(centerX, centerY + arm);
  ctx.stroke();
  ctx.restore();
}

export async function renderBundleToDataUrl(
  productAUrl: string,
  productBUrl: string,
  transforms: BundleTransforms,
): Promise<string> {
  const [imgA, imgB] = await Promise.all([
    loadImage(productAUrl),
    loadImage(productBUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

  drawProductLayer(ctx, imgA, transforms.productA, 0.34);
  drawPlusSymbol(ctx, transforms.plus);
  drawProductLayer(ctx, imgB, transforms.productB, 0.34);

  return canvas.toDataURL("image/png");
}
