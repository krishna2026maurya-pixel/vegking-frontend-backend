'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Scale, Sparkles, MessageSquare, ArrowLeft, Search, ShieldCheck, 
  CheckCircle2, ShoppingCart, Zap, Clock, ArrowRight, Check 
} from 'lucide-react';
import NegotiationModal from '@/components/NegotiationModal';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function BulkProductsPage() {
  const router = useRouter();
  const { data: session } = useAuth();
  const { addBulkDealToCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<any[]>([]);
  const [negotiateProduct, setNegotiateProduct] = useState<any>(null);

  // User Negotiations for real-time deal detection
  const [userNegotiations, setUserNegotiations] = useState<any[]>([]);
  const [loadingNegotiations, setLoadingNegotiations] = useState(false);

  const fetchUserNegotiations = useCallback(async () => {
    if (!session?.user?.id) {
      setUserNegotiations([]);
      return;
    }
    try {
      const res = await fetch(`/api/negotiations?user_id=${session.user.id}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.data) {
        setUserNegotiations(json.data);
      }
    } catch (e) {
      console.error('Failed to load user bulk negotiations:', e);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products?limit=200'),
          fetch('/api/categories?limit=50'),
        ]);

        const prodJson = await prodRes.json();
        const catJson = await catRes.json();

        setProducts(prodJson.data || []);
        setCategories(catJson.data || []);
      } catch (e) {
        console.error('Failed to load bulk products:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchUserNegotiations();
    const interval = setInterval(fetchUserNegotiations, 3000);
    return () => clearInterval(interval);
  }, [fetchUserNegotiations]);

  // Map product_id to active negotiation
  const dealsMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const neg of userNegotiations) {
      const pid = String(neg.product_id?._id || neg.product_id);
      if (pid) {
        if (!map[pid] || neg.status === 'ACCEPTED') {
          map[pid] = neg;
        }
      }
    }
    return map;
  }, [userNegotiations]);

  const acceptedDeals = useMemo(() => {
    return userNegotiations.filter((n) => n.status === 'ACCEPTED');
  }, [userNegotiations]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search.trim() ||
      (p.name || p.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.vendor_shop_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesCat = categoryFilter === 'All' ||
      (p.category || '').toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCat;
  });

  const handleOrderAcceptedDeal = (deal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    addBulkDealToCart({
      negotiation_id: deal._id,
      product_id: deal.product_id?._id || deal.product_id,
      product_name: deal.product_name,
      product_image: deal.product_image || '/images/product-card-default.jpg',
      agreed_rate: deal.final_agreed_price,
      agreed_qty: deal.final_agreed_qty,
      unit: deal.unit || 'kg',
      deal_token: deal.deal_token,
    }, e);
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-[#070e17] text-gray-100 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Compact Navigation & Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-green-900 to-teal-950 rounded-2xl p-4 sm:p-6 border border-emerald-800/40 shadow-xl relative overflow-hidden">
          <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
            <Scale className="w-44 h-44 text-emerald-300" />
          </div>

          <div className="relative z-10 space-y-2.5 max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-bold uppercase tracking-wider transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Buy in Bulk & Direct Vendor Negotiations
              </h1>
              <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Min 5 kg
              </span>
            </div>

            <p className="text-emerald-200/90 text-xs sm:text-sm leading-relaxed">
              Order produce in bulk (5 kg or more) directly from verified growers and vendors. Bargain custom rates and delivery terms in live chat.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-emerald-200">
              <span className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg backdrop-blur border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Minimum 5 kg Order
              </span>
              <span className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg backdrop-blur border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Direct Verified Vendor Sourcing
              </span>
              <span className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg backdrop-blur border border-white/10">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Live Direct Bargaining
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Approved Deals Alert Banner for Logged-In User */}
        {acceptedDeals.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-900/90 via-green-900/90 to-teal-900/90 rounded-2xl p-4 sm:p-5 border-2 border-emerald-400 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400 text-gray-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      🎉 You have {acceptedDeals.length} Approved Wholesale Deal{acceptedDeals.length > 1 ? 's' : ''}!
                    </h2>
                    <span className="bg-emerald-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Ready for Order
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Your negotiated bulk rates have been accepted by the seller. Claim before the 24-hour deal window closes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {acceptedDeals.map((deal) => (
                  <div 
                    key={deal._id}
                    className="flex items-center gap-2.5 bg-black/40 border border-emerald-500/40 rounded-xl p-2 shrink-0 backdrop-blur"
                  >
                    <img
                      src={deal.product_image || '/images/product-card-default.jpg'}
                      alt={deal.product_name}
                      className="w-9 h-9 rounded-lg object-cover border border-emerald-500/30"
                    />
                    <div className="text-xs">
                      <div className="font-extrabold text-white truncate max-w-[120px]">{deal.product_name}</div>
                      <div className="text-emerald-300 font-bold text-[11px]">
                        ₹{deal.final_agreed_price}/{deal.unit} &bull; {deal.final_agreed_qty} {deal.unit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleOrderAcceptedDeal(deal, e)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs rounded-lg transition shadow flex items-center gap-1 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Buy (₹{deal.total_deal_amount})</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Compact Search & Category Filter Row */}
        <div className="bg-[#0e1726] rounded-xl p-3 border border-gray-800 shadow-md flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search produce or vendor..."
              className="w-full h-9 pl-9 pr-3 bg-[#162235] border border-gray-700/80 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Clean Scrollable Category Pills without ugly scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full scrollbar-none [&::-webkit-scrollbar]:hidden py-0.5">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                categoryFilter === 'All'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#162235] text-gray-300 hover:bg-[#1f2f47] hover:text-white border border-gray-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id || c.name}
                onClick={() => setCategoryFilter(c.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  categoryFilter === c.name
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#162235] text-gray-300 hover:bg-[#1f2f47] hover:text-white border border-gray-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#0e1726] rounded-xl p-3 border border-gray-800 animate-pulse space-y-2.5">
                <div className="aspect-[4/3] bg-gray-800 rounded-lg" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
                <div className="h-2.5 bg-gray-800 rounded w-1/2" />
                <div className="h-8 bg-gray-800 rounded-lg mt-2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#0e1726] rounded-xl border border-gray-800 space-y-2">
            <Scale className="w-10 h-10 text-gray-500 mx-auto" />
            <h3 className="text-sm font-bold text-gray-300">No bulk items found</h3>
            <p className="text-xs text-gray-500">Try adjusting your search terms or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const minKg = p.bulk_min_qty || 5;
              const retailPrice = Number(p.price || p.selling_price || 0);
              const discountPct = Number(p.discount || 0);
              const wholesalePrice = (p.bulk_base_price && Number(p.bulk_base_price) > 0 && Number(p.bulk_base_price) < retailPrice)
                ? Number(p.bulk_base_price)
                : Math.max(1, Math.round(retailPrice * 0.85));

              const deal = dealsMap[p._id];
              const isDealAccepted = deal?.status === 'ACCEPTED';
              const isDealCountered = deal?.status === 'COUNTERED';

              return (
                <div
                  key={p._id}
                  onClick={() => setNegotiateProduct(p)}
                  className={`rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                    isDealAccepted
                      ? 'bg-gradient-to-b from-emerald-950/60 to-[#0e1726] border-2 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/40'
                      : isDealCountered
                      ? 'bg-gradient-to-b from-amber-950/40 to-[#0e1726] border border-amber-500/80'
                      : 'bg-[#0e1726] border-gray-800 hover:border-emerald-500 hover:shadow-lg'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Compact Image */}
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-800/80">
                      <img
                        src={p.image || p.product_image || '/images/product-card-default.jpg'}
                        alt={p.name || p.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Status Badges */}
                      {isDealAccepted ? (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-400 text-gray-950 font-black text-[9px] px-2 py-0.5 rounded uppercase shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Deal Accepted: ₹{deal.final_agreed_price}/{deal.unit || 'kg'}</span>
                        </span>
                      ) : isDealCountered ? (
                        <span className="absolute top-1.5 left-1.5 bg-amber-400 text-gray-950 font-black text-[9px] px-2 py-0.5 rounded uppercase shadow-sm">
                          Counter: ₹{deal.current_counter_price}/{deal.unit || 'kg'}
                        </span>
                      ) : (
                        <span className="absolute top-1.5 left-1.5 bg-amber-400 text-gray-950 font-black text-[9px] px-2 py-0.2 rounded uppercase shadow-sm">
                          Min {minKg} kg
                        </span>
                      )}
                    </div>

                    {/* Vendor & Title */}
                    <div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider truncate">
                        {p.vendor_shop_name || 'Verified Vendor'}
                      </p>
                      <h3 className="font-bold text-white text-sm truncate mt-0.5 group-hover:text-emerald-300 transition">
                        {p.name || p.product_name}
                      </h3>
                      <p className="text-[11px] text-gray-400 truncate">{p.category || 'Fresh Produce'}</p>
                    </div>

                    {/* Pricing Snippet */}
                    {isDealAccepted ? (
                      <div className="p-2.5 bg-emerald-950/80 rounded-lg border border-emerald-600/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">Your Approved Rate:</span>
                          <span className="text-sm font-black text-emerald-300">
                            ₹{deal.final_agreed_price}/{deal.unit || 'kg'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-100 font-semibold">
                          <span>Agreed: {deal.final_agreed_qty} {deal.unit || 'kg'}</span>
                          <span className="font-black text-white">Total: ₹{deal.total_deal_amount}</span>
                        </div>
                        <div className="pt-1 border-t border-emerald-800/40 flex justify-between text-[10px] text-gray-400">
                          <span>Wholesale: <span className="line-through">₹{wholesalePrice}</span></span>
                          <span>Retail: <span className="line-through">₹{retailPrice}</span></span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-[#142032] rounded-lg flex items-center justify-between border border-gray-800 text-xs">
                        <div>
                          <span className="text-[9px] text-gray-400 block leading-tight">Wholesale Rate:</span>
                          <span className="text-sm font-black text-emerald-400">
                            ₹{wholesalePrice}/kg
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-500 block leading-tight">Retail:</span>
                          <span className="text-[11px] line-through text-gray-500">
                            ₹{retailPrice}/kg
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compact Action Buttons */}
                  {isDealAccepted ? (
                    <div className="mt-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleOrderAcceptedDeal(deal, e)}
                        className="w-full h-9 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Order Deal (₹{deal.total_deal_amount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNegotiateProduct(p)}
                        className="w-full text-center text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                      >
                        View Deal & Chat History
                      </button>
                    </div>
                  ) : isDealCountered ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNegotiateProduct(p);
                      }}
                      className="mt-2.5 w-full h-8.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-wider shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Review Offer (₹{deal.current_counter_price})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNegotiateProduct(p);
                      }}
                      className="mt-2.5 w-full h-8.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Negotiate Rate</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Compact Live Negotiation Modal */}
        <NegotiationModal
          isOpen={!!negotiateProduct}
          onClose={() => {
            setNegotiateProduct(null);
            fetchUserNegotiations();
          }}
          product={negotiateProduct}
        />

      </div>
    </div>
  );
}
