import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RevealObserver } from '@/components/RevealObserver';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <CartProvider>
      <Navbar user={user && { name: user.name, role: user.role }} />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
      <RevealObserver />
    </CartProvider>
  );
}
