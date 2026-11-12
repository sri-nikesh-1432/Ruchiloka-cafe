'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import type { OrderingProvider } from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { ProfileShell } from '@/components/profile/ProfileShell';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

interface OrderHandoffRow {
  id: string;
  provider: OrderingProvider;
  mode: string;
  cartTransferred: boolean;
  subtotalInr: number;
  redirectUrl: string | null;
  summarySnapshot: string;
  createdAt: string;
}

export default function ProfileOrdersPage() {
  const { user } = useApp();
  const [history, setHistory] = useState<OrderHandoffRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.ordering
      .myHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <PageTransitionWrapper>
      <ProfileShell
        title="Order Handoff History"
        subtitle="Summary trays prepared on Ruchiloka Café and handed off to Swiggy or Zomato. Live delivery tracking occurs directly inside the chosen marketplace app."
      >
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-ivory border border-beige-border" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl border border-beige-border bg-ivory p-12 text-center space-y-4">
            <ShoppingBag className="mx-auto h-9 w-9 text-cognac" />
            <h2 className="font-serif text-2xl font-semibold text-dark-brown">
              No marketplace handoffs recorded yet
            </h2>
            <p className="text-sm text-coffee-muted">
              Build a tray from our menu and choose Swiggy or Zomato to record and streamline your
              order handoffs.
            </p>
            <Link
              href="/menu"
              className="inline-flex rounded-full bg-dark-brown px-7 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac"
            >
              Explore Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-3xl border border-beige-border bg-ivory p-6 space-y-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full bg-dark-brown px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream">
                      {entry.provider}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        entry.cartTransferred
                          ? 'bg-sky-blue-soft text-sky-blue-deep'
                          : 'bg-beige text-coffee-muted'
                      }`}
                    >
                      {entry.cartTransferred ? 'Cart Transferred' : 'Listing + Summary'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-dark-brown">
                      ₹{entry.subtotalInr}
                    </span>
                    <span className="font-mono text-xs text-coffee-muted">
                      {new Date(entry.createdAt).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      IST
                    </span>
                  </div>
                </div>

                <pre className="whitespace-pre-wrap rounded-2xl border border-beige-border bg-cream p-4 font-mono text-xs text-coffee">
                  {entry.summarySnapshot}
                </pre>

                {entry.redirectUrl && (
                  <a
                    href={entry.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cognac hover:underline"
                  >
                    Open Ruchiloka on {entry.provider}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </ProfileShell>
    </PageTransitionWrapper>
  );
}
