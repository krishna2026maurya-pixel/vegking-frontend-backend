'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/v1/cart');
      const data = await res.json();
      if (data.success) {
        // Map backend product schema to match frontend product cards
        const mappedProducts = (data.data.products || []).map((p: any) => ({
          _id: p.product_id,
          name: p.product_name,
          image: p.product_image,
          price: p.selling_price,
          quantity: p.cart_count,
          cartQuantity: p.cart_count,
          unit: p.quantity_unit,
        }));
        setCart(mappedProducts);
        setCartTotal(data.data.pricing.subtotal || 0);
      }
    } catch (e) {
      console.error('Failed to fetch cart', e);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (product: any) => {
    try {
      const id = product.cartId || product._id;
      const res = await fetch('/api/v1/cart/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, status: 'add' })
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart(); // Refresh cart to sync with backend
        alert(`Added ${product.name || 'product'} to cart!`);
      } else {
        alert(data.error || 'Failed to add to cart');
      }
    } catch (e) {
      console.error('Add to cart error:', e);
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      const existing = cart.find(c => (c.cartId || c._id) === id);
      if (!existing) return;
      
      const qtyToRemove = existing.cartQuantity || existing.quantity || 1;
      for (let i = 0; i < qtyToRemove; i++) {
        await fetch('/api/v1/cart/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: id, status: 'remove' })
        });
      }
      await fetchCart();
    } catch (e) {
      console.error('Remove from cart error:', e);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 0) return; // Allow 0 to remove item
    const existing = cart.find(c => (c.cartId || c._id) === id);
    if (!existing) return;
    
    const currentQty = existing.cartQuantity || existing.quantity || 0;
    const isAdding = quantity > currentQty;
    const difference = Math.abs(quantity - currentQty);
    
    try {
      for (let i = 0; i < difference; i++) {
        await fetch('/api/v1/cart/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: id, status: isAdding ? 'add' : 'remove' })
        });
      }
      await fetchCart();
    } catch(e) {
       console.error('Update quantity error:', e);
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch('/api/v1/cart/clear', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.message || data.success) {
        await fetchCart();
      }
    } catch (e) {
      console.error('Clear cart error:', e);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
