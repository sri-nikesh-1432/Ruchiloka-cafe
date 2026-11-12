'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, Minus, Plus, X } from 'lucide-react';
import type { MenuItemDto } from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { DietaryBadge } from './MenuItemCard';
import { EDITORIAL_EASE } from '@/components/motion/MotionPrimitives';

interface MenuItemModalProps {
  item: MenuItemDto | null;
  onClose: () => void;
}

export function MenuItemModal({ item, onClose }: MenuItemModalProps) {
  const { addToCart } = useApp();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!item) return;
    const firstAvailableVariant = item.variants.find((v) => v.isAvailable);
    setSelectedVariantId(firstAvailableVariant?.id ?? null);
    setSelectedAddonIds([]);
    setQuantity(1);
    setSpecialInstructions('');
  }, [item]);

  if (!item) return null;

  const selectedVariant = selectedVariantId
    ? item.variants.find((v) => v.id === selectedVariantId) ?? null
    : null;

  const addonsTotal = item.addons
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.priceInr, 0);

  const unitTotal = item.priceInr + (selectedVariant?.priceDeltaInr ?? 0) + addonsTotal;
  const lineTotal = unitTotal * quantity;

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (!item.isAvailable || submitting) return;
    setSubmitting(true);
    try {
      await addToCart({
        item,
        variantId: selectedVariantId,
        addonIds: selectedAddonIds,
        quantity,
        specialInstructions,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-detail-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
          className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-beige-border bg-cream shadow-modal"
        >
          {/* Hero photo */}
          <div className="relative h-56 sm:h-64 shrink-0 overflow-hidden bg-beige">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close item details"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-dark-brown shadow-md transition-colors hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <DietaryBadge isVegetarian={item.isVegetarian} />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-coffee-muted">
                  {item.categoryName}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-coffee-muted">
                  <Clock className="h-3.5 w-3.5 text-cognac" />~{item.prepTimeMinutes} min
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between gap-4">
                <h2 id="item-detail-title" className="font-serif text-3xl font-semibold text-dark-brown">
                  {item.name}
                </h2>
                <span className="font-mono text-xl font-bold text-dark-brown">
                  ₹{item.priceInr}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-coffee-muted">{item.description}</p>
            </div>

            {item.variants.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-coffee">
                  Choose Preparation / Size
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {item.variants.map((variant) => {
                    const active = selectedVariantId === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={!variant.isAvailable}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                          active
                            ? 'border-cognac bg-ivory text-dark-brown shadow-sm'
                            : 'border-beige-border bg-beige-soft/60 text-coffee hover:border-coffee-muted'
                        } disabled:opacity-50`}
                      >
                        <span className="font-medium">{variant.name}</span>
                        <span className="font-mono text-xs text-coffee-muted">
                          {variant.priceDeltaInr > 0
                            ? `+₹${variant.priceDeltaInr}`
                            : variant.priceDeltaInr < 0
                              ? `-₹${Math.abs(variant.priceDeltaInr)}`
                              : 'Standard'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {item.addons.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-coffee">
                  Optional Add-ons
                </h3>
                <div className="space-y-2">
                  {item.addons.map((addon) => {
                    const checked = selectedAddonIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        disabled={!addon.isAvailable}
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all ${
                          checked
                            ? 'border-cognac bg-ivory text-dark-brown'
                            : 'border-beige-border bg-beige-soft/50 text-coffee hover:border-coffee-muted'
                        } disabled:opacity-50`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              checked
                                ? 'border-cognac bg-cognac text-white'
                                : 'border-coffee-soft bg-white'
                            }`}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span className="font-medium">{addon.name}</span>
                        </span>
                        <span className="font-mono text-xs text-coffee-muted">+₹{addon.priceInr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="special-instructions"
                className="block text-xs font-semibold uppercase tracking-[0.2em] text-coffee"
              >
                Special Instructions (Optional)
              </label>
              <textarea
                id="special-instructions"
                rows={2}
                maxLength={300}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Less sugar, extra crispy, mild spice..."
                className="w-full rounded-2xl border border-beige-border bg-ivory px-4 py-3 text-sm text-dark-brown placeholder:text-coffee-soft focus:border-cognac focus:outline-none"
              />
            </div>
          </div>

          {/* Sticky Action Bar */}
          <div className="flex items-center justify-between gap-4 border-t border-beige-border bg-ivory px-6 py-4 sm:px-8">
            <div className="inline-flex items-center rounded-full border border-beige-border bg-cream">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="px-3.5 py-2 text-coffee hover:text-dark-brown"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[28px] text-center font-mono text-sm font-bold text-dark-brown">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(25, q + 1))}
                aria-label="Increase quantity"
                className="px-3.5 py-2 text-coffee hover:text-dark-brown"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={!item.isAvailable || submitting}
              onClick={() => void handleAdd()}
              className="flex-1 rounded-full bg-dark-brown px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-cognac disabled:cursor-not-allowed disabled:bg-beige disabled:text-coffee-soft"
            >
              {item.isAvailable
                ? submitting
                  ? 'Adding...'
                  : `Add to Tray — ₹${lineTotal}`
                : 'Currently Unavailable'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
