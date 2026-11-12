import type { Metadata } from 'next';
import { MenuBrowser } from '@/components/menu/MenuBrowser';

export const metadata: Metadata = {
  title: 'Tea and Coffee Menu (6:30 AM – 11:00 PM IST)',
  description: 'Filter coffee, espresso cappuccinos, and aromatic chai served 6:30 AM – 11:00 PM IST.',
};

export default function BeveragesMenuPage() {
  return <MenuBrowser activeCategory="beverages" />;
}
