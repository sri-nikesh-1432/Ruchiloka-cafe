'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Search, SlidersHorizontal, Utensils } from 'lucide-react';
import {
  MENU_CATEGORY_META,
  getCategoryServiceStatus,
  type MenuCategorySlug,
  type MenuItemDto,
} from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import {
  EditorialReveal,
  PageTransitionWrapper,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/MotionPrimitives';
import { MenuItemCard } from './MenuItemCard';
import { MenuItemModal } from './MenuItemModal';
import { MenuCardsShowcase } from './MenuCardsShowcase';

interface MenuBrowserProps {
  activeCategory?: MenuCategorySlug | 'all';
}

const CATEGORY_TABS: Array<{ slug: MenuCategorySlug | 'all'; label: string; href: string }> = [
  { slug: 'all', label: 'All Offerings', href: '/menu' },
  { slug: 'tiffins', label: 'Tiffins', href: '/menu/tiffins' },
  { slug: 'beverages', label: 'Tea & Coffee', href: '/menu/beverages' },
  { slug: 'continental', label: 'Continental', href: '/menu/continental' },
  { slug: 'snacks', label: 'Snacks', href: '/menu/snacks' },
];

export function MenuBrowser({ activeCategory = 'all' }: MenuBrowserProps) {
  const { publicSettings, cart, openOrderModal, user } = useApp();
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'display' | 'price_asc' | 'price_desc'>('display');
  const [vegOnly, setVegOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [inspectItem, setInspectItem] = useState<MenuItemDto | null>(null);

  const categoryMeta = activeCategory !== 'all' ? MENU_CATEGORY_META[activeCategory] : null;
  const serviceStatus =
    activeCategory !== 'all'
      ? getCategoryServiceStatus(activeCategory, new Date(), publicSettings.operatingHours)
      : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    api.menu
      .listItems({
        category: activeCategory === 'all' ? undefined : activeCategory,
        sort: sortBy,
      })
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Unable to reach menu catalogue right now.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategory, sortBy]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (vegOnly && !item.isVegetarian) return false;
      if (availableOnly && !item.isAvailable) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, vegOnly, availableOnly]);

  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      {/* Editorial Header */}
      <section className="border-b border-beige-border bg-beige-soft py-12 sm:py-16">
        <div className="editorial-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="editorial-kicker">Ruchiloka Culinary Catalogue</span>
              <h1 className="editorial-heading text-4xl sm:text-5xl font-semibold">
                {categoryMeta ? categoryMeta.name : 'Our Complete Menu'}
              </h1>
              <p className="text-base leading-relaxed text-coffee-muted">
                {categoryMeta
                  ? categoryMeta.subtitle
                  : 'Explore freshly steamed morning tiffins, signature filter brews, aromatic chai, continental bowls, and warm evening bites.'}
              </p>
            </div>

            {serviceStatus && (
              <div className="inline-flex flex-col rounded-2xl border border-beige-border bg-ivory px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-cognac" />
                  <span className="font-mono text-sm font-bold text-dark-brown">
                    {serviceStatus.displayHours} IST
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      serviceStatus.isOpen
                        ? 'bg-sky-blue-soft text-sky-blue-deep'
                        : 'bg-beige text-coffee-muted'
                    }`}
                  >
                    {serviceStatus.statusText}
                  </span>
                </div>
                <p className="mt-1 text-xs text-coffee-muted">{serviceStatus.nextChangeText}</p>
              </div>
            )}
          </div>

          {/* Real Route Category Navigation Tabs */}
          <nav aria-label="Menu categories" className="mt-8 flex flex-wrap gap-2.5">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.slug;
              return (
                <Link
                  key={tab.slug}
                  href={tab.href}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-dark-brown text-cream shadow-sm'
                      : 'border border-beige-border bg-ivory text-coffee hover:border-cognac hover:text-cognac'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="editorial-container pt-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-beige-border bg-ivory p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee-soft" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dosa, filter coffee, sandwich..."
              aria-label="Search menu items"
              className="w-full rounded-full border border-beige-border bg-cream py-2.5 pl-11 pr-4 text-sm text-dark-brown placeholder:text-coffee-soft focus:border-cognac focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setVegOnly((v) => !v)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                vegOnly
                  ? 'border-cognac bg-cognac text-white'
                  : 'border-beige-border bg-cream text-coffee hover:border-cognac'
              }`}
            >
              Vegetarian Only
            </button>

            <button
              type="button"
              onClick={() => setAvailableOnly((v) => !v)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                availableOnly
                  ? 'border-dark-brown bg-dark-brown text-cream'
                  : 'border-beige-border bg-cream text-coffee hover:border-dark-brown'
              }`}
            >
              Available Now
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-cream px-3.5 py-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-coffee-muted" />
              <select
                aria-label="Sort menu items"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-xs font-semibold text-dark-brown focus:outline-none"
              >
                <option value="display">Chef&apos;s Order</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Floating Order Strip if Tray has items */}
        {cart.itemCount > 0 && (
          <EditorialReveal className="mt-6 flex flex-col gap-3 rounded-2xl border border-cognac/30 bg-beige px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-dark-brown">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your tray ·{' '}
                <span className="font-mono">₹{cart.subtotalInr}</span>
              </p>
              <p className="text-xs text-coffee-muted">
                Ready to review or proceed to Swiggy / Zomato ordering.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                className="rounded-full border border-beige-border bg-ivory px-4 py-2 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac"
              >
                View Cart
              </Link>
              <button
                type="button"
                onClick={openOrderModal}
                className="inline-flex items-center gap-1.5 rounded-full bg-cognac px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-cognac-hover transition-colors"
              >
                Order Now
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </EditorialReveal>
        )}

        {/* Menu Grid */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="h-96 animate-pulse rounded-3xl border border-beige-border bg-ivory"
                />
              ))}
            </div>
          ) : errorMsg ? (
            <div className="rounded-3xl border border-beige-border bg-ivory p-10 text-center">
              <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                Menu Service Temporarily Unavailable
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-coffee-muted">{errorMsg}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-full bg-dark-brown px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-coffee"
              >
                Retry Loading Menu
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-beige-border bg-ivory px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-beige text-cognac">
                <Utensils className="h-6 w-6" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                {items.length === 0
                  ? 'No menu items published in this section yet'
                  : 'No dishes match your filters'}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-coffee-muted">
                {items.length === 0
                  ? 'Ruchiloka Café updates its dishes and pricing directly from our kitchen administration portal so every item stays authentic.'
                  : 'Try clearing your search term or dietary filter to view all dishes in this category.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setVegOnly(false);
                      setAvailableOnly(false);
                    }}
                    className="rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream"
                  >
                    Reset Filters
                  </button>
                )}
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="rounded-full border border-cognac bg-cognac-light/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown"
                  >
                    Add Dishes in Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <StaggerItem key={item.id}>
                  <MenuItemCard item={item} onInspect={setInspectItem} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      <section className="pt-4">
        <MenuCardsShowcase
          id="official-menu-cards"
          defaultCategory={activeCategory === 'tiffins' ? 'all' : activeCategory}
          compactHeader
        />
      </section>

      <MenuItemModal item={inspectItem} onClose={() => setInspectItem(null)} />
    </PageTransitionWrapper>
  );
}
