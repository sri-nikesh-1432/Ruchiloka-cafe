import type { Metadata } from 'next';
import { MenuBrowser } from '@/components/menu/MenuBrowser';

export const metadata: Metadata = {
  title: 'Continental Menu (3:00 PM – 11:00 PM IST)',
  description: 'Continental sandwiches, pasta bowls, and café plates served 3:00 PM – 11:00 PM IST.',
};

export default function ContinentalMenuPage() {
  return <MenuBrowser activeCategory="continental" />;
}
