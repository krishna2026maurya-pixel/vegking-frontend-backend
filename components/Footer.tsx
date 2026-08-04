"use client";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Mail, MapPin, Phone, Truck } from 'lucide-react';

const shopLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/cart', label: 'Cart' },
  { href: '/login', label: 'Orders' },
];

const helpLinks = [
  'Freshness guarantee',
  'Same-day delivery',
  'Secure checkout',
  'Easy returns',
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <footer className="mt-16 bg-accent-darker text-white border-t border-primary-variant/20">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">

          {/* Logo & Slogan Column */}
          <div className="space-y-4">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <Image src="/logo.png" alt="Organic Vatika" width={44} height={44} priority className="object-contain" />
            </Link>
            <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-green-100/80 font-medium">
              Fresh, organic, and locally grown vegetables delivered quickly from trusted farms to your kitchen. Healthy living starts here.
            </p>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
              <Leaf className="h-3.5 w-3.5 fill-white/10" />
              100% fresh picks daily
            </div>
          </div>

          {/* Shops Navigation Links */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-white mb-4 pb-1 border-b border-white/15 inline-block">
              Shop
            </h2>
            <div className="space-y-3">
              {shopLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-xs sm:text-sm text-green-100/90 font-medium transition-colors hover:text-accent-warm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Guarantees Column */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-white mb-4 pb-1 border-b border-white/15 inline-block">
              Why Us
            </h2>
            <div className="space-y-3">
              {helpLinks.map((label) => (
                <p key={label} className="text-xs sm:text-sm text-green-100/90 font-medium">
                  {label}
                </p>
              ))}
            </div>
          </div>

          {/* Contact Details Column */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-white mb-4 pb-1 border-b border-white/15 inline-block">
              Contact
            </h2>
            <div className="space-y-3.5 text-xs sm:text-sm text-green-100/80 font-medium">
              <p className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent-warm shrink-0" />
                +91 98765 43210
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-green-300 shrink-0" />
                hello@veggiemart.local
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-green-300 shrink-0" />
                Fresh Market Road, India
              </p>
              <p className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-accent-warm shrink-0" />
                Delivery every day, 7 AM - 10 PM
              </p>
            </div>
          </div>
        </div>

        {/* Footer Sub-bottom copyrights */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-[10px] sm:text-xs font-bold text-green-200/50 sm:flex-row sm:items-center sm:justify-between uppercase tracking-widest">
          <p>© 2026 Organic Vatika. All rights reserved.</p>
          <p className="text-accent-warm">Farm fresh vegetables, delivered with care.</p>
        </div>
      </div>
    </footer>
  );
}
