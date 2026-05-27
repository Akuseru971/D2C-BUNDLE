import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/constants";

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}

export function validateImageFile(file: File): ValidationResult {
  if (!file || file.size === 0) {
    return { valid: false, error: "Please select a valid image file." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image must be smaller than ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  const mimeOk = ALLOWED_MIME_TYPES.includes(
    file.type as (typeof ALLOWED_MIME_TYPES)[number],
  );
  const ext = getExtension(file.name);
  const extOk = ALLOWED_EXTENSIONS.includes(
    ext as (typeof ALLOWED_EXTENSIONS)[number],
  );

  if (!mimeOk && !extOk) {
    return {
      valid: false,
      error: "Only PNG, JPG, JPEG, and WEBP images are allowed.",
    };
  }

  return { valid: true };
}
