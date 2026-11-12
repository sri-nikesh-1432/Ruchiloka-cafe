'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  ShieldAlert,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import type {
  OrderHandoffResultDto,
  OrderingProvider,
  OrderingProviderStatusDto,
} from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { EDITORIAL_EASE } from '@/components/motion/MotionPrimitives';

function SwiggyMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cognac text-white font-serif text-xl font-bold shadow-sm">
      S
    </span>
  );
}

function ZomatoMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-dark-brown text-white font-serif text-xl font-bold shadow-sm">
      Z
    </span>
  );
}

export function OrderingModal() {
  const {
    cart,
    isOrderModalOpen,
    closeOrderModal,
    getGuestCartPayload,
    pushToast,
    user,
  } = useApp();

  const [providers, setProviders] = useState<OrderingProviderStatusDto[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submittingProvider, setSubmittingProvider] = useState<OrderingProvider | null>(null);
  const [handoffResult, setHandoffResult] = useState<OrderHandoffResultDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOrderModalOpen) {
      setHandoffResult(null);
      setErrorMsg(null);
      setCopied(false);
      return;
    }

    let cancelled = false;
    setLoadingProviders(true);
    api.ordering
      .getProviders()
      .then((list) => {
        if (!cancelled) setProviders(list);
      })
      .catch(() => {
        if (!cancelled) {
          setProviders([
            {
              provider: 'SWIGGY',
              displayName: 'Swiggy',
              apiHandoffEnabled: false,
              listingConfigured: false,
              listingUrl: null,
              mode: 'UNCONFIGURED',
              notice: 'Unable to verify marketplace status right now. Please try again shortly.',
            },
            {
              provider: 'ZOMATO',
              displayName: 'Zomato',
              apiHandoffEnabled: false,
              listingConfigured: false,
              listingUrl: null,
              mode: 'UNCONFIGURED',
              notice: 'Unable to verify marketplace status right now. Please try again shortly.',
            },
          ]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProviders(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOrderModalOpen]);

  const buildLocalSummaryText = () => {
    const lines = cart.items.map((item) => {
      const variantPart = item.variantName ? ` (${item.variantName})` : '';
      const addonPart =
        item.addons.length > 0 ? ` + ${item.addons.map((a) => a.name).join(', ')}` : '';
      const notePart = item.specialInstructions ? ` [Note: ${item.specialInstructions}]` : '';
      return `• ${item.name}${variantPart}${addonPart} × ${item.quantity} — ₹${item.lineTotalInr}${notePart}`;
    });
    return `Ruchiloka Café Order Summary\n${lines.join('\n')}\nEstimated Subtotal: ₹${cart.subtotalInr}`;
  };

  const handleSelectPlatform = async (provider: OrderingProvider) => {
    setErrorMsg(null);
    setSubmittingProvider(provider);
    try {
      const payloadItems = user ? undefined : getGuestCartPayload();
      const result = await api.ordering.handoff(provider, payloadItems);
      setHandoffResult(result);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not prepare marketplace handoff. You can still copy your order summary below.'
      );
    } finally {
      setSubmittingProvider(null);
    }
  };

  const handleCopySummary = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      pushToast({
        title: 'Order summary copied',
        description: 'Ready to reference when adding items on the delivery app.',
        tone: 'info',
      });
      setTimeout(() => setCopied(false), 2600);
    } catch {
      pushToast({
        title: 'Copy unavailable',
        description: 'Please select and copy the summary text manually.',
        tone: 'error',
      });
    }
  };

  return (
    <AnimatePresence>
      {isOrderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOrderModal}
            className="fixed inset-0 bg-black/55 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-beige-border bg-cream shadow-modal"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-beige-border bg-ivory px-6 py-5 sm:px-8">
              <div>
                <span className="editorial-kicker">Marketplace Ordering</span>
                <h2
                  id="order-modal-title"
                  className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-dark-brown"
                >
                  Where would you like to order?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeOrderModal}
                aria-label="Close ordering modal"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-beige-border text-coffee hover:bg-beige transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
              {/* Selected Tray Summary */}
              <div className="rounded-2xl border border-beige-border bg-ivory p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-beige-border/70 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dark-brown">
                    <UtensilsCrossed className="h-4 w-4 text-cognac" />
                    <span>Your Selected Tray ({cart.itemCount})</span>
                  </div>
                  <span className="font-mono text-base font-bold text-dark-brown">
                    ₹{cart.subtotalInr}
                  </span>
                </div>
                <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cart.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm text-coffee"
                    >
                      <span className="truncate">
                        {item.name}
                        {item.variantName ? ` (${item.variantName})` : ''}{' '}
                        <span className="font-mono text-xs text-coffee-muted">× {item.quantity}</span>
                      </span>
                      <span className="font-mono text-xs font-semibold text-dark-brown shrink-0">
                        ₹{item.lineTotalInr}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-3 rounded-2xl border border-cognac/35 bg-cognac-light/30 p-4 text-sm text-dark-brown">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-cognac" />
                  <div>
                    <p className="font-medium">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={() => void handleCopySummary(buildLocalSummaryText())}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-cognac underline"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy order summary anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Choose Platform or View Handoff Result */}
              {!handoffResult ? (
                <div className="space-y-4">
                  <p className="text-sm text-coffee-muted">
                    Choose your preferred delivery marketplace to continue. Your Ruchiloka tray stays
                    preserved here until your order is placed on the marketplace app.
                  </p>

                  {loadingProviders ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[0, 1].map((idx) => (
                        <div
                          key={idx}
                          className="h-36 animate-pulse rounded-2xl border border-beige-border bg-beige-soft"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {(['SWIGGY', 'ZOMATO'] as OrderingProvider[]).map((code) => {
                        const info = providers.find((p) => p.provider === code);
                        const isBusy = submittingProvider === code;
                        return (
                          <motion.button
                            key={code}
                            type="button"
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.99 }}
                            disabled={!!submittingProvider || cart.items.length === 0}
                            onClick={() => void handleSelectPlatform(code)}
                            className="group flex flex-col justify-between rounded-2xl border border-beige-border bg-ivory p-5 text-left transition-all hover:border-cognac hover:shadow-card disabled:opacity-60"
                          >
                            <div className="flex items-start justify-between gap-3">
                              {code === 'SWIGGY' ? <SwiggyMark /> : <ZomatoMark />}
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                                  info?.apiHandoffEnabled
                                    ? 'bg-sky-blue-soft text-sky-blue-deep'
                                    : 'bg-beige text-coffee-muted'
                                }`}
                              >
                                {info?.apiHandoffEnabled
                                  ? 'Cart Handoff Active'
                                  : info?.listingConfigured
                                    ? 'Verified Listing'
                                    : 'Summary Mode'}
                              </span>
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between">
                                <span className="font-serif text-xl font-semibold text-dark-brown group-hover:text-cognac transition-colors">
                                  Order on {code === 'SWIGGY' ? 'Swiggy' : 'Zomato'}
                                </span>
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-cognac" />
                                ) : (
                                  <ExternalLink className="h-4 w-4 text-coffee-muted group-hover:text-cognac transition-colors" />
                                )}
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-coffee-muted">
                                {info?.notice ??
                                  'Continues to Ruchiloka Café on this marketplace with your order summary.'}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-beige-border bg-ivory p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        handoffResult.cartTransferred
                          ? 'bg-sky-blue-soft text-sky-blue-deep'
                          : 'bg-beige text-cognac'
                      }`}
                    >
                      <Info className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-dark-brown">
                        {handoffResult.cartTransferred
                          ? `Items transferred to ${handoffResult.provider}`
                          : `${handoffResult.provider === 'SWIGGY' ? 'Swiggy' : 'Zomato'} Listing & Order Checklist`}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-coffee-muted">
                        {handoffResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Copyable Order Summary */}
                  <div className="rounded-xl border border-beige-border bg-cream p-4">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                        Copyable Order Summary
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopySummary(handoffResult.orderSummaryText)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-dark-brown px-3 py-1 text-[11px] font-semibold text-cream hover:bg-coffee transition-colors"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied' : 'Copy Summary'}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-dark-brown">
                      {handoffResult.orderSummaryText}
                    </pre>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setHandoffResult(null)}
                      className="text-xs font-semibold text-coffee-muted hover:text-dark-brown underline"
                    >
                      Choose another marketplace
                    </button>

                    {handoffResult.redirectUrl ? (
                      <a
                        href={handoffResult.redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-cognac px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-cognac-hover shadow-sm"
                      >
                        Open Ruchiloka on {handoffResult.provider === 'SWIGGY' ? 'Swiggy' : 'Zomato'}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="rounded-full bg-beige px-4 py-2 text-xs font-medium text-coffee">
                        Marketplace listing URL pending admin configuration
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
