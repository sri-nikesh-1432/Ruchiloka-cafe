'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, ShoppingBag, User, X, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ToranBorderStrip } from '@/components/brand/TraditionalOrnaments';
import { useApp } from '@/context/AppContext';
import { EDITORIAL_EASE, ScrollProgressBar } from '@/components/motion/MotionPrimitives';

const MENU_DROPDOWN = [
  { href: '/menu', label: 'All Menu & Printed Cards' },
  { href: '/menu/tiffins', label: 'Tiffins (6:30 AM – 11:30 AM)' },
  { href: '/menu/beverages', label: 'Tea & Coffee (6:30 AM – 11:00 PM)' },
  { href: '/menu/continental', label: 'Continental (3:00 PM – 11:00 PM)' },
  { href: '/menu/snacks', label: 'Fries, Burgers & Snacks (3:00 PM – 11:00 PM)' },
];

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Our Menu', hasDropdown: true },
  { href: '/about', label: 'About Us' },
  { href: '/reserve', label: 'Reservations' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const { user, cart, openCartDrawer } = useApp();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 28);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuDropdownOpen(false);
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
            ? 'bg-cream/85 backdrop-blur-sm text-dark-brown border-b border-beige-border/40'
            : 'bg-cream/95 text-dark-brown border-b border-beige-border/80 backdrop-blur-md shadow-sm'
        }`}
      >
        {/* Traditional toran border along the top edge matching Ruchiloka's brand artwork */}
        <div className="bg-cream/95 border-b border-beige-border/40">
          <ToranBorderStrip className="opacity-85" />
        </div>

        <div className="editorial-container flex items-center justify-between gap-4 py-2.5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
          >
            <BrandLogo variant="light" layout="lockup" size="md" showSubtext />
          </motion.div>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link, idx) => {
              const active = isRouteActive(link.href);

              if (link.hasDropdown) {
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * idx, ease: EDITORIAL_EASE }}
                    className="relative"
                    onMouseEnter={() => setMenuDropdownOpen(true)}
                    onMouseLeave={() => setMenuDropdownOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className={`relative inline-flex items-center gap-1 py-1.5 text-sm font-medium tracking-wide transition-colors ${
                        active ? 'text-cognac' : 'text-coffee hover:text-cognac'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          menuDropdownOpen ? 'rotate-180 text-cognac' : ''
                        }`}
                      />
                      {active && (
                        <motion.span
                          layoutId="nav-active-underline"
                          transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                          className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-cognac"
                        />
                      )}
                    </Link>

                    <AnimatePresence>
                      {menuDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="absolute left-0 top-full pt-2 w-72 z-50"
                        >
                          <div className="rounded-2xl border border-beige-border bg-ivory p-2 shadow-editorial">
                            {MENU_DROPDOWN.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className="block rounded-xl px-3.5 py-2.5 text-xs font-medium text-dark-brown transition-colors hover:bg-beige-soft hover:text-cognac"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * idx, ease: EDITORIAL_EASE }}
                >
                  <Link
                    href={link.href}
                    className={`relative inline-block py-1.5 text-sm font-medium tracking-wide transition-colors ${
                      active ? 'text-cognac' : 'text-coffee hover:text-cognac'
                    }`}
                  >
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active-underline"
                        transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                        className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-cognac"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-beige-border bg-beige px-3 py-1.5 text-xs font-semibold tracking-wide text-coffee transition-colors hover:border-cognac hover:text-cognac"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cognac" />
                Admin
              </Link>
            )}

            <Link
              href={user ? '/profile' : '/login'}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-beige-border bg-ivory px-4 py-2 text-xs font-semibold tracking-wider text-dark-brown shadow-xs transition-all hover:border-cognac hover:text-cognac"
            >
              <User className="h-3.5 w-3.5 text-cognac" />
              <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </Link>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={openCartDrawer}
              aria-label={`Open tray with ${cart.itemCount} items`}
              className="relative inline-flex items-center gap-2 rounded-full bg-dark-brown px-4 py-2 text-xs font-semibold tracking-wider uppercase text-cream shadow-sm transition-all hover:bg-coffee"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Tray</span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={cart.itemCount}
                  initial={{ scale: 0.7, opacity: 0.6 }}
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                  className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ivory px-1.5 font-mono text-[11px] font-bold text-dark-brown"
                >
                  {cart.itemCount}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-beige-border bg-ivory text-dark-brown transition-colors hover:bg-beige lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <ScrollProgressBar />
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EDITORIAL_EASE }}
            className="fixed inset-x-0 top-[92px] z-30 border-b border-beige-border bg-cream/98 px-6 pb-8 pt-6 shadow-editorial backdrop-blur-lg lg:hidden"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = isRouteActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                      active ? 'bg-beige text-cognac' : 'text-dark-brown hover:bg-beige-soft'
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
