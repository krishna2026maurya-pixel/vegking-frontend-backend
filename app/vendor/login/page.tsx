'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, Mail, Store, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function VendorLoginPage() {
  return (
    <Suspense fallback={null}>
      <VendorLoginForm />
    </Suspense>
  );
}

function VendorLoginForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  useEffect(() => {
    if (searchParams.get('registered')) {
      showToast('Application submitted successfully! Please wait for admin approval.', 'success');
    }
  }, [searchParams, showToast]);

  const triggerError = (msg: string) => {
    setMessage(msg);
    showToast(msg, 'error');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!email || !password) {
        triggerError('Email and password are required.');
        setLoading(false);
        return;
      }

      const res = await signIn('vendor', {
        email,
        password,
        redirect: false
      });

      if (res?.error) {
        triggerError('Invalid credentials.');
      } else {
        showToast('Logged in successfully!', 'success');
        router.push('/vendor/dashboard');
      }
    } catch {
      triggerError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 antialiased overflow-x-hidden">
      {/* LEFT COLUMN: HERO PANEL */}
      <div 
        className="hidden md:flex md:w-1/2 p-10 flex-col justify-between relative bg-cover bg-center shrink-0"
        style={{ backgroundImage: `url('/images/vendor_signup_hero.png')` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        {/* Brand Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-8.5 w-8.5 relative shrink-0">
            <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight">VegKing Merchant</span>
        </div>

        {/* Benefits Card */}
        <div className="relative z-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-md shadow-2xl">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/25">Merchant Portal</span>
          <h2 className="text-2xl font-black text-white mt-3 tracking-tight leading-tight">Welcome back, Merchant</h2>
          <p className="text-xs font-medium text-gray-200 mt-1.5 leading-relaxed">Log in to manage your shop's inventory, fulfill active orders, view customer messages, and track earnings.</p>
          
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-gray-100 font-semibold">
              <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] shrink-0">✓</span>
              <span>Dedicated delivery rider fleet for all orders</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-100 font-semibold">
              <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] shrink-0">✓</span>
              <span>Direct bank settlement within 24 hours</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-100 font-semibold">
              <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] shrink-0">✓</span>
              <span>Advanced inventory & pricing controls</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] text-gray-300 font-semibold">
          © 2026 VegKing Merchant Portal. All rights reserved.
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-between py-12 px-6 sm:px-12 md:px-14 overflow-y-auto max-h-screen">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          
          {/* Mobile Logo & Header Link */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:hidden">
              <div className="h-8 w-8 relative shrink-0">
                <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-sm text-gray-900 tracking-tight">VegKing</span>
            </div>
            <Link href="/vendor/register" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 ml-auto transition-colors">
              Become a vendor? <span className="underline">Apply</span>
            </Link>
          </div>

          {/* Form Header */}
          <div>
            <h1 className="text-lg font-black text-gray-955 tracking-tight">Vendor Login</h1>
            <p className="mt-1 text-[11px] font-semibold text-gray-400">Approved vendors can access their merchant dashboard here.</p>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(event) => setEmail(event.target.value)} 
                  placeholder="e.g. merchant@vegking.com" 
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  placeholder="Enter account password" 
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800" 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 text-xs font-extrabold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] shadow-md shadow-emerald-100 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  Log In
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs font-semibold text-gray-500">
            New seller?{' '}
            <Link href="/vendor/register" className="font-black text-emerald-600 hover:underline">
              Become a Vendor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
