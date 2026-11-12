'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pt-36 pb-24 editorial-container max-w-lg">
      <div className="rounded-[2rem] border border-beige-border bg-ivory p-10 text-center space-y-5 shadow-card">
        <AlertCircle className="mx-auto h-10 w-10 text-cognac" />
        <h1 className="font-serif text-3xl font-semibold text-dark-brown">
          Something unexpected happened
        </h1>
        <p className="text-sm text-coffee-muted">
          {error.message || 'We hit a brief snag loading this view.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-beige-border bg-cream px-6 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
