'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  ExternalLink,
  ImageIcon,
  Instagram,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Star,
  Utensils,
  X,
} from 'lucide-react';
import {
  AUTHENTIC_GALLERY_ITEMS,
  BUSINESS_INFO,
  GALLERY_CATEGORY_LABELS,
  GOOGLE_REVIEW_SUMMARY,
  SUPPLIED_GOOGLE_REVIEWS,
  VERIFIED_LINKS,
  type AuthenticGallerySeedItem,
  type MenuItemDto,
} from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import {
  BorderDrawReveal,
  EDITORIAL_EASE,
  EditorialReveal,
  ImageMaskReveal,
  SlideReveal,
  StaggerContainer,
  StaggerItem,
  TextReveal,
} from '@/components/motion/MotionPrimitives';
import {
  BotanicalLeafSprig,
  LotusMandalaWatermark,
  SkyBlueUnderline,
  ToranBorderStrip,
  TraditionalFramedCard,
} from '@/components/brand/TraditionalOrnaments';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { MenuItemModal } from '@/components/menu/MenuItemModal';
import { MenuCardsShowcase } from '@/components/menu/MenuCardsShowcase';
import { LiveCafePill, useLiveIstStatus } from './LiveStatusBadge';

const EXPERIENCES = [
  {
    number: '01',
    title: 'Freshly Prepared Tiffins',
    subtitle: 'Start your day right',
    timing: '6:30 AM – 11:30 AM',
    href: '/menu/tiffins',
    image: '/images/exp-tiffins.webp',
    alt: 'Steamed idli, vada, and crisp dosa tiffins at Ruchiloka Café',
  },
  {
    number: '02',
    title: 'Coffee, Tea & Conversations',
    subtitle: 'Sip. Relax. Repeat.',
    timing: '6:30 AM – 11:00 PM',
    href: '/menu/beverages',
    image: '/images/exp-coffee-tea.webp',
    alt: 'Freshly brewed latte art cappuccino beside roasted coffee beans',
  },
  {
    number: '03',
    title: 'Continental Delights',
    subtitle: 'A global touch',
    timing: '3:00 PM – 11:00 PM',
    href: '/menu/continental',
    image: '/images/exp-continental.webp',
    alt: 'Creamy artisanal continental pasta served warm',
  },
];

const SIGNATURE_CATEGORY_PREVIEWS = [
  {
    title: 'Morning Tiffins',
    caption: 'Served fresh 6:30 AM – 11:30 AM',
    href: '/menu/tiffins',
    image: '/images/gallery-idli-coffee.webp',
    alt: 'South Indian idli sambar paired with filter coffee',
  },
  {
    title: 'Tea & Filter Coffee',
    caption: 'Served all day 6:30 AM – 11:00 PM',
    href: '/menu/beverages',
    image: '/images/hero-coffee-pour.webp',
    alt: 'Hot handcrafted latte coffee pour',
  },
  {
    title: 'Burgers, Fries & Sandwiches',
    caption: 'Served 3:00 PM – 11:00 PM',
    href: '/menu/snacks',
    image: '/images/gallery-sandwich-brew.webp',
    alt: 'Toasted café sandwich served beside warm brews',
  },
  {
    title: 'Pizzas, Pastas & Wraps',
    caption: 'Served 3:00 PM – 11:00 PM',
    href: '/menu/continental',
    image: '/images/exp-continental.webp',
    alt: 'Continental pasta plate at Ruchiloka Café',
  },
];

const FEATURED_GALLERY_PHOTOS: AuthenticGallerySeedItem[] = AUTHENTIC_GALLERY_ITEMS.filter(
  (item) => item.isFeaturedOnHome
);

const INSTAGRAM_PREVIEW_PHOTOS: AuthenticGallerySeedItem[] = AUTHENTIC_GALLERY_ITEMS.filter(
  (item) => item.showInInstagramPreview
);

const HOME_REVIEW_HIGHLIGHTS = [1, 4, 3, 9]
  .map((id) => SUPPLIED_GOOGLE_REVIEWS.find((review) => review.id === id))
  .filter((review): review is (typeof SUPPLIED_GOOGLE_REVIEWS)[number] => Boolean(review));

export function LandingView() {
  const { publicSettings } = useApp();
  const { statuses } = useLiveIstStatus(publicSettings.operatingHours);
  const landingRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();

  const [highlights, setHighlights] = useState<MenuItemDto[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const [inspectItem, setInspectItem] = useState<MenuItemDto | null>(null);
  const [lightboxList, setLightboxList] = useState<AuthenticGallerySeedItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const openLightbox = (items: AuthenticGallerySeedItem[], index: number) => {
    setLightboxList(items);
    setLightboxIndex(index);
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
      } else if (event.key === 'ArrowRight' && lightboxList.length > 1) {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % lightboxList.length));
      } else if (event.key === 'ArrowLeft' && lightboxList.length > 1) {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + lightboxList.length) % lightboxList.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, lightboxList.length]);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !landingRef.current) return;
    if (prefersReduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to('.js-hero-bg-photo', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.js-hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to('.js-hero-mandala', {
        rotation: 22,
        y: 34,
        ease: 'none',
        scrollTrigger: {
          trigger: '.js-hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      gsap.to('.js-hero-leaf', {
        y: -26,
        ease: 'none',
        scrollTrigger: {
          trigger: '.js-hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to('.js-hero-collage', {
        y: -16,
        ease: 'none',
        scrollTrigger: {
          trigger: '.js-hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.1,
        },
      });

      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const track = landingRef.current?.querySelector<HTMLElement>('.js-gallery-track');
        const container = landingRef.current?.querySelector<HTMLElement>('.js-gallery-viewport');
        if (!track || !container) return;

        const maxShift = Math.max(0, track.scrollWidth - container.clientWidth);
        if (maxShift > 24) {
          gsap.to(track, {
            x: -maxShift,
            ease: 'none',
            scrollTrigger: {
              trigger: '.js-gallery-filmstrip-section',
              start: 'top 84%',
              end: 'bottom 20%',
              scrub: 1.15,
              invalidateOnRefresh: true,
            },
          });
        }

        gsap.utils.toArray<HTMLElement>('.js-gallery-depth-even').forEach((card) => {
          gsap.fromTo(
            card,
            { y: 12 },
            {
              y: -12,
              ease: 'none',
              scrollTrigger: {
                trigger: '.js-gallery-filmstrip-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
              },
            }
          );
        });
      });

      gsap.to('.js-reserve-photo', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.js-reserve-card',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, landingRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  useEffect(() => {
    let cancelled = false;
    setLoadingHighlights(true);

    api.menu
      .listItems({ featured: true })
      .then((items) => {
        if (!cancelled) setHighlights(items.slice(0, 4));
      })
      .catch(() => {
        // Fallback to clean official printed menu card links if API is offline
      })
      .finally(() => {
        if (!cancelled) setLoadingHighlights(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={landingRef}>
      {/* SECTION 2: PARCHMENT & PHOTOGRAPHY HERO (calm entrance + subtle scroll parallax) */}
      <section className="js-hero-section relative overflow-hidden bg-cream pt-[96px] sm:pt-[108px] pb-16 sm:pb-24">
        {/* Background ambient café photograph softly blended into parchment */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <motion.div
            initial={prefersReduced ? false : { scale: 1.08, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.25, ease: EDITORIAL_EASE }}
            className="js-hero-bg-photo h-full w-full will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-cafe.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center opacity-25 lg:opacity-65"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/90 lg:via-cream/70 to-cream/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-cream/75" />
        </div>

        {/* Traditional Watermarks matching reference banner */}
        <BotanicalLeafSprig className="js-hero-leaf pointer-events-none absolute -left-4 top-32 hidden sm:block h-36 w-28 text-coffee/25" />
        <LotusMandalaWatermark className="js-hero-mandala pointer-events-none absolute left-[42%] top-20 hidden lg:block h-72 w-72 text-coffee/[0.12]" />

        <div className="editorial-container relative z-10 grid items-center gap-10 lg:grid-cols-12 pt-4 sm:pt-8 pb-6 sm:pb-10">
          {/* Left Editorial Typography Column */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EDITORIAL_EASE }}
              className="flex flex-wrap items-center gap-3"
            >
              <LiveCafePill windows={publicSettings.operatingHours} />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-coffee-muted">
                Kukatpally · Hyderabad
              </span>
            </motion.div>

            <h1 className="font-serif text-4xl sm:text-5xl xl:text-[3.85rem] font-semibold leading-[1.08] tracking-[-0.02em] text-dark-brown">
              <TextReveal immediate delay={0.08}>
                Every Cup. Every Bite.
              </TextReveal>{' '}
              <br />
              <span className="italic font-normal text-coffee">
                <TextReveal immediate delay={0.2}>
                  A Little More{' '}
                </TextReveal>
                <span className="relative inline-block">
                  <TextReveal immediate delay={0.3}>
                    Special.
                  </TextReveal>
                  <motion.span
                    initial={prefersReduced ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.75, delay: 0.48, ease: EDITORIAL_EASE }}
                    className="block origin-left"
                  >
                    <SkyBlueUnderline className="absolute -bottom-2 left-0 w-full h-3.5" />
                  </motion.span>
                </span>
              </span>
            </h1>

            <motion.p
              initial={prefersReduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: EDITORIAL_EASE }}
              className="max-w-lg text-base sm:text-[17px] leading-relaxed text-coffee"
            >
              {BUSINESS_INFO.supportingCopy} Crafted fresh from dawn in Vivekananda Nagar with
              traditional warmth.
            </motion.p>

            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.36, ease: EDITORIAL_EASE }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2.5 rounded-full bg-coffee px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-editorial transition-all hover:bg-dark-brown active:scale-[0.98]"
              >
                <span>Explore Our Menu</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/reserve"
                className="inline-flex items-center gap-2 rounded-full border border-beige-dark bg-ivory px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-dark-brown shadow-card transition-all hover:border-cognac hover:text-cognac active:scale-[0.98]"
              >
                <CalendarCheck className="h-4 w-4 text-cognac" />
                <span>Reserve a Table</span>
              </Link>

              <a
                href="#official-menu-cards"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cognac hover:text-dark-brown transition-colors"
              >
                <span>View Menu Cards</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>

            {/* Calm Scroll Cue fading once scrolled */}
            {!prefersReduced && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: hasScrolled ? 0 : 0.85 }}
                transition={{ duration: 0.4 }}
                aria-hidden="true"
                className="hidden sm:inline-flex items-center gap-2.5 pt-3 text-[10px] font-mono uppercase tracking-[0.22em] text-coffee-muted"
              >
                <span className="relative h-6 w-[1px] overflow-hidden bg-beige-border">
                  <motion.span
                    animate={{ y: ['-100%', '100%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="block h-3 w-full bg-cognac"
                  />
                </span>
                <span>Scroll to discover</span>
              </motion.div>
            )}
          </div>

          {/* Right Layered Real Café & Culinary Photography Collage */}
          <div className="lg:col-span-6">
            <div className="js-hero-collage relative grid grid-cols-12 gap-3.5 items-end max-w-xl mx-auto lg:ml-auto will-change-transform">
              {/* Coffee Pour Card */}
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.14, ease: EDITORIAL_EASE }}
                className="col-span-7 overflow-hidden rounded-[26px] border-2 border-ivory bg-ivory p-2 shadow-editorial"
              >
                <ImageMaskReveal immediate delay={0.18} roundedClass="rounded-[18px]">
                  <div className="relative aspect-[4/4.3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/hero-coffee-pour.webp"
                      alt="Freshly brewed coffee cup poured at Ruchiloka Café"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </ImageMaskReveal>
              </motion.div>

              {/* Golden Masala Dosa + Official Crest Stamp Stack */}
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.24, ease: EDITORIAL_EASE }}
                className="col-span-5 space-y-3.5"
              >
                <div className="flex items-center justify-center rounded-2xl border border-beige-dark/70 bg-[#FFF6D5] px-3 py-2.5 shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/brand/ruchiloka-logo.png"
                    alt="Ruchiloka Café official medallion emblem"
                    className="h-14 w-14 object-contain"
                  />
                  <div className="ml-2.5 leading-tight text-left">
                    <p className="font-serif text-sm font-semibold text-dark-brown">Ruchiloka</p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-coffee-muted">
                      Est. Kukatpally
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[22px] border-2 border-ivory bg-ivory p-1.5 shadow-editorial">
                  <ImageMaskReveal immediate delay={0.28} roundedClass="rounded-[16px]">
                    <div className="relative aspect-[4/3.6] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/exp-tiffins.webp"
                        alt="Crispy dosa served with sambar and traditional chutneys"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </ImageMaskReveal>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: OVERLAPPING 3-CARD EXPERIENCE STRIP (sequential staggered reveal + mask) */}
      <section aria-label="Café Experiences" className="relative z-20 -mt-8 sm:-mt-12 pb-12">
        <div className="editorial-container">
          <EditorialReveal yOffset={24}>
            <TraditionalFramedCard className="bg-ivory/95 backdrop-blur-sm">
              <StaggerContainer
                staggerDelay={0.1}
                className="grid divide-y divide-beige-border/75 md:grid-cols-3 md:divide-x md:divide-y-0"
              >
                {EXPERIENCES.map((exp, idx) => (
                  <StaggerItem key={exp.number}>
                    <Link
                      href={exp.href}
                      className="group flex items-center gap-4 p-4 sm:p-5 transition-colors hover:bg-beige-soft/75"
                    >
                      <ImageMaskReveal
                        delay={idx * 0.08}
                        roundedClass="rounded-2xl"
                        className="relative h-20 w-24 sm:h-24 sm:w-28 shrink-0 border border-beige-border bg-beige"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={exp.image}
                          alt={exp.alt}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </ImageMaskReveal>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cognac">
                          <span>{exp.number}</span>
                          <span>·</span>
                          <span>{exp.timing}</span>
                        </div>
                        <h2 className="font-serif text-lg sm:text-xl font-semibold leading-snug text-dark-brown group-hover:text-cognac transition-colors">
                          {exp.title}
                        </h2>
                        <p className="text-xs text-coffee-muted">{exp.subtitle}</p>
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </TraditionalFramedCard>
          </EditorialReveal>
        </div>
      </section>

      {/* SECTION 4 & 5: MENU HIGHLIGHTS + LIVE IST OPERATING HOURS SIDE-BY-SIDE */}
      <section className="py-12 sm:py-16 bg-cream">
        <div className="editorial-container">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left: Menu Highlights */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4">
                <div>
                  <span className="editorial-kicker">— Our Menu —</span>
                  <h2 className="mt-1.5 editorial-heading text-3xl sm:text-4xl font-semibold">
                    <TextReveal>Menu Highlights</TextReveal>
                  </h2>
                  <p className="mt-1 text-sm text-coffee-muted">
                    A blend of traditional tiffins, brewed coffee, and contemporary continental plates.
                  </p>
                </div>

                <Link
                  href="/menu"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-coffee px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-all hover:bg-dark-brown active:scale-[0.97]"
                >
                  <span>View Full Menu</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <BorderDrawReveal>
                <div className="h-px w-full bg-beige-border" />
              </BorderDrawReveal>

              {loadingHighlights ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((sk) => (
                    <div
                      key={sk}
                      className="h-56 animate-pulse rounded-2xl border border-beige-border bg-ivory"
                    />
                  ))}
                </div>
              ) : highlights.length > 0 ? (
                <StaggerContainer className="grid gap-5 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <StaggerItem key={item.id}>
                      <MenuItemCard item={item} onInspect={setInspectItem} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                /* Clean factual category showcases without invented item prices */
                <StaggerContainer
                  staggerDelay={0.08}
                  className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                  {SIGNATURE_CATEGORY_PREVIEWS.map((cat) => (
                    <StaggerItem key={cat.title}>
                      <Link
                        href={cat.href}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-beige-dark/70 bg-ivory shadow-card transition-all hover:-translate-y-0.5 hover:border-cognac hover:shadow-editorial"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-beige">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cat.image}
                            alt={cat.alt}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-3.5">
                          <div>
                            <h3 className="font-serif text-lg font-semibold text-dark-brown group-hover:text-cognac transition-colors">
                              {cat.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-coffee-muted">{cat.caption}</p>
                          </div>
                          <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-cognac">
                            Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>

            {/* Right: Live IST Operating Hours Card (row-by-row reveal) */}
            <SlideReveal direction="right" className="lg:col-span-4">
              <TraditionalFramedCard className="bg-beige-soft/90 p-6 sm:p-7">
                <BotanicalLeafSprig className="pointer-events-none absolute -right-4 -bottom-4 h-28 w-24 text-coffee/15" />

                <div className="flex items-center gap-2.5">
                  <motion.span
                    initial={prefersReduced ? false : { rotate: -24, opacity: 0.7 }}
                    whileInView={{ rotate: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: EDITORIAL_EASE }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory border border-beige-border text-cognac"
                  >
                    <Clock className="h-4 w-4" />
                  </motion.span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-2xl font-semibold text-dark-brown leading-none">
                        Operating Hours
                      </h2>
                      <Link
                        href="/timings"
                        className="font-mono text-[10px] uppercase tracking-wider text-cognac hover:underline font-semibold"
                      >
                        Live Clock →
                      </Link>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-coffee-muted">
                      Ruchiloka Café · Asia/Kolkata (IST)
                    </p>
                  </div>
                </div>

                <StaggerContainer staggerDelay={0.09} className="mt-5 divide-y divide-beige-border/80">
                  {statuses.map((slot) => (
                    <StaggerItem key={slot.key} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-dark-brown">{slot.label}</span>
                        <span className="font-mono text-xs font-bold text-coffee">
                          {slot.displayHours}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-coffee-muted">
                        {/* Traditional Typography Status Badge (NO BLUE DOT) */}
                        <span
                          className={`inline-flex items-center gap-1.5 font-serif text-xs font-bold uppercase tracking-wider ${
                            slot.isOpen ? 'text-dark-brown' : 'text-coffee-soft'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              slot.isOpen
                                ? 'bg-cognac shadow-[0_0_6px_rgba(194,113,79,0.8)]'
                                : 'bg-coffee-soft/70'
                            }`}
                          />
                          {slot.statusText}
                        </span>
                        <span>{slot.nextChangeText}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                <div className="mt-5 pt-3.5 border-t border-beige-border">
                  <Link
                    href="/timings"
                    className="group inline-flex items-center justify-between w-full rounded-xl border border-cognac/30 bg-ivory px-4 py-2.5 text-xs font-semibold text-dark-brown hover:border-cognac hover:bg-[#FFF9F2] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-cognac group-hover:rotate-12 transition-transform" />
                      <span>View Full Timings &amp; Live Wall Clock</span>
                    </div>
                    <span className="text-cognac font-mono text-[11px] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Link>
                </div>
              </TraditionalFramedCard>
            </SlideReveal>
          </div>
        </div>
      </section>

      {/* OFFICIAL CROPPED PRINTED MENU CARDS ON LANDING PAGE */}
      <MenuCardsShowcase id="official-menu-cards" />

      {/* SECTION 6, 7 & 8: CINEMATIC GALLERY FILMSTRIP + BENTO ROW (GALLERY · RESERVATIONS · LOCATION) */}
      <section className="py-16 sm:py-24 bg-beige-soft">
        <div className="editorial-container space-y-10">
          {/* Desktop Scroll-Linked Horizontal Gallery & Mobile Touch Strip */}
          <div className="js-gallery-filmstrip-section space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="editorial-kicker">— Café Atmosphere —</span>
                <h2 className="mt-1 editorial-heading text-3xl sm:text-4xl font-semibold">
                  <TextReveal>Warmth, Brews &amp; Tables</TextReveal>
                </h2>
              </div>
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-coffee-muted">
                Click any frame to inspect full view
              </p>
            </div>

            <div className="js-gallery-viewport overflow-x-auto lg:overflow-hidden pb-3 -mx-1 px-1">
              <div className="js-gallery-track flex gap-4 sm:gap-5 snap-x snap-mandatory lg:snap-none w-max lg:w-max">
                {FEATURED_GALLERY_PHOTOS.map((photo, idx) => (
                  <button
                    key={photo.slug}
                    type="button"
                    onClick={() => openLightbox(FEATURED_GALLERY_PHOTOS, idx)}
                    className={`group relative snap-start w-64 sm:w-72 lg:w-[290px] shrink-0 overflow-hidden rounded-[22px] border border-beige-dark/80 bg-ivory p-2 text-left shadow-card transition-shadow hover:border-cognac hover:shadow-editorial focus:outline-none focus:ring-2 focus:ring-cognac ${
                      idx % 2 === 1 ? 'js-gallery-depth-even lg:mt-4' : ''
                    }`}
                  >
                    <ImageMaskReveal delay={Math.min(idx * 0.06, 0.3)} roundedClass="rounded-[16px]">
                      <div className="relative aspect-[4/3] overflow-hidden bg-beige">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageUrl}
                          alt={photo.altText}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                        <span className="absolute bottom-2.5 left-3 right-3 font-serif text-base font-medium text-white">
                          {photo.title}
                        </span>
                      </div>
                    </ImageMaskReveal>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-7 lg:grid-cols-12 items-stretch">
            {/* 1. Café Gallery Preview Card */}
            <EditorialReveal delay={0.04} className="lg:col-span-4 flex">
              <TraditionalFramedCard className="w-full bg-ivory p-6 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-dark-brown">
                      <ImageIcon className="h-4 w-4 text-cognac" />
                      <h2 className="font-serif text-2xl font-semibold">Café Gallery</h2>
                    </div>
                    <Link
                      href="/gallery"
                      className="inline-flex items-center gap-1 rounded-full border border-beige-border bg-cream px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac transition-colors"
                    >
                      Explore Our Gallery <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-coffee-muted">
                    Real moments from our Kukatpally courtyard, juice counter, plates, and @ruchilokacafe.in.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    {FEATURED_GALLERY_PHOTOS.slice(0, 3).map((photo, idx) => (
                      <button
                        key={photo.slug}
                        type="button"
                        onClick={() => openLightbox(FEATURED_GALLERY_PHOTOS, idx)}
                        className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-beige-border bg-beige focus:outline-none focus:ring-2 focus:ring-cognac"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageUrl}
                          alt={photo.altText}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-beige-border/70 flex items-center justify-between text-xs text-coffee-muted">
                  <button
                    type="button"
                    onClick={() => setShowFullGallery((prev) => !prev)}
                    className="font-medium text-cognac hover:underline focus:outline-none"
                  >
                    {showFullGallery ? 'Hide quick grid' : 'Quick expand highlights'}
                  </button>
                  <Coffee className="h-4 w-4 text-cognac" />
                </div>
              </TraditionalFramedCard>
            </EditorialReveal>

            {/* 2. Find Your Table Prominent Reservation Card (clip-path reveal + depth parallax) */}
            <EditorialReveal delay={0.12} className="lg:col-span-4 flex">
              <div className="js-reserve-card w-full relative overflow-hidden rounded-[26px] border border-beige-dark bg-[#EAD3B5]/70 p-6 shadow-card flex flex-col justify-between">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[6px] rounded-[20px] border border-coffee/15"
                />
                <div className="relative z-10 grid grid-cols-12 gap-4 items-center h-full">
                  <SlideReveal direction="left" className="col-span-7 space-y-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ivory text-cognac shadow-xs">
                      <Utensils className="h-4 w-4" />
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-dark-brown">
                      Find Your Table
                    </h2>
                    <p className="text-xs leading-relaxed text-coffee">
                      Reserve a cosy corner for morning tiffins, coffee catch-ups, or evening dinners
                      with instant IST slot booking.
                    </p>
                    <div className="pt-1">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-block"
                      >
                        <Link
                          href="/reserve"
                          className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-cognac"
                        >
                          <span>Reserve Now</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </motion.div>
                    </div>
                  </SlideReveal>

                  <div className="col-span-5">
                    <ImageMaskReveal roundedClass="rounded-2xl" className="border border-ivory shadow-card">
                      <div className="js-reserve-photo aspect-[3/4] overflow-hidden will-change-transform">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/gallery-pastry-plate.webp"
                          alt="Reserved café table with coffee and fresh bake"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </ImageMaskReveal>
                  </div>
                </div>
              </div>
            </EditorialReveal>

            {/* 3. Our Location Card with Map & ruchiloka.in@gmail.com */}
            <EditorialReveal delay={0.18} className="lg:col-span-4 flex">
              <TraditionalFramedCard className="w-full bg-ivory p-6 flex flex-col justify-between space-y-4">
                <StaggerContainer staggerDelay={0.07} className="space-y-3">
                  <StaggerItem className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cognac shrink-0" />
                    <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                      Our Location
                    </h2>
                  </StaggerItem>

                  <StaggerItem>
                    <p className="text-xs leading-relaxed text-coffee-muted">
                      {BUSINESS_INFO.address.line1}, {BUSINESS_INFO.address.line2},{' '}
                      {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.state}{' '}
                      {BUSINESS_INFO.address.postalCode}
                    </p>
                  </StaggerItem>

                  <StaggerItem className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-coffee">
                    <a
                      href={`tel:${publicSettings.cafePhone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 font-mono font-semibold hover:text-cognac transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-cognac" />
                      {publicSettings.cafePhone}
                    </a>
                    <a
                      href={BUSINESS_INFO.emailHref}
                      className="inline-flex items-center gap-1.5 font-medium hover:text-cognac transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5 text-cognac" />
                      {BUSINESS_INFO.email}
                    </a>
                  </StaggerItem>
                </StaggerContainer>

                <motion.div
                  initial={prefersReduced ? false : { opacity: 0.4, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, ease: EDITORIAL_EASE }}
                  className="relative overflow-hidden rounded-2xl border border-beige-border bg-beige aspect-[16/9]"
                >
                  <iframe
                    title="Ruchiloka Café Location Map"
                    src={BUSINESS_INFO.googleMapsEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full border-0"
                  />
                  <a
                    href={BUSINESS_INFO.googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-full bg-dark-brown/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream shadow-md backdrop-blur-sm transition-colors hover:bg-cognac"
                  >
                    <span>Get Directions</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </motion.div>
              </TraditionalFramedCard>
            </EditorialReveal>
          </div>

          {/* Expandable Full Gallery Grid */}
          <AnimatePresence>
            {showFullGallery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <ToranBorderStrip className="mb-6 opacity-60" />
                  <EditorialReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURED_GALLERY_PHOTOS.map((photo, idx) => (
                      <button
                        key={photo.slug}
                        type="button"
                        onClick={() => openLightbox(FEATURED_GALLERY_PHOTOS, idx)}
                        className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-beige-border bg-ivory text-left shadow-card focus:outline-none focus:ring-2 focus:ring-cognac"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageUrl}
                          alt={photo.altText}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <span className="block font-serif text-base font-medium text-white">
                            {photo.title}
                          </span>
                          <span className="block text-[11px] text-white/80">
                            {GALLERY_CATEGORY_LABELS[photo.categorySlug]} · {photo.attribution}
                          </span>
                        </div>
                      </button>
                    ))}
                  </EditorialReveal>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact Authentic Instagram Preview Strip (@ruchilokacafe.in) */}
          <div className="pt-4">
            <ToranBorderStrip className="mb-8 opacity-60" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
              <div>
                <span className="editorial-kicker">— Official Instagram —</span>
                <h2 className="mt-1 editorial-heading text-2xl sm:text-3xl font-semibold">
                  <TextReveal>Stories from {VERIFIED_LINKS.instagramHandle}</TextReveal>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={VERIFIED_LINKS.instagramProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-beige-dark bg-ivory px-4 py-2 text-xs font-semibold text-dark-brown shadow-card transition-colors hover:border-cognac hover:text-cognac"
                >
                  <Instagram className="h-3.5 w-3.5 text-cognac" />
                  Follow on Instagram
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
                <Link
                  href="/gallery"
                  className="btn-espresso inline-flex items-center gap-1.5 text-xs"
                >
                  Full Photo Archive <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {INSTAGRAM_PREVIEW_PHOTOS.slice(0, 6).map((post, idx) => (
                <div
                  key={post.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-beige-dark/80 bg-ivory shadow-card transition-all hover:border-cognac hover:shadow-editorial"
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(INSTAGRAM_PREVIEW_PHOTOS, idx)}
                    className="relative aspect-[4/5] w-full overflow-hidden bg-beige text-left focus:outline-none focus:ring-2 focus:ring-cognac"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.altText}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-dark-brown/75 px-2.5 py-0.5 text-[10px] font-medium text-cream backdrop-blur-sm">
                      {post.isCustomerOrCreator ? 'Featured' : 'Official Post'}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col justify-between p-3 space-y-2">
                    <div>
                      <p className="font-serif text-sm font-semibold text-dark-brown line-clamp-1">
                        {post.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-coffee-muted line-clamp-2">
                        {post.attribution}
                      </p>
                    </div>
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-cognac hover:underline"
                    >
                      View post <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: GOOGLE BUSINESS PROFILE & CUSTOMER FEEDBACK PREVIEW */}
      <section className="relative overflow-hidden bg-cream py-16 sm:py-24">
        <div className="editorial-container space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2 max-w-2xl">
              <span className="editorial-kicker">— Guest Feedback —</span>
              <h2 className="editorial-heading text-3xl sm:text-4xl font-semibold">
                <TextReveal>Voices from Ruchiloka</TextReveal>
              </h2>
              <p className="text-sm text-coffee-muted leading-relaxed">
                Real reviews from guests who visited our Vivekananda Nagar courtyard for morning
                pesarattu, handcrafted milkshakes, fresh juices, and evening conversations.
              </p>
            </div>

            <TraditionalFramedCard className="bg-ivory px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cognac/15 text-cognac">
                  <Star className="h-5 w-5 fill-cognac text-cognac" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold text-dark-brown">
                      {GOOGLE_REVIEW_SUMMARY.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-coffee-muted">/ 5.0</span>
                  </div>
                  <p className="text-[11px] text-coffee-muted">
                    {GOOGLE_REVIEW_SUMMARY.reviewCount} Google Reviews
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-beige-border hidden sm:block" />
              <a
                href={VERIFIED_LINKS.googleMapsCanonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-beige-dark bg-cream px-4 py-2 text-xs font-semibold text-dark-brown hover:border-cognac transition-colors"
              >
                Read Our Google Reviews <ExternalLink className="h-3.5 w-3.5 text-cognac" />
              </a>
            </TraditionalFramedCard>
          </div>

          <div className="flex flex-wrap gap-2">
            {GOOGLE_REVIEW_SUMMARY.topicHighlights.slice(0, 7).map((topic) => (
              <span
                key={topic.label}
                className="rounded-full border border-beige-border bg-ivory px-3.5 py-1 text-xs text-coffee-muted"
              >
                {topic.label} <strong className="text-dark-brown">({topic.count})</strong>
              </span>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {HOME_REVIEW_HIGHLIGHTS.map((review) => (
              <TraditionalFramedCard
                key={review.id}
                className="bg-ivory p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-lg font-semibold text-dark-brown leading-snug">
                        {review.reviewerName}
                      </p>
                      <p className="text-[11px] text-coffee-muted">
                        {review.postedAgo}
                        {review.visitDetails ? ` · ${review.visitDetails}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-beige-soft px-2.5 py-0.5 text-[10px] font-medium text-cognac">
                      Google
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-dark-brown/90 whitespace-pre-line">
                    &ldquo;{review.reviewText}&rdquo;
                  </p>
                </div>

                {review.ownerResponse && (
                  <div className="rounded-xl border border-beige-border/80 bg-cream/70 px-3 py-2 text-xs text-coffee-muted">
                    <span className="font-semibold text-dark-brown">Owner reply: </span>
                    {review.ownerResponse}
                  </div>
                )}
              </TraditionalFramedCard>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-xs text-coffee-muted">
              Individual Google star counts are shown only when explicitly recorded; overall Google score is 4.7/5 across 57 reviews.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/reviews"
                className="rounded-full border border-beige-dark bg-ivory px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-dark-brown transition-colors hover:border-cognac"
              >
                View All Reviews →
              </Link>
              <Link
                href="/reviews#write-review"
                className="btn-espresso inline-flex items-center gap-2 text-xs"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Write a Review
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Item Customize Modal */}
      <MenuItemModal item={inspectItem} onClose={() => setInspectItem(null)} />

      {/* Gallery Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxList[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-dark-brown shadow-modal"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close image preview"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
              {lightboxList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null
                          ? null
                          : (prev - 1 + lightboxList.length) % lightboxList.length
                      )
                    }
                    aria-label="Previous photograph"
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null ? null : (prev + 1) % lightboxList.length
                      )
                    }
                    aria-label="Next photograph"
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="flex items-center justify-center bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxList[lightboxIndex].imageUrl}
                  alt={lightboxList[lightboxIndex].altText}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
              <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-serif text-lg text-cream">
                    {lightboxList[lightboxIndex].title}
                  </h3>
                  <p className="text-xs text-beige/80">
                    {lightboxList[lightboxIndex].caption} · {lightboxList[lightboxIndex].attribution}
                  </p>
                </div>
                <a
                  href={lightboxList[lightboxIndex].sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-medium text-cream hover:border-cognac-light"
                >
                  Source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
