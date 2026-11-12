'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'transparent-hero';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  showSubtext?: boolean;
}

/**
 * Displays the official Ruchiloka Café logo image (/images/brand/ruchiloka-logo.png)
 * inside an appropriate light or dark surface treatment without altering, recoloring,
 * or distorting the original artwork. If the official image asset has not yet been
 * placed in public/images/brand/, displays a clean typographic wordmark lockup
 * instead of a broken image placeholder.
 */
export function BrandLogo({
  variant = 'light',
  size = 'md',
  href = '/',
  showSubtext = false,
}: BrandLogoProps) {
  const [imageMissing, setImageMissing] = useState(false);

  const dims = {
    sm: { box: 'h-9 w-9', text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'h-11 w-11', text: 'text-lg sm:text-xl', sub: 'text-[10px]' },
    lg: { box: 'h-14 w-14', text: 'text-2xl', sub: 'text-[11px]' },
  }[size];

  const surfaceClasses =
    variant === 'dark'
      ? 'bg-ivory/95 border border-beige-border/50 shadow-sm'
      : variant === 'transparent-hero'
        ? 'bg-ivory/95 border border-white/40 shadow-sm'
        : 'bg-ivory border border-beige-border shadow-sm';

  const titleColor =
    variant === 'dark' || variant === 'transparent-hero' ? 'text-white' : 'text-dark-brown';

  const subColor =
    variant === 'dark' || variant === 'transparent-hero'
      ? 'text-beige/80'
      : 'text-coffee-muted';

  const content = (
    <span className="inline-flex items-center gap-3 select-none group">
      <span
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-[1.03] ${dims.box} ${surfaceClasses}`}
      >
        {!imageMissing ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/brand/ruchiloka-logo.png"
            alt="Ruchiloka Café official logo"
            className="h-full w-full object-contain p-1"
            onError={() => setImageMissing(true)}
          />
        ) : (
          <span className="font-serif text-lg font-semibold tracking-tight text-coffee">
            R
          </span>
        )}
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif font-semibold tracking-[0.03em] transition-colors ${dims.text} ${titleColor}`}
        >
          Ruchiloka <span className="font-normal italic">Café</span>
        </span>
        {showSubtext && (
          <span className={`mt-1 font-sans uppercase tracking-[0.22em] ${dims.sub} ${subColor}`}>
            Kukatpally · Hyderabad
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Ruchiloka Café Home" className="inline-flex items-center">
      {content}
    </Link>
  );
}
