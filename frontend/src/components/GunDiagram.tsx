'use client';

interface Part {
  id: string;
  label: string;
  dotX: number;
  dotY: number;
  labelX: number;
  labelY: number;
  side: 'left' | 'right';
}

const PARTS: Part[] = [
  { id: 'receiver',  label: 'RECEIVER BODY',     dotX: 600, dotY: 265, labelX: 70,   labelY: 130, side: 'left' },
  { id: 'barrel',    label: 'BARREL CORE',       dotX: 255, dotY: 265, labelX: 70,   labelY: 230, side: 'left' },
  { id: 'rail',      label: 'TOP RAIL',          dotX: 640, dotY: 205, labelX: 70,   labelY: 330, side: 'left' },
  { id: 'trigger',   label: 'TRIGGER MODULE',    dotX: 630, dotY: 430, labelX: 70,   labelY: 430, side: 'left' },
  { id: 'feed',      label: 'FEED ASSEMBLY',     dotX: 430, dotY: 450, labelX: 1130, labelY: 160, side: 'right' },
  { id: 'selector',  label: 'SELECTOR LINKAGE',  dotX: 760, dotY: 370, labelX: 1130, labelY: 260, side: 'right' },
  { id: 'grip',      label: 'GRIP FRAME',        dotX: 860, dotY: 500, labelX: 1130, labelY: 360, side: 'right' },
  { id: 'stock',     label: 'REAR FRAME',        dotX: 1020, dotY: 290, labelX: 1130, labelY: 460, side: 'right' },
];

const TICK = 16;

export default function GunDiagram() {
  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-2xl border border-neutral-200 bg-white/70 p-3 md:p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
      <svg
        className="w-full h-auto"
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="1200" height="720" fill="#fafafa" />

        <g stroke="#121212" fill="none" strokeWidth="1.2" opacity="0.9">
          <rect x="500" y="210" width="220" height="85" rx="8" />
          <rect x="220" y="245" width="210" height="36" rx="14" />
          <rect x="570" y="170" width="170" height="20" rx="4" />
          <path d="M760 300 L900 300 L950 355 L950 540 L860 540 L820 475 L760 475 Z" />
          <path d="M600 392 C640 420, 655 448, 638 486 C620 523, 585 520, 563 488 C545 462, 552 428, 600 392 Z" />
          <path d="M450 360 L520 360 L505 600 L410 600 Z" />
          <rect x="980" y="230" width="120" height="20" rx="4" />
          <rect x="1000" y="252" width="45" height="160" rx="20" />
        </g>

        <g stroke="#9f9f9f" strokeWidth="0.9">
          <line x1="500" y1="205" x2="720" y2="205" />
          <line x1="500" y1="302" x2="720" y2="302" />
          <line x1="760" y1="476" x2="953" y2="476" />
        </g>

        <g className="hidden lg:block">
          {PARTS.map((p, i) => {
            const isLeft = p.side === 'left';
            const tickX1 = isLeft ? p.labelX : p.labelX - TICK;
            const tickX2 = isLeft ? p.labelX + TICK : p.labelX;
            const textX = isLeft ? p.labelX + TICK + 6 : p.labelX - TICK - 6;
            const anchor = isLeft ? 'start' : 'end';

            return (
              <g
                key={p.id}
                style={{
                  opacity: 0,
                  animation: 'annotationFade 0.55s ease forwards',
                  animationDelay: `${0.25 + i * 0.12}s`,
                }}
              >
                <line x1={p.dotX} y1={p.dotY} x2={p.labelX} y2={p.labelY} stroke="#8e8e8e" strokeWidth="0.9" />
                <line x1={tickX1} y1={p.labelY} x2={tickX2} y2={p.labelY} stroke="#767676" strokeWidth="0.9" />
                <circle cx={p.dotX} cy={p.dotY} r="4.5" fill="#fafafa" stroke="#8e8e8e" strokeWidth="1" />
                <circle cx={p.dotX} cy={p.dotY} r="1.8" fill="#6b6b6b" />
                <text
                  x={textX}
                  y={p.labelY - 6}
                  textAnchor={anchor}
                  fill="#1f1f1f"
                  fontSize="10"
                  fontFamily="var(--font-geist-mono), 'Courier New', monospace"
                  letterSpacing="1.8"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
