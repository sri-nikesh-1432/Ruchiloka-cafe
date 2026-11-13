'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BUSINESS_INFO,
  getIstClockParts,
  getIstFullTimings,
  type IstFullTimings,
  type OperatingWindow,
} from '@ruchiloka/shared';

interface ParchmentWallClockProps {
  windows?: OperatingWindow[];
  simulatedDate?: Date | null;
  size?: 'large' | 'compact';
  className?: string;
  showPlaque?: boolean;
}

const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

export function ParchmentWallClock({
  windows,
  simulatedDate = null,
  size = 'large',
  className = '',
  showPlaque = true,
}: ParchmentWallClockProps) {
  const prefersReduced = useReducedMotion();
  const [currentDate, setCurrentDate] = useState<Date>(simulatedDate || new Date());

  // Update clock every second when not in simulated mode
  useEffect(() => {
    if (simulatedDate) {
      setCurrentDate(simulatedDate);
      return;
    }
    const update = () => setCurrentDate(new Date());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [simulatedDate]);

  const timings: IstFullTimings = getIstFullTimings(currentDate, windows);
  const { hour, minute, second } = timings.ist;

  // Clock Hand Angles (in degrees)
  const secondAngle = second * 6;
  const minuteAngle = minute * 6 + (second / 60) * 6;
  const hourAngle = ((hour % 12) + minute / 60 + second / 3600) * 30;

  const isLarge = size === 'large';
  const dialRadius = isLarge ? 170 : 120;
  const numeralRadius = isLarge ? 128 : 88;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Wall Clock Physical Outer Case */}
      <div
        className={`relative flex items-center justify-center rounded-full p-3 sm:p-4 shadow-[0_22px_60px_-15px_rgba(43,30,22,0.45)] transition-all ${
          isLarge ? 'w-80 h-80 sm:w-96 sm:h-96' : 'w-64 h-64 sm:w-72 sm:h-72'
        }`}
        style={{
          background:
            'radial-gradient(circle at 35% 25%, #5A3D2D 0%, #3A2317 45%, #24140C 85%, #180D07 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(255,255,255,0.22), 0 16px 40px rgba(27,16,10,0.5), 0 4px 10px rgba(0,0,0,0.3)',
        }}
        role="img"
        aria-label={`Ruchiloka Café Wall Clock showing ${timings.formattedClock12} Indian Standard Time`}
      >
        {/* Layered Cast-Bronze & Brass Rim */}
        <div
          className="relative flex h-full w-full items-center justify-center rounded-full border border-[#E8C89B]/40 p-2 sm:p-2.5"
          style={{
            background:
              'linear-gradient(145deg, #7A533E 0%, #4D3022 40%, #301A11 75%, #5C3A28 100%)',
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.55), 0 2px 5px rgba(255,255,255,0.15)',
          }}
        >
          {/* Beveled Brass Inner Ring */}
          <div className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-[#D4A373]/75 p-1.5 shadow-inner">
            {/* Authentic Aged Parchment Dial Face */}
            <div
              className="relative h-full w-full overflow-hidden rounded-full shadow-[inset_0_4px_18px_rgba(61,40,28,0.28)]"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #FFFDF8 0%, #F8F1E3 52%, #EDE0C8 85%, #E2CFB0 100%)',
              }}
            >
              {/* Subtle Parchment Texture Vignette & Ornamental Kolam Watermark */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.09]"
                style={{
                  backgroundImage: `radial-gradient(circle, #5A3D2D 1px, transparent 1px)`,
                  backgroundSize: '12px 12px',
                }}
              />

              {/* Center Subtle Ruchiloka Emblem Watermark */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.14]"
              >
                <svg viewBox="0 0 100 100" className="h-28 w-28 text-coffee">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
                  <path
                    d="M32 50 C32 36, 68 36, 68 50 C68 64, 32 64, 32 50 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                  <path d="M38 48 C44 42, 56 42, 62 48" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M38 52 C44 58, 56 58, 62 52" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>

              {/* Dial Face SVG (Precision Outer Chapter Ring, Ticks, Branding & Numerals) */}
              <svg
                viewBox={`-${dialRadius} -${dialRadius} ${dialRadius * 2} ${dialRadius * 2}`}
                className="absolute inset-0 h-full w-full"
              >
                {/* Concentric Traditional Border Rings */}
                <circle cx="0" cy="0" r={dialRadius - 6} fill="none" stroke="#664634" strokeWidth="1.2" opacity="0.6" />
                <circle cx="0" cy="0" r={dialRadius - 10} fill="none" stroke="#C2714F" strokeWidth="0.8" opacity="0.4" />
                <circle cx="0" cy="0" r={dialRadius - 20} fill="none" stroke="#664634" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 3" />

                {/* 60 Minute & 12 Hour Ticks */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i * 6 * Math.PI) / 180;
                  const isHour = i % 5 === 0;
                  const rOuter = dialRadius - 12;
                  const rInner = isHour ? dialRadius - 20 : dialRadius - 16;
                  const x1 = Math.sin(angle) * rOuter;
                  const y1 = -Math.cos(angle) * rOuter;
                  const x2 = Math.sin(angle) * rInner;
                  const y2 = -Math.cos(angle) * rInner;

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isHour ? '#301C12' : '#8A6854'}
                      strokeWidth={isHour ? 1.8 : 0.9}
                      opacity={isHour ? 0.9 : 0.5}
                    />
                  );
                })}

                {/* 12 Roman Numerals */}
                {ROMAN_NUMERALS.map((numeral, index) => {
                  const angle = (index * 30 * Math.PI) / 180;
                  const x = Math.sin(angle) * numeralRadius;
                  const y = -Math.cos(angle) * numeralRadius;
                  return (
                    <text
                      key={numeral}
                      x={x}
                      y={y + (isLarge ? 5.5 : 4)}
                      textAnchor="middle"
                      fill="#26160E"
                      className="font-serif font-bold tracking-tight"
                      style={{
                        fontSize: isLarge ? (numeral.length > 2 ? '14px' : '15px') : '10.5px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {numeral}
                    </text>
                  );
                })}

                {/* Prominent Café Branding on Clock Dial */}
                <g className="font-serif">
                  {/* Top Arch Brand Headline */}
                  <text
                    x="0"
                    y={-numeralRadius * 0.42}
                    textAnchor="middle"
                    fill="#26160E"
                    className="font-bold tracking-[0.24em]"
                    style={{ fontSize: isLarge ? '13px' : '9.5px' }}
                  >
                    RUCHILOKA CAFE
                  </text>

                  {/* Brand Tagline & Region */}
                  <text
                    x="0"
                    y={-numeralRadius * 0.26}
                    textAnchor="middle"
                    fill="#754E38"
                    className="italic font-normal"
                    style={{ fontSize: isLarge ? '8px' : '6px', letterSpacing: '0.06em' }}
                  >
                    Every Flavour Has a Story
                  </text>

                  {/* Lower Dial IST Info */}
                  <text
                    x="0"
                    y={numeralRadius * 0.38}
                    textAnchor="middle"
                    fill="#4D3022"
                    className="font-mono uppercase font-semibold"
                    style={{ fontSize: isLarge ? '7.5px' : '5.5px', letterSpacing: '0.18em' }}
                  >
                    KUKATPALLY · HYDERABAD
                  </text>

                  <text
                    x="0"
                    y={numeralRadius * 0.52}
                    textAnchor="middle"
                    fill="#8A6854"
                    className="font-mono uppercase"
                    style={{ fontSize: isLarge ? '6.5px' : '5px', letterSpacing: '0.14em' }}
                  >
                    INDIAN STANDARD TIME
                  </text>
                </g>

                {/* Real-time Moving Clock Hands - Grouped strictly around exact center (0, 0) */}
                <g filter="url(#shadow-filter)">
                  {/* Hour Hand Group (Breguet / antique pierced diamond) */}
                  <g
                    transform={`rotate(${hourAngle}, 0, 0)`}
                    style={{
                      transformOrigin: '0px 0px',
                      transition: prefersReduced ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {/* Counterweight Tail & Ring */}
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2={isLarge ? 17 : 12}
                      stroke="#24140C"
                      strokeWidth={isLarge ? 3 : 2.4}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="0"
                      cy={isLarge ? 12 : 8.5}
                      r={isLarge ? 3.5 : 2.5}
                      fill="#301A11"
                      stroke="#24140C"
                      strokeWidth="1"
                    />

                    {/* Main Hour Shaft */}
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2={-numeralRadius * 0.62}
                      stroke="#24140C"
                      strokeWidth={isLarge ? 3.8 : 2.8}
                      strokeLinecap="round"
                    />

                    {/* Elegant Diamond Lozenge Accent */}
                    <polygon
                      points={`0,${-numeralRadius * 0.58} ${isLarge ? 4.5 : 3.5},${-numeralRadius * 0.44} 0,${-numeralRadius * 0.30} -${isLarge ? 4.5 : 3.5},${-numeralRadius * 0.44}`}
                      fill="#C2714F"
                      stroke="#24140C"
                      strokeWidth="1.2"
                    />
                    {/* Inner Gold Core Rivet */}
                    <circle
                      cx="0"
                      cy={-numeralRadius * 0.44}
                      r={isLarge ? 1.6 : 1.1}
                      fill="#F5E1C8"
                    />
                  </g>

                  {/* Minute Hand Group (Lancet needle reaching the minute chapter ring) */}
                  <g
                    transform={`rotate(${minuteAngle}, 0, 0)`}
                    style={{
                      transformOrigin: '0px 0px',
                      transition: prefersReduced ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {/* Counterweight Tail */}
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2={isLarge ? 22 : 16}
                      stroke="#2A160E"
                      strokeWidth={isLarge ? 2.5 : 2}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="0"
                      cy={isLarge ? 16 : 11.5}
                      r={isLarge ? 3 : 2.2}
                      fill="#4D3022"
                      stroke="#24140C"
                      strokeWidth="0.8"
                    />

                    {/* Main Minute Shaft */}
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2={-numeralRadius * 0.88}
                      stroke="#2A160E"
                      strokeWidth={isLarge ? 2.6 : 2}
                      strokeLinecap="round"
                    />

                    {/* Slender Diamond Accent */}
                    <polygon
                      points={`0,${-numeralRadius * 0.82} ${isLarge ? 3.5 : 2.6},${-numeralRadius * 0.68} 0,${-numeralRadius * 0.54} -${isLarge ? 3.5 : 2.6},${-numeralRadius * 0.68}`}
                      fill="#E2B179"
                      stroke="#24140C"
                      strokeWidth="1"
                    />
                    <circle
                      cx="0"
                      cy={-numeralRadius * 0.68}
                      r={isLarge ? 1.2 : 0.9}
                      fill="#2A160E"
                    />
                  </g>

                  {/* Second Hand Group (Terracotta sweep needle) */}
                  <g
                    transform={`rotate(${secondAngle}, 0, 0)`}
                    style={{
                      transformOrigin: '0px 0px',
                      transition: prefersReduced ? 'none' : 'transform 0.15s linear',
                    }}
                  >
                    {/* Counterweight Tail */}
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2={isLarge ? 26 : 19}
                      stroke="#C2714F"
                      strokeWidth={isLarge ? 1.4 : 1.1}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="0"
                      cy={isLarge ? 18 : 13}
                      r={isLarge ? 3.2 : 2.4}
                      fill="#C2714F"
                      stroke="#7A2E1D"
                      strokeWidth="0.8"
                    />

                    {/* Main Second Needle */}
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2={-numeralRadius * 0.94}
                      stroke="#C2714F"
                      strokeWidth={isLarge ? 1.4 : 1.1}
                      strokeLinecap="round"
                    />
                    {/* Sweep Dot Marker */}
                    <circle
                      cx="0"
                      cy={-numeralRadius * 0.78}
                      r={isLarge ? 1.8 : 1.3}
                      fill="#C2714F"
                    />
                  </g>
                </g>

                {/* Center Brass Hub Rivet & Jewel Cap (Covers center pivot 0, 0 perfectly) */}
                <circle cx="0" cy="0" r={isLarge ? 7.5 : 5.8} fill="#D4A373" stroke="#24140C" strokeWidth="1.5" />
                <circle cx="0" cy="0" r={isLarge ? 4.5 : 3.4} fill="#7A2E1D" />
                <circle cx="0" cy="0" r={isLarge ? 2.2 : 1.6} fill="#F5E1C8" />
                <circle cx="-1.2" cy="-1.2" r="1.2" fill="#FFF8EE" opacity="0.85" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Traditional Parchment Plaque below Clock */}
      {showPlaque && (
        <div className="mt-6 flex flex-col items-center text-center">
          {/* Day & Full Date */}
          <p className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-dark-brown">
            {timings.dayAndDate}
          </p>

          {/* Precision Digital IST Clock */}
          <div className="mt-1 flex items-center gap-2 font-mono text-base sm:text-lg font-semibold tracking-wider text-coffee">
            <span>{timings.ist.time12WithSeconds}</span>
            <span className="rounded bg-ivory px-2 py-0.5 text-xs text-coffee-muted border border-beige-border">
              IST (Asia/Kolkata)
            </span>
          </div>

          {/* Elegant Status Badge with Traditional Typography (NO BLUE DOT) */}
          <div className="mt-3.5 inline-flex items-center gap-2.5 rounded-full border border-cognac/30 bg-ivory px-4 py-1.5 shadow-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                timings.isCafeOpen ? 'bg-cognac shadow-[0_0_8px_rgba(194,113,79,0.7)]' : 'bg-coffee-soft'
              }`}
              aria-hidden="true"
            />
            <span
              className={`font-serif text-xs sm:text-sm font-bold uppercase tracking-[0.2em] ${
                timings.isCafeOpen ? 'text-dark-brown' : 'text-coffee-muted'
              }`}
            >
              {timings.isCafeOpen ? 'OPEN NOW' : 'CLOSED NOW'}
            </span>
            <span className="text-coffee-muted/50">·</span>
            <span className="text-xs font-medium text-coffee-soft">
              {timings.activeServiceNames.length > 0
                ? timings.activeServiceNames.join(' & ')
                : 'All Counters Closed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
