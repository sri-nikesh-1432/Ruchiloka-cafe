'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  CalendarCheck,
  UtensilsCrossed,
} from 'lucide-react';
import type { MenuCategorySlug } from '@ruchiloka/shared';
import {
  LotusMandalaWatermark,
  ToranBorderStrip,
} from '@/components/brand/TraditionalOrnaments';
import {
  BorderDrawReveal,
  EDITORIAL_EASE,
  TextReveal,
} from '@/components/motion/MotionPrimitives';

export interface OfficialMenuCard {
  id: string;
  title: string;
  subtitle: string;
  categorySlug: MenuCategorySlug;
  image: string;
  timing: string;
}

export const OFFICIAL_MENU_CARDS: OfficialMenuCard[] = [
  {
    id: 'tea-and-coffee',
    title: 'Tea & Coffee',
    subtitle: 'Traditional Chai, Filter Kaapi, RL Specials, Hot Milk & Cold Coffees',
    categorySlug: 'beverages',
    image: '/images/menu-cards/tea-and-coffee.webp',
    timing: '6:30 AM – 11:00 PM IST',
  },
  {
    id: 'sides-and-desserts',
    title: 'Sides & Desserts',
    subtitle: 'Bakery Puffs, Samosas, Calzones, Bun Maska, Brownie & Cheesecake',
    categorySlug: 'snacks',
    image: '/images/menu-cards/sides-and-desserts.webp',
    timing: '3:00 PM – 11:00 PM IST',
  },
  {
    id: 'fries-and-bites',
    title: 'Fries & Bites',
    subtitle: 'Loaded Fries, Paneer Pops, Mozzarella Sticks, Wings & Lollipops',
    categorySlug: 'snacks',
    image: '/images/menu-cards/fries-and-bites.webp',
    timing: '3:00 PM – 11:00 PM IST',
  },
  {
    id: 'burgers-and-sandwich',
    title: 'Burgers & Sandwich',
    subtitle: 'Classic Veg, Paneer, Cheese Smash Burgers & RL Special Sandwiches',
    categorySlug: 'snacks',
    image: '/images/menu-cards/burgers-and-sandwich.webp',
    timing: '3:00 PM – 11:00 PM IST',
  },
  {
    id: 'pizzas',
    title: "Pizza's (Regular / Large)",
    subtitle: 'Handcrafted Veg & Chicken Pizzas baked with mozzarella & house sauces',
    categorySlug: 'continental',
    image: '/images/menu-cards/pizzas.webp',
    timing: '3:00 PM – 11:00 PM IST',
  },
  {
    id: 'pasta-wraps-salads',
    title: 'Pasta, Wraps & Salads',
    subtitle: 'Alfredo, Neapolitan, Aglio e Olio Pastas, Wraps & Caesar Salads',
    categorySlug: 'continental',
    image: '/images/menu-cards/pasta-wraps-salads.webp',
    timing: '3:00 PM – 11:00 PM IST',
  },
];

interface MenuCardsShowcaseProps {
  id?: string;
  defaultCategory?: MenuCategorySlug | 'all';
  compactHeader?: boolean;
}

export function MenuCardsShowcase({
  id = 'official-menu-cards',
  defaultCategory = 'all',
  compactHeader = false,
}: MenuCardsShowcaseProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | string>(
    defaultCategory === 'all' ? 'all' : defaultCategory
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setSelectedFilter(defaultCategory === 'all' ? 'all' : defaultCategory);
  }, [defaultCategory]);

  const visibleCards = useMemo(() => {
    if (selectedFilter === 'all') return OFFICIAL_MENU_CARDS;
    if (
      selectedFilter === 'beverages' ||
      selectedFilter === 'snacks' ||
      selectedFilter === 'continental'
    ) {
      return OFFICIAL_MENU_CARDS.filter((c) => c.categorySlug === selectedFilter);
    }
    return OFFICIAL_MENU_CARDS.filter((c) => c.id === selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
        setZoomed(false);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % visibleCards.length
        );
        setZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + visibleCards.length) % visibleCards.length
        );
        setZoomed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, visibleCards.length]);

  const activeLightboxCard =
    lightboxIndex !== null && visibleCards[lightboxIndex]
      ? visibleCards[lightboxIndex]
      : null;

  return (
    <section
      id={id}
      className="relative overflow-hidden bg-cream py-16 sm:py-24 border-y border-beige-border/80"
    >
      {/* Traditional Subtle Watermarks */}
      <LotusMandalaWatermark className="hidden md:block absolute -left-24 top-12 h-72 w-72 text-coffee/[0.06]" />
      <LotusMandalaWatermark className="hidden md:block absolute -right-24 bottom-12 h-72 w-72 text-coffee/[0.06]" />

      <div className="editorial-container relative z-10">
        {!compactHeader && (
          <BorderDrawReveal className="mb-8 overflow-hidden rounded-full border border-beige-border/70 bg-ivory/70">
            <ToranBorderStrip className="opacity-75" />
          </BorderDrawReveal>
        )}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-2 editorial-kicker">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Official Printed Café Menu
            </span>
            <h2 className="editorial-heading text-3xl sm:text-5xl font-semibold leading-tight">
              <TextReveal>Browse Every Ruchiloka Menu Card</TextReveal>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-coffee-muted">
              From hand-brewed Tea &amp; Filter Coffee to Pizzas, Pastas, Burgers, Fries,
              and Desserts—click any menu card below to zoom in and read every offering clearly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/menu"
              className="rounded-full border border-beige-border bg-ivory px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-dark-brown transition-colors hover:border-cognac hover:text-cognac"
            >
              Interactive Menu
            </Link>
            <Link
              href="/reserve"
              className="inline-flex items-center gap-1.5 rounded-full bg-dark-brown px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-cognac"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Reserve a Table
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          role="tablist"
          aria-label="Filter printed menu cards"
          className="mt-8 flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedFilter === 'all'}
            onClick={() => setSelectedFilter('all')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              selectedFilter === 'all'
                ? 'bg-dark-brown text-cream shadow-sm'
                : 'border border-beige-border bg-ivory text-coffee hover:border-cognac hover:text-cognac'
            }`}
          >
            All 6 Menu Cards
          </button>
          {OFFICIAL_MENU_CARDS.map((card) => {
            const active = selectedFilter === card.id;
            return (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedFilter(card.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                  active
                    ? 'bg-cognac text-white shadow-sm'
                    : 'border border-beige-border bg-ivory text-coffee hover:border-cognac hover:text-cognac'
                }`}
              >
                {card.title}
              </button>
            );
          })}
        </div>

        {/* Neatly Cropped Menu Cards Grid */}
        <motion.div
          layout
          className={`mt-9 grid gap-7 ${
            visibleCards.length === 1
              ? 'max-w-lg mx-auto grid-cols-1'
              : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          <AnimatePresence mode="popLayout">
            {visibleCards.map((card, index) => (
              <motion.article
                layout
                key={card.id}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25), ease: EDITORIAL_EASE }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col rounded-[26px] border border-beige-dark/80 bg-ivory p-3.5 shadow-card transition-shadow duration-300 hover:shadow-editorial"
              >
                {/* Traditional inner hairline accent */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[6px] rounded-[20px] border border-beige-border/50"
                />

                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex(index);
                    setZoomed(false);
                  }}
                  aria-label={`Zoom in to read ${card.title} menu card`}
                  className="relative z-10 block w-full overflow-hidden rounded-[18px] border border-beige-border/80 bg-[#FEF6EB] text-left focus:outline-none focus:ring-2 focus:ring-cognac"
                >
                  <div className="relative aspect-[860/1230] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={`${card.title} official Ruchiloka Café menu`}
                      loading="lazy"
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-dark-brown/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream backdrop-blur-sm transition-colors group-hover:bg-cognac">
                    <Maximize2 className="h-3 w-3" />
                    Read Card
                  </span>
                </button>

                <div className="relative z-10 flex flex-1 flex-col justify-between gap-2 px-2 pt-3.5 pb-1">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-xl font-semibold text-dark-brown">
                        {card.title}
                      </h3>
                      <span className="rounded-full bg-beige px-2.5 py-0.5 font-mono text-[10px] font-medium text-coffee">
                        {card.timing.replace(' IST', '')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-coffee-muted">{card.subtitle}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* High-Resolution Reader Lightbox */}
      <AnimatePresence>
        {activeLightboxCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeLightboxCard.title} menu preview`}
            onClick={() => {
              setLightboxIndex(null);
              setZoomed(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-beige-border/40 bg-dark-brown shadow-modal"
            >
              {/* Lightbox Header Controls */}
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3.5 text-cream">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-white">
                    {activeLightboxCard.title}
                  </h3>
                  <p className="text-xs text-beige/75">{activeLightboxCard.timing}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomed((z) => !z)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    {zoomed ? (
                      <>
                        <ZoomOut className="h-3.5 w-3.5" /> Fit Screen
                      </>
                    ) : (
                      <>
                        <ZoomIn className="h-3.5 w-3.5" /> Zoom In
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex(null);
                      setZoomed(false);
                    }}
                    aria-label="Close menu card viewer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-cognac transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Zoom Canvas */}
              <div className="relative flex-1 overflow-auto bg-[#1B120C] p-3 sm:p-6">
                <div className="mx-auto flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeLightboxCard.image}
                    alt={`${activeLightboxCard.title} menu sheet`}
                    onClick={() => setZoomed((z) => !z)}
                    className={`cursor-zoom-in rounded-xl border border-beige-border/20 shadow-modal transition-all duration-300 ${
                      zoomed ? 'w-full max-w-[780px] cursor-zoom-out' : 'max-h-[73vh] w-auto object-contain'
                    }`}
                  />
                </div>
              </div>

              {/* Lightbox Footer Pagination */}
              {visibleCards.length > 1 && (
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-beige/85">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex((prev) =>
                        prev === null
                          ? null
                          : (prev - 1 + visibleCards.length) % visibleCards.length
                      );
                      setZoomed(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 font-semibold hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Card
                  </button>

                  <span className="font-mono text-[11px]">
                    Card {(lightboxIndex ?? 0) + 1} / {visibleCards.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex((prev) =>
                        prev === null ? null : (prev + 1) % visibleCards.length
                      );
                      setZoomed(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 font-semibold hover:bg-white/10"
                  >
                    Next Card
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
