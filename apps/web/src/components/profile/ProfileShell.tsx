'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LogOut, ShieldCheck, ShoppingBag, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function ProfileShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, authLoading, logout } = useApp();

  if (authLoading) {
    return (
      <div className="pt-32 pb-24 editorial-container max-w-4xl">
        <div className="h-64 animate-pulse rounded-3xl border border-beige-border bg-ivory" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32 pb-24 editorial-container max-w-md">
        <div className="rounded-[2rem] border border-beige-border bg-ivory p-8 sm:p-10 text-center space-y-5 shadow-card">
          <User className="mx-auto h-10 w-10 text-cognac" />
          <h1 className="font-serif text-3xl font-semibold text-dark-brown">Sign In Required</h1>
          <p className="text-sm text-coffee-muted">
            Sign in to view your profile, reservation statuses, and order handoff records.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { href: '/profile', label: 'Account Details', icon: User },
    { href: '/profile/bookings', label: 'Reservations', icon: Calendar },
    { href: '/profile/orders', label: 'Order Handoffs', icon: ShoppingBag },
  ];

  return (
    <div className="pt-28 pb-24">
      <div className="editorial-container max-w-5xl">
        <div className="flex flex-col gap-5 border-b border-beige-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="editorial-kicker">Guest Account</span>
            <h1 className="mt-2 editorial-heading text-4xl font-semibold">{title}</h1>
            <p className="mt-1.5 text-sm text-coffee-muted">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-cognac/35 bg-cognac-light/25 px-4 py-2 text-xs font-semibold text-dark-brown hover:bg-cognac-light/40"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cognac" />
                Admin Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-full border border-beige-border bg-ivory px-4 py-2 text-xs font-semibold text-coffee hover:border-cognac hover:text-cognac"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        <nav aria-label="Profile navigation" className="mt-6 flex flex-wrap gap-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-dark-brown text-cream'
                    : 'border border-beige-border bg-ivory text-coffee hover:border-cognac'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
