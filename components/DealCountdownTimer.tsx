'use client';
import React, { useState, useEffect } from 'react';
import { Clock, Flame, ShieldAlert } from 'lucide-react';
interface DealCountdownTimerProps {
  expiresAt?: string | Date | null;
  fallbackStartTime?: string | Date | null; // e.g. updatedAt
  variant?: 'compact' | 'badge' | 'box';
  onExpire?: () => void;
  className?: string;
}
export default function DealCountdownTimer({
  expiresAt,
  fallbackStartTime,
  variant = 'compact',
  onExpire,
  className = '',
}: DealCountdownTimerProps) {
  // Calculate target expiry timestamp (default 24 hours from start if not set)
  const getTargetTimestamp = (): number => {
    if (expiresAt) {
      const parsed = new Date(expiresAt).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (fallbackStartTime) {
      const parsedStart = new Date(fallbackStartTime).getTime();
      if (!isNaN(parsedStart) && parsedStart > 0) {
        return parsedStart + 24 * 60 * 60 * 1000;
      }
    }
    // Default fallback: 24h from now
    return Date.now() + 24 * 60 * 60 * 1000;
  };

  const [timeLeft, setTimeLeft] = useState<{
    totalMs: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    totalMs: 86400000,
    hours: 23,
    minutes: 59,
    seconds: 59,
    isExpired: false,
  });

  useEffect(() => {
    const target = getTargetTimestamp();

    const calculateTime = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          totalMs: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        totalMs: diff,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, fallbackStartTime]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = timeLeft.totalMs < 2 * 60 * 60 * 1000 && !timeLeft.isExpired; // Less than 2 hours
  const isMedium = timeLeft.totalMs < 6 * 60 * 60 * 1000 && !isUrgent && !timeLeft.isExpired;

  if (timeLeft.isExpired) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-[11px] font-black uppercase tracking-wider ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span>Deal Expired</span>
      </div>
    );
  }

  // 1. Box / Digital Clock Variant (Ideal for Drawer Top Card)
  if (variant === 'box') {
    return (
      <div className={`p-2.5 rounded-2xl border transition-all duration-500 ${isUrgent
          ? 'bg-gradient-to-r from-red-950/90 via-orange-950/80 to-red-950/90 border-red-600/80 text-red-200 animate-pulse'
          : isMedium
            ? 'bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border-amber-500/60 text-amber-200'
            : 'bg-black/40 backdrop-blur-md border-emerald-500/40 text-emerald-100'
        } ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <Flame className="w-4 h-4 text-orange-400 animate-bounce shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                {isUrgent ? '🔥 Price Locking Out Soon!' : '🔒 Agreed Rate Locked For'}
              </span>
              <p className="text-[10px] text-gray-300">Checkout before 24h timer expires</p>
            </div>
          </div>

          {/* Digital Timer Counter */}
          <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
            <div className="bg-black/60 px-2 py-1 rounded-lg border border-white/10 text-white min-w-[30px] text-center shadow-inner">
              {pad(timeLeft.hours)}<span className="text-[9px] text-gray-400 block -mt-0.5 font-sans">h</span>
            </div>
            <span className="text-amber-400 font-bold">:</span>
            <div className="bg-black/60 px-2 py-1 rounded-lg border border-white/10 text-white min-w-[30px] text-center shadow-inner">
              {pad(timeLeft.minutes)}<span className="text-[9px] text-gray-400 block -mt-0.5 font-sans">m</span>
            </div>
            <span className="text-amber-400 font-bold">:</span>
            <div className="bg-black/60 px-2 py-1 rounded-lg border border-white/10 text-amber-300 min-w-[30px] text-center shadow-inner animate-pulse">
              {pad(timeLeft.seconds)}<span className="text-[9px] text-amber-400/80 block -mt-0.5 font-sans">s</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Badge Pill Variant (Ideal for Profile Negotiation Cards & Cart items)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black tracking-tight transition-all shadow-xs ${isUrgent
          ? 'bg-red-950/80 border-red-700/80 text-red-200 animate-pulse'
          : isMedium
            ? 'bg-amber-950/70 border-amber-700/70 text-amber-200'
            : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200'
        } ${className}`}>
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : 'text-amber-400'} shrink-0`} />
        <span>
          Expires in <strong className="font-mono text-white font-extrabold">{pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s</strong>
        </span>
      </div>
    );
  }

  // 3. Default Compact inline Pill
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border font-mono ${isUrgent
        ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
        : 'bg-black/40 border-amber-400/40 text-amber-300'
      } ${className}`}>
      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
      <span>{pad(timeLeft.hours)}h:{pad(timeLeft.minutes)}m:{pad(timeLeft.seconds)}s left</span>
    </span>
  );
}
