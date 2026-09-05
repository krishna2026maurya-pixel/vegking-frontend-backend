'use client';

import { SessionProvider, useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const session = useSession();

  const signOut = async (options?: { callbackUrl?: string; redirect?: boolean }) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return nextAuthSignOut({ callbackUrl: '/', ...options });
  };

  return {
    ...session,
    signIn,
    signOut,
  };
}
