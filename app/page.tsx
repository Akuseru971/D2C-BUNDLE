"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BundleWorkspace from "@/components/BundleWorkspace";
import ImageUploadBox from "@/components/ImageUploadBox";

function useProductUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const setProduct = useCallback(
    (nextFile: File | null, nextPreview: string | null) => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextPreview;
      });
      setFile(nextFile);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return { file, previewUrl, setProduct };
}

export default function HomePage() {
  const productA = useProductUpload();
  const productB = useProductUpload();
  const productC = useProductUpload();
  const logo = useProductUpload();
  const background = useProductUpload();

  const [error, setError] = useState<string | null>(null);

  const canCompose = useMemo(
    () =>
      Boolean(
        productA.previewUrl ||
          productB.previewUrl ||
          productC.previewUrl ||
          background.previewUrl,
      ),
    [
      productA.previewUrl,
      productB.previewUrl,
      productC.previewUrl,
      background.previewUrl,
    ],
  );

  const handleEditUploads = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Bundle Image Composer
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 sm:text-base">
            Upload product photos and an optional background, arrange them on a
            clean 1:1 canvas, and download a marketplace-ready bundle image.
          </p>
        </header>

        <section
          id="uploads"
          className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <ImageUploadBox
              label="Product A (optional)"
              file={productA.file}
              previewUrl={productA.previewUrl}
              onFileChange={productA.setProduct}
              onError={setError}
            />
            <ImageUploadBox
              label="Product B (optional)"
              file={productB.file}
              previewUrl={productB.previewUrl}
              onFileChange={productB.setProduct}
              onError={setError}
            />
            <ImageUploadBox
              label="Product C (optional)"
              file={productC.file}
              previewUrl={productC.previewUrl}
              onFileChange={productC.setProduct}
              onError={setError}
            />
            <ImageUploadBox
              label="Logo (optional)"
              file={logo.file}
              previewUrl={logo.previewUrl}
              onFileChange={logo.setProduct}
              onError={setError}
            />
            <ImageUploadBox
              label="Background (optional)"
              file={background.file}
              previewUrl={background.previewUrl}
              onFileChange={background.setProduct}
              onError={setError}
            />
          </div>
          <p className="mt-4 text-center text-xs text-zinc-500">
            The background is drawn behind all other layers (last in the stack).
          </p>

          {!canCompose && (
            <p className="mt-6 text-center text-sm text-zinc-500">
              Upload at least one product or a background image to open the
              editor.
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </section>

        {canCompose && (
          <BundleWorkspace
            productAUrl={productA.previewUrl}
            productBUrl={productB.previewUrl}
            productCUrl={productC.previewUrl}
            logoUrl={logo.previewUrl}
            backgroundUrl={background.previewUrl}
            onEditUploads={handleEditUploads}
          />
        )}
      </div>
    </main>
  );
}
