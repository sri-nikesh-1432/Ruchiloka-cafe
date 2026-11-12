'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Clock,
  Coffee,
  MapPin,
  Phone,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { BUSINESS_INFO, type MenuItemDto } from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import {
  EDITORIAL_EASE,
  EditorialReveal,
  ParallaxFrame,
  StaggerContainer,
  StaggerItem,
  SubtleFloat,
} from '@/components/motion/MotionPrimitives';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { MenuItemModal } from '@/components/menu/MenuItemModal';
import { LiveCafePill, useLiveIstStatus } from './LiveStatusBadge';

const EXPERIENCES = [
  {
    number: '01',
    title: 'Freshly Prepared Tiffins',
    timing: '6:30 AM – 11:30 AM IST',
    description:
      'Crisp golden dosas, cloud-soft steamed idlis, spiced chutneys, and simmering sambar made fresh every morning from dawn.',
    href: '/menu/tiffins',
    image: '/images/exp-tiffins.webp',
    alt: 'Crisp masala dosa with sambar and fresh chutneys at Ruchiloka Café',
  },
  {
    number: '02',
    title: 'Coffee, Tea & Conversations',
    timing: '6:30 AM – 11:00 PM IST',
    description:
      'From rich South Indian filter kaapi and velvety cappuccinos to slow-simmered masala chai—crafted for unhurried mornings and late evenings.',
    href: '/menu/beverages',
    image: '/images/exp-coffee-tea.webp',
    alt: 'Freshly brewed latte art cappuccino beside roasted coffee beans',
  },
  {
    number: '03',
    title: 'Continental Delights',
    timing: '3:00 PM – 11:00 PM IST',
    description:
      'Warm toasted sandwiches, creamy bowls of pasta, flaky butter croissants, and savoury evening snacks tailored for afternoon meetups.',
    href: '/menu/continental',
    image: '/images/exp-continental.webp',
    alt: 'Artisanal continental pasta dish served fresh',
  },
];

const GALLERY_PHOTOS = [
  {
    src: '/images/gallery-tiffin-spread.webp',
    alt: 'Traditional South Indian tiffin spread with dosa, idli, and vada',
    caption: 'Morning Tiffin Rituals',
    span: 'md:col-span-5 md:row-span-2 aspect-[4/5]',
  },
  {
    src: '/images/hero-coffee-pour.webp',
    alt: 'Barista pouring steamed milk into espresso',
    caption: 'Handcrafted Espresso & Filter Brews',
    span: 'md:col-span-7 aspect-[16/10]',
  },
  {
    src: '/images/gallery-croissant-coffee.webp',
    alt: 'Sunlit pastry croissant paired with hot coffee',
    caption: 'Golden Hour Bakes',
    span: 'md:col-span-4 aspect-[4/5]',
  },
  {
    src: '/images/gallery-sandwich-brew.webp',
    alt: 'Artisan sandwich served beside warm ceramic coffee mugs',
    caption: 'Warm Afternoon Plates',
    span: 'md:col-span-3 aspect-[4/5]',
  },
  {
    src: '/images/gallery-idli-coffee.webp',
    alt: 'Steamed idli sambar alongside frothy filter coffee',
    caption: 'Comfort in Every Cup',
    span: 'md:col-span-6 aspect-[16/10]',
  },
  {
    src: '/images/gallery-warm-tables.webp',
    alt: 'Warm lighting and cozy seating inside Ruchiloka Café',
    caption: 'Kukatpally Dining Room',
    span: 'md:col-span-6 aspect-[16/10]',
  },
];

export function LandingView() {
  const { publicSettings } = useApp();
  const { statuses } = useLiveIstStatus(publicSettings.operatingHours);

  const [highlights, setHighlights] = useState<MenuItemDto[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const [inspectItem, setInspectItem] = useState<MenuItemDto | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingHighlights(true);
    setHighlightsError(null);

    api.menu
      .listItems({ featured: true })
      .then((items) => {
        if (!cancelled) {
          setHighlights(items.slice(0, 6));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setHighlightsError(
            err instanceof Error ? err.message : 'Unable to load menu highlights right now.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHighlights(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* SECTION 2: HERO */}
      <section className="relative min-h-[94vh] flex items-end overflow-hidden bg-dark-brown text-white pt-28 pb-16 sm:pb-24">
        {/* Background Atmospheric Photography */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-cafe.webp"
            alt="Warm sunlit interior of Ruchiloka Café"
            className="h-full w-full object-cover object-center opacity-50 scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-brown via-dark-brown/65 to-black/45" />
        </div>

        <div className="editorial-container relative z-10 grid items-end gap-12 lg:grid-cols-12">
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EDITORIAL_EASE }}
              className="flex flex-wrap items-center gap-3"
            >
              <LiveCafePill windows={publicSettings.operatingHours} />
              <span className="text-xs uppercase tracking-[0.22em] text-beige/80">
                Kukatpally · Hyderabad
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: EDITORIAL_EASE }}
              className="font-serif text-4xl sm:text-6xl lg:text-[4.25rem] font-semibold leading-[1.06] tracking-[-0.02em] text-white"
            >
              Every Cup. <br className="hidden sm:inline" />
              Every Bite. <br />
              <span className="italic font-normal text-cognac-light">A Little More Special.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.16, ease: EDITORIAL_EASE }}
              className="max-w-xl text-base sm:text-lg leading-relaxed text-beige/90"
            >
              {BUSINESS_INFO.supportingCopy}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.24, ease: EDITORIAL_EASE }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2.5 rounded-full bg-cognac px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-cognac-hover shadow-editorial"
              >
                <span>Explore Our Menu</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/reserve"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/10 px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-all hover:bg-white hover:text-dark-brown"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Reserve a Table</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Framed Barista Pour Card + Subtle Floating Accent */}
          <div className="lg:col-span-5 hidden sm:block">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EDITORIAL_EASE }}
              className="relative mx-auto max-w-md lg:ml-auto"
            >
              <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-coffee/40 p-2.5 backdrop-blur-sm shadow-modal">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/hero-coffee-pour.webp"
                    alt="Barista pouring microfoam into freshly pulled espresso"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between px-3 pt-3 pb-1 text-xs text-beige/90">
                  <span>Freshly Brewed · 6:30 AM – 11:00 PM IST</span>
                  <Coffee className="h-4 w-4 text-cognac-light" />
                </div>
              </div>

              <SubtleFloat
                amplitude={5}
                duration={6}
                className="absolute -left-6 -top-5 hidden xl:flex items-center gap-2.5 rounded-2xl border border-beige-border/40 bg-ivory px-4 py-3 text-dark-brown shadow-editorial"
              >
                <Sparkles className="h-4 w-4 text-cognac" />
                <div className="leading-tight">
                  <p className="font-serif text-sm font-semibold">Morning Tiffins</p>
                  <p className="font-mono text-[10px] text-coffee-muted">From 6:30 AM IST</p>
                </div>
              </SubtleFloat>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.a
          href="#our-experience"
          aria-label="Scroll to Our Experience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:inline-flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-[0.26em] text-beige/70 hover:text-white transition-colors"
        >
          <span>Scroll</span>
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
        </motion.a>
      </section>

      {/* SECTION 3: OUR EXPERIENCE */}
      <section id="our-experience" className="py-24 sm:py-32 bg-cream">
        <div className="editorial-container">
          <EditorialReveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-beige-border pb-10">
            <div className="max-w-2xl">
              <span className="editorial-kicker">Our Experience</span>
              <h2 className="mt-3 editorial-heading text-4xl sm:text-5xl font-semibold leading-tight">
                Three rhythms of comfort, <br className="hidden sm:inline" />
                from first light to late evening.
              </h2>
            </div>
            <p className="max-w-md text-sm sm:text-base leading-relaxed text-coffee-muted">
              Each hour at Ruchiloka Café has its own kitchen pulse—authentic South Indian morning
              tiffins, all-day craft coffee and tea, and unhurried continental evenings.
            </p>
          </EditorialReveal>

          <div className="mt-16 space-y-20 lg:space-y-28">
            {EXPERIENCES.map((exp, idx) => {
              const reversed = idx % 2 === 1;
              return (
                <EditorialReveal
                  key={exp.number}
                  className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16"
                >
                  <div className={`lg:col-span-7 ${reversed ? 'lg:order-2' : ''}`}>
                    <Link href={exp.href} className="group block overflow-hidden rounded-[2rem] bg-beige">
                      <ParallaxFrame offset={24} className="aspect-[16/11]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={exp.image}
                          alt={exp.alt}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </ParallaxFrame>
                    </Link>
                  </div>

                  <div className={`lg:col-span-5 space-y-5 ${reversed ? 'lg:order-1' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-cognac">
                        {exp.number}
                      </span>
                      <span className="h-px w-8 bg-beige-border" />
                      <span className="font-mono text-xs text-coffee-muted">{exp.timing}</span>
                    </div>

                    <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-dark-brown">
                      {exp.title}
                    </h3>

                    <p className="text-base leading-relaxed text-coffee-muted">{exp.description}</p>

                    <div className="pt-2">
                      <Link
                        href={exp.href}
                        className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-dark-brown hover:text-cognac transition-colors"
                      >
                        <span>Explore {exp.title.split(' ')[0]} Menu</span>
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </div>
                  </div>
                </EditorialReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: MENU HIGHLIGHTS */}
      <section className="py-24 sm:py-32 bg-beige-soft border-y border-beige-border">
        <div className="editorial-container">
          <EditorialReveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="editorial-kicker">Curated Highlights</span>
              <h2 className="mt-3 editorial-heading text-4xl sm:text-5xl font-semibold">
                From Our Kitchen &amp; Espresso Bar
              </h2>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-ivory px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-dark-brown transition-all hover:border-cognac hover:text-cognac"
            >
              <span>View Full Menu</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </EditorialReveal>

          <div className="mt-12">
            {loadingHighlights ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="h-96 animate-pulse rounded-3xl border border-beige-border bg-ivory"
                  />
                ))}
              </div>
            ) : highlights.length > 0 ? (
              <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((item) => (
                  <StaggerItem key={item.id}>
                    <MenuItemCard item={item} onInspect={setInspectItem} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="rounded-[2rem] border border-beige-border bg-ivory px-8 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-beige text-cognac">
                  <Utensils className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-dark-brown">
                  {highlightsError ? 'Kitchen Menu Syncing' : 'Menu Highlights Coming Soon'}
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-coffee-muted">
                  {highlightsError
                    ? 'Our live menu server is currently connecting. Once online, featured dishes and real-time availability appear automatically.'
                    : 'Our chef and management team have not yet published featured dishes for today. Browse our menu categories or manage offerings from the admin studio.'}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-coffee transition-colors"
                  >
                    Open Interactive Menu
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/reserve"
                    className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-cream px-6 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac transition-colors"
                  >
                    Reserve a Table
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: OPERATING HOURS */}
      <section className="py-24 sm:py-28 bg-cream">
        <div className="editorial-container">
          <EditorialReveal className="grid gap-12 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="editorial-kicker">Service Timings · IST</span>
              <h2 className="editorial-heading text-4xl sm:text-5xl font-semibold leading-tight">
                Live Kitchen &amp; <br />Brewing Hours
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-coffee-muted">
                All hours are calculated dynamically in Indian Standard Time (`Asia/Kolkata`). Drop
                by early for crisp morning tiffins or settle in for warm continental evenings.
              </p>
            </div>

            <div className="lg:col-span-7 divide-y divide-beige-border border-y border-beige-border">
              {statuses.map((slot) => (
                <div
                  key={slot.key}
                  className="flex flex-col gap-3 py-7 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-2xl font-semibold text-dark-brown">
                        {slot.label}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          slot.isOpen
                            ? 'bg-sky-blue-soft text-sky-blue-deep'
                            : 'bg-beige text-coffee-muted'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            slot.isOpen ? 'bg-sky-blue-deep' : 'bg-coffee-soft'
                          }`}
                        />
                        {slot.statusText}
                      </span>
                    </div>
                    <p className="text-sm text-coffee-muted">{slot.description}</p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <p className="font-mono text-base font-bold text-dark-brown">
                      {slot.displayHours}
                    </p>
                    <p className="mt-0.5 text-xs text-coffee-muted">{slot.nextChangeText}</p>
                  </div>
                </div>
              ))}
            </div>
          </EditorialReveal>
        </div>
      </section>

      {/* SECTION 6: CAFÉ GALLERY */}
      <section className="py-24 sm:py-32 bg-dark-brown text-cream">
        <div className="editorial-container">
          <EditorialReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="editorial-kicker text-cognac-light">Atmosphere &amp; Craft</span>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-white">
                Inside Ruchiloka Café
              </h2>
            </div>
            <p className="max-w-md text-sm text-beige/80">
              Morning filter aromas, sunlit corner tables, and plates crafted to linger over. Click
              any photograph to inspect closer.
            </p>
          </EditorialReveal>

          <StaggerContainer className="mt-12 grid gap-4 md:grid-cols-12">
            {GALLERY_PHOTOS.map((photo) => (
              <StaggerItem key={photo.src} className={photo.span}>
                <button
                  type="button"
                  onClick={() => setLightboxImage({ src: photo.src, caption: photo.caption })}
                  className="group relative block h-full w-full overflow-hidden rounded-3xl bg-coffee/40 text-left focus:outline-none focus:ring-2 focus:ring-cognac"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-95" />
                  <span className="absolute bottom-4 left-5 right-5 font-serif text-lg font-medium text-white">
                    {photo.caption}
                  </span>
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* SECTION 7: RESERVATIONS */}
      <section className="py-24 sm:py-32 bg-beige">
        <div className="editorial-container">
          <EditorialReveal className="relative overflow-hidden rounded-[2.5rem] border border-beige-border bg-ivory p-8 sm:p-14 lg:p-20 shadow-editorial">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-6">
                <span className="editorial-kicker">Table Reservations</span>
                <h2 className="editorial-heading text-4xl sm:text-5xl font-semibold leading-tight">
                  Reserve your favourite <br className="hidden sm:inline" />
                  corner in Kukatpally.
                </h2>
                <p className="max-w-xl text-base leading-relaxed text-coffee-muted">
                  Whether it&apos;s an early morning tiffin breakfast with family, a mid-day coffee
                  catch-up, or an evening continental dinner, book your table in advance with live
                  slot availability in IST.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/reserve"
                    className="group inline-flex items-center gap-2.5 rounded-full bg-dark-brown px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition-all hover:bg-cognac"
                  >
                    <span>Find Your Table</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className="inline-flex items-center gap-2 text-xs text-coffee-muted">
                    <Clock className="h-4 w-4 text-cognac" />
                    Instant email confirmation updates
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-3xl border border-beige-border aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/gallery-pastry-plate.webp"
                    alt="Coffee and fresh croissant set on a reserved table"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </EditorialReveal>
        </div>
      </section>

      {/* SECTION 8: LOCATION */}
      <section className="py-24 sm:py-28 bg-cream">
        <div className="editorial-container">
          <EditorialReveal className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-6">
              <span className="editorial-kicker">Visit Us</span>
              <h2 className="editorial-heading text-4xl sm:text-5xl font-semibold">
                Find Ruchiloka Café
              </h2>

              <div className="space-y-4 pt-2 text-sm sm:text-base text-coffee">
                <div className="flex items-start gap-3.5">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-cognac" />
                  <div>
                    <p className="font-semibold text-dark-brown">Address</p>
                    <p className="mt-1 leading-relaxed text-coffee-muted">
                      {BUSINESS_INFO.address.line1},
                      <br />
                      {BUSINESS_INFO.address.line2},
                      <br />
                      {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.state}{' '}
                      {BUSINESS_INFO.address.postalCode}, {BUSINESS_INFO.address.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-cognac" />
                  <div>
                    <p className="font-semibold text-dark-brown">Telephone</p>
                    <a
                      href={`tel:${publicSettings.cafePhone.replace(/\s+/g, '')}`}
                      className="mt-1 inline-block font-mono text-coffee hover:text-cognac transition-colors"
                    >
                      {publicSettings.cafePhone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={BUSINESS_INFO.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-cognac"
                >
                  <span>Get Directions</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-ivory px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-dark-brown transition-colors hover:border-cognac"
                >
                  Send an Enquiry
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-[2rem] border border-beige-border bg-beige shadow-card aspect-[16/10]">
                <iframe
                  title="Ruchiloka Café Location Map"
                  src={BUSINESS_INFO.googleMapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          </EditorialReveal>
        </div>
      </section>

      {/* Item Customize Modal */}
      <MenuItemModal item={inspectItem} onClose={() => setInspectItem(null)} />

      {/* Gallery Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-h-[88vh] max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-dark-brown shadow-modal"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="Close image preview"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.src}
                alt={lightboxImage.caption}
                className="max-h-[78vh] w-auto object-contain"
              />
              <div className="px-6 py-4 text-center font-serif text-lg text-cream">
                {lightboxImage.caption}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
