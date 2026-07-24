'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Leaf, LogIn, Phone, Lock, Loader2, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [mobileNo, setMobileNo] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNo || mobileNo.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no: mobileNo })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setMessage(data.message || 'OTP sent successfully! Demo OTP: 1234');
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no: mobileNo, otp })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

      // Store token (e.g. localStorage)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      router.push('/user/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-5">
      <div className="grid w-full max-w-4xl overflow-hidden border border-gray-100 bg-white shadow-xl shadow-primary/10 lg:max-h-[34rem] lg:grid-cols-[0.98fr_1.02fr]">
        <section className="relative hidden overflow-hidden bg-accent-dark lg:block">
          <Image
            src="/images/auth-login-organic.png"
            alt="Fresh vegetables from Organic Vatika"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-accent-dark/95 via-accent-dark/55 to-accent-dark/20" />
          <Link href="/" className="absolute left-6 top-6 z-10 inline-flex items-center gap-2">
            <span className="text-sm font-black text-white">Organic Vatika</span>
          </Link>
          <div className="absolute inset-x-0 bottom-0 p-7 text-white">
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest backdrop-blur">
              <Leaf className="h-3.5 w-3.5" />
              Organic Vatika
            </div>
            <h2 className="mt-4 max-w-sm text-3xl font-black leading-tight">
              Fresh vegetables delivered with care.
            </h2>
            <p className="mt-3 max-w-sm text-xs font-medium leading-6 text-green-50/85">
              Sign in to manage your cart, track orders, and keep your weekly fresh grocery routine moving.
            </p>

            <div className="mt-6 grid max-w-sm grid-cols-2 gap-3">
              <div className="border border-white/15 bg-white/10 p-3 backdrop-blur">
                <Truck className="h-4 w-4 text-orange-300" />
                <p className="mt-2 text-xs font-extrabold">Daily delivery</p>
              </div>
              <div className="border border-white/15 bg-white/10 p-3 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-green-200" />
                <p className="mt-2 text-xs font-extrabold">Freshness checked</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden px-4 py-5 sm:px-6 lg:px-9">
          <div className="absolute inset-0 lg:hidden">
            <Image
              src="/images/auth-login-organic.png"
              alt="Fresh vegetables from Organic Vatika"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-white/92" />
          </div>
          <div className="relative z-10 w-full max-w-sm">
            <div className="relative mb-4 flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 lg:hidden">
                <span className="text-xs font-black text-text-brand">Organic Vatika</span>
              </Link>
              <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-primary-hover hover:underline">
                Home
              </Link>
            </div>

            <div className="relative border border-white/70 bg-white/95 p-5 shadow-xl shadow-primary/10 sm:p-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center bg-green-50 text-primary-hover">
                <LogIn className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">Welcome Back</h1>
              <p className="mt-2 text-xs font-medium leading-5 text-gray-500">
                Enter your credentials to access your account.
              </p>

              {message && (
                <div className="mt-3 border border-green-100 bg-green-50 p-3 text-xs font-semibold text-green-600">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-3 border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600 animate-shake">
                  {error}
                </div>
              )}

              <form onSubmit={step === 'mobile' ? handleSendOtp : handleVerifyOtp} className="mt-4 space-y-3">
                {step === 'mobile' ? (
                  <Input
                    type="tel"
                    placeholder="Mobile Number"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    icon={<Phone />}
                    required
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    icon={<Lock />}
                    required
                  />
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-xs font-extrabold"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 'mobile' ? 'Send OTP' : 'Verify & Login'}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs font-semibold text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-black text-primary hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
