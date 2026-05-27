"use client";

import { useCallback, useEffect, useState } from "react";
import GeneratedResult from "@/components/GeneratedResult";
import ImageUploadBox from "@/components/ImageUploadBox";
import LoadingSpinner from "@/components/LoadingSpinner";

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

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const canGenerate =
    Boolean(productA.file && productB.file) && !isLoading;

  const handleGenerate = async () => {
    if (!productA.file || !productB.file) {
      setError("Please upload Product A and Product B before generating.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append("productA", productA.file);
      formData.append("productB", productB.file);
      if (productC.file) {
        formData.append("productC", productC.file);
      }

      const response = await fetch("/api/generate-bundle", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        image?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate bundle image.");
      }

      if (!data.image) {
        throw new Error("No image was returned from the server.");
      }

      setGeneratedImage(data.image);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate bundle image.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedImage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Bundle Image Generator
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 sm:text-base">
            Upload two or three product images and generate a clean
            marketplace-ready bundle image.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <ImageUploadBox
              label="Product A"
              file={productA.file}
              previewUrl={productA.previewUrl}
              onFileChange={productA.setProduct}
              onError={setError}
            />
            <ImageUploadBox
              label="Product B"
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
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Generating bundle…
              </>
            ) : (
              "Generate Bundle"
            )}
          </button>

          {isLoading && (
            <p className="mt-3 text-center text-sm text-zinc-500">
              Creating your bundle image. This may take up to a minute…
            </p>
          )}
        </section>

        {generatedImage &&
          productA.previewUrl &&
          productB.previewUrl && (
            <GeneratedResult
              aiImageUrl={generatedImage}
              productAUrl={productA.previewUrl}
              productBUrl={productB.previewUrl}
              productCUrl={productC.previewUrl}
              onGenerateAgain={handleGenerateAgain}
            />
          )}
      </div>
    </main>
  );
}
