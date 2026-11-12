import type { Metadata } from 'next';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { OrderingModal } from '@/components/ordering/OrderingModal';
import { ToastViewport } from '@/components/layout/ToastViewport';

export const metadata: Metadata = {
  title: {
    default: 'Ruchiloka Café | Kukatpally, Hyderabad',
    template: '%s | Ruchiloka Café',
  },
  description:
    'Every Cup. Every Bite. A Little More Special. Discover freshly prepared morning tiffins, brewed coffee, tea, and continental delights at Ruchiloka Café, Kukatpally, Hyderabad.',
  keywords: [
    'Ruchiloka Café',
    'Kukatpally café',
    'Hyderabad tiffins',
    'South Indian filter coffee',
    'table reservation Hyderabad',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-cream text-dark-brown font-sans antialiased">
        <MotionConfig reducedMotion="user">
          <AppProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <OrderingModal />
            <ToastViewport />
          </AppProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
