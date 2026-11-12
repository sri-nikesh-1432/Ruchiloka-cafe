import type { Metadata } from 'next';
import { GalleryView } from '@/components/gallery/GalleryView';

export const metadata: Metadata = {
  title: 'Ruchiloka Gallery | Real Café Courtyard, Food & Evening Moments',
  description:
    'Explore authentic photographs of Ruchiloka Café in Kukatpally from our Google Business Profile and official Instagram (@ruchilokacafe.in).',
};

export default function GalleryPage() {
  return <GalleryView />;
}
