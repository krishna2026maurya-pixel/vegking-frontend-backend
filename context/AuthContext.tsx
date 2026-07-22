'use client';
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<{ user: any } | null>(null);

  const signIn = (role: string = 'admin') => {
    setSession({
      user: { name: role === 'admin' ? 'Admin User' : 'Test Vendor', role, vendorStatus: 'approved' }
    });
  };

  const signOut = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ data: session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
