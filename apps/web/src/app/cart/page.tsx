'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

export default function CartPage() {
  const {
    cart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    openOrderModal,
  } = useApp();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const startEditingNote = (id: string, currentNote: string | null) => {
    setEditingNoteId(id);
    setNoteDraft(currentNote ?? '');
  };

  const saveNote = async (id: string, qty: number) => {
    await updateCartItemQuantity(id, qty, noteDraft);
    setEditingNoteId(null);
  };

  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <div className="editorial-container">
        <div className="border-b border-beige-border pb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="editorial-kicker">Your Selection</span>
            <h1 className="mt-2 editorial-heading text-4xl sm:text-5xl font-semibold">
              Café Tray
            </h1>
          </div>

          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={() => void clearCart()}
              className="self-start sm:self-auto text-xs font-semibold uppercase tracking-wider text-coffee-muted hover:text-cognac underline"
            >
              Clear Tray
            </button>
          )}
        </div>

        {cart.items.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-beige-border bg-ivory px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-beige text-cognac">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-dark-brown">
              Your tray is currently empty
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-coffee-muted">
              Select dishes from our Tiffins, Tea &amp; Coffee, Continental, or Snacks menu to build
              your order and hand off to Swiggy or Zomato.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
              >
                Explore Our Menu
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reserve"
                className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-cream px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac transition-colors"
              >
                Reserve a Table
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-12 items-start">
            {/* Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-3xl border border-beige-border bg-ivory p-5 sm:flex-row sm:items-start shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-28 w-full sm:w-28 shrink-0 rounded-2xl object-cover bg-beige"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                          {item.name}
                        </h2>
                        {item.variantName && (
                          <p className="text-xs font-medium text-coffee-muted">
                            Option: {item.variantName}
                          </p>
                        )}
                        {item.addons.length > 0 && (
                          <p className="mt-0.5 text-xs text-coffee-soft">
                            Add-ons: {item.addons.map((a) => `${a.name} (+₹${a.priceInr})`).join(', ')}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeCartItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded-full p-2 text-coffee-soft hover:bg-beige hover:text-cognac transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Special instructions editor */}
                    <div className="mt-3">
                      {editingNoteId === item.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            maxLength={300}
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Cooking or preparation note..."
                            className="flex-1 min-w-[200px] rounded-xl border border-beige-border bg-cream px-3 py-1.5 text-xs text-dark-brown focus:border-cognac focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void saveNote(item.id, item.quantity)}
                            className="rounded-full bg-dark-brown px-3.5 py-1.5 text-[11px] font-semibold text-cream"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="text-xs text-coffee-muted px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingNote(item.id, item.specialInstructions)}
                          className="text-xs text-coffee-muted hover:text-cognac underline"
                        >
                          {item.specialInstructions
                            ? `Note: "${item.specialInstructions}" (Edit)`
                            : '+ Add special instructions'}
                        </button>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-beige-border/70 pt-4">
                      <div className="inline-flex items-center rounded-full border border-beige-border bg-cream">
                        <button
                          type="button"
                          onClick={() => void updateCartItemQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="px-3.5 py-1.5 text-coffee hover:text-dark-brown"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[28px] text-center font-mono text-sm font-bold text-dark-brown">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => void updateCartItemQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="px-3.5 py-1.5 text-coffee hover:text-dark-brown"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-lg font-bold text-dark-brown">
                          ₹{item.lineTotalInr}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Panel */}
            <aside className="lg:col-span-4 rounded-3xl border border-beige-border bg-ivory p-6 sm:p-8 shadow-card space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-dark-brown">Order Summary</h2>
                <p className="mt-1 text-xs text-coffee-muted">
                  Prices verified securely against Ruchiloka Café&apos;s live catalogue.
                </p>
              </div>

              <div className="space-y-3 border-y border-beige-border py-5 text-sm">
                <div className="flex justify-between text-coffee">
                  <span>Items ({cart.itemCount})</span>
                  <span className="font-mono font-semibold text-dark-brown">₹{cart.subtotalInr}</span>
                </div>
                <div className="flex justify-between text-coffee-muted text-xs">
                  <span>Delivery &amp; Marketplace Fees</span>
                  <span>Calculated on Swiggy / Zomato</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-dark-brown">Estimated Subtotal</span>
                <span className="font-mono text-2xl font-bold text-dark-brown">
                  ₹{cart.subtotalInr}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openOrderModal}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-cognac px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-cognac-hover shadow-sm"
                >
                  <span>Order Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  href="/order"
                  className="flex w-full items-center justify-center rounded-full border border-beige-border bg-cream px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-dark-brown hover:border-cognac transition-colors"
                >
                  Open Full Ordering Page
                </Link>
              </div>

              <p className="text-[11px] leading-relaxed text-coffee-muted">
                Payment and final delivery checkout happen directly on Swiggy or Zomato—your
                selected tray stays saved here for easy reference.
              </p>
            </aside>
          </div>
        )}
      </div>
    </PageTransitionWrapper>
  );
}
