'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag, User, X, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useApp } from '@/context/AppContext';
import { EDITORIAL_EASE } from '@/components/motion/MotionPrimitives';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Our Menu' },
  { href: '/about', label: 'About Us' },
  { href: '/reserve', label: 'Reservations' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, cart, openCartDrawer } = useApp();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const overHero = isHome && !scrolled && !mobileOpen;

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          overHero
            ? 'bg-transparent py-4 text-white'
            : 'border-b border-beige-border/80 bg-cream/92 py-3 text-dark-brown backdrop-blur-md shadow-sm'
        }`}
      >
        <div className="editorial-container flex items-center justify-between gap-4">
          <BrandLogo variant={overHero ? 'transparent-hero' : 'light'} size="md" showSubtext />

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const active = isRouteActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1.5 text-sm font-medium tracking-wide transition-colors ${
                    overHero
                      ? active
                        ? 'text-white'
                        : 'text-white/85 hover:text-white'
                      : active
                        ? 'text-cognac'
                        : 'text-coffee hover:text-cognac'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active-underline"
                      transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                      className={`absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full ${
                        overHero ? 'bg-cognac-light' : 'bg-cognac'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                  overHero
                    ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                    : 'border-beige-border bg-beige text-coffee hover:border-cognac hover:text-cognac'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cognac" />
                Admin
              </Link>
            )}

            <Link
              href={user ? '/profile' : '/login'}
              className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all ${
                overHero
                  ? 'border-white/35 bg-white/10 text-white hover:bg-white/20'
                  : 'border-beige-border bg-ivory text-dark-brown hover:border-cognac hover:text-cognac'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </Link>

            <button
              type="button"
              onClick={openCartDrawer}
              aria-label={`Open tray with ${cart.itemCount} items`}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all ${
                overHero
                  ? 'bg-cognac text-white hover:bg-cognac-hover shadow-sm'
                  : 'bg-dark-brown text-cream hover:bg-coffee shadow-sm'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Tray</span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={cart.itemCount}
                  initial={{ scale: 0.75, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 font-mono text-[11px] font-bold text-dark-brown"
                >
                  {cart.itemCount}
                </motion.span>
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border lg:hidden transition-colors ${
                overHero
                  ? 'border-white/35 text-white hover:bg-white/15'
                  : 'border-beige-border text-dark-brown hover:bg-beige'
              }`}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EDITORIAL_EASE }}
            className="fixed inset-x-0 top-[68px] z-30 border-b border-beige-border bg-cream/98 px-6 pb-8 pt-6 shadow-editorial backdrop-blur-lg lg:hidden"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = isRouteActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                      active
                        ? 'bg-beige text-cognac'
                        : 'text-dark-brown hover:bg-beige-soft'
                    }`}
                  >
                    <span>{link.label}</span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-cognac" />}
                  </Link>
                );
              })}

              <div className="my-3 h-px bg-beige-border" />

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  className="flex items-center justify-center gap-2 rounded-xl border border-beige-border bg-ivory px-4 py-3 text-sm font-medium text-dark-brown"
                >
                  <ShoppingBag className="h-4 w-4 text-cognac" />
                  Cart ({cart.itemCount})
                </Link>
                <Link
                  href={user ? '/profile' : '/login'}
                  className="flex items-center justify-center gap-2 rounded-xl bg-dark-brown px-4 py-3 text-sm font-medium text-cream"
                >
                  <User className="h-4 w-4" />
                  {user ? 'Profile' : 'Sign In'}
                </Link>
              </div>

              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-cognac/30 bg-cognac-light/30 px-4 py-3 text-sm font-semibold text-coffee"
                >
                  <ShieldCheck className="h-4 w-4 text-cognac" />
                  Admin Dashboard
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
