import type { Metadata } from 'next';
import { LandingView } from '@/components/home/LandingView';

export const metadata: Metadata = {
  title: 'Ruchiloka Café | Fresh Tiffins, Coffee & Continental Plates in Kukatpally',
  description:
    'Every Cup. Every Bite. A Little More Special. Visit Ruchiloka Café at Vivekananda Nagar, Kukatpally, Hyderabad for morning tiffins, craft coffee, tea, and continental delights.',
};

export default function HomePage() {
  return <LandingView />;
}
