export const IMAGE_MODEL = "gpt-image-1";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per image

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;
