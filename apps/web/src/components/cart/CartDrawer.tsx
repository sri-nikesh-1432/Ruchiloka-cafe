'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { EDITORIAL_EASE } from '@/components/motion/MotionPrimitives';

export function CartDrawer() {
  const {
    cart,
    isCartDrawerOpen,
    closeCartDrawer,
    updateCartItemQuantity,
    removeCartItem,
    openOrderModal,
  } = useApp();

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCartDrawer}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: EDITORIAL_EASE }}
            aria-label="Your Café Tray"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-beige-border bg-cream shadow-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-beige-border px-6 py-5 bg-ivory">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-beige text-coffee">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-dark-brown">Your Café Tray</h2>
                  <p className="text-xs text-coffee-muted">
                    {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} selected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCartDrawer}
                aria-label="Close tray drawer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-beige-border text-coffee transition-colors hover:bg-beige"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-beige text-coffee-muted">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-xl font-medium text-dark-brown">
                    Your tray is waiting
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-coffee-muted">
                    Explore our morning tiffins, freshly brewed filter coffee, and evening continental plates.
                  </p>
                  <Link
                    href="/menu"
                    onClick={closeCartDrawer}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-coffee"
                  >
                    Browse Our Menu
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {cart.items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-4 rounded-2xl border border-beige-border bg-ivory p-3.5 shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-20 w-20 shrink-0 rounded-xl object-cover bg-beige"
                        />
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-serif text-base font-semibold text-dark-brown truncate">
                                {item.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => void removeCartItem(item.id)}
                                aria-label={`Remove ${item.name}`}
                                className="text-coffee-soft hover:text-cognac transition-colors p-0.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {item.variantName && (
                              <p className="text-xs text-coffee-muted">{item.variantName}</p>
                            )}
                            {item.addons.length > 0 && (
                              <p className="text-[11px] text-coffee-soft truncate">
                                + {item.addons.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="mt-1 text-[11px] italic text-coffee-muted line-clamp-1">
                                &ldquo;{item.specialInstructions}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-full border border-beige-border bg-cream">
                              <button
                                type="button"
                                onClick={() => void updateCartItemQuantity(item.id, item.quantity - 1)}
                                aria-label="Decrease quantity"
                                className="px-2.5 py-1 text-coffee hover:text-dark-brown transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-[24px] text-center font-mono text-xs font-semibold text-dark-brown">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => void updateCartItemQuantity(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                                className="px-2.5 py-1 text-coffee hover:text-dark-brown transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="font-mono text-sm font-semibold text-dark-brown">
                              ₹{item.lineTotalInr}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer Actions */}
            {cart.items.length > 0 && (
              <div className="border-t border-beige-border bg-ivory px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-coffee-muted">Estimated Subtotal</span>
                  <span className="font-mono text-xl font-bold text-dark-brown">
                    ₹{cart.subtotalInr}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-coffee-muted">
                  Final taxes, packaging, and delivery fees are calculated directly on Swiggy or
                  Zomato during checkout.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/cart"
                    onClick={closeCartDrawer}
                    className="inline-flex items-center justify-center rounded-full border border-beige-border bg-cream px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown transition-colors hover:bg-beige"
                  >
                    View Tray
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeCartDrawer();
                      openOrderModal();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-cognac px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-cognac-hover shadow-sm"
                  >
                    Order Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
