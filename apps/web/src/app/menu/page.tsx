import type { Metadata } from 'next';
import { MenuBrowser } from '@/components/menu/MenuBrowser';

export const metadata: Metadata = {
  title: 'Our Menu',
  description:
    'Browse Ruchiloka Café menu across Tiffins, Tea & Coffee, Continental, and Evening Snacks.',
};

export default function MenuPage() {
  return <MenuBrowser activeCategory="all" />;
}
