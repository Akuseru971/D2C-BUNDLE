"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useProcessedImageUrl } from "@/hooks/useProcessedProductUrl";
import {
  MAX_WHITE_EXPAND_PX,
  WHITE_EXPAND_STEP_PX,
} from "@/lib/image-processing-options";
import { validateImageFile } from "@/lib/validation";

type ImageKind = "product" | "logo" | "background";

type ImageUploadBoxProps = {
  label: string;
  file: File | null;
  previewUrl: string | null;
  onFileChange: (file: File | null, previewUrl: string | null) => void;
  onError: (message: string | null) => void;
  imageKind?: ImageKind;
  cutoutEnabled?: boolean;
  onCutoutChange?: (enabled: boolean) => void;
  whiteExpandPx?: number;
  onWhiteExpandChange?: (px: number) => void;
};

export default function ImageUploadBox({
  label,
  file,
  previewUrl,
  onFileChange,
  onError,
  imageKind = "product",
  cutoutEnabled = true,
  onCutoutChange,
  whiteExpandPx = 0,
  onWhiteExpandChange,
}: ImageUploadBoxProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const showProcessingOptions = imageKind !== "background";
  const processedPreview = useProcessedImageUrl(
    previewUrl,
    imageKind,
    cutoutEnabled,
    whiteExpandPx,
  );

  const handleFile = useCallback(
    (selected: File | null) => {
      if (!selected) {
        onFileChange(null, null);
        return;
      }

      const validation = validateImageFile(selected);
      if (!validation.valid) {
        onError(validation.error);
        return;
      }

      onError(null);
      const url = URL.createObjectURL(selected);
      onFileChange(selected, url);
    },
    [onFileChange, onError],
  );

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    handleFile(selected);
    event.target.value = "";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    handleFile(dropped);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const clearFile = () => {
    onFileChange(null, null);
    onError(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
        {showProcessingOptions && onCutoutChange && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={cutoutEnabled}
              onChange={(event) => onCutoutChange(event.target.checked)}
              onClick={(event) => event.stopPropagation()}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
            />
            Détourage
          </label>
        )}
      </div>

      {showProcessingOptions && onWhiteExpandChange && previewUrl && (
        <label
          className="flex items-center gap-2 text-xs text-zinc-600"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="shrink-0">Fond blanc</span>
          <input
            type="range"
            min={0}
            max={MAX_WHITE_EXPAND_PX}
            step={WHITE_EXPAND_STEP_PX}
            value={whiteExpandPx}
            onChange={(event) =>
              onWhiteExpandChange(Number(event.target.value))
            }
            className="h-1.5 flex-1 cursor-pointer accent-zinc-900"
          />
          <span className="w-10 shrink-0 text-right tabular-nums text-zinc-500">
            {whiteExpandPx}px
          </span>
        </label>
      )}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-4 transition-colors sm:min-h-[280px] ${
          isDragging
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          onChange={onInputChange}
        />

        {previewUrl ? (
          <div className="flex h-full w-full flex-col items-center gap-3 rounded-xl bg-white p-3">
            {processedPreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={processedPreview}
                alt={`${label} preview`}
                className="max-h-[200px] w-full object-contain sm:max-h-[240px]"
              />
            ) : (
              <div className="flex h-[200px] w-full items-center justify-center sm:h-[240px]">
                <span className="text-xs text-zinc-400">Processing…</span>
              </div>
            )}
            <p className="truncate text-xs text-zinc-500">{file?.name}</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                clearFile();
              }}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-6 w-6"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0l-4 4m4-4 4 4M4 20h16"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-800">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-zinc-500">PNG, JPG, JPEG, WEBP · max 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
