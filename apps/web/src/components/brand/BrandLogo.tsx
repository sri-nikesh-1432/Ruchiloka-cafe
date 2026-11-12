'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'transparent-hero';
  layout?: 'lockup' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  showSubtext?: boolean;
}

/**
 * Displays the authentic Ruchiloka Café artwork cropped from official assets:
 * - layout="lockup": Swirl coffee-bean emblem + original "Ruchiloka · Every Flavour Has a Story" wordmark.
 * - layout="badge": Official circular medallion crest (/images/brand/ruchiloka-logo.png).
 * Original artwork pixels, lettering, and proportions are strictly preserved.
 */
export function BrandLogo({
  variant = 'light',
  layout = 'lockup',
  size = 'md',
  href = '/',
  showSubtext = false,
}: BrandLogoProps) {
  const [swirlMissing, setSwirlMissing] = useState(false);
  const [wordmarkMissing, setWordmarkMissing] = useState(false);
  const [badgeMissing, setBadgeMissing] = useState(false);

  const dims = {
    sm: { badge: 'h-9 w-9', swirl: 'h-7 w-auto', wordmark: 'h-8 w-auto', text: 'text-base', sub: 'text-[9px]' },
    md: { badge: 'h-11 w-11', swirl: 'h-8 sm:h-9 w-auto', wordmark: 'h-9 sm:h-10 w-auto', text: 'text-lg sm:text-xl', sub: 'text-[10px]' },
    lg: { badge: 'h-14 w-14', swirl: 'h-10 w-auto', wordmark: 'h-11 w-auto', text: 'text-2xl', sub: 'text-[11px]' },
  }[size];

  const isDarkSurface = variant === 'dark';

  const lockupFallbackMissing = swirlMissing || wordmarkMissing;

  const content =
    layout === 'badge' ? (
      <span className="inline-flex items-center gap-3 select-none group">
        <span
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF6D5] border border-beige-border/70 shadow-sm transition-transform duration-300 group-hover:scale-[1.03] ${dims.badge}`}
        >
          {!badgeMissing ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/brand/ruchiloka-logo.png"
              alt="Ruchiloka Café official logo"
              className="h-full w-full object-contain"
              onError={() => setBadgeMissing(true)}
            />
          ) : (
            <span className="font-serif text-lg font-semibold tracking-tight text-coffee">R</span>
          )}
        </span>
        <span className="flex flex-col leading-none">
          <span
            className={`font-serif font-semibold tracking-[0.03em] transition-colors ${dims.text} ${
              isDarkSurface ? 'text-white' : 'text-dark-brown'
            }`}
          >
            Ruchiloka <span className="font-normal italic">Café</span>
          </span>
          {showSubtext && (
            <span
              className={`mt-1 font-sans uppercase tracking-[0.2em] ${dims.sub} ${
                isDarkSurface ? 'text-beige/80' : 'text-coffee-muted'
              }`}
            >
              Every Flavour Has a Story
            </span>
          )}
        </span>
      </span>
    ) : (
      <span
        className={`inline-flex items-center gap-2 select-none group ${
          isDarkSurface
            ? 'rounded-full bg-[#FFF6D5] px-4 py-2 border border-beige-border/40 shadow-sm'
            : ''
        }`}
      >
        {!lockupFallbackMissing ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/ruchiloka-swirl.png"
              alt=""
              aria-hidden="true"
              className={`${dims.swirl} shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.04]`}
              onError={() => setSwirlMissing(true)}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/ruchiloka-wordmark-transparent.png"
              alt="Ruchiloka — Every Flavour Has a Story"
              className={`${dims.wordmark} shrink-0 object-contain`}
              onError={() => setWordmarkMissing(true)}
            />
          </>
        ) : (
          <span className="flex flex-col leading-none">
            <span
              className={`font-serif font-semibold tracking-[0.03em] ${dims.text} ${
                isDarkSurface ? 'text-dark-brown' : 'text-dark-brown'
              }`}
            >
              Ruchiloka <span className="font-normal italic">Café</span>
            </span>
            {showSubtext && (
              <span className={`mt-1 font-sans uppercase tracking-[0.2em] ${dims.sub} text-coffee-muted`}>
                Every Flavour Has a Story
              </span>
            )}
          </span>
        )}
      </span>
    );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Ruchiloka Café Home" className="focus:outline-none">
      {content}
    </Link>
  );
}
