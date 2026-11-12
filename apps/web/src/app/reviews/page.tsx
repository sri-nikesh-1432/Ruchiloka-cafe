import type { Metadata } from 'next';
import { ReviewsView } from '@/components/reviews/ReviewsView';

export const metadata: Metadata = {
  title: 'Customer Reviews | Ruchiloka Café Kukatpally',
  description:
    'Read verified Google reviews (4.7/5 from 57 reviews) and submit your own café review directly to Ruchiloka Café in Vivekananda Nagar, Kukatpally.',
};

export default function ReviewsPage() {
  return <ReviewsView />;
}
