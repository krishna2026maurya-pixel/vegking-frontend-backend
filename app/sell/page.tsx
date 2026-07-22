import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardCheck, PackagePlus, Store, Truck } from 'lucide-react';

const benefits = [
  'Reach buyers looking for fresh, local, and organic produce.',
  'Manage product listings, stock, and pricing from one dashboard.',
  'Track marketplace orders tied to your own products.',
  'Get reviewed by the Organic Vatika admin team before selling.',
];

const steps = [
  { title: 'Apply', text: 'Submit your business, contact, and GST details for review.', icon: ClipboardCheck },
  { title: 'Get Approved', text: 'Admins verify your application and approve your vendor account.', icon: CheckCircle2 },
  { title: 'Add Products', text: 'List products with category, price, stock, image, and weight options.', icon: PackagePlus },
  { title: 'Fulfil Orders', text: 'Watch incoming orders and keep customers supplied with fresh produce.', icon: Truck },
];

export default function VendorInfoPage() {
  return (
    <div className="bg-white">
      <section className="relative min-h-[82vh] overflow-hidden">
        <Image
          src="/images/banner3.jpg"
          alt="Fresh produce marketplace"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest backdrop-blur">
              <Store className="h-4 w-4" />
              Vendor Marketplace
            </div>
            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-6xl">Sell on Organic Vatika</h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-white/85 sm:text-lg">
              Bring your farm, kitchen, or fresh grocery business to customers who care about quality and daily freshness.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/vendor/register"
                className="inline-flex h-12 items-center justify-center gap-2 bg-green-600 px-6 text-sm font-extrabold text-white transition hover:bg-green-700"
              >
                Become a Vendor
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vendor/login"
                className="inline-flex h-12 items-center justify-center border border-white/40 bg-white/10 px-6 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                Vendor Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-black text-gray-950">Built for real marketplace selling</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-gray-600">
            Vendor accounts stay pending until approved, so the storefront remains curated while sellers get a clear path from application to fulfilment.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="border border-gray-100 bg-gray-50 p-5">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="mt-3 text-sm font-bold leading-6 text-gray-800">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-100 bg-[#f7faf5]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-gray-950">How selling works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="border border-gray-100 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-green-700" />
                    <span className="text-xs font-black text-gray-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-black text-gray-950">{step.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-gray-600">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
