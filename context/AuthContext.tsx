'use client';

import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const session = useSession();
  return {
    ...session,
    signIn,
    signOut,
  };
}
