'use client';

import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import LiveNotificationToast from '@/components/LiveNotificationToast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <LiveNotificationToast />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
