'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Clock,
  Coffee,
  UtensilsCrossed,
  Pizza,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  BUSINESS_INFO,
  DEFAULT_OPERATING_WINDOWS,
  formatDurationMinutes,
  formatMinutesTo12Hour,
  getIstFullTimings,
  parseTime24ToMinutes,
  type IstFullTimings,
  type OperatingWindow,
} from '@ruchiloka/shared';
import {
  BorderDrawReveal,
  EditorialReveal,
  EDITORIAL_EASE,
  PageTransitionWrapper,
  StaggerContainer,
  StaggerItem,
  TextReveal,
} from '@/components/motion/MotionPrimitives';
import {
  BotanicalLeafSprig,
  LotusMandalaWatermark,
  ToranBorderStrip,
  TraditionalFramedCard,
} from '@/components/brand/TraditionalOrnaments';
import { ParchmentWallClock } from './ParchmentWallClock';

interface TimingsViewProps {
  initialWindows?: OperatingWindow[];
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  tiffins: <UtensilsCrossed className="h-5 w-5" />,
  beverages: <Coffee className="h-5 w-5" />,
  continental_snacks: <Pizza className="h-5 w-5" />,
};

const SERVICE_MENU_LINKS: Record<string, string> = {
  tiffins: '/menu/tiffins',
  beverages: '/menu/beverages',
  continental_snacks: '/menu/continental',
};

const SERVICE_HIGHLIGHTS: Record<string, string[]> = {
  tiffins: [
    'Crisp Golden Masala Dosa',
    'Steaming Ghee Podi Idli',
    'Crispy Sambar Vada',
    'Fluffy Poori with Potato Masala',
    'Piping Hot Filter Coffee',
  ],
  beverages: [
    'Authentic South Indian Filter Coffee',
    'Traditional Jaggery Bellam Chai',
    'Special Ruchiloka Brew (Bru / Continental / Nescafe)',
    'Artisanal Iced Hazelnut & Caramel Lattes',
    'Thickshakes & Badam Milk',
  ],
  continental_snacks: [
    'Handcrafted Thin-Crust Pizzas',
    'Creamy Alfredo & Rose Pastas',
    'Grilled Paninis & Burgers',
    'Golden Crispy Bites & Peri Peri Fries',
    'Tres Leches & Blueberry Cheesecakes',
  ],
};

const SIMULATION_PRESETS = [
  { label: 'Morning Tiffins (8:00 AM)', hour: 8, minute: 0 },
  { label: 'Midday Coffee (1:30 PM)', hour: 13, minute: 30 },
  { label: 'Evening Dining (6:00 PM)', hour: 18, minute: 0 },
  { label: 'Late Night Closed (11:45 PM)', hour: 23, minute: 45 },
];

export function TimingsView({ initialWindows = DEFAULT_OPERATING_WINDOWS }: TimingsViewProps) {
  const prefersReduced = useReducedMotion();
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [showSimulator, setShowSimulator] = useState(false);

  // Live timer tick every second when not simulated
  useEffect(() => {
    if (simulatedDate) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [simulatedDate]);

  const activeDate = simulatedDate || now;
  const timings: IstFullTimings = getIstFullTimings(activeDate, initialWindows);

  const applySimulationPreset = (hour: number, minute: number) => {
    const base = new Date();
    // Calculate difference to set the IST time to exact hour:minute
    // Using UTC offset for IST (+5:30)
    const targetUtc = new Date(base);
    // IST is UTC + 5h30m -> target UTC is hour - 5, minute - 30
    targetUtc.setUTCHours(hour - 5, minute - 30, 0, 0);
    setSimulatedDate(targetUtc);
  };

  const resetToLiveTime = () => {
    setSimulatedDate(null);
    setNow(new Date());
  };

  return (
    <PageTransitionWrapper className="min-h-screen bg-ivory">
      {/* Decorative Traditional Toran Header Accent */}
      <div className="relative z-10 w-full overflow-hidden border-b border-beige-border/80 bg-beige-soft/60">
        <ToranBorderStrip className="py-1 text-coffee/20" />
      </div>

      {/* Hero Section with Large Parchment Wall Clock & Status Announcement */}
      <section className="relative overflow-hidden bg-gradient-to-b from-beige-soft/70 via-ivory to-cream pt-10 sm:pt-16 pb-14 sm:pb-20">
        <LotusMandalaWatermark className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 h-[520px] w-[520px] text-coffee/[0.06]" />
        <BotanicalLeafSprig className="pointer-events-none absolute -left-8 top-28 hidden md:block h-44 w-36 text-coffee/15" />
        <BotanicalLeafSprig className="pointer-events-none absolute -right-8 bottom-12 hidden md:block h-44 w-36 text-coffee/15 rotate-180" />

        <div className="editorial-container relative z-10">
          {/* Breadcrumb & Section Eyebrow */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono uppercase tracking-widest text-coffee-muted">
              <Link href="/" className="hover:text-dark-brown transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-coffee font-semibold">Operating Hours &amp; Live Clock</span>
            </div>

            {/* Simulated Mode Indicator */}
            {simulatedDate && (
              <div className="inline-flex items-center gap-2 rounded-full border border-cognac/40 bg-cognac-light/20 px-3 py-1 font-mono text-xs font-semibold text-cognac">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Simulating {timings.formattedClock12}</span>
                <button
                  onClick={resetToLiveTime}
                  className="inline-flex items-center gap-1 rounded bg-cognac px-2 py-0.5 text-[10px] text-white hover:bg-dark-brown transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Reset to Live IST
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 grid items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Traditional Ruchiloka Wall Clock */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <EditorialReveal delay={0.05} className="w-full flex justify-center">
                <ParchmentWallClock
                  windows={initialWindows}
                  simulatedDate={simulatedDate}
                  size="large"
                  showPlaque={true}
                />
              </EditorialReveal>
            </div>

            {/* Right Column: Dynamic Status & Editorial Announcements */}
            <div className="lg:col-span-7 space-y-6">
              <EditorialReveal delay={0.1}>
                {/* Traditional Eyebrow Badge (NO BLUE DOT) */}
                <div className="inline-flex items-center gap-2 rounded-full border border-cognac/30 bg-ivory/90 px-4 py-1.5 shadow-sm">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      timings.isCafeOpen
                        ? 'bg-cognac shadow-[0_0_8px_rgba(194,113,79,0.7)]'
                        : 'bg-coffee-soft'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`font-serif text-sm font-bold uppercase tracking-[0.22em] ${
                      timings.isCafeOpen ? 'text-dark-brown' : 'text-coffee-muted'
                    }`}
                  >
                    {timings.isCafeOpen ? 'OPEN NOW' : 'CLOSED NOW'}
                  </span>
                  <span className="text-coffee-muted/40">·</span>
                  <span className="font-mono text-xs text-coffee font-semibold">
                    {timings.formattedClock12}
                  </span>
                </div>
              </EditorialReveal>

              <div className="space-y-3">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-dark-brown leading-[1.12]">
                  <TextReveal immediate delay={0.15}>
                    Timings &amp; Service Schedules
                  </TextReveal>
                </h1>

                <p className="font-serif text-lg sm:text-xl italic text-coffee leading-relaxed">
                  {timings.isCafeOpen ? (
                    <span>
                      Ruchiloka Café is currently welcoming guests in Kukatpally,{' '}
                      <span className="font-semibold text-dark-brown underline decoration-cognac/40 underline-offset-4">
                        {timings.activeServiceSummary}
                      </span>
                      .
                    </span>
                  ) : (
                    <span>
                      The kitchen and beverage counters are closed for the night. We reopen with fresh morning tiffins &amp; hot coffee.
                    </span>
                  )}
                </p>
              </div>

              {/* Dynamic Status Callout Card */}
              <BorderDrawReveal delay={0.25}>
                <div
                  className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${
                    timings.isCafeOpen
                      ? 'border-cognac/30 bg-gradient-to-r from-ivory to-[#FFF9F2]'
                      : 'border-beige-border bg-beige-soft/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        timings.isCafeOpen
                          ? 'border-cognac/40 bg-cognac-light/20 text-cognac'
                          : 'border-beige-border bg-ivory text-coffee-soft'
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-dark-brown">
                        {timings.nextChangeHeadline}
                      </h2>
                      <p className="text-sm text-coffee-soft leading-relaxed">
                        {timings.nextChangeSubtext}
                      </p>
                    </div>
                  </div>
                </div>
              </BorderDrawReveal>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-6 py-3 text-sm font-semibold text-beige hover:bg-cognac transition-all shadow-sm"
                >
                  <span>Explore Full Menu</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/reserve"
                  className="inline-flex items-center gap-2 rounded-full border border-dark-brown/30 bg-ivory px-6 py-3 text-sm font-semibold text-dark-brown hover:border-cognac hover:text-cognac transition-all"
                >
                  <Calendar className="h-4 w-4 text-cognac" />
                  <span>Reserve a Table</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowSimulator(!showSimulator)}
                  className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-beige-soft/70 px-4 py-3 text-xs font-mono font-medium text-coffee hover:bg-ivory transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cognac" />
                  <span>{showSimulator ? 'Hide Time Simulator' : 'Test Time Simulator'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Time Simulator Drawer (Testing & Customer Planning) */}
      {showSimulator && (
        <section className="border-y border-cognac/30 bg-[#FFFDF8] py-8 transition-all">
          <div className="editorial-container space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-dark-brown">
                  Interactive Service Time Simulator
                </h3>
                <p className="text-xs text-coffee-muted">
                  Simulate different times of day to verify the dynamic wall clock, countdowns, and service availability.
                </p>
              </div>

              {simulatedDate && (
                <button
                  onClick={resetToLiveTime}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cognac bg-ivory px-3.5 py-1.5 text-xs font-semibold text-cognac hover:bg-cognac hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to Live Clock ({timings.ist.time12})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {SIMULATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applySimulationPreset(preset.hour, preset.minute)}
                  className="rounded-xl border border-beige-border bg-ivory p-3 text-left hover:border-cognac hover:bg-[#FFF9F2] transition-all shadow-sm"
                >
                  <span className="block font-mono text-xs font-bold text-cognac">
                    {formatMinutesTo12Hour(preset.hour * 60 + preset.minute)} IST
                  </span>
                  <span className="mt-1 block text-xs font-medium text-dark-brown">
                    {preset.label.split('(')[0].trim()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Visual Daytime Schedule Progress Bar & Timeline */}
      <section className="border-y border-beige-border/80 bg-beige-soft/40 py-10 sm:py-14">
        <div className="editorial-container space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cognac">
                Daily Flow (Asia/Kolkata)
              </span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-dark-brown">
                Today&apos;s Operating Timeline
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-coffee font-semibold">
              <span className="h-2 w-2 rounded-full bg-cognac animate-pulse" />
              <span>Current Time: {timings.formattedClock12}</span>
            </div>
          </div>

          {/* Visual Timeline Bar with Real-time IST Marker */}
          <div className="relative mt-6 rounded-2xl border border-beige-border bg-ivory p-5 sm:p-7 shadow-sm">
            {/* Timeline Horizontal Ruler */}
            <div className="relative h-6 w-full rounded-full bg-beige-soft overflow-hidden">
              {/* Tiffins Window: 06:30 to 11:30 (Minutes: 390 to 690 out of 360-1410 span) */}
              <div
                className="absolute top-0 bottom-0 bg-[#E2B179]/55 border-r border-[#C2714F]/40"
                style={{
                  left: `${((390 - 360) / 1050) * 100}%`,
                  width: `${((690 - 390) / 1050) * 100}%`,
                }}
                title="Tiffins: 6:30 AM – 11:30 AM"
              />

              {/* Continental & Snacks Window: 15:00 to 23:00 (Minutes: 900 to 1380 out of 360-1410 span) */}
              <div
                className="absolute top-0 bottom-0 bg-[#C2714F]/40 border-l border-r border-[#8C4A2F]/40"
                style={{
                  left: `${((900 - 360) / 1050) * 100}%`,
                  width: `${((1380 - 900) / 1050) * 100}%`,
                }}
                title="Continental & Snacks: 3:00 PM – 11:00 PM"
              />

              {/* All-Day Beverage Window (Subtle underline gradient 06:30 to 23:00) */}
              <div
                className="absolute bottom-0 h-1.5 bg-cognac rounded-full"
                style={{
                  left: `${((390 - 360) / 1050) * 100}%`,
                  width: `${((1380 - 390) / 1050) * 100}%`,
                }}
                title="Tea & Coffee: 6:30 AM – 11:00 PM"
              />

              {/* Real-time IST Indicator Marker */}
              {timings.timelineProgressPercent > 0 && timings.timelineProgressPercent < 100 && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-dark-brown shadow-[0_0_8px_rgba(43,30,22,0.8)] z-10"
                  style={{ left: `${timings.timelineProgressPercent}%` }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-white bg-dark-brown shadow-sm" />
                </div>
              )}
            </div>

            {/* Timeline Major Milestones */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] sm:text-xs font-mono text-coffee-muted">
              <div>
                <span className="font-bold text-dark-brown">6:30 AM</span>
                <span className="hidden sm:inline text-coffee-soft"> · Doors Open</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-dark-brown">11:30 AM</span>
                <span className="hidden sm:inline text-coffee-soft"> · Tiffins End</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-dark-brown">3:00 PM</span>
                <span className="hidden sm:inline text-coffee-soft"> · Evening Menu</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-dark-brown">11:00 PM</span>
                <span className="hidden sm:inline text-coffee-soft"> · Closing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Dedicated Service Cards Grid */}
      <section className="py-14 sm:py-20">
        <div className="editorial-container space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cognac">
              Authentic Service Windows
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark-brown">
              Freshly Prepared Throughout the Day
            </h2>
            <p className="text-sm text-coffee-soft leading-relaxed">
              Every service at Ruchiloka is timed to deliver peak freshness — from morning batter fermentations to evening artisanal bakes.
            </p>
          </div>

          <StaggerContainer staggerDelay={0.12} className="grid gap-8 md:grid-cols-3">
            {timings.services.map((service) => {
              const icon = SERVICE_ICONS[service.key] || <Clock className="h-5 w-5" />;
              const menuHref = SERVICE_MENU_LINKS[service.key] || '/menu';
              const highlights = SERVICE_HIGHLIGHTS[service.key] || [];

              return (
                <StaggerItem key={service.key}>
                  <TraditionalFramedCard className="flex flex-col h-full bg-ivory p-6 sm:p-7 transition-all hover:shadow-lg">
                    {/* Header: Service Icon, Name & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-beige-border bg-beige-soft/80 text-cognac shadow-inner">
                        {icon}
                      </div>

                      {/* Traditional Typography Status Badge (NO BLUE DOT) */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-serif text-xs font-bold uppercase tracking-wider ${
                          service.isOpen
                            ? 'border-cognac/40 bg-cognac-light/20 text-dark-brown shadow-sm'
                            : 'border-beige-border bg-beige-soft/60 text-coffee-muted'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            service.isOpen ? 'bg-cognac' : 'bg-coffee-soft'
                          }`}
                        />
                        <span>{service.statusText}</span>
                      </span>
                    </div>

                    <div className="mt-5 space-y-2">
                      <h3 className="font-serif text-2xl font-bold text-dark-brown leading-snug">
                        {service.label}
                      </h3>
                      <div className="inline-block rounded-md bg-beige-soft/70 px-2.5 py-1 font-mono text-xs font-bold text-coffee">
                        {service.displayHours} IST
                      </div>
                      <p className="text-xs sm:text-sm text-coffee-soft leading-relaxed pt-1">
                        {service.description}
                      </p>
                    </div>

                    {/* Service Change Next Event Text */}
                    <div className="mt-4 rounded-xl border border-beige-border/80 bg-beige-soft/30 p-3 text-xs text-coffee">
                      <span className="font-semibold text-dark-brown">Schedule status: </span>
                      <span>{service.nextChangeText}</span>
                    </div>

                    {/* Signature Dishes during this window */}
                    <div className="mt-5 space-y-2.5 flex-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-coffee-muted">
                        Window Highlights:
                      </span>
                      <ul className="space-y-1.5 text-xs text-coffee-soft">
                        {highlights.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-cognac" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Link to Service Menu */}
                    <div className="mt-6 pt-4 border-t border-beige-border/80">
                      <Link
                        href={menuHref}
                        className="inline-flex items-center justify-between w-full rounded-xl border border-beige-border bg-ivory px-4 py-2.5 text-xs font-semibold text-dark-brown hover:border-cognac hover:text-cognac transition-colors"
                      >
                        <span>View {service.label} Menu</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </TraditionalFramedCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Kukatpally Dining Guidelines & Visiting Information */}
      <section className="border-t border-beige-border/80 bg-beige-soft/50 py-14 sm:py-20">
        <div className="editorial-container">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cognac">
                Visiting Ruchiloka
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark-brown">
                Dine-In, Takeaway &amp; Table Reservations
              </h2>
              <p className="text-sm text-coffee-soft leading-relaxed">
                Whether dropping in for morning filter coffee or gathering with family for evening pizzas and dosas, our team ensures warm hospitality and relaxed seating.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-cognac shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-coffee-soft">
                    <span className="font-bold text-dark-brown">Morning Tiffins Walk-ins: </span>
                    Seating is open and quick; no prior reservation needed for breakfast.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-cognac shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-coffee-soft">
                    <span className="font-bold text-dark-brown">Evening Table Reservations: </span>
                    Recommended for groups of 4 or more between 6:00 PM and 10:00 PM.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-cognac shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-coffee-soft">
                    <span className="font-bold text-dark-brown">All-Day Filter Coffee &amp; Chai: </span>
                    Served continuously from 6:30 AM to 11:00 PM without midday closures.
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Location Card */}
            <div className="lg:col-span-6">
              <TraditionalFramedCard className="bg-ivory p-6 sm:p-8 space-y-6">
                <h3 className="font-serif text-2xl font-bold text-dark-brown">
                  Café Location &amp; Inquiries
                </h3>

                <div className="space-y-4 text-xs sm:text-sm text-coffee-soft">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-cognac shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-dark-brown">Ruchiloka Café</p>
                      <p className="mt-0.5 leading-relaxed">{BUSINESS_INFO.address.full}</p>
                      <a
                        href={BUSINESS_INFO.googleMapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 font-semibold text-cognac hover:underline"
                      >
                        <span>Open in Google Maps</span>
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-cognac shrink-0" />
                    <div>
                      <span className="text-coffee-muted">Phone: </span>
                      <a href={BUSINESS_INFO.phoneHref} className="font-bold text-dark-brown hover:text-cognac">
                        {BUSINESS_INFO.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-cognac shrink-0" />
                    <div>
                      <span className="text-coffee-muted">Official Email: </span>
                      <span className="font-mono text-dark-brown font-medium">
                        {BUSINESS_INFO.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-beige-border flex flex-wrap gap-3">
                  <Link
                    href="/reserve"
                    className="inline-flex items-center gap-2 rounded-xl bg-dark-brown px-5 py-2.5 text-xs font-semibold text-beige hover:bg-cognac transition-colors"
                  >
                    <span>Reserve a Table Online</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-beige-border bg-beige-soft/60 px-5 py-2.5 text-xs font-semibold text-dark-brown hover:bg-ivory transition-colors"
                  >
                    <span>Send Inquiry</span>
                  </Link>
                </div>
              </TraditionalFramedCard>
            </div>
          </div>
        </div>
      </section>
    </PageTransitionWrapper>
  );
}
