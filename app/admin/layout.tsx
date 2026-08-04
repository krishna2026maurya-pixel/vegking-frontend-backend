import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminClientShell from './components/AdminClientShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role !== 'admin') {
    redirect('/admin-login');
  }

  const sessionUser = {
    name: session.user.name || 'Admin User',
    email: session.user.email || 'admin@vegimart.com',
    image: session.user.image || null,
  };

  return (
    <AdminClientShell sessionUser={sessionUser}>
      {children}
    </AdminClientShell>
  );
}
