import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { Checkout } from './Checkout';

export const metadata: Metadata = { title: 'Mon panier' };

export default async function CartPage() {
  const user = await getCurrentUser();
  return (
    <Checkout
      customer={user ? { name: user.name, phone: user.phone ?? '', email: user.email } : null}
    />
  );
}
