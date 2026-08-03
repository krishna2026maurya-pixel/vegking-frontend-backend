'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, Mail, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function VendorLoginPage() {
  return (
    <Suspense fallback={null}>
      <VendorLoginForm />
    </Suspense>
  );
}

function VendorLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Basic validation simulation
      if (!email || !password) {
        setMessage('Email and password are required.');
        setLoading(false);
        return;
      }

      const res = await signIn('vendor', {
        email,
        password,
        redirect: false
      });

      if (res?.error) {
        setMessage('Invalid credentials.');
      } else {
        router.push('/vendor/dashboard');
      }
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf5] px-4 py-12">
      <div className="w-full max-w-md border border-gray-100 bg-white p-6 shadow-xl shadow-green-900/10 sm:p-8">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-green-50 text-green-700">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-gray-950">Vendor Login</h1>
        <p className="mt-2 text-sm font-medium text-gray-500">Approved vendors can access their dashboard here.</p>

        {searchParams.get('registered') && (
          <div className="mt-5 border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-700">
            Application submitted. You can log in after admin approval.
          </div>
        )}
        {message && <div className="mt-5 border border-amber-100 bg-amber-50 p-3 text-sm font-bold text-amber-700">{message}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex h-12 items-center gap-3 border border-gray-200 bg-gray-50 px-4 focus-within:border-green-500 focus-within:bg-white">
            <Mail className="h-4 w-4 text-gray-400" />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-full flex-1 bg-transparent text-sm font-semibold outline-none" required />
          </div>
          <div className="flex h-12 items-center gap-3 border border-gray-200 bg-gray-50 px-4 focus-within:border-green-500 focus-within:bg-white">
            <Lock className="h-4 w-4 text-gray-400" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="h-full flex-1 bg-transparent text-sm font-semibold outline-none" required />
          </div>
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 bg-green-600 text-sm font-extrabold text-white transition hover:bg-green-700 disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm font-semibold text-gray-600">
          New seller? <Link href="/vendor/register" className="font-black text-green-700 hover:underline">Become a Vendor</Link>
        </p>
      </div>
    </div>
  );
}
