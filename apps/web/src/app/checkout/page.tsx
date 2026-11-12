import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

export const metadata: Metadata = {
  title: 'Marketplace Checkout Handoff',
  description:
    'Complete your Ruchiloka Café food order safely through Swiggy or Zomato.',
};

export default function CheckoutPage() {
  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <div className="editorial-container max-w-3xl">
        <div className="rounded-[2.5rem] border border-beige-border bg-ivory p-8 sm:p-12 shadow-card space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-blue-soft px-3.5 py-1.5 text-xs font-semibold text-sky-blue-deep">
            <ShieldCheck className="h-4 w-4" />
            Marketplace-Verified Ordering
          </div>

          <h1 className="editorial-heading text-4xl font-semibold">
            Complete Your Order on Swiggy or Zomato
          </h1>

          <p className="text-base leading-relaxed text-coffee-muted">
            Ruchiloka Café prepares your item selection on this site and hands off directly to our
            official Swiggy or Zomato storefront for payment and doorstep delivery tracking. We never
            collect or process card details on Ruchiloka.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/order"
              className="inline-flex items-center gap-2 rounded-full bg-cognac px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-cognac-hover transition-colors"
            >
              <span>Choose Swiggy or Zomato</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-cream px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac transition-colors"
            >
              <span>Review Tray</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
