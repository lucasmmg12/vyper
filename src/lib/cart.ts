'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/types/ecommerce';

const CART_KEY = 'vyper_cart';

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setItems(getStoredCart());
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      saveCart(items);
      // Dispatch custom event so other components can listen
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.producto_id === item.producto_id);
      if (existing) {
        return prev.map(i =>
          i.producto_id === item.producto_id
            ? { ...i, cantidad: i.cantidad + item.cantidad }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productoId: string) => {
    setItems(prev => prev.filter(i => i.producto_id !== productoId));
  }, []);

  const updateQuantity = useCallback((productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems(prev => prev.filter(i => i.producto_id !== productoId));
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.producto_id === productoId ? { ...i, cantidad } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.cantidad, 0);
  }, [items]);

  return {
    items,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
  };
}
