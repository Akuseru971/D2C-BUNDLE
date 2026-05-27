type PlusSymbolProps = {
  scale?: number;
  className?: string;
};

/** Premium plus badge — matches canvas export styling. */
export default function PlusSymbol({ scale = 1, className = "" }: PlusSymbolProps) {
  const size = 72 * scale;

  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 32% 28%, #2a2a2a 0%, #0a0a0a 72%)",
        boxShadow:
          "0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <span
        className="relative font-extralight leading-none text-white"
        style={{
          fontSize: size * 0.44,
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
        aria-hidden
      >
        +
      </span>
    </div>
  );
}
