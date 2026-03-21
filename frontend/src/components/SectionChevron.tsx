"use client";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

interface SectionChevronProps {
  targetId: string;
  ariaLabel: string;
}

export function SectionChevron({ targetId, ariaLabel }: SectionChevronProps) {
  return (
    <div className="mt-auto flex justify-center pt-10 pb-6 shrink-0">
      <button
        onClick={() => scrollToId(targetId)}
        onKeyDown={(e) => e.key === "Enter" && scrollToId(targetId)}
        className="flex flex-col items-center text-charcoal/70 hover:text-charcoal transition-colors animate-bounce"
        aria-label={ariaLabel}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
