'use client';

import React, { useEffect, useState } from 'react';
import {
  getIstClockParts,
  getServiceStatuses,
  isCafeCurrentlyOpen,
  type OperatingWindow,
} from '@ruchiloka/shared';

const STATIC_SSR_BASELINE = new Date('2026-01-01T06:00:00.000Z');

export function useLiveIstStatus(windows: OperatingWindow[]) {
  const [now, setNow] = useState<Date>(STATIC_SSR_BASELINE);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const ist = getIstClockParts(now);
  const statuses = getServiceStatuses(now, windows);
  const cafeOpen = isCafeCurrentlyOpen(now, windows);

  return {
    ist,
    statuses,
    cafeOpen,
    formattedClock: `${ist.time24} IST`,
  };
}

export function LiveCafePill({ windows }: { windows: OperatingWindow[] }) {
  const { cafeOpen, formattedClock } = useLiveIstStatus(windows);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/35 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
      <span
        className={`h-2 w-2 rounded-full ${cafeOpen ? 'bg-sky-blue animate-pulse' : 'bg-cognac'}`}
        aria-hidden="true"
      />
      <span>{cafeOpen ? 'Open Now' : 'Currently Closed'}</span>
      <span className="text-white/60">·</span>
      <span className="font-mono text-[11px] text-beige">{formattedClock}</span>
    </span>
  );
}
