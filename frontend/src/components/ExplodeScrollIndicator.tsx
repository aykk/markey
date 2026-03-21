"use client";

/**
 * Shows how far the user has scrolled (wheel) through the “unexplode” interaction.
 * `explodeProgress` is 1 = fully exploded, 0 = fully assembled.
 */
export function ExplodeScrollIndicator({
  explodeProgress,
  className = "",
}: {
  explodeProgress: number;
  className?: string;
}) {
  const pct = Math.round((1 - explodeProgress) * 100);
  const fill = 1 - explodeProgress;

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Assembly scroll progress"
        className="relative h-36 md:h-44 w-1 overflow-hidden rounded-full bg-charcoal/12"
      >
        <div
          className="absolute inset-x-0 bottom-0 top-0 origin-bottom rounded-full bg-charcoal/45 will-change-transform"
          style={{
            transform: `scaleY(${fill})`,
            transition:
              "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
    </div>
  );
}
