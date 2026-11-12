import type { Metadata } from 'next';
import { BUSINESS_INFO } from '@ruchiloka/shared';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and Conditions for Ruchiloka Café table bookings and online ordering.',
};

export default function TermsPage() {
  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <article className="editorial-container max-w-3xl space-y-6 text-coffee leading-relaxed">
        <span className="editorial-kicker">Legal</span>
        <h1 className="editorial-heading text-4xl sm:text-5xl font-semibold">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-coffee-muted">
          {BUSINESS_INFO.name} · {BUSINESS_INFO.address.full}
        </p>

        <section className="space-y-3 pt-4">
          <h2 className="font-serif text-2xl font-semibold text-dark-brown">
            1. Operating Hours &amp; Menu Availability
          </h2>
          <p className="text-sm">
            Service windows follow Indian Standard Time (`Asia/Kolkata`): Tiffins (6:30 AM – 11:30
            AM), Tea and Coffee (6:30 AM – 11:00 PM), and Continental and Snacks (3:00 PM – 11:00
            PM). Dish availability and pricing in INR are maintained live by café management.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-dark-brown">
            2. Table Reservations
          </h2>
          <p className="text-sm">
            Reservation requests remain in PENDING status until confirmed by our host desk (or
            automatically confirmed according to slot availability). Kindly arrive within 15 minutes
            of your scheduled IST slot.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-dark-brown">
            3. Marketplace Delivery Handoffs
          </h2>
          <p className="text-sm">
            Selecting Swiggy or Zomato hands off your prepared summary or verified listing session
            to the chosen third-party platform. Delivery times, taxes, packaging charges, and
            payment settlement are governed by the respective marketplace&apos;s terms. For questions,
            contact us at{' '}
            <a href={BUSINESS_INFO.emailHref} className="text-cognac underline">
              {BUSINESS_INFO.email}
            </a>
            .
          </p>
        </section>
      </article>
    </PageTransitionWrapper>
  );
}
