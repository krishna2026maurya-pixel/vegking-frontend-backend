'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext<any>(null);
const LOCAL_STORAGE_KEY = 'vegking_guest_cart';

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const { data: session, status: authStatus } = useAuth();
  const hasSyncedGuest = useRef(false);

  // Compute total price from cart array
  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const qty = Number(item.cartQuantity || item.quantity || 1);
      return sum + price * qty;
    }, 0);
  };

  // Fetch cart from backend or fallback to localStorage for guests
  const fetchCart = useCallback(async () => {
    if (authStatus === 'loading') return;

    if (authStatus === 'authenticated' && session?.user) {
      try {
        const res = await fetch('/api/v1/cart');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const mappedProducts = (data.data.products || []).map((p: any) => ({
              _id: p.product_id,
              cartId: p.product_id,
              name: p.product_name,
              image: p.product_image,
              price: p.selling_price,
              quantity: p.cart_count,
              cartQuantity: p.cart_count,
              unit: p.quantity_unit,
            }));
            setCart(mappedProducts);
            setCartTotal(data.data.pricing?.subtotal || calculateTotal(mappedProducts));
            return;
          }
        }
      } catch (e) {
        console.error('Failed to fetch backend cart', e);
      }
      return;
    }

    // Guest user only: load from localStorage
    if (authStatus === 'unauthenticated') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCart(parsed);
            setCartTotal(calculateTotal(parsed));
            return;
          }
        }
      } catch (e) {
        console.error('Failed to read local guest cart', e);
      }
      setCart([]);
      setCartTotal(0);
    }
  }, [authStatus, session]);

  // Initial load when auth state resolves
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Migrate guest cart items to account on login (runs strictly once upon login)
  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const guestItems = JSON.parse(saved);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            Promise.all(
              guestItems.map((item: any) =>
                fetch('/api/v1/cart/toggle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    product_id: item._id || item.cartId,
                    status: 'set_qty',
                    qty: item.cartQuantity || item.quantity || 1,
                  }),
                })
              )
            ).then(() => {
              fetchCart();
            });
          }
        }
      } catch (e) {
        console.error('Guest cart sync error:', e);
      }
    }
  }, [authStatus, session, fetchCart]);

  const saveLocalCart = (newCart: any[]) => {
    setCart(newCart);
    setCartTotal(calculateTotal(newCart));
    if (authStatus === 'unauthenticated') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
      } catch (e) {}
    }
  };

  const triggerFlyToCart = (startElOrEvent?: any, customImage?: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (startElOrEvent) {
      if (typeof startElOrEvent.clientX === 'number' && typeof startElOrEvent.clientY === 'number' && (startElOrEvent.clientX > 0 || startElOrEvent.clientY > 0)) {
        startX = startElOrEvent.clientX;
        startY = startElOrEvent.clientY;
      } else if (startElOrEvent.currentTarget && startElOrEvent.currentTarget.getBoundingClientRect) {
        const rect = startElOrEvent.currentTarget.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      } else if (startElOrEvent.target && startElOrEvent.target.getBoundingClientRect) {
        const rect = startElOrEvent.target.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }

    const cartIcon = document.getElementById('navbar-cart-icon') || document.querySelector('[data-cart-icon="true"]');
    let targetX = window.innerWidth - 60;
    let targetY = 30;

    if (cartIcon) {
      const rect = cartIcon.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    const flyingElem = document.createElement('div');
    flyingElem.style.position = 'fixed';
    flyingElem.style.zIndex = '999999';
    flyingElem.style.left = `${startX}px`;
    flyingElem.style.top = `${startY}px`;
    flyingElem.style.width = '48px';
    flyingElem.style.height = '48px';
    flyingElem.style.borderRadius = '50%';
    flyingElem.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
    flyingElem.style.pointerEvents = 'none';
    flyingElem.style.transform = 'translate(-50%, -50%) scale(1)';
    flyingElem.style.transition = 'all 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)';
    flyingElem.style.opacity = '1';
    flyingElem.style.border = '2px solid #22c55e';
    flyingElem.style.backgroundColor = '#ffffff';
    flyingElem.style.backgroundImage = `url(${customImage || '/images/product-card-default.jpg'})`;
    flyingElem.style.backgroundSize = 'cover';
    flyingElem.style.backgroundPosition = 'center';

    document.body.appendChild(flyingElem);

    requestAnimationFrame(() => {
      flyingElem.style.left = `${targetX}px`;
      flyingElem.style.top = `${targetY}px`;
      flyingElem.style.transform = 'translate(-50%, -50%) scale(0.25)';
      flyingElem.style.opacity = '0.4';
    });

    setTimeout(() => {
      if (document.body.contains(flyingElem)) {
        document.body.removeChild(flyingElem);
      }
      const cartBtn = document.getElementById('navbar-cart-btn');
      if (cartBtn) {
        cartBtn.classList.add('animate-cart-bounce');
        setTimeout(() => {
          cartBtn.classList.remove('animate-cart-bounce');
        }, 500);
      }
    }, 650);
  };

  const addToCart = async (product: any, eventOrElement?: any) => {
    const id = product.cartId || product._id;
    if (!id) return;

    const imgUrl = product.image || product.product_image || '';
    triggerFlyToCart(eventOrElement, imgUrl);

    // 1. Instantly update UI and LocalStorage
    let updatedCart: any[];
    const existingIndex = cart.findIndex((c) => (c.cartId || c._id) === id);
    if (existingIndex > -1) {
      updatedCart = cart.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              cartQuantity: (item.cartQuantity || item.quantity || 1) + 1,
              quantity: (item.cartQuantity || item.quantity || 1) + 1,
            }
          : item
      );
    } else {
      const newItem = {
        _id: id,
        cartId: id,
        name: product.name || product.product_name || 'Product',
        image: product.image || product.product_image || '',
        price: Number(product.price || product.selling_price || 0),
        quantity: 1,
        cartQuantity: 1,
        unit: product.unit || product.quantity || '1 unit',
      };
      updatedCart = [...cart, newItem];
    }
    saveLocalCart(updatedCart);

    // 2. If user is logged in, sync with backend
    if (authStatus === 'authenticated' && session?.user) {
      try {
        await fetch('/api/v1/cart/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: id, status: 'add' }),
        });
      } catch (e) {
        console.error('Backend add to cart error:', e);
      }
    }
  };

  const addBulkDealToCart = (deal: {
    negotiation_id: string;
    product_id: string;
    product_name: string;
    product_image?: string;
    agreed_rate: number;
    agreed_qty: number;
    unit?: string;
    deal_token?: string;
  }, eventOrElement?: any) => {
    const dealCartId = `bulk_${deal.negotiation_id || deal.product_id}`;
    triggerFlyToCart(eventOrElement, deal.product_image);

    const newItem = {
      _id: deal.product_id,
      cartId: dealCartId,
      name: `${deal.product_name} (Bulk Wholesale)`,
      image: deal.product_image || '/images/product-card-default.jpg',
      price: Number(deal.agreed_rate),
      quantity: Math.max(5, Number(deal.agreed_qty)),
      cartQuantity: Math.max(5, Number(deal.agreed_qty)),
      unit: `${deal.agreed_qty} ${deal.unit || 'kg'}`,
      is_bulk_deal: true,
      negotiation_id: deal.negotiation_id,
      deal_token: deal.deal_token,
    };

    const existingIndex = cart.findIndex((c) => (c.cartId || c._id) === dealCartId);
    let updatedCart: any[];
    if (existingIndex > -1) {
      updatedCart = cart.map((item, idx) => idx === existingIndex ? newItem : item);
    } else {
      updatedCart = [...cart, newItem];
    }
    saveLocalCart(updatedCart);
  };

  const removeFromCart = async (id: string) => {
    if (!id) return;
    const existing = cart.find((c) => (c.cartId || c._id) === id);
    const productId = existing?._id || id;

    // 1. Instantly remove from local cart & update state
    const updatedCart = cart.filter((c) => (c.cartId || c._id) !== id);
    saveLocalCart(updatedCart);

    // 2. If logged in, sync with backend in 1 instant call
    if (authStatus === 'authenticated' && session?.user) {
      try {
        await fetch('/api/v1/cart/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId, status: 'delete' }),
        });
      } catch (e) {
        console.error('Backend remove from cart error:', e);
      }
    }
  };

  const updateQuantity = async (id: string, quantity: number, eventOrElement?: any) => {
    if (!id) return;
    const existing = cart.find((c) => (c.cartId || c._id) === id);
    const productId = existing?._id || id;

    // If it is a negotiated bulk deal, strictly enforce minimum 5 kg
    if (existing?.is_bulk_deal && quantity < 5) {
      return;
    }

    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const currentQty = existing ? existing.cartQuantity || existing.quantity || 1 : 1;
    const isAdding = quantity > currentQty;

    if (isAdding) {
      triggerFlyToCart(eventOrElement, existing?.image);
    }

    // 1. Instantly update UI and LocalStorage
    const updatedCart = cart.map((item) =>
      (item.cartId || item._id) === id
        ? { ...item, cartQuantity: quantity, quantity: quantity }
        : item
    );
    saveLocalCart(updatedCart);

    // 2. If logged in, sync directly with backend in 1 instant call
    if (authStatus === 'authenticated' && session?.user) {
      try {
        await fetch('/api/v1/cart/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId, status: 'set_qty', qty: quantity }),
        });
      } catch (e) {
        console.error('Backend update quantity error:', e);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    setCartTotal(0);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {}
    if (authStatus === 'authenticated' && session?.user) {
      try {
        await fetch('/api/v1/cart/clear', { method: 'POST' });
        await fetch('/api/v1/cart/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: 'ALL', status: 'remove_all' }),
        });
      } catch (e) {
        console.error('Backend clear cart error:', e);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, addBulkDealToCart, removeFromCart, updateQuantity, clearCart, cartTotal, fetchCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
