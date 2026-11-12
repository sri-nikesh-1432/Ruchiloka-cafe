'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, SlidersHorizontal } from 'lucide-react';
import type { MenuItemDto } from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';

interface MenuItemCardProps {
  item: MenuItemDto;
  onInspect: (item: MenuItemDto) => void;
}

/**
 * Dietary indicator strictly aligned to Ruchiloka's 8-color palette
 * (Coffee Brown / Cognac for Veg, Dark Brown / Black for Non-Veg; zero green accents).
 */
export function DietaryBadge({ isVegetarian }: { isVegetarian: boolean }) {
  return (
    <span
      title={isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        isVegetarian
          ? 'border-cognac/35 bg-cognac-light/25 text-coffee'
          : 'border-dark-brown/30 bg-beige text-dark-brown'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${isVegetarian ? 'bg-cognac' : 'bg-dark-brown'}`}
        aria-hidden="true"
      />
      {isVegetarian ? 'Veg' : 'Non-Veg'}
    </span>
  );
}

export function MenuItemCard({ item, onInspect }: MenuItemCardProps) {
  const { addToCart } = useApp();
  const hasCustomizations = item.variants.length > 0 || item.addons.length > 0;

  const handlePrimaryAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    if (hasCustomizations) {
      onInspect(item);
      return;
    }
    await addToCart({ item, quantity: 1 });
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      onClick={() => onInspect(item)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-beige-border bg-ivory transition-shadow duration-300 hover:shadow-editorial"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-beige">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            !item.isAvailable ? 'grayscale opacity-75' : ''
          }`}
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <DietaryBadge isVegetarian={item.isVegetarian} />
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${
              item.isAvailable
                ? 'bg-cream/90 text-dark-brown'
                : 'bg-dark-brown/85 text-cream'
            }`}
          >
            {item.isAvailable ? 'Available' : 'Sold Out'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-xl font-semibold leading-snug text-dark-brown group-hover:text-cognac transition-colors">
              {item.name}
            </h3>
            <span className="shrink-0 font-mono text-base font-bold text-dark-brown">
              ₹{item.priceInr}
            </span>
          </div>

          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coffee-soft">
            {item.categoryName}
          </p>

          <p className="mt-2.5 text-sm leading-relaxed text-coffee-muted line-clamp-2">
            {item.description}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-beige-border/70 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-coffee-muted">
            <Clock className="h-3.5 w-3.5 text-cognac" />
            ~{item.prepTimeMinutes} min
          </span>

          <motion.button
            type="button"
            disabled={!item.isAvailable}
            whileHover={item.isAvailable ? { scale: 1.03 } : undefined}
            whileTap={item.isAvailable ? { scale: 0.95 } : undefined}
            transition={{ duration: 0.18 }}
            onClick={(e) => void handlePrimaryAction(e)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              item.isAvailable
                ? 'bg-dark-brown text-cream hover:bg-cognac'
                : 'cursor-not-allowed bg-beige text-coffee-soft'
            }`}
          >
            {hasCustomizations ? (
              <>
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Customize
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add to Tray
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
