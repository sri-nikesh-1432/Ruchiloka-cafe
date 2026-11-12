'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { BUSINESS_INFO } from '@ruchiloka/shared';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ToranBorderStrip } from '@/components/brand/TraditionalOrnaments';
import { useApp } from '@/context/AppContext';

export function Footer() {
  const { publicSettings } = useApp();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-beige-border/40 bg-dark-brown text-cream overflow-hidden">
      <div className="opacity-25">
        <ToranBorderStrip tone="light" />
      </div>

      <div className="editorial-container py-14 lg:py-18">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <BrandLogo variant="dark" layout="badge" size="lg" showSubtext />
            <p className="max-w-sm text-sm leading-relaxed text-beige/80">
              {BUSINESS_INFO.supportingCopy} Good Food. Good Mood. Visit our Kukatpally café
              for morning tiffins, freshly brewed tea &amp; coffee, burgers, pizzas, and more.
            </p>
            <div className="space-y-2.5 text-sm text-beige/85">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cognac-light" />
                <span>{publicSettings.cafeAddress}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-cognac-light" />
                <a
                  href={`tel:${publicSettings.cafePhone.replace(/\s+/g, '')}`}
                  className="hover:text-white transition-colors"
                >
                  {publicSettings.cafePhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-cognac-light" />
                <a
                  href={BUSINESS_INFO.emailHref}
                  className="hover:text-white transition-colors"
                >
                  {BUSINESS_INFO.email}
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={BUSINESS_INFO.googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-beige/25 px-4 py-2 text-xs font-medium tracking-wide text-cream transition-colors hover:border-cognac hover:bg-cognac/15"
              >
                Get Directions
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              {publicSettings.instagramUrl && (
                <a
                  href={publicSettings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-beige/25 px-4 py-2 text-xs font-medium tracking-wide text-cream transition-colors hover:border-cognac hover:bg-cognac/15"
                >
                  Instagram
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {publicSettings.facebookUrl && (
                <a
                  href={publicSettings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-beige/25 px-4 py-2 text-xs font-medium tracking-wide text-cream transition-colors hover:border-cognac hover:bg-cognac/15"
                >
                  Facebook
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation Column */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-cognac-light">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm text-beige/80">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors">
                  Full Café Menu &amp; Cards
                </Link>
              </li>
              <li>
                <Link href="/menu/tiffins" className="hover:text-white transition-colors">
                  Morning Tiffins
                </Link>
              </li>
              <li>
                <Link href="/menu/beverages" className="hover:text-white transition-colors">
                  Tea &amp; Coffee
                </Link>
              </li>
              <li>
                <Link href="/menu/continental" className="hover:text-white transition-colors">
                  Continental &amp; Snacks
                </Link>
              </li>
              <li>
                <Link href="/reserve" className="hover:text-white transition-colors">
                  Reserve a Table
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Operating Hours Column */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-cognac-light">
              Hours (IST)
            </h3>
            <ul className="space-y-4 text-sm">
              {publicSettings.operatingHours.map((slot) => (
                <li
                  key={slot.key}
                  className="border-b border-white/10 pb-3 last:border-none last:pb-0"
                >
                  <div className="flex items-center gap-2 font-medium text-white">
                    <Clock className="h-3.5 w-3.5 text-cognac-light" />
                    <span>{slot.label}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-beige/80">{slot.displayHours} IST</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Partners & Legal */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-cognac-light">
              Order Online
            </h3>
            <div className="flex flex-col gap-2.5">
              {publicSettings.swiggyListingUrl ? (
                <a
                  href={publicSettings.swiggyListingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:border-cognac hover:bg-cognac/20"
                >
                  <span>Swiggy</span>
                  <ExternalLink className="h-3.5 w-3.5 text-cognac-light" />
                </a>
              ) : (
                <Link
                  href="/order"
                  className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-beige/85 transition-colors hover:border-cognac"
                >
                  <span>Order via Swiggy</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-cognac-light" />
                </Link>
              )}

              {publicSettings.zomatoListingUrl ? (
                <a
                  href={publicSettings.zomatoListingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:border-cognac hover:bg-cognac/20"
                >
                  <span>Zomato</span>
                  <ExternalLink className="h-3.5 w-3.5 text-cognac-light" />
                </a>
              ) : (
                <Link
                  href="/order"
                  className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-beige/85 transition-colors hover:border-cognac"
                >
                  <span>Order via Zomato</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-cognac-light" />
                </Link>
              )}
            </div>

            <div className="pt-4 space-y-2 text-xs text-beige/70">
              <div>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </div>
              <div>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms &amp; Conditions
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 text-xs text-beige/65 sm:flex-row sm:items-center">
          <p>© {currentYear} Ruchiloka Café. All rights reserved.</p>
          <p className="font-serif italic text-sm text-beige/85">
            Visit. Dine. Repeat. · {BUSINESS_INFO.email}
          </p>
        </div>
      </div>
    </footer>
  );
}
