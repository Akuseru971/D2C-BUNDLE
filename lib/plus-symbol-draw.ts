/** Draw a premium plus badge — shared by canvas export and live preview. */
export function drawPremiumPlus(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) {
  ctx.save();

  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = radius * 0.55;
  ctx.shadowOffsetY = radius * 0.12;

  const gradient = ctx.createRadialGradient(
    centerX - radius * 0.25,
    centerY - radius * 0.25,
    radius * 0.1,
    centerX,
    centerY,
    radius,
  );
  gradient.addColorStop(0, "#2a2a2a");
  gradient.addColorStop(1, "#0a0a0a");

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = Math.max(1, radius * 0.04);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(2.5, radius * 0.11);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const arm = radius * 0.38;
  ctx.beginPath();
  ctx.moveTo(centerX - arm, centerY);
  ctx.lineTo(centerX + arm, centerY);
  ctx.moveTo(centerX, centerY - arm);
  ctx.lineTo(centerX, centerY + arm);
  ctx.stroke();

  ctx.restore();
}

export function plusRadiusForCanvas(
  canvasSize: number,
  scale: number,
): number {
  return canvasSize * 0.048 * scale;
}
