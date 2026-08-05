"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CUTOUT_ENABLED,
  DEFAULT_WHITE_EXPAND_PX,
} from "@/lib/image-processing-options";

type ProductUpload = {
  file: File | null;
  previewUrl: string | null;
  cutoutEnabled: boolean;
  whiteExpandPx: number;
  setProduct: (file: File | null, previewUrl: string | null) => void;
  setCutoutEnabled: (enabled: boolean) => void;
  setWhiteExpandPx: (px: number) => void;
};

type UploadState = {
  file: File | null;
  previewUrl: string | null;
  cutoutEnabled: boolean;
  whiteExpandPx: number;
};

export function useProductUploads(count: number): {
  uploads: ProductUpload[];
  previewUrls: (string | null)[];
  cutoutEnabled: boolean[];
  whiteExpandPx: number[];
} {
  const [uploads, setUploads] = useState<UploadState[]>(() =>
    Array.from({ length: count }, () => ({
      file: null,
      previewUrl: null,
      cutoutEnabled: DEFAULT_CUTOUT_ENABLED,
      whiteExpandPx: DEFAULT_WHITE_EXPAND_PX,
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

  const setWhiteExpandAt = useCallback((index: number, whiteExpandPx: number) => {
    setUploads((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], whiteExpandPx };
      return next;
    });
  }, []);

  const productUploads = useMemo(
    () =>
      uploads.map((upload, index) => ({
        file: upload.file,
        previewUrl: upload.previewUrl,
        cutoutEnabled: upload.cutoutEnabled,
        whiteExpandPx: upload.whiteExpandPx,
        setProduct: (file: File | null, previewUrl: string | null) =>
          setProductAt(index, file, previewUrl),
        setCutoutEnabled: (enabled: boolean) => setCutoutAt(index, enabled),
        setWhiteExpandPx: (px: number) => setWhiteExpandAt(index, px),
      })),
    [uploads, setProductAt, setCutoutAt, setWhiteExpandAt],
  );

  const previewUrls = useMemo(
    () => uploads.map((upload) => upload.previewUrl),
    [uploads],
  );

  const cutoutEnabled = useMemo(
    () => uploads.map((upload) => upload.cutoutEnabled),
    [uploads],
  );

  const whiteExpandPx = useMemo(
    () => uploads.map((upload) => upload.whiteExpandPx),
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

  return { uploads: productUploads, previewUrls, cutoutEnabled, whiteExpandPx };
}

export function useProductUpload(): ProductUpload {
  const { uploads } = useProductUploads(1);
  return uploads[0];
}
