'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import type {
  OrderHandoffResultDto,
  OrderingProvider,
  OrderingProviderStatusDto,
} from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

export default function OrderPage() {
  const { cart, user, getGuestCartPayload, pushToast } = useApp();
  const [providers, setProviders] = useState<OrderingProviderStatusDto[]>([]);
  const [verifiedSummary, setVerifiedSummary] = useState<{
    subtotalInr: number;
    orderSummaryText: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<OrderingProvider | null>(null);
  const [handoff, setHandoff] = useState<OrderHandoffResultDto | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.ordering.getProviders().catch(() => []),
      cart.items.length > 0
        ? api.ordering.prepare(user ? undefined : getGuestCartPayload()).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([providerList, prep]) => {
        if (cancelled) return;
        setProviders(providerList);
        if (prep) {
          setVerifiedSummary({
            subtotalInr: prep.subtotalInr,
            orderSummaryText: prep.orderSummaryText,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cart.items.length, user, getGuestCartPayload]);

  const handleHandoff = async (provider: OrderingProvider) => {
    setSubmitting(provider);
    try {
      const result = await api.ordering.handoff(
        provider,
        user ? undefined : getGuestCartPayload()
      );
      setHandoff(result);
    } catch (err) {
      pushToast({
        title: 'Handoff preparation error',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      pushToast({ title: 'Summary copied to clipboard', tone: 'info' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      pushToast({ title: 'Unable to copy automatically', tone: 'error' });
    }
  };

  return (
    <PageTransitionWrapper className="pt-28 pb-24">
      <div className="editorial-container max-w-5xl">
        <div className="border-b border-beige-border pb-8">
          <span className="editorial-kicker">Marketplace Delivery Handoff</span>
          <h1 className="mt-2 editorial-heading text-4xl sm:text-5xl font-semibold">
            Where would you like to order?
          </h1>
          <p className="mt-3 max-w-2xl text-base text-coffee-muted">
            Build your tray on Ruchiloka Café and continue to Swiggy or Zomato to complete payment
            and delivery tracking.
          </p>
        </div>

        {cart.items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-beige-border bg-ivory p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-cognac mb-4" />
            <h2 className="font-serif text-2xl font-semibold text-dark-brown">
              Add items to your tray first
            </h2>
            <p className="mt-2 text-sm text-coffee-muted">
              Once you select dishes from our menu, choose Swiggy or Zomato right here.
            </p>
            <Link
              href="/menu"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream"
            >
              Browse Our Menu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-12 items-start">
            {/* Tray Checklist */}
            <div className="lg:col-span-5 rounded-3xl border border-beige-border bg-ivory p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-beige-border pb-3">
                <h2 className="font-serif text-xl font-semibold text-dark-brown">
                  Your Tray ({cart.itemCount})
                </h2>
                <span className="font-mono text-lg font-bold text-dark-brown">
                  ₹{verifiedSummary?.subtotalInr ?? cart.subtotalInr}
                </span>
              </div>

              <ul className="space-y-3">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm">
                    <div className="text-coffee">
                      <span className="font-medium text-dark-brown">{item.name}</span>
                      {item.variantName && (
                        <span className="block text-xs text-coffee-muted">{item.variantName}</span>
                      )}
                      <span className="block font-mono text-xs text-coffee-muted">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-dark-brown">
                      ₹{item.lineTotalInr}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/cart"
                className="inline-block text-xs font-semibold text-cognac underline pt-2"
              >
                Modify Tray Items
              </Link>
            </div>

            {/* Marketplace Cards */}
            <div className="lg:col-span-7 space-y-6">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-44 animate-pulse rounded-3xl bg-beige" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['SWIGGY', 'ZOMATO'] as OrderingProvider[]).map((code) => {
                    const status = providers.find((p) => p.provider === code);
                    const busy = submitting === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        disabled={!!submitting}
                        onClick={() => void handleHandoff(code)}
                        className="group flex flex-col justify-between rounded-3xl border border-beige-border bg-ivory p-6 text-left transition-all hover:-translate-y-1 hover:border-cognac hover:shadow-editorial"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl font-serif text-2xl font-bold text-white ${
                              code === 'SWIGGY' ? 'bg-cognac' : 'bg-dark-brown'
                            }`}
                          >
                            {code === 'SWIGGY' ? 'S' : 'Z'}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                              status?.apiHandoffEnabled
                                ? 'bg-sky-blue-soft text-sky-blue-deep'
                                : 'bg-beige text-coffee-muted'
                            }`}
                          >
                            {status?.apiHandoffEnabled ? 'Cart API Enabled' : 'Listing Handoff'}
                          </span>
                        </div>

                        <div className="mt-5">
                          <div className="flex items-center justify-between">
                            <h3 className="font-serif text-2xl font-semibold text-dark-brown group-hover:text-cognac transition-colors">
                              {code === 'SWIGGY' ? 'Swiggy' : 'Zomato'}
                            </h3>
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin text-cognac" />
                            ) : (
                              <ExternalLink className="h-4 w-4 text-coffee-muted group-hover:text-cognac" />
                            )}
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-coffee-muted">
                            {status?.notice ?? 'Proceed to Ruchiloka Café listing on this platform.'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {handoff && (
                <div className="rounded-3xl border border-cognac/35 bg-ivory p-6 space-y-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-cognac" />
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-dark-brown">
                        {handoff.cartTransferred
                          ? `Cart Transferred to ${handoff.provider}`
                          : `Order Summary Prepared for ${handoff.provider}`}
                      </h3>
                      <p className="mt-1 text-sm text-coffee-muted">{handoff.message}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-beige-border bg-cream p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-coffee-muted">
                        Order Summary
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopy(handoff.orderSummaryText)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-dark-brown px-3 py-1 text-[11px] font-semibold text-cream"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs text-dark-brown">
                      {handoff.orderSummaryText}
                    </pre>
                  </div>

                  {handoff.redirectUrl && (
                    <a
                      href={handoff.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-cognac px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-cognac-hover"
                    >
                      Continue to {handoff.provider === 'SWIGGY' ? 'Swiggy' : 'Zomato'}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransitionWrapper>
  );
}
