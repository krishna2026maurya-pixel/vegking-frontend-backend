'use client';
import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const id = product.cartId || product._id;
      const existing = prev.find((item) => (item.cartId || item._id) === id);
      if (existing) {
        return prev.map((item) =>
          (item.cartId || item._id) === id
            ? { ...item, cartQuantity: (item.cartQuantity || 1) + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
    alert(`Added ${product.name} to cart!`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => (item.cartId || item._id) !== id));
  };

  const updateQuantity = (id: string, cartQuantity: number) => {
    if (cartQuantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        (item.cartId || item._id) === id ? { ...item, cartQuantity } : item
      )
    );
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.cartQuantity) || 1;
    return total + price * qty;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
