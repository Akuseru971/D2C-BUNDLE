"use client";

import { useMemo, useState } from "react";
import BundleWorkspace from "@/components/BundleWorkspace";
import ImageUploadBox from "@/components/ImageUploadBox";
import { useProductUpload, useProductUploads } from "@/hooks/useProductUploads";
import { MAX_PRODUCT_ELEMENTS } from "@/lib/constants";

export default function HomePage() {
  const { uploads: products, previewUrls: productUrls } =
    useProductUploads(MAX_PRODUCT_ELEMENTS);
  const logo = useProductUpload();
  const background = useProductUpload();

  const [error, setError] = useState<string | null>(null);

  const canCompose = useMemo(
    () =>
      Boolean(
        productUrls.some(Boolean) || background.previewUrl,
      ),
    [productUrls, background.previewUrl],
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
            Upload up to {MAX_PRODUCT_ELEMENTS} product photos and an optional
            background, arrange them on a clean 1:1 canvas, and download a
            marketplace-ready bundle image.
          </p>
        </header>

        <section
          id="uploads"
          className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ImageUploadBox
                key={index}
                label={`Product ${index + 1} (optional)`}
                file={product.file}
                previewUrl={product.previewUrl}
                onFileChange={product.setProduct}
                onError={setError}
              />
            ))}
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
            Up to {MAX_PRODUCT_ELEMENTS} products · The background is drawn behind
            all other layers.
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
            productUrls={productUrls}
            logoUrl={logo.previewUrl}
            backgroundUrl={background.previewUrl}
            onEditUploads={handleEditUploads}
          />
        )}
      </div>
    </main>
  );
}
