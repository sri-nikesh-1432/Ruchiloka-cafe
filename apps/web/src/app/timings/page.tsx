import type { Metadata } from 'next';
import { TimingsView } from '@/components/timings/TimingsView';

export const metadata: Metadata = {
  title: 'Operating Hours & Live Clock | Ruchiloka Café Kukatpally',
  description:
    'Real-time Indian Standard Time (IST) wall clock and service availability schedules for Ruchiloka Café in Kukatpally: Morning Tiffins (6:30 AM–11:30 AM), All-Day Tea & Coffee (6:30 AM–11:00 PM), and Continental & Evening Snacks (3:00 PM–11:00 PM).',
};

export default function TimingsPage() {
  return <TimingsView />;
}
