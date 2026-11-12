import type { ReactNode } from 'react';

interface ToranBorderStripProps {
  className?: string;
  flip?: boolean;
  tone?: 'coffee' | 'light';
}

/**
 * Repeating traditional knotted scalloped toran border motif
 * faithful to Ruchiloka Café's official artwork.
 */
export function ToranBorderStrip({
  className = '',
  flip = false,
  tone = 'coffee',
}: ToranBorderStripProps) {
  const stroke = tone === 'light' ? '#F3E5CE' : '#4B2E1E';
  const patternId = `ruchiloka-toran-${tone}-${flip ? 'flip' : 'top'}`;

  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden pointer-events-none select-none ${
        flip ? 'rotate-180' : ''
      } ${className}`}
    >
      <svg
        className="w-full h-7 sm:h-8 block"
        preserveAspectRatio="none"
        viewBox="0 0 1200 32"
        fill="none"
      >
        <defs>
          <pattern
            id={patternId}
            width="60"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            {/* Top double cross-knot ribbon */}
            <path
              d="M0 10 C 8 2, 22 2, 30 10 C 38 18, 52 18, 60 10"
              stroke={stroke}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <path
              d="M0 10 C 8 18, 22 18, 30 10 C 38 2, 52 2, 60 10"
              stroke={stroke}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            {/* Pendant teardrop loop */}
            <path
              d="M30 10 C 36 16, 36 25, 30 30 C 24 25, 24 16, 30 10 Z"
              stroke={stroke}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Traditional dots inside loops & pendant */}
            <circle cx="15" cy="10" r="1.2" fill={stroke} />
            <circle cx="45" cy="10" r="1.2" fill={stroke} />
            <circle cx="30" cy="21" r="1.35" fill={stroke} />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1200" height="32" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

interface LotusMandalaWatermarkProps {
  className?: string;
}

/**
 * Geometric lotus & sunburst mandala line-art inspired by Ruchiloka Café's banner.
 */
export function LotusMandalaWatermark({ className = '' }: LotusMandalaWatermarkProps) {
  const petals = Array.from({ length: 12 }, (_, idx) => idx * 30);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 240"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
    >
      <circle cx="120" cy="120" r="24" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="120" cy="120" r="34" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="120" cy="120" r="52" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="120" cy="120" r="76" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" />

      {petals.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 120 120)`}>
          {/* Outer arched lotus petal */}
          <path
            d="M120 12 C 130 32, 134 52, 120 68 C 106 52, 110 32, 120 12 Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d="M120 22 C 126 36, 127 49, 120 62 C 113 49, 114 36, 120 22 Z"
            stroke="currentColor"
            strokeWidth="0.95"
          />
          {/* Inner triangle chevron */}
          <path
            d="M111 70 L120 56 L129 70"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="120" cy="44" r="1.4" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Subtle hand-drawn coffee & botanical sprig outline motif for parchment hero margins.
 */
export function BotanicalLeafSprig({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 140"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M10 130 C 32 98, 56 62, 102 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M52 74 C 30 68, 22 48, 28 34 C 46 38, 58 54, 52 74 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M58 66 C 82 70, 98 58, 106 42 C 88 38, 68 48, 58 66 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M34 98 C 14 96, 8 82, 12 68 C 26 70, 38 82, 34 98 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M78 44 C 72 24, 84 12, 98 10 C 102 24, 92 38, 78 44 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hand-drawn sky-blue underline stroke matching the "Special." editorial accent.
 */
export function SkyBlueUnderline({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 16"
      fill="none"
      preserveAspectRatio="none"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M4 10 C 56 4, 152 3, 216 9"
        stroke="#6EA5C2"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M28 14 C 82 10, 148 10, 198 13"
        stroke="#6EA5C2"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

interface TraditionalFramedCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Warm ivory/parchment card with traditional hairline inner rule and corner accents.
 */
export function TraditionalFramedCard({
  children,
  className = '',
}: TraditionalFramedCardProps) {
  return (
    <div
      className={`relative rounded-[26px] border border-beige-dark/80 bg-ivory shadow-card overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[6px] rounded-[20px] border border-beige-border/55"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
