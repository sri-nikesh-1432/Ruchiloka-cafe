import Link from 'next/link';
import { ArrowLeft, Coffee } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="pt-36 pb-24 editorial-container max-w-lg">
      <div className="rounded-[2.5rem] border border-beige-border bg-ivory p-10 sm:p-12 text-center space-y-5 shadow-editorial">
        <Coffee className="mx-auto h-10 w-10 text-cognac" />
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-coffee-muted">
          404 · Page Not Found
        </span>
        <h1 className="font-serif text-4xl font-semibold text-dark-brown">
          This table isn&apos;t on the floor plan
        </h1>
        <p className="text-sm leading-relaxed text-coffee-muted">
          The page you&apos;re looking for may have moved. Let&apos;s bring you back to our fresh
          coffee and morning tiffins.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center rounded-full border border-beige-border bg-cream px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
