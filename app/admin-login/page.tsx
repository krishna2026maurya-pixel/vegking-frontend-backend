'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ShieldCheck, Mail, Lock, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('admin-login', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-[#edf7f0] via-[#f5f9f6] to-[#fbfdfb] px-4 py-12 antialiased">
      <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100/80 p-8 sm:p-10 shadow-[0_24px_60px_rgba(43,182,115,0.06)]">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl relative">
            <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="mt-2 text-xs font-semibold text-gray-400">
            Sign in to access the VegKing admin dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/50 p-4 text-xs font-bold text-red-600 animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
            <Input
              type="email"
              placeholder="admin@vegking.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="text-gray-400" />}
              className="h-12 border-gray-200 rounded-xl bg-gray-50/50 focus-visible:ring-green-500/20 focus-visible:border-[#2bb673] text-sm font-semibold transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="text-gray-400" />}
              className="h-12 border-gray-200 rounded-xl bg-gray-50/50 focus-visible:ring-green-500/20 focus-visible:border-[#2bb673] text-sm font-semibold transition-all"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-6 h-12 w-full text-sm font-extrabold rounded-xl bg-gradient-to-r from-[#2bb673] to-[#10b981] text-white hover:brightness-105 active:scale-[0.98] transition-all shadow-md shadow-[#2bb673]/20 border-0"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Secure Login
          </Button>
        </form>
      </div>
    </div>
  );
}
