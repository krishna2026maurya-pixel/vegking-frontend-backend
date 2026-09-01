'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, MessageSquare, Send, CheckCircle2, AlertCircle, ShoppingCart, 
  Sparkles, Clock, ArrowRight, ShieldCheck, RefreshCw, Store, Check, 
  BadgeCheck, Scale, Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DealCountdownTimer from '@/components/DealCountdownTimer';

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    _id: string;
    name?: string;
    product_name?: string;
    image?: string;
    product_image?: string;
    price?: number;
    selling_price?: number;
    mrp?: number;
    discount?: number;
    vendor_id?: string | { _id: string; shop_name?: string };
    vendor_shop_name?: string;
    bulk_min_qty?: number;
    bulk_base_price?: number;
    bulk_unit?: string;
  } | null;
}

export default function NegotiationModal({ isOpen, onClose, product }: NegotiationModalProps) {
  const router = useRouter();
  const { data: session } = useAuth();
  const { addBulkDealToCart } = useCart();
  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lock body scroll when drawer is open
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Compute accurate database pricing
  const retailPrice = Number(product?.price || product?.selling_price || 0);
  
  // Bulk base wholesale rate
  const bulkBaseWholesale = (product?.bulk_base_price && product.bulk_base_price > 0 && product.bulk_base_price < retailPrice)
    ? product.bulk_base_price
    : Math.max(1, Math.round(retailPrice * 0.85));

  const minQty = Math.max(5, Number(product?.bulk_min_qty) || 5);
  
  const [targetQty, setTargetQty] = useState<number>(minQty);
  const [targetPrice, setTargetPrice] = useState<string>(String(Math.max(1, Math.round(bulkBaseWholesale * 0.95))));
  const [note, setNote] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [counterPriceInput, setCounterPriceInput] = useState('');
  const [sending, setSending] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  // Auto-update default target price when product changes
  useEffect(() => {
    if (product) {
      const bWholesale = (product.bulk_base_price && product.bulk_base_price > 0 && product.bulk_base_price < Number(product.price || 0))
        ? product.bulk_base_price
        : Math.max(1, Math.round(Number(product.price || product.selling_price || 40) * 0.85));
      const mQty = Math.max(5, Number(product.bulk_min_qty) || 5);
      setTargetQty(mQty);
      setTargetPrice(String(Math.max(1, Math.round(bWholesale * 0.95))));
    }
  }, [product]);

  // Scroll to bottom ONLY when a new message arrives or on first load
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      prevMsgCountRef.current = messages.length;
    }
  }, [messages.length]);

  // Load or fetch active negotiation session
  const fetchActiveSession = useCallback(async (silent = false) => {
    if (!product?._id || !session?.user?.id) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const pId = product._id;
      const uId = session.user.id;
      const res = await fetch(`/api/negotiations?product_id=${pId}&user_id=${uId}`);
      const json = await res.json();
      if (res.ok && json.data && json.data.length > 0) {
        const active = json.data[0];
        setSessionData(active);
        // Fetch messages
        const msgRes = await fetch(`/api/negotiations/${active._id}`);
        const msgJson = await msgRes.json();
        if (msgRes.ok && msgJson.data) {
          if (msgJson.data.session) {
            setSessionData(msgJson.data.session);
          }
          const newMessages = msgJson.data.messages || [];
          setMessages((prev) => {
            if (prev.length === newMessages.length) {
              return prev; // No change in count, avoid re-render and scroll jump
            }
            return newMessages;
          });
        }
      } else {
        setSessionData(null);
        setMessages([]);
        prevMsgCountRef.current = 0;
      }
    } catch (err: any) {
      console.error('Failed to load negotiation:', err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [product?._id, session?.user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    fetchActiveSession(false);
    const interval = setInterval(() => {
      fetchActiveSession(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, fetchActiveSession]);

  if (!isOpen || !product || !mounted) return null;

  const productName = product.name || product.product_name || 'Product';
  const productImage = product.image || product.product_image || '/images/product-card-default.jpg';
  const vendorName = product.vendor_shop_name || 'Verified Seller';
  const bulkUnit = product.bulk_unit || 'kg';

  // Initiate initial negotiation
  const handleStartNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      setError('Please sign in to negotiate with the vendor');
      return;
    }

    if (targetQty < 5) {
      setError('Minimum bulk order quantity must be at least 5 kg');
      return;
    }

    if (!targetPrice || Number(targetPrice) <= 0) {
      setError('Please enter a valid target price');
      return;
    }

    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/negotiations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product._id,
          user_id: session.user.id,
          requested_qty: targetQty,
          initial_offer_price: Number(targetPrice),
          customer_name: session.user.name || session.user.email || 'Customer',
          customer_mobile: (session.user as any).mobile_number || '',
          note: note.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start negotiation');

      setSessionData(json.data);
      const msgRes = await fetch(`/api/negotiations/${json.data._id}`);
      const msgJson = await msgRes.json();
      if (msgRes.ok && msgJson.data) {
        setMessages(msgJson.data.messages || []);
      }
      setSuccessMsg('Offer submitted! Live chat connected on right.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Send a chat message or counter-offer
  const handleSendMessage = async (e?: React.FormEvent, customCounter?: number) => {
    if (e) e.preventDefault();
    if (!sessionData?._id) return;

    const proposedPrice = customCounter || (counterPriceInput ? Number(counterPriceInput) : null);
    if (!chatInput.trim() && !proposedPrice) return;

    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/negotiations/${sessionData._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: session?.user?.id,
          sender_role: 'user',
          sender_name: session?.user?.name || 'Customer',
          message: chatInput.trim(),
          proposed_price: proposedPrice,
          proposed_qty: sessionData.requested_qty,
          offer_type: proposedPrice ? 'COUNTER' : 'CHAT',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send message');

      setMessages((prev) => [...prev, json.data]);
      setChatInput('');
      setCounterPriceInput('');
      
      const sessRes = await fetch(`/api/negotiations/${sessionData._id}`);
      const sessJson = await sessRes.json();
      if (sessRes.ok && sessJson.data) {
        setSessionData(sessJson.data.session || sessJson.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Add the accepted deal to cart
  const handleAddDealToCart = (e: React.MouseEvent) => {
    if (!sessionData || sessionData.status !== 'ACCEPTED') return;
    
    addBulkDealToCart({
      negotiation_id: sessionData._id,
      product_id: sessionData.product_id,
      product_name: sessionData.product_name,
      product_image: sessionData.product_image,
      agreed_rate: sessionData.final_agreed_price,
      agreed_qty: sessionData.final_agreed_qty,
      unit: sessionData.unit,
      deal_token: sessionData.deal_token,
    }, e);

    setAddedToCart(true);
    setTimeout(() => {
      onClose();
      router.push('/cart');
    }, 600);
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchActiveSession(false);
  };

  const currentDisplayPrice = sessionData?.current_counter_price || sessionData?.initial_offer_price || targetPrice;
  const currentQty = sessionData?.requested_qty || targetQty;
  const currentTotal = Math.round((Number(currentDisplayPrice) || 0) * (Number(currentQty) || 1));

  const drawerContent = (
    <div
      className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex justify-end transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Slide-over Right Side Panel */}
      <div
        className="relative w-full sm:max-w-md md:max-w-lg bg-[#0e1726] text-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden border-l border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Real-Time Messenger Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/30 shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-[#0e1726] rounded-full ring-1 ring-emerald-800" title="Online" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm truncate tracking-tight">{vendorName}</h3>
                <BadgeCheck className="w-4 h-4 text-emerald-200 shrink-0" />
              </div>
              <p className="text-[11px] text-emerald-100 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Live Negotiation Room</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close Right Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pinned Product & Target Deal Summary Bar */}
        <div className="px-4 py-3 bg-[#142032] border-b border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={productImage} 
              alt={productName} 
              className="w-12 h-12 rounded-xl object-cover border border-gray-700 bg-white shrink-0 shadow-xs" 
            />
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs text-white truncate">{productName}</h4>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-300 mt-0.5">
                <span>Retail: <strong className="text-gray-100">₹{retailPrice}/{bulkUnit}</strong></span>
                <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                  Wholesale Base: ₹{bulkBaseWholesale}/{bulkUnit}
                </span>
              </div>
            </div>
          </div>

          {sessionData?.status && (
            <div className="shrink-0 text-right">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                sessionData.status === 'ACCEPTED' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' :
                sessionData.status === 'COUNTERED' ? 'bg-amber-400 text-gray-950 font-black' :
                sessionData.status === 'REJECTED' ? 'bg-red-500 text-white' :
                'bg-blue-600 text-white'
              }`}>
                {sessionData.status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3 text-white" />}
                {sessionData.status}
              </span>
              <span className="block text-[10px] font-bold text-gray-400 mt-0.5">
                {currentQty} {bulkUnit} • ₹{currentTotal}
              </span>
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-950/70 border border-red-800 text-red-300 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-semibold">{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Chat / Content Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a1120]">
          
          {/* Guest notice */}
          {!session?.user && (
            <div className="my-auto py-12 px-6 text-center space-y-4 bg-[#142032] rounded-3xl border border-dashed border-gray-700 shadow-sm">
              <div className="w-14 h-14 bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 border border-emerald-800">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-white">Sign In to Negotiate Bulk Price</h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Connect live with verified wholesale sellers and negotiate competitive per-kg prices for orders of 5kg and above.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link href="/login" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer">
                  Sign In
                </Link>
                <Link href="/register" className="px-6 py-2.5 rounded-xl border border-gray-700 hover:bg-[#1a2940] text-gray-200 font-bold text-xs transition cursor-pointer">
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* Initial Step: Offer Proposal Form if no active session */}
          {session?.user && !sessionData && (
            <div className="bg-[#142032] rounded-3xl p-5 border border-gray-800 shadow-sm space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Scale className="w-5 h-5" />
                  <h3 className="text-sm font-black text-white">Propose Your Bulk Purchase Rate</h3>
                </div>
                <p className="text-xs text-gray-400">
                  Enter your required quantity (min 5kg) and your target rate to open a real-time negotiation channel with {vendorName}.
                </p>
              </div>

              <form onSubmit={handleStartNegotiation} className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Quantity (Min 5 {bulkUnit}) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={5}
                        step={1}
                        value={targetQty}
                        onChange={(e) => setTargetQty(Math.max(5, Number(e.target.value)))}
                        required
                        className="w-full h-11 px-3 border border-gray-700 rounded-xl text-sm font-black bg-[#0e1726] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        {bulkUnit}
                      </span>
                    </div>

                    {/* Quick Quantity Chips (All strictly >= 5) */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {[5, 10, 20, 50, 100].map((qtyVal) => (
                        <button
                          key={qtyVal}
                          type="button"
                          onClick={() => setTargetQty(qtyVal)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                            targetQty === qtyVal
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-[#0e1726] text-gray-400 hover:text-white border-gray-750'
                          }`}
                        >
                          {qtyVal} {bulkUnit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Target Rate / {bulkUnit} (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step={0.01}
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="e.g. 35"
                        required
                        className="w-full h-11 px-3 border border-gray-700 rounded-xl text-sm font-black bg-[#0e1726] text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        ₹/{bulkUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Budget Calculator */}
                <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                      Estimated Proposed Total
                    </span>
                    <p className="text-xs text-gray-400">
                      {targetQty} {bulkUnit} @ ₹{targetPrice}/{bulkUnit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-amber-300">
                      ₹{Math.round((Number(targetPrice) || 0) * (targetQty || 0))}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Message / Special Requirement (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Weekly restaurant stock, need early morning dispatch..."
                    className="w-full h-11 px-3.5 border border-gray-700 rounded-xl text-xs bg-[#0e1726] text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {sending ? 'Connecting Room...' : 'Start Live Negotiation Chat'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Active Real-Time Messenger Thread */}
          {session?.user && sessionData && (
            <div className="space-y-4">
              
              {/* Accepted Deal Confirmed Card */}
              {sessionData.status === 'ACCEPTED' && (
                <div className="p-5 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white rounded-3xl shadow-xl space-y-3.5 border-2 border-emerald-400/40 relative overflow-hidden animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white">Deal Confirmed & Price Locked!</h4>
                        <p className="text-[11px] text-emerald-100">Ready to purchase at agreed wholesale rate</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-black/40 border border-white/20 px-2.5 py-1 rounded-full font-mono font-black text-amber-200">
                      TOKEN: {sessionData.deal_token}
                    </span>
                  </div>

                  <div className="p-3 bg-black/30 backdrop-blur rounded-2xl flex items-center justify-between border border-white/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-200 block">Agreed Wholesale Rate</span>
                      <strong className="text-sm font-black text-white">{sessionData.final_agreed_qty} {sessionData.unit} @ ₹{sessionData.final_agreed_price}/{sessionData.unit}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-200 block">Total Amount</span>
                      <strong className="text-lg font-black text-amber-300">₹{sessionData.total_deal_amount}</strong>
                    </div>
                  </div>

                  {/* 24-Hour Deal Expiry Countdown Box */}
                  <DealCountdownTimer
                    variant="box"
                    expiresAt={sessionData.deal_expires_at}
                    fallbackStartTime={sessionData.updatedAt}
                  />

                  <button
                    onClick={handleAddDealToCart}
                    disabled={addedToCart}
                    className="w-full py-3.5 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {addedToCart ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Added to Cart! Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-emerald-700" />
                        <span>Add to Cart & Checkout (₹{sessionData.total_deal_amount}) ➔</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Chat Message Bubble Stream */}
              <div className="space-y-3 min-h-[220px]">
                {messages.map((msg: any, idx: number) => {
                  const isUser = msg.sender_role === 'user';
                  const isCounter = msg.offer_type === 'COUNTER' || msg.offer_type === 'PROPOSAL';
                  const isAccept = msg.offer_type === 'ACCEPT';
                  
                  return (
                    <div key={msg._id || idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-extrabold text-gray-400">
                          {isUser ? 'You (Buyer)' : `${vendorName} (Seller)`}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className={`max-w-[85%] rounded-3xl p-3.5 text-xs shadow-sm space-y-2 ${
                        isUser
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-tr-none'
                          : 'bg-[#142032] text-gray-100 border border-gray-700 rounded-tl-none'
                      }`}>
                        {msg.message && (
                          <p className="leading-relaxed text-xs font-medium">{msg.message}</p>
                        )}

                        {/* Counter Proposal Card inside bubble */}
                        {isCounter && msg.proposed_price && (
                          <div className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border ${
                            isUser 
                              ? 'bg-emerald-700/90 border-emerald-500 text-white' 
                              : 'bg-amber-950/60 border-amber-700 text-amber-200'
                          }`}>
                            <div>
                              <span className="text-[10px] opacity-80 block">Offered Rate</span>
                              <strong className="text-sm font-black">₹{msg.proposed_price}/{sessionData.unit}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] opacity-80 block">For {msg.proposed_qty || sessionData.requested_qty} {sessionData.unit}</span>
                              <span className="font-extrabold text-xs">Total: ₹{Math.round(msg.proposed_price * (msg.proposed_qty || sessionData.requested_qty))}</span>
                            </div>
                          </div>
                        )}

                        {isAccept && (
                          <div className="p-2 bg-emerald-950 border border-emerald-700 text-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Agreed & Accepted Deal</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Messenger Toolbar & Quick Counter Input */}
        {session?.user && sessionData && sessionData.status !== 'ACCEPTED' && sessionData.status !== 'REJECTED' && (
          <div className="p-3.5 bg-[#0e1726] border-t border-gray-800 space-y-2.5 shrink-0">
            {/* Quick Price & Quantity Adjuster Chips (strictly >= 5 kg) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              <span className="text-gray-400 text-[10px] shrink-0">Quick Rate:</span>
              {[
                { label: `-₹2 (₹${Math.max(1, Math.round((Number(currentDisplayPrice) || 0) - 2))})`, val: Math.max(1, Math.round((Number(currentDisplayPrice) || 0) - 2)) },
                { label: `₹${bulkBaseWholesale}/kg`, val: bulkBaseWholesale },
                { label: `+₹2 (₹${Math.round((Number(currentDisplayPrice) || 0) + 2)})`, val: Math.round((Number(currentDisplayPrice) || 0) + 2) },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setCounterPriceInput(String(chip.val))}
                  className="px-2.5 py-1 bg-[#142032] hover:bg-emerald-950/60 hover:text-emerald-300 rounded-lg text-gray-300 transition shrink-0 cursor-pointer border border-gray-700"
                >
                  {chip.label}
                </button>
              ))}

              <span className="text-gray-400 text-[10px] shrink-0 ml-2">Min 5kg+:</span>
              {[5, 10, 25, 50].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setChatInput(`I want to order ${q} ${bulkUnit} at proposed rate.`);
                  }}
                  className="px-2.5 py-1 bg-[#142032] hover:bg-amber-950/60 hover:text-amber-300 rounded-lg text-amber-200 transition shrink-0 cursor-pointer border border-amber-800/60"
                >
                  {q} {bulkUnit}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="w-28 relative shrink-0">
                <input
                  type="number"
                  step={0.01}
                  value={counterPriceInput}
                  onChange={(e) => setCounterPriceInput(e.target.value)}
                  placeholder="Rate ₹/kg"
                  className="w-full h-11 px-2.5 border border-amber-600/70 rounded-2xl text-xs font-black bg-amber-950/30 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400">
                  ₹/kg
                </span>
              </div>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type negotiation message..."
                className="flex-1 h-11 px-4 border border-gray-700 rounded-2xl text-xs bg-[#142032] text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                disabled={sending || (!chatInput.trim() && !counterPriceInput)}
                className="h-11 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null;
}
