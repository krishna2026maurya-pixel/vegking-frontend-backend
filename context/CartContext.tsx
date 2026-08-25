'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext<any>(null);
const LOCAL_STORAGE_KEY = 'vegking_guest_cart';

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const { data: session, status: authStatus } = useAuth();
  const isSyncing = useRef(false);

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
    try {
      if (authStatus === 'authenticated' && session?.user) {
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
            // Update local storage backup
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mappedProducts));
            } catch (e) {}
            return;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch backend cart', e);
    }

    // Guest fallback: load from localStorage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
          setCartTotal(calculateTotal(parsed));
        }
      }
    } catch (e) {
      console.error('Failed to read local guest cart', e);
    }
  }, [authStatus, session]);

  // Initial load
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Sync guest cart to backend upon login
  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user && !isSyncing.current) {
      const syncGuestCartToBackend = async () => {
        isSyncing.current = true;
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            const guestItems = JSON.parse(saved);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              for (const item of guestItems) {
                const id = item.cartId || item._id;
                const count = item.cartQuantity || item.quantity || 1;
                for (let i = 0; i < count; i++) {
                  await fetch('/api/v1/cart/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: id, status: 'add' }),
                  });
                }
              }
            }
          }
          await fetchCart();
        } catch (e) {
          console.error('Error syncing guest cart on login:', e);
        } finally {
          isSyncing.current = false;
        }
      };
      syncGuestCartToBackend();
    }
  }, [authStatus, session, fetchCart]);

  const saveLocalCart = (newCart: any[]) => {
    setCart(newCart);
    setCartTotal(calculateTotal(newCart));
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
    } catch (e) {}
  };

  const triggerFlyToCart = (startElOrEvent?: any, customImage?: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // 1. Determine start coordinates
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
      } else if (startElOrEvent.getBoundingClientRect) {
        const rect = startElOrEvent.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }

    // 2. Determine target coordinates (Navbar Cart Icon)
    const cartBtn = document.getElementById('navbar-cart-button') || document.querySelector('a[href="/cart"]');
    let endX = window.innerWidth - 35;
    let endY = 28;

    if (cartBtn) {
      const cartRect = cartBtn.getBoundingClientRect();
      endX = cartRect.left + cartRect.width / 2;
      endY = cartRect.top + cartRect.height / 2;
    }

    // 3. Create Flying Element
    const flyingEl = document.createElement('div');
    flyingEl.style.position = 'fixed';
    flyingEl.style.zIndex = '99999';
    flyingEl.style.pointerEvents = 'none';
    flyingEl.style.width = '52px';
    flyingEl.style.height = '52px';
    flyingEl.style.borderRadius = '50%';
    flyingEl.style.overflow = 'hidden';
    flyingEl.style.border = '2.5px solid #16a34a';
    flyingEl.style.backgroundColor = '#ffffff';
    flyingEl.style.boxShadow = '0 12px 28px -4px rgba(22, 163, 74, 0.5), 0 6px 12px -2px rgba(0, 0, 0, 0.25)';
    flyingEl.style.left = `${startX - 26}px`;
    flyingEl.style.top = `${startY - 26}px`;
    flyingEl.style.transform = 'scale(1)';
    flyingEl.style.opacity = '1';
    flyingEl.style.transition = 'all 0.65s cubic-bezier(0.2, 0.85, 0.25, 1)';

    const img = document.createElement('img');
    img.src = customImage || '/images/product-card-default.jpg';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.onerror = () => { img.src = '/images/product-card-default.jpg'; };
    flyingEl.appendChild(img);

    document.body.appendChild(flyingEl);

    // Trigger reflow
    void flyingEl.offsetWidth;

    // Animate to destination
    requestAnimationFrame(() => {
      flyingEl.style.left = `${endX - 14}px`;
      flyingEl.style.top = `${endY - 14}px`;
      flyingEl.style.transform = 'scale(0.28) rotate(360deg)';
      flyingEl.style.opacity = '0.95';
    });

    setTimeout(() => {
      if (flyingEl.parentNode) {
        flyingEl.parentNode.removeChild(flyingEl);
      }
      if (cartBtn) {
        cartBtn.classList.remove('animate-cart-bounce');
        void cartBtn.offsetWidth;
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

    // Trigger visual flying animation to cart
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

  const removeFromCart = async (id: string) => {
    if (!id) return;
    const existing = cart.find((c) => (c.cartId || c._id) === id);
    const qtyToRemove = existing ? existing.cartQuantity || existing.quantity || 1 : 1;

    // 1. Instantly remove from local cart
    const updatedCart = cart.filter((c) => (c.cartId || c._id) !== id);
    saveLocalCart(updatedCart);

    // 2. If logged in, sync with backend
    if (authStatus === 'authenticated' && session?.user) {
      try {
        for (let i = 0; i < qtyToRemove; i++) {
          await fetch('/api/v1/cart/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id, status: 'remove' }),
          });
        }
      } catch (e) {
        console.error('Backend remove from cart error:', e);
      }
    }
  };

  const updateQuantity = async (id: string, quantity: number, eventOrElement?: any) => {
    if (!id) return;
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const existing = cart.find((c) => (c.cartId || c._id) === id);
    const currentQty = existing ? existing.cartQuantity || existing.quantity || 1 : 1;
    const difference = Math.abs(quantity - currentQty);
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

    // 2. If logged in, sync with backend
    if (authStatus === 'authenticated' && session?.user && difference > 0) {
      try {
        for (let i = 0; i < difference; i++) {
          await fetch('/api/v1/cart/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id, status: isAdding ? 'add' : 'remove' }),
          });
        }
      } catch (e) {
        console.error('Backend update quantity error:', e);
      }
    }
  };

  const clearCart = async () => {
    saveLocalCart([]);
    if (authStatus === 'authenticated' && session?.user) {
      try {
        await fetch('/api/v1/cart/clear', { method: 'POST' });
      } catch (e) {
        console.error('Backend clear cart error:', e);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, fetchCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
