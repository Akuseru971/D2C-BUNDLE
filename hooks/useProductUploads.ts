"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ProductUpload = {
  file: File | null;
  previewUrl: string | null;
  setProduct: (file: File | null, previewUrl: string | null) => void;
};

export function useProductUploads(count: number): {
  uploads: ProductUpload[];
  previewUrls: (string | null)[];
} {
  const [uploads, setUploads] = useState<
    { file: File | null; previewUrl: string | null }[]
  >(() => Array.from({ length: count }, () => ({ file: null, previewUrl: null })));

  const setProductAt = useCallback(
    (index: number, file: File | null, previewUrl: string | null) => {
      setUploads((prev) => {
        const next = [...prev];
        const current = next[index];
        if (current?.previewUrl && current.previewUrl !== previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }
        next[index] = { file, previewUrl };
        return next;
      });
    },
    [],
  );

  const productUploads = useMemo(
    () =>
      uploads.map((upload, index) => ({
        file: upload.file,
        previewUrl: upload.previewUrl,
        setProduct: (file: File | null, previewUrl: string | null) =>
          setProductAt(index, file, previewUrl),
      })),
    [uploads, setProductAt],
  );

  const previewUrls = useMemo(
    () => uploads.map((upload) => upload.previewUrl),
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

  return { uploads: productUploads, previewUrls };
}

export function useProductUpload(): ProductUpload {
  const { uploads } = useProductUploads(1);
  return uploads[0];
}
