'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

import { MapPin, CreditCard, ShoppingBag, Loader2, CheckCircle2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import the map picker to avoid SSR issues with window/google
const GoogleMapAddressPicker = dynamic(
    () => import('@/components/GoogleMapAddressPicker'),
    { ssr: false }
);

export default function CheckoutPage() {
    const { cart, cartTotal, removeFromCart, clearCart } = useCart();
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const router = useRouter();

    const { data: session, status } = useAuth();

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/checkout');
            return;
        }
        if (session?.user?.role !== 'user') {
            router.push(session?.user?.role === 'admin' ? '/admin' : '/vendor/dashboard');
        }
    }, [status, router]);

    const loadRazorpayCheckout = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const deliveryCharge = cartTotal > 0 && cartTotal < 199 ? 40 : 0;
    const finalTotal = cartTotal + deliveryCharge;

    const handlePlaceOrder = async () => {
        if (!address) return;
        setLoading(true);

        try {
            if (paymentMethod === 'COD') {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart.map((item: any) => ({
                            productId: item.productId || item._id,
                            name: item.name,
                            price: item.price,
                            quantity: item.cartQuantity,
                            image: item.image,
                            is_bulk_deal: Boolean(item.is_bulk_deal),
                            negotiation_id: item.negotiation_id || null,
                            deal_token: item.deal_token || null,
                        })),
                        totalAmount: finalTotal,
                        delivery_charge: deliveryCharge,
                        shippingAddress: address,
                        coords,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrderId(data.id || data._id);
                    setSuccess(true);
                    clearCart();
                } else {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || 'Unable to place order.');
                }
            } else {
                const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/create-payment`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart.map((item: any) => ({
                            productId: item.productId || item._id,
                            name: item.name,
                            price: item.price,
                            quantity: item.cartQuantity,
                            image: item.image,
                            is_bulk_deal: Boolean(item.is_bulk_deal),
                            negotiation_id: item.negotiation_id || null,
                            deal_token: item.deal_token || null,
                        })),
                        totalAmount: finalTotal,
                        delivery_charge: deliveryCharge,
                        shippingAddress: address,
                        coords,
                    }),
                });
                if (!createRes.ok) {
                    const data = await createRes.json().catch(() => ({}));
                    throw new Error(data.message || 'Unable to initiate payment.');
                }
                const paymentData = await createRes.json();

                if (!paymentData.keyId) {
                    throw new Error('Invalid payment gateway configuration. Please try again later.');
                }

                await loadRazorpayCheckout();
                const razorpay = new (window as any).Razorpay({
                    key: paymentData.keyId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    name: 'VegKing',
                    description: 'Order Payment',
                    order_id: paymentData.razorpayOrderId,
                    handler: async (response: any) => {
                        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/verify-payment`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: paymentData.orderId,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });
                        if (verifyRes.ok) {
                            setSuccess(true);
                            clearCart();
                            setTimeout(() => router.push('/profile/orders'), 3000);
                        } else {
                            const vdata = await verifyRes.json().catch(() => ({}));
                            alert(vdata.message || 'Payment verification failed.');
                        }
                    },
                    prefill: {
                        name: session?.user?.name || '',
                        email: session?.user?.email || '',
                    },
                    theme: { color: '#16a34a' },
                    modal: {
                        ondismiss: () => {
                            setLoading(false);
                        },
                    },
                });
                razorpay.on('payment.failed', (resp: any) => {
                    console.error('Razorpay payment failed:', resp.error);
                    alert(resp.error?.description || 'Payment failed. Please try again.');
                    setLoading(false);
                });
                razorpay.open();
            }
        } catch (err: any) {
            console.error('Order error:', err);
            alert(err.message || 'Failed to place order.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 min-h-[70vh]">
            <h1 className="text-3xl font-black text-gray-950 mb-8 flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-primary" />
                Checkout
            </h1>

            {success ? (
                <div className="p-8 bg-white rounded-3xl shadow-xl shadow-primary/10 text-center border border-gray-100 animate-in zoom-in duration-500">
                    <CheckCircle2 className="mx-auto mb-4 text-green-600 w-16 h-16" />
                    <h2 className="text-2xl font-black mb-2 text-gray-950">Order Placed Successfully!</h2>
                    {orderId && <p className="mb-4 text-sm font-medium text-gray-500">Your order ID: <span className="font-bold text-gray-900">{orderId.toUpperCase()}</span></p>}
                    <Button
                        onClick={() => router.push('/profile/orders')}
                        className="mt-4"
                    >
                        View My Orders
                    </Button>
                </div>
            ) : (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-primary/5">
                    {/* ── Address Section ── */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-950 mb-3">
                            <MapPin className="w-4 h-4 text-primary" />
                            Shipping Address
                        </label>

                        {/* Choose from Map button */}
                        <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="w-full mb-3 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 text-primary font-bold text-sm transition-all group"
                        >
                            <Map className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {address ? 'Change location on map' : 'Choose location from Google Map'}
                        </button>

                        {/* Editable textarea — shows selected or manual address */}
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Or type your complete shipping address manually..."
                            rows={3}
                            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50/50 resize-none transition-colors text-sm font-medium text-gray-800"
                        />

                        {/* Coords badge — shown when address picked from map */}
                        {coords && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Location pinned: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                            </div>
                        )}
                    </div>

                    {step === 1 ? (
                        <Button
                            onClick={() => setStep(2)}
                            disabled={loading || !address}
                            className="w-full h-14 rounded-2xl text-base shadow-lg disabled:opacity-50"
                        >
                            Next Step
                        </Button>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-950">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Order Summary
                            </h2>

                            <div className="space-y-3 bg-green-50/50 border border-green-100/50 p-6 rounded-2xl mb-6">
                                <div className="space-y-2 mb-4 pb-4 border-b border-green-200/50">
                                    {cart.map((item: any) => {
                                        const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.cartQuantity) || 1);
                                        return (
                                            <div key={item.cartId || item._id} className="flex justify-between text-gray-700 text-sm">
                                                <span className="truncate pr-4">
                                                    {item.name} <span className="text-gray-500 text-xs ml-1">x{item.cartQuantity}</span>
                                                </span>
                                                <span className="font-semibold text-gray-900 flex-shrink-0">₹{itemTotal.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-gray-600 font-medium text-sm">
                                    <span>Subtotal ({cart.length} items)</span>
                                    <span>₹{Number(cartTotal || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 font-medium text-sm">
                                    <span>Delivery</span>
                                    {deliveryCharge > 0 ? (
                                        <span className="text-gray-900 font-bold">₹{deliveryCharge.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-green-600 font-bold uppercase tracking-wider text-xs">Free</span>
                                    )}
                                </div>
                                {deliveryCharge > 0 && (
                                    <p className="text-xs text-gray-400 text-right mt-1">Add ₹{(199 - cartTotal).toFixed(2)} more for FREE delivery!</p>
                                )}
                                <div className="h-px bg-gray-200/60 my-4" />
                                <div className="flex justify-between text-xl font-black text-gray-950">
                                    <span>Total</span>
                                    <span className="text-primary">₹{Number(finalTotal || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Delivery address preview */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Delivering to</p>
                                    <p className="text-sm font-semibold text-gray-800 leading-snug">{address}</p>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-xs text-primary font-bold mt-1 hover:underline"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-950 mb-3">Payment Method</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={() => setPaymentMethod('COD')}
                                            className="text-primary focus:ring-primary w-4 h-4 accent-primary"
                                        />
                                        <span className="font-bold text-gray-950 text-sm">Cash on Delivery</span>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'RAZORPAY' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="RAZORPAY"
                                            checked={paymentMethod === 'RAZORPAY'}
                                            onChange={() => setPaymentMethod('RAZORPAY')}
                                            className="text-primary focus:ring-primary w-4 h-4 accent-primary"
                                        />
                                        <span className="font-bold text-gray-950 text-sm">Online Payment</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="w-1/3 h-14 rounded-2xl"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="w-2/3 h-14 rounded-2xl shadow-lg disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Google Map Picker Modal ── */}
            {showMapPicker && (
                <GoogleMapAddressPicker
                    defaultAddress={address}
                    onSelect={(addr, latlng) => {
                        setAddress(addr);
                        setCoords(latlng);
                    }}
                    onClose={() => setShowMapPicker(false)}
                />
            )}
        </div>
    );
}
