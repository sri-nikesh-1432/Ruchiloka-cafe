'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getIstClockParts,
  getIstFullTimings,
  getServiceStatuses,
  isCafeCurrentlyOpen,
  type IstFullTimings,
  type OperatingWindow,
} from '@ruchiloka/shared';

const STATIC_SSR_BASELINE = new Date('2026-01-01T06:00:00.000Z');

export function useLiveIstStatus(windows: OperatingWindow[]) {
  const [now, setNow] = useState<Date>(STATIC_SSR_BASELINE);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ist = getIstClockParts(now);
  const full = getIstFullTimings(now, windows);
  const statuses = getServiceStatuses(now, windows);
  const cafeOpen = isCafeCurrentlyOpen(now, windows);

  return {
    ist,
    full,
    statuses,
    cafeOpen,
    formattedClock: `${ist.time24} IST`,
    formattedClock12: `${ist.time12} IST`,
  };
}

export function LiveCafePill({ windows }: { windows: OperatingWindow[] }) {
  const { cafeOpen, full } = useLiveIstStatus(windows);

  return (
    <Link
      href="/timings"
      className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 py-1.5 text-xs text-white backdrop-blur-md transition-all hover:border-cognac hover:bg-black/60 shadow-sm"
      title="View full operating schedule & live café wall clock"
    >
      {/* Traditional Warm Bullet Accent (NO BLUE DOT) */}
      <span
        className={`h-2 w-2 rounded-full ${
          cafeOpen
            ? 'bg-cognac shadow-[0_0_6px_rgba(194,113,79,0.9)]'
            : 'bg-coffee-soft'
        }`}
        aria-hidden="true"
      />

      {/* Elegant Serif Typography Status */}
      <span
        className={`font-serif tracking-[0.18em] uppercase font-bold text-[11px] ${
          cafeOpen ? 'text-sandstone' : 'text-cognac-light'
        }`}
      >
        {cafeOpen ? 'OPEN NOW' : 'CLOSED NOW'}
      </span>

      <span className="text-white/40">·</span>

      <span className="font-mono text-[11px] text-beige">
        {full.ist.time12} IST
      </span>

      <span className="text-sandstone/70 text-[10px] group-hover:translate-x-0.5 transition-transform">
        →
      </span>
    </Link>
  );
}
