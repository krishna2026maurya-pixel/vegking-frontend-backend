"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ShoppingBag, Package, Bell, X, ExternalLink, Flame, UserPlus, Store } from 'lucide-react';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  createdAt?: string;
}

interface LiveNotificationToastProps {
  role?: 'admin' | 'vendor' | 'all';
  vendorId?: string;
}

// Gentle pleasant sound chime using Web Audio API
function playChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Note 1 (D5 - 587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.09, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2 (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.09, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Audio autoplay or permission restriction safely ignored
  }
}

export default function LiveNotificationToast({ role: propRole, vendorId: propVendorId }: LiveNotificationToastProps) {
  const { data: session, status } = useSession();
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const lastCheckRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadedRef = useRef<boolean>(false);
  const autoHideTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Auto-detect role and vendorId from session
  const sessionUser = session?.user as any;
  const userRole = sessionUser?.role;
  
  // STRICT: Only allow admin and vendor to receive pop-up notifications.
  // Unauthenticated visitors and normal users (role: 'user') must never see popup toasts.
  const isAuthorized = status === 'authenticated' && (userRole === 'admin' || userRole === 'vendor');
  const activeRole: 'admin' | 'vendor' | null = isAuthorized
    ? (userRole === 'vendor' ? 'vendor' : 'admin')
    : (propRole === 'admin' || propRole === 'vendor' ? propRole : null);
  const activeVendorId = propVendorId || (activeRole === 'vendor' ? (sessionUser?.id || sessionUser?._id) : undefined);

  // Clear toasts and timers whenever user logs out or becomes unauthorized
  useEffect(() => {
    if (!isAuthorized) {
      setToasts([]);
      initialLoadedRef.current = false;
      lastCheckRef.current = null;
      autoHideTimersRef.current.forEach(timer => clearTimeout(timer));
      autoHideTimersRef.current.clear();
    }
  }, [isAuthorized]);

  // Initialize dismissed IDs from sessionStorage (only when authorized)
  useEffect(() => {
    if (!isAuthorized) return;
    try {
      const stored = sessionStorage.getItem('vegking_dismissed_notifs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => seenIdsRef.current.add(id));
        }
      }
    } catch (_) {}
  }, [isAuthorized]);

  // Remove toast from display
  const removeToast = useCallback((id: string, options?: { manual?: boolean; markRead?: boolean }) => {
    setToasts(prev => prev.filter(t => t._id !== id));
    seenIdsRef.current.add(id);

    // Clear auto-hide timer for this toast
    if (autoHideTimersRef.current.has(id)) {
      clearTimeout(autoHideTimersRef.current.get(id));
      autoHideTimersRef.current.delete(id);
    }

    // If manual dismiss by user, remember in sessionStorage
    if (options?.manual) {
      try {
        const existing = Array.from(seenIdsRef.current).slice(-50);
        sessionStorage.setItem('vegking_dismissed_notifs', JSON.stringify(existing));
      } catch (_) {}
    }

    // Optionally mark as read in database
    if (options?.markRead) {
      fetch('/api/notifications/feed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }
  }, []);

  // Add new toast to queue with auto-dismiss
  const addToast = useCallback((item: NotificationItem) => {
    seenIdsRef.current.add(item._id);
    playChime();

    setToasts(prev => {
      // Prevent duplicates
      if (prev.some(t => t._id === item._id)) return prev;
      return [item, ...prev].slice(0, 4); // Max 4 on screen at once
    });

    // Auto-dismiss after 10s if not hovered
    const timer = setTimeout(() => {
      removeToast(item._id, { manual: false });
    }, 10000);
    autoHideTimersRef.current.set(item._id, timer);
  }, [removeToast]);

  // Support custom events and window console helpers for immediate testing (only when authorized)
  useEffect(() => {
    if (!isAuthorized) return;

    const handleCustomEvent = (event: any) => {
      if (event?.detail) {
        addToast(event.detail);
      }
    };

    window.addEventListener('vegking-notify', handleCustomEvent);

    // Expose test helper in browser window: window.vegkingTestToast('order')
    (window as any).vegkingTestToast = (type = 'new_order') => {
      const id = 'test_' + Date.now();
      let title = 'New Order Placed: #ORD-998811';
      let message = 'Order #ORD-998811 placed by Rahul Sharma (9876543210) for ₹640 via UPI.\nItems: Fresh Spinach 500g, Organic Tomatoes 1kg.\nDelivery to: Pune.';
      let link = activeRole === 'vendor' ? '/vendor/dashboard' : '/admin/orders';

      if (type === 'user_registered' || type === 'user') {
        title = 'New Customer Registration: Vikram Mehta';
        message = 'New customer registered: Vikram Mehta (Phone: 9811223344, Email: vikram@example.com) from Pune. Account is active.';
        link = '/admin/users';
      } else if (type === 'vendor_application' || type === 'vendor') {
        title = 'New Vendor Registered: Green Earth Organic Farm';
        message = 'New vendor registered: "Green Earth Organic Farm" owned by Anita Deshmukh. Phone: 9822334455, Location: Nashik.';
        link = '/admin/vendors';
      } else if (type === 'product_created' || type === 'product') {
        title = 'Product Added: Fresh Strawberries (500g)';
        message = 'Product: "Fresh Strawberries (500g)" (Fruits) added with 40 units in stock at ₹140. Shop: Direct / Admin.';
        link = activeRole === 'vendor' ? '/vendor/dashboard' : '/admin/products';
      }

      addToast({ _id: id, title, message, type, link, createdAt: new Date().toISOString() });
    };

    return () => {
      window.removeEventListener('vegking-notify', handleCustomEvent);
      delete (window as any).vegkingTestToast;
    };
  }, [isAuthorized, activeRole, addToast]);

  // Main notification feed poller - ONLY runs for authenticated admin and vendor
  useEffect(() => {
    // Strictly block unauthenticated visitors and non-admin/non-vendor users
    if (status !== 'authenticated' || !isAuthorized || !activeRole) {
      return;
    }

    // For vendor, wait until vendorId is available
    if (activeRole === 'vendor' && !activeVendorId) {
      return;
    }

    let isMounted = true;

    const poll = async () => {
      if (!isMounted) return;

      try {
        const params = new URLSearchParams({
          role: activeRole,
          limit: '5',
        });
        if (activeVendorId) {
          params.append('vendor_id', activeVendorId);
        }

        // On subsequent polls, send 'since' timestamp to fetch newly inserted notifications
        if (initialLoadedRef.current && lastCheckRef.current) {
          params.append('since', lastCheckRef.current);
        }

        const res = await fetch(`/api/notifications/feed?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!res.ok || !isMounted) return;

        const json = await res.json();
        if (!isMounted) return;

        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const freshItems: NotificationItem[] = [];

          for (const item of json.data) {
            if (!seenIdsRef.current.has(item._id)) {
              freshItems.push(item);
            }
          }

          if (freshItems.length > 0 && isMounted) {
            // ONLY mark as seen once confirmed ready to show
            freshItems.forEach(item => seenIdsRef.current.add(item._id));
            playChime();

            setToasts(prev => {
              const existingIds = new Set(prev.map(p => p._id));
              const toAdd = freshItems.filter(f => !existingIds.has(f._id));
              return [...toAdd, ...prev].slice(0, 4);
            });

            // Set up auto-hide timers
            freshItems.forEach(item => {
              const timer = setTimeout(() => {
                if (isMounted) {
                  removeToast(item._id, { manual: false });
                }
              }, 10000);
              autoHideTimersRef.current.set(item._id, timer);
            });
          }
        }

        initialLoadedRef.current = true;
        if (json.serverTime) {
          lastCheckRef.current = json.serverTime;
        }
      } catch {
        // Polling network drop handled gracefully
      }
    };

    // Run poll immediately on login
    poll();

    // Poll every 3.5 seconds
    const interval = setInterval(poll, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [status, isAuthorized, activeRole, activeVendorId, removeToast]);

  // Never render tray if unauthorized (guest or normal user) or no toasts
  if (!isAuthorized || toasts.length === 0) return null;

  return (
    <div 
      id="live-notification-tray"
      className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {toasts.map((toast) => {
        const isOrder = toast.type === 'new_order';
        const isUserReg = toast.type === 'user_registered';
        const isVendorReg = toast.type === 'vendor_application';
        const isProduct = toast.type === 'product_created' || toast.type === 'product_updated';

        // Event-specific theme tokens
        let theme = {
          border: 'border-emerald-500/50 dark:border-emerald-500/60',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          badgeText: 'NEW ORDER',
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-600 dark:text-emerald-400',
          icon: <ShoppingBag size={20} className="stroke-[2.2]" />,
          linkText: 'View Order',
          linkColor: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
        };

        if (isUserReg) {
          theme = {
            border: 'border-purple-500/50 dark:border-purple-500/60',
            badgeBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            badgeText: 'CUSTOMER SIGNUP',
            iconBg: 'bg-purple-100 dark:bg-purple-950/90 text-purple-600 dark:text-purple-400',
            icon: <UserPlus size={20} className="stroke-[2.2]" />,
            linkText: 'View Customer',
            linkColor: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
          };
        } else if (isVendorReg) {
          theme = {
            border: 'border-amber-500/50 dark:border-amber-500/60',
            badgeBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            badgeText: 'VENDOR REGISTRATION',
            iconBg: 'bg-amber-100 dark:bg-amber-950/90 text-amber-600 dark:text-amber-400',
            icon: <Store size={20} className="stroke-[2.2]" />,
            linkText: 'Review Vendor',
            linkColor: 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300',
          };
        } else if (isProduct) {
          theme = {
            border: 'border-blue-500/50 dark:border-blue-500/60',
            badgeBg: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            badgeText: 'INVENTORY UPDATE',
            iconBg: 'bg-blue-100 dark:bg-blue-950/90 text-blue-600 dark:text-blue-400',
            icon: <Package size={20} className="stroke-[2.2]" />,
            linkText: 'View Product',
            linkColor: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
          };
        } else if (!isOrder) {
          theme = {
            border: 'border-gray-300 dark:border-gray-700',
            badgeBg: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
            badgeText: 'ALERT',
            iconBg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
            icon: <Bell size={20} className="stroke-[2.2]" />,
            linkText: 'View Details',
            linkColor: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
          };
        }

        return (
          <div
            key={toast._id}
            className={`pointer-events-auto bg-white/95 dark:bg-gray-900/95 rounded-2xl p-4 shadow-2xl border ${theme.border} backdrop-blur-md transition-all duration-300 transform translate-x-0 animate-slide-in-right`}
            style={{
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.32), 0 0 1px 1px rgba(0, 0, 0, 0.12)',
              animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Header: Live Pulse Dot, Badge, and Close Button */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-gray-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  <Flame size={12} className="fill-orange-500 text-orange-500" />
                  Live Alert
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                  {theme.badgeText}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast._id, { manual: true, markRead: true })}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>

            {/* Notification Body with Full Details */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center shadow-inner ${theme.iconBg}`}
              >
                {theme.icon}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  {toast.title}
                </h4>
                {/* Full message display without truncation */}
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed break-words whitespace-pre-line">
                  {toast.message}
                </p>

                {/* Footer with time and direct action link */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80">
                  <span className="text-[10px] text-gray-400 font-medium">Just now</span>
                  {toast.link && (
                    <Link
                      href={toast.link}
                      onClick={() => removeToast(toast._id, { manual: true, markRead: true })}
                      className={`inline-flex items-center gap-1 text-xs font-black hover:underline transition cursor-pointer ${theme.linkColor}`}
                    >
                      <span>{theme.linkText}</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
