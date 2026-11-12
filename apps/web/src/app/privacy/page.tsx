import type { Metadata } from 'next';
import { BUSINESS_INFO } from '@ruchiloka/shared';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Ruchiloka Café, Kukatpally, Hyderabad.',
};

export default function PrivacyPage() {
  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <article className="editorial-container max-w-3xl space-y-6 text-coffee leading-relaxed">
        <span className="editorial-kicker">Legal</span>
        <h1 className="editorial-heading text-4xl sm:text-5xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-coffee-muted">
          Effective for {BUSINESS_INFO.name}, {BUSINESS_INFO.address.full}
        </p>

        <section className="space-y-3 pt-4">
          <h2 className="font-serif text-2xl font-semibold text-dark-brown">
            1. Information We Collect
          </h2>
          <p className="text-sm">
            When you sign in via Google OAuth or email, create a table reservation, save items to
            your tray, or submit an enquiry, we store your name, email address, optional phone
            number, and reservation or tray records solely to provide café hospitality services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-dark-brown">
            2. Transactional Communications
          </h2>
          <p className="text-sm">
            Reservation confirmations, status updates, account verification links, and enquiry
            responses are dispatched exclusively through our backend transactional email provider
            (Resend).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-dark-brown">
            3. Third-Party Ordering Marketplaces
          </h2>
          <p className="text-sm">
            Online delivery payments and checkout take place strictly on Swiggy or Zomato once you
            select a marketplace handoff. Ruchiloka Café never collects or stores payment card or
            UPI credentials.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-dark-brown">4. Contact</h2>
          <p className="text-sm">
            For data access or deletion requests, call {BUSINESS_INFO.phone} or write via our{' '}
            <a href="/contact" className="text-cognac underline">
              Contact page
            </a>
            .
          </p>
        </section>
      </article>
    </PageTransitionWrapper>
  );
}
