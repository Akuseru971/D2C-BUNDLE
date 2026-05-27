const FIDELITY = `Product fidelity requirements:
- Preserve the exact original appearance of every product.
- Do not alter their real shapes, proportions, colors, materials, textures, metallic reflections, handles, buttons, logos, or visible inscriptions.
- Do not invent product details or make products generic.
- Do not make visible inscriptions intentionally unreadable.
- Do not beautify products in a way that changes their real design.
- Every product must be fully visible, sharp, clean, and not cropped.
- Never render products inside white rectangles or marketplace "card" frames.`;

const BACKGROUND = `- Single uniform very light grey background (#f5f5f5) — perfectly flat.
- Products directly on this background with NO white squares, NO boxes, NO rectangular padding around products.
- Remove white or off-white backdrops from source cutouts.
- Subtle realistic shadows under products only.
- No promotional badge, logo overlay, or corner graphics.
- No plus symbol. No "+" sign. No circular plus badge. No bundle "+" icon.
- No text, slogans, or decorative elements.
- No packaging.`;

export function buildBundlePrompt(productCount: 2 | 3): string {
  if (productCount === 3) {
    return `Create a square 1:1 e-commerce bundle image using the three provided product images as strict visual references.

Image order: Product A (first image), Product B (second image), Product C (third image).

Composition:
- Product A at the top.
- Product B in the middle.
- Product C at the bottom.
- CRITICAL: All three products must NEVER overlap. Keep clear vertical spacing with visible background between each item.
- Do NOT add a plus symbol or any separator icon between products.
${BACKGROUND}

${FIDELITY}

The final image must be sober, premium, marketplace-ready, faithful to the original products, and not misleading.`;
  }

  return `Create a square 1:1 e-commerce bundle image using the two provided product images as strict visual references.

Image order: Product A (first image), Product B (second image).

Composition:
- Product A at the top.
- Product B at the bottom.
- CRITICAL: Both products must NEVER overlap. Keep clear vertical spacing with visible background between them.
- Do NOT add a plus symbol or any separator icon between products.
${BACKGROUND}

${FIDELITY}

The final image must be sober, premium, marketplace-ready, faithful to the original products, and not misleading.`;
}
