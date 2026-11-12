import type { Metadata } from 'next';
import { MenuBrowser } from '@/components/menu/MenuBrowser';

export const metadata: Metadata = {
  title: 'Snacks Menu (3:00 PM – 11:00 PM IST)',
  description: 'Crisp evening snacks and baked treats served 3:00 PM – 11:00 PM IST.',
};

export default function SnacksMenuPage() {
  return <MenuBrowser activeCategory="snacks" />;
}
