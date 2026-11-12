import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Coffee, HeartHandshake, MapPin } from 'lucide-react';
import { BUSINESS_INFO, DEFAULT_OPERATING_WINDOWS } from '@ruchiloka/shared';
import {
  EditorialReveal,
  PageTransitionWrapper,
  ParallaxFrame,
} from '@/components/motion/MotionPrimitives';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Discover the story, culinary heritage, and hospitality of Ruchiloka Café in Kukatpally, Hyderabad.',
};

export default function AboutPage() {
  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <section className="editorial-container">
        <div className="grid gap-12 lg:grid-cols-12 items-center border-b border-beige-border pb-16">
          <div className="lg:col-span-6 space-y-6">
            <span className="editorial-kicker">Our Story · Kukatpally</span>
            <h1 className="editorial-heading text-4xl sm:text-6xl font-semibold leading-tight">
              A warm table for every hour of the day.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-coffee-muted">
              At Ruchiloka Café, hospitality begins early—with steaming morning idlis, crisp dosas,
              and freshly roasted filter coffee before the city wakes up, stretching smoothly into
              afternoon chai conversations and continental plates after dusk.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
              >
                Explore Our Menu
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reserve"
                className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-ivory px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac transition-colors"
              >
                Book a Table
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-[2.5rem] border border-beige-border bg-beige aspect-[4/3]">
              <ParallaxFrame offset={24} className="h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero-cafe.webp"
                  alt="Warm interior seating at Ruchiloka Café"
                  className="h-full w-full object-cover"
                />
              </ParallaxFrame>
            </div>
          </div>
        </div>

        {/* Three Pillars */}
        <EditorialReveal className="py-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-beige-border bg-ivory p-8 space-y-4">
            <Coffee className="h-6 w-6 text-cognac" />
            <h2 className="font-serif text-2xl font-semibold text-dark-brown">
              Crafted Brews All Day
            </h2>
            <p className="text-sm leading-relaxed text-coffee-muted">
              From traditional brass-davara South Indian filter kaapi and spiced masala chai to
              espresso-bar cappuccinos served continuously from 6:30 AM until 11:00 PM IST.
            </p>
          </div>

          <div className="rounded-3xl border border-beige-border bg-ivory p-8 space-y-4">
            <Clock className="h-6 w-6 text-cognac" />
            <h2 className="font-serif text-2xl font-semibold text-dark-brown">
              Honest Kitchen Windows
            </h2>
            <p className="text-sm leading-relaxed text-coffee-muted">
              Each service window is timed so dishes are prepared fresh—morning tiffins until 11:30
              AM and continental bakes &amp; snacks starting at 3:00 PM.
            </p>
          </div>

          <div className="rounded-3xl border border-beige-border bg-ivory p-8 space-y-4">
            <HeartHandshake className="h-6 w-6 text-cognac" />
            <h2 className="font-serif text-2xl font-semibold text-dark-brown">
              Rooted in Vivekananda Nagar
            </h2>
            <p className="text-sm leading-relaxed text-coffee-muted">
              Designed as a neighbourhood gathering room on Road Number 25—where families start
              their mornings and friends linger over evening bites.
            </p>
          </div>
        </EditorialReveal>

        {/* Address & Hours Strip */}
        <EditorialReveal className="rounded-[2rem] border border-beige-border bg-beige-soft p-8 sm:p-12 grid gap-8 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="editorial-kicker">Visit Us</span>
            <h2 className="font-serif text-3xl font-semibold text-dark-brown">
              {BUSINESS_INFO.name}
            </h2>
            <p className="flex items-start gap-2.5 text-sm text-coffee-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cognac" />
              <span>{BUSINESS_INFO.address.full}</span>
            </p>
            <p className="text-xs text-coffee">
              Phone: <a href={BUSINESS_INFO.phoneHref} className="font-mono hover:text-cognac">{BUSINESS_INFO.phone}</a> · Email: <a href={BUSINESS_INFO.emailHref} className="font-medium hover:text-cognac">{BUSINESS_INFO.email}</a>
            </p>
          </div>
          <div className="lg:col-span-6 grid gap-3 sm:grid-cols-3">
            {DEFAULT_OPERATING_WINDOWS.map((win) => (
              <div key={win.key} className="rounded-2xl border border-beige-border bg-ivory p-4">
                <p className="font-serif text-base font-semibold text-dark-brown">{win.label}</p>
                <p className="mt-1 font-mono text-xs text-cognac">{win.displayHours}</p>
              </div>
            ))}
          </div>
        </EditorialReveal>
      </section>
    </PageTransitionWrapper>
  );
}
