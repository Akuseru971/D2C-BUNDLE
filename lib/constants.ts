export const IMAGE_MODEL = "gpt-image-1";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per image

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

export const BUNDLE_PROMPT = `Create a square 1:1 e-commerce bundle image using the two provided product images as strict visual references.

The first provided image is Product A. The second provided image is Product B.

Composition:
- Product A at the top.
- Product B at the bottom.
- A luxury, premium centered plus symbol between them — this is a key visual element.
- Plus symbol design (must look high-end and marketplace-polished):
  - Perfectly circular matte black badge with a subtle radial depth (soft highlight, not flat).
  - Crisp, balanced white plus sign centered inside the circle — clean geometric lines, equal arm length, rounded line caps.
  - Proportions: the circle should be compact but clearly visible; the plus arms should not touch the circle edge (comfortable padding).
  - Very subtle soft drop shadow under the badge only — refined, not heavy.
  - No glow, no gradient on the plus itself, no 3D extrusion, no emoji style.
  - Must read instantly as a premium “bundle” indicator on Amazon-style marketplaces.
- Neutral white or very light grey background.
- Subtle realistic shadows.
- No text.
- No slogans.
- No badges.
- No decorative elements.
- No packaging.

Product fidelity requirements:
- Preserve the exact original appearance of both products.
- Do not alter their real shapes.
- Do not alter proportions.
- Do not alter colors.
- Do not alter materials.
- Do not alter textures.
- Do not alter metallic reflections.
- Do not alter handles.
- Do not alter buttons.
- Do not alter logos.
- Do not alter visible inscriptions.
- Do not invent product details.
- Do not make the products generic.
- Do not make visible inscriptions intentionally unreadable.
- Do not beautify the products in a way that changes their real design.
- Both products must be fully visible, sharp, clean, and not cropped.

The final image must look like a sober, premium, marketplace-ready bundle image, faithful to the original products and not misleading to consumers.`;
