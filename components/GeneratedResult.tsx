"use client";

type GeneratedResultProps = {
  imageUrl: string;
  onDownload: () => void;
  onGenerateAgain: () => void;
};

export default function GeneratedResult({
  imageUrl,
  onDownload,
  onGenerateAgain,
}: GeneratedResultProps) {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Generated bundle</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Your marketplace-ready 1:1 bundle image is ready.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Generated bundle image"
          className="mx-auto aspect-square w-full max-w-md object-contain"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Download Image
        </button>
        <button
          type="button"
          onClick={onGenerateAgain}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          Generate Again
        </button>
      </div>
    </section>
  );
}
