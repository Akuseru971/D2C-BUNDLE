type GenerationProgressBarProps = {
  progress: number;
  label?: string;
};

export default function GenerationProgressBar({
  progress,
  label = "Generating bundle image…",
}: GenerationProgressBarProps) {
  const value = Math.min(100, Math.max(0, progress));
  const rounded = Math.round(value);

  return (
    <div className="mt-4" aria-busy="true" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-600">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-zinc-900">{rounded}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-label={label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200"
      >
        <div
          className="h-full rounded-full bg-zinc-900 transition-[width] duration-200 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        This may take up to a minute. Please keep this tab open.
      </p>
    </div>
  );
}
