'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Scale, Search, Filter, RotateCw, Check, CheckCircle2, 
  X, Send, User, Store, Clock, ArrowRight, ShieldCheck, 
  MessageSquare, ShoppingCart, ChevronRight, Loader2 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { extractPriceFromMessage, getNegotiatedPrice } from '@/lib/negotiation-utils';

function deduplicateMessages(rawMessages: any[]): any[] {
  if (!Array.isArray(rawMessages)) return [];
  const seen = new Set<string>();
  const result: any[] = [];
  for (const m of rawMessages) {
    if (!m) continue;
    const key = m._id ? String(m._id) : `${m.createdAt || ''}-${m.sender_role || ''}-${m.message || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(m);
    }
  }
  return result;
}

export default function AdminBulkInquiriesPage() {
  const { data: session } = useAuth();

  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null);
  const [negotiationMessages, setNegotiationMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [adminCounterInput, setAdminCounterInput] = useState('');
  const [actionSending, setActionSending] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const fetchNegotiations = useCallback(async (silent = false) => {
    if (!silent && negotiations.length === 0) setLoading(true);
    try {
      const res = await fetch('/api/negotiations', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.data) {
        setNegotiations(json.data);
      }
    } catch (e) {
      console.error('Failed to load admin negotiations:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [negotiations.length]);

  useEffect(() => {
    fetchNegotiations(false);
    const interval = setInterval(() => fetchNegotiations(true), 4000);
    return () => clearInterval(interval);
  }, [fetchNegotiations]);

  const openNegotiation = async (neg: any) => {
    setSelectedNegotiation(neg);
    try {
      const res = await fetch(`/api/negotiations/${neg._id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.session) {
          setSelectedNegotiation(json.data.session);
        }
        setNegotiationMessages(deduplicateMessages(json.data.messages || []));
      }
    } catch (e) {
      console.error('Failed to load inquiry messages:', e);
    }
  };

  // Real-time polling for selected negotiation
  useEffect(() => {
    if (!selectedNegotiation?._id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/negotiations/${selectedNegotiation._id}`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.data) {
          if (json.data.session) {
            setSelectedNegotiation(json.data.session);
          }
          if (json.data.messages) {
            setNegotiationMessages((prev) => {
              const incoming = deduplicateMessages(json.data.messages);
              if (prev.length === incoming.length && prev.every((m, idx) => (m._id || idx) === (incoming[idx]?._id || idx))) {
                return prev;
              }
              return incoming;
            });
          }
        }
      } catch (err) {
        console.error('Silent admin chat poll error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedNegotiation?._id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [negotiationMessages.length]);

  // Auto-select first negotiation if none selected
  useEffect(() => {
    if (!selectedNegotiation && negotiations.length > 0) {
      openNegotiation(negotiations[0]);
    }
  }, [negotiations, selectedNegotiation]);

  const effectiveAgreedPrice = useMemo(() => {
    if (!selectedNegotiation) return 0;
    if (adminCounterInput && Number(adminCounterInput) > 0) {
      return Number(adminCounterInput);
    }
    return getNegotiatedPrice(selectedNegotiation, negotiationMessages);
  }, [selectedNegotiation, negotiationMessages, adminCounterInput]);

  const handleAdminSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNegotiation?._id || (!adminChatInput.trim() && !adminCounterInput)) return;
    setActionSending(true);
    try {
      const detectedPrice = extractPriceFromMessage(adminChatInput);
      const proposedPrice = adminCounterInput ? Number(adminCounterInput) : (detectedPrice || null);
      const res = await fetch(`/api/negotiations/${selectedNegotiation._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: session?.user?.id || 'admin',
          sender_role: 'vendor',
          sender_name: 'Platform Admin',
          message: adminChatInput.trim(),
          proposed_price: proposedPrice,
          proposed_qty: selectedNegotiation.requested_qty,
          offer_type: proposedPrice ? 'COUNTER' : 'CHAT',
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setNegotiationMessages((prev) => [...prev, json.data]);
        setAdminChatInput('');
        setAdminCounterInput('');
        fetchNegotiations(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionSending(false);
    }
  };

  const handleAdminAction = async (action: 'ACCEPT' | 'REJECT', customPrice?: number) => {
    if (!selectedNegotiation?._id) return;
    setActionSending(true);
    try {
      const finalPrice = customPrice || effectiveAgreedPrice || selectedNegotiation.current_counter_price || selectedNegotiation.initial_offer_price;
      const res = await fetch(`/api/negotiations/${selectedNegotiation._id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          sender_id: session?.user?.id || 'admin',
          sender_role: 'vendor',
          final_price: finalPrice,
          final_qty: selectedNegotiation.requested_qty,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setSelectedNegotiation(json.data);
        openNegotiation(json.data);
        fetchNegotiations(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionSending(false);
    }
  };

  const filteredNegotiations = negotiations.filter((n) => {
    const matchesStatus = statusFilter === 'ALL' || n.status === statusFilter;
    const matchesSearch = !search.trim() ||
      (n.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.vendor_shop_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.customer_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Bulk Inquiries & Negotiations</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {negotiations.length} Total
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monitor and arbitrate wholesale bulk inquiries between buyers and vendors across the VegKing platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNegotiations(false)}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, customer, or vendor..."
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'OPEN', 'COUNTERED', 'ACCEPTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: List & Chat */}
      {loading && negotiations.length === 0 ? (
        <div className="p-16 text-center text-gray-400 text-sm">Loading bulk inquiries...</div>
      ) : filteredNegotiations.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
          <Scale className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="font-bold text-gray-700 dark:text-gray-200">No Inquiries Found</h3>
          <p className="text-xs text-gray-400">Try adjusting your search terms or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar List */}
          <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredNegotiations.map((n) => {
              const isSelected = selectedNegotiation?._id === n._id;
              return (
                <div
                  key={n._id}
                  onClick={() => openNegotiation(n)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={n.product_image || '/images/product-card-default.jpg'}
                        alt={n.product_name}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate max-w-[170px]">
                          {n.product_name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Buyer: <strong>{n.customer_name || 'Customer'}</strong>
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Seller: {n.vendor_shop_name || 'Vendor'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        n.status === 'ACCEPTED'
                          ? 'bg-green-100 text-green-800'
                          : n.status === 'COUNTERED'
                          ? 'bg-amber-100 text-amber-800'
                          : n.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {n.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Requested:</span>
                      <span>{n.requested_qty} {n.unit || 'kg'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">
                        {n.status === 'ACCEPTED' ? 'Agreed Rate:' : 'Offer Rate:'}
                      </span>
                      <span className="text-emerald-600 font-bold">
                        ₹{n.final_agreed_price || n.current_counter_price || n.initial_offer_price}/{n.unit || 'kg'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Chat & Action Panel */}
          <div className="lg:col-span-7 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-5 flex flex-col min-h-[500px] justify-between">
            {selectedNegotiation ? (
              <div className="flex flex-col h-full space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                      {selectedNegotiation.product_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Buyer: <strong>{selectedNegotiation.customer_name}</strong> &bull; Seller: <strong>{selectedNegotiation.vendor_shop_name}</strong>
                    </p>
                  </div>

                  {selectedNegotiation.status === 'ACCEPTED' ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 font-extrabold text-xs px-3 py-1 rounded-xl border border-green-300 flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                        <span>Deal Accepted: ₹{selectedNegotiation.final_agreed_price || selectedNegotiation.current_counter_price}/{selectedNegotiation.unit || 'kg'} ({selectedNegotiation.final_agreed_qty || selectedNegotiation.requested_qty} {selectedNegotiation.unit || 'kg'} &bull; Total ₹{selectedNegotiation.total_deal_amount})</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAdminAction('ACCEPT', effectiveAgreedPrice)}
                        disabled={actionSending || effectiveAgreedPrice <= 0}
                        className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                        title={`Accept deal at ₹${effectiveAgreedPrice}/${selectedNegotiation.unit || 'kg'}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Deal (₹{effectiveAgreedPrice}/{selectedNegotiation.unit || 'kg'})</span>
                      </button>

                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-2 py-1 text-xs border border-gray-200 dark:border-gray-600" title="Adjust rate to accept or counter">
                        <span className="text-gray-400 font-bold mr-0.5">₹</span>
                        <input
                          type="number"
                          value={adminCounterInput}
                          onChange={(e) => setAdminCounterInput(e.target.value)}
                          placeholder={String(effectiveAgreedPrice)}
                          className="w-12 bg-transparent font-black text-gray-900 dark:text-white outline-none text-xs"
                        />
                        <span className="text-[10px] text-gray-400">/{selectedNegotiation.unit || 'kg'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdminAction('REJECT')}
                        disabled={actionSending}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Messages Stream */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto space-y-3 min-h-[250px] max-h-[350px] p-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl"
                >
                  {deduplicateMessages(negotiationMessages).map((msg: any, i: number) => {
                    const isVendor = msg.sender_role === 'vendor';
                    const itemKey = msg._id ? `${msg._id}-${i}` : `amsg-${i}`;
                    return (
                      <div key={itemKey} className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-bold text-gray-400 px-1 mb-0.5">
                          {isVendor ? (msg.sender_name || 'Vendor / Admin') : (msg.sender_name || 'Buyer')}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                            isVendor
                              ? 'bg-emerald-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                          }`}
                        >
                          <p>{msg.message}</p>
                          {msg.proposed_price && (
                            <div className="mt-1 font-bold text-[10px] opacity-90">
                              Offered Rate: ₹{msg.proposed_price}/{selectedNegotiation.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Counter Presets & Input */}
                {selectedNegotiation.status !== 'ACCEPTED' && selectedNegotiation.status !== 'REJECTED' && (
                  <form onSubmit={handleAdminSendMessage} className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={0.01}
                        value={adminCounterInput}
                        onChange={(e) => setAdminCounterInput(e.target.value)}
                        placeholder="Counter ₹/kg"
                        className="w-32 h-10 px-2.5 border border-amber-300 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={adminChatInput}
                        onChange={(e) => setAdminChatInput(e.target.value)}
                        placeholder="Send message to buyer/vendor..."
                        className="flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={actionSending || (!adminChatInput.trim() && !adminCounterInput)}
                        className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 text-xs">
                Select a bulk inquiry from the list to view chat and manage negotiation offers.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
