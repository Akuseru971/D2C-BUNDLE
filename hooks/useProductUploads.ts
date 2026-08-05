"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_CUTOUT_ENABLED } from "@/lib/image-processing-options";

type ProductUpload = {
  file: File | null;
  previewUrl: string | null;
  cutoutEnabled: boolean;
  setProduct: (file: File | null, previewUrl: string | null) => void;
  setCutoutEnabled: (enabled: boolean) => void;
};

type UploadState = {
  file: File | null;
  previewUrl: string | null;
  cutoutEnabled: boolean;
};

export function useProductUploads(count: number): {
  uploads: ProductUpload[];
  previewUrls: (string | null)[];
  cutoutEnabled: boolean[];
} {
  const [uploads, setUploads] = useState<UploadState[]>(() =>
    Array.from({ length: count }, () => ({
      file: null,
      previewUrl: null,
      cutoutEnabled: DEFAULT_CUTOUT_ENABLED,
    })),
  );

  const setProductAt = useCallback(
    (index: number, file: File | null, previewUrl: string | null) => {
      setUploads((prev) => {
        const next = [...prev];
        const current = next[index];
        if (current?.previewUrl && current.previewUrl !== previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }
        next[index] = {
          ...next[index],
          file,
          previewUrl,
        };
        return next;
      });
    },
    [],
  );

  const setCutoutAt = useCallback((index: number, cutoutEnabled: boolean) => {
    setUploads((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], cutoutEnabled };
      return next;
    });
  }, []);

  const productUploads = useMemo(
    () =>
      uploads.map((upload, index) => ({
        file: upload.file,
        previewUrl: upload.previewUrl,
        cutoutEnabled: upload.cutoutEnabled,
        setProduct: (file: File | null, previewUrl: string | null) =>
          setProductAt(index, file, previewUrl),
        setCutoutEnabled: (enabled: boolean) => setCutoutAt(index, enabled),
      })),
    [uploads, setProductAt, setCutoutAt],
  );

  const previewUrls = useMemo(
    () => uploads.map((upload) => upload.previewUrl),
    [uploads],
  );

  const cutoutEnabled = useMemo(
    () => uploads.map((upload) => upload.cutoutEnabled),
    [uploads],
  );

  useEffect(() => {
    return () => {
      setUploads((current) => {
        for (const upload of current) {
          if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);
        }
        return current;
      });
    };
  }, []);

  return { uploads: productUploads, previewUrls, cutoutEnabled };
}

export function useProductUpload(): ProductUpload {
  const { uploads } = useProductUploads(1);
  return uploads[0];
}
