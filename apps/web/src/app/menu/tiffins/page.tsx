import type { Metadata } from 'next';
import { MenuBrowser } from '@/components/menu/MenuBrowser';

export const metadata: Metadata = {
  title: 'Tiffins Menu (6:30 AM – 11:30 AM IST)',
  description: 'Freshly prepared South Indian morning tiffins served 6:30 AM – 11:30 AM IST.',
};

export default function TiffinsMenuPage() {
  return <MenuBrowser activeCategory="tiffins" />;
}
