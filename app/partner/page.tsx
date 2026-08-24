"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Users,
  DollarSign,
  Store,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Percent,
  Check,
  Calculator
} from "lucide-react";

// Types
interface CategoryRate {
  name: string;
  traditionalMargin: number; // e.g. 60% (meaning 40% loss to middlemen)
  vegKingMargin: number;      // e.g. 88% (meaning only 12% commission)
}

const CATEGORY_DATA: Record<string, CategoryRate> = {
  vegetables: { name: "Fresh Vegetables", traditionalMargin: 0.58, vegKingMargin: 0.88 },
  fruits: { name: "Organic Fruits", traditionalMargin: 0.55, vegKingMargin: 0.86 },
  dairy: { name: "Dairy & Farm Fresh", traditionalMargin: 0.62, vegKingMargin: 0.90 },
  groceries: { name: "Organic Staples", traditionalMargin: 0.65, vegKingMargin: 0.92 },
};

export default function PartnerPage() {
  // Profit Calculator State
  const [sales, setSales] = useState<number>(150000);
  const [category, setCategory] = useState<keyof typeof CATEGORY_DATA>("vegetables");

  // Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const selectedCategory = CATEGORY_DATA[category];
  const traditionalEarnings = Math.round(sales * selectedCategory.traditionalMargin);
  const vegKingEarnings = Math.round(sales * selectedCategory.vegKingMargin);
  const incrementalProfit = vegKingEarnings - traditionalEarnings;

  const faqs = [
    {
      q: "Who can partner with VegKing?",
      a: "Any local farmer, organic grower, dairy producer, cooperative society, or local grocery business that maintains quality standards and wants to sell fresh, organic, or healthy items directly to consumers."
    },
    {
      q: "What are the registration charges?",
      a: "VegKing has zero registration or monthly subscription fees for partners. We only charge a small performance-based commission on successful sales, meaning we only make money when you do."
    },
    {
      q: "How does logistics and delivery work?",
      a: "Once you pack and label the order, VegKing's integrated rider network will pick it up directly from your farm or store and deliver it to the buyer. You focus on quality, we handle the delivery."
    },
    {
      q: "When and how do I receive payouts?",
      a: "Payouts are processed directly into your registered bank account weekly. You can track all orders, commissions, and upcoming payouts in real-time on your Vendor Dashboard."
    }
  ];

  return (
    <div className="bg-[#f6faf5] text-gray-900 font-sans">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/vendor_signup_hero.png"
            alt="Healthy farm fresh partner"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#073c2a]/95 via-[#073c2a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f6faf5] via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#a3e635] backdrop-blur-md rounded-full mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Harvest Alliance Program
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Sow the Seeds of <br />
              <span className="text-[#a3e635]">Your Digital Growth</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl font-medium text-white/90 leading-relaxed max-w-2xl">
              Connect your farm, dairy, or shop directly to thousands of local families. Bypass middlemen, maximize your margins, and deliver freshness.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/vendor/register"
                className="group flex h-14 items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] px-8 text-sm font-bold text-white transition-all duration-300 shadow-lg shadow-[#16a34a]/30 rounded-xl"
              >
                Become a Partner
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/vendor/login"
                className="flex h-14 items-center justify-center border border-white/30 bg-white/10 hover:bg-white/20 px-8 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 rounded-xl"
              >
                Partner Portal Login
              </Link>
            </div>

            {/* Quick stats badges */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-10">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-xl">
                <span className="block text-2xl font-black text-green-800">15k+</span>
                <span className="text-xs text-white/100 font-semibold uppercase tracking-wider">Active Customers</span>
              </div>
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-xl">
                <span className="block text-2xl font-black text-green-800">30%+</span>
                <span className="text-xs text-white/100 font-semibold uppercase tracking-wider">Higher Margins</span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                <span className="block text-2xl font-black text-green-800">24-Hour</span>
                <span className="text-xs text-white/100 font-semibold uppercase tracking-wider">Onboarding</span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                <span className="block text-2xl font-black text-green-800">Weekly</span>
                <span className="text-xs text-white/100 font-semibold uppercase tracking-wider">Direct Payouts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose VegKing / Profits Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-extrabold text-[#16a34a] uppercase tracking-widest">Why Partner With Us</h2>
          <p className="mt-3 text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
            Designed to Maximize Your Earnings & Reach
          </p>
          <p className="mt-4 text-base text-gray-500 font-medium">
            Unlike traditional wholesalers or high-commission delivery apps, we believe the ones who produce or stock the food should keep the majority of the profit.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Card 1 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl relative group">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-[#16a34a] mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-950">Higher Profit Margins</h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed font-medium">
              We charge a flat platform commission starting as low as 8%, compared to traditional brokers who take up to 40% of your margins.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl relative group">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-[#16a34a] mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-950">Direct Customer Base</h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed font-medium">
              Get immediate placement to a curated group of quality-conscious buyers and organic subscribers. Build your own brand on our store.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl relative group">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-[#16a34a] mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-950">Zero-Hassle Logistics</h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed font-medium">
              Our automated delivery fleet assigns a rider to your location as soon as you confirm packing. No delivery overhead for your team.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Profit Estimator Section */}
      <section className="bg-gradient-to-br from-[#073c2a] to-[#1e3b2b] text-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">

            <div>
              <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#a3e635] rounded-lg mb-6">
                <Calculator className="h-3.5 w-3.5" />
                Live Revenue Estimator
              </div>
              <h2 className="text-3xl sm:text-4xl font-black">
                Estimate Your Earnings
              </h2>
              <p className="mt-4 text-white/80 font-medium leading-relaxed">
                Choose your product category and sliding scale of monthly sales. See how our low commission and direct-to-consumer model puts more money directly back into your bank account.
              </p>

              {/* Calculator Inputs */}
              <div className="mt-10 space-y-8">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-3">
                    Product Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(CATEGORY_DATA).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setCategory(key as keyof typeof CATEGORY_DATA)}
                        className={`px-4 py-3 text-left border rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-between ${category === key
                          ? "bg-[#16a34a] border-[#16a34a] text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                      >
                        {value.name}
                        {category === key && <CheckCircle2 className="h-4 w-4 text-white shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sales Volume Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-black uppercase tracking-wider text-white/70">
                      Estimated Monthly Sales
                    </label>
                    <span className="text-lg font-black text-[#a3e635]">
                      ₹{sales.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20000"
                    max="1000000"
                    step="10000"
                    value={sales}
                    onChange={(e) => setSales(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#a3e635]"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-bold mt-2">
                    <span>₹20,000</span>
                    <span>₹500,000</span>
                    <span>₹1,000,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="bg-white/5 border border-white/15 p-8 rounded-3xl backdrop-blur-md">
              <h3 className="text-sm font-black uppercase tracking-wider text-white/50 mb-6">
                Monthly Profit Breakdown
              </h3>

              <div className="space-y-6">
                {/* Traditional Wholesalers */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <span className="block text-sm text-white/75 font-semibold">Traditional Channels</span>
                    <span className="text-xs text-white/40">Includes local middlemen & waste</span>
                  </div>
                  <span className="text-xl font-bold text-white/60">
                    ₹{traditionalEarnings.toLocaleString()}
                  </span>
                </div>

                {/* VegKing Platform */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <span className="block text-sm text-[#a3e635] font-extrabold flex items-center gap-1">
                      VegKing Partner Network
                    </span>
                    <span className="text-xs text-white/40">Only 8%-12% commission</span>
                  </div>
                  <span className="text-2xl font-black text-[#a3e635]">
                    ₹{vegKingEarnings.toLocaleString()}
                  </span>
                </div>

                {/* Extra Profit callout */}
                <div className="bg-[#a3e635]/10 border border-[#a3e635]/30 p-6 rounded-2xl text-center">
                  <span className="block text-xs uppercase tracking-wider font-extrabold text-[#a3e635]">
                    Your Additional Monthly Earnings
                  </span>
                  <span className="block text-3xl sm:text-4xl font-black text-[#a3e635] mt-2">
                    + ₹{incrementalProfit.toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-[#a3e635]/80 font-medium mt-1">
                    Keep your hard-earned profits. Reach families directly.
                  </span>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/vendor/register"
                  className="w-full text-center py-4 bg-white hover:bg-gray-100 text-[#073c2a] text-sm font-extrabold transition-all duration-300 rounded-xl"
                >
                  Start Earning More Today
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Simple 4-Step Process Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-extrabold text-[#16a34a] uppercase tracking-widest">Simple Setup</h2>
          <p className="mt-3 text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
            How It Works
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {[
            {
              step: "01",
              title: "Apply Online",
              desc: "Provide your basic shop/farm details and GST details.",
            },
            {
              step: "02",
              title: "Get Verified",
              desc: "Our verification team checks and approves your partner dashboard.",
            },
            {
              step: "03",
              title: "Add Products",
              desc: "Upload inventory, photos, pricing, and pack weights.",
            },
            {
              step: "04",
              title: "Fulfil & Earn",
              desc: "Orders get routed to you, riders deliver, and payouts deposit weekly.",
            },
          ].map((item, index) => (
            <div key={index} className="bg-white border border-gray-100 p-6 rounded-2xl relative">
              <span className="block text-4xl font-black bg-gradient-to-br from-green-100 to-green-800 bg-clip-text text-transparent absolute top-4 right-6">
                {item.step}
              </span>
              <h3 className="mt-6 text-lg font-black text-gray-950">{item.title}</h3>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="border-t border-gray-100 bg-[#f7faf5] py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-950">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-sm text-gray-500 font-medium">
              Everything you need to know about partnering with VegKing.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="font-extrabold text-sm text-gray-900 pr-4">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-[#16a34a] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-xs text-gray-600 leading-relaxed font-medium border-t border-gray-50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#16a34a] to-[#4a7c59] text-white p-12 sm:p-16 rounded-3xl relative overflow-hidden text-center sm:text-left">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-radial-gradient shrink-0 pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Ready to take your business online?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/90 leading-relaxed font-medium">
              Join the VegKing partner ecosystem today. Create your shop account in under 5 minutes and start supplying local neighborhoods.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/vendor/register"
                className="inline-flex h-12 items-center justify-center bg-white hover:bg-gray-100 px-6 text-xs font-black text-[#16a34a] rounded-xl transition duration-300"
              >
                Become a Partner
              </Link>
              <Link
                href="/vendor/login"
                className="inline-flex h-12 items-center justify-center border border-white/30 bg-[#16a34a]/30 hover:bg-[#16a34a]/50 px-6 text-xs font-black text-white rounded-xl backdrop-blur-sm transition duration-300"
              >
                Login to Partner Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
