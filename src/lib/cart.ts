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
        return prev.map(i => {
          if (i.producto_id !== item.producto_id) return i;
          
          const newQty = i.cantidad + item.cantidad;
          let newPrice = i.precio;
          if (i.venta_lista && i.venta_lista.tipo === 'escalonada' && i.venta_lista.escalones && i.venta_costo) {
            const validEscalones = i.venta_lista.escalones
              .filter(e => newQty >= e.cantidad_minima)
              .sort((a, b) => b.cantidad_minima - a.cantidad_minima);
            if (validEscalones.length > 0) {
              newPrice = Math.round(i.venta_costo * validEscalones[0].multiplicador);
            }
          }
          
          return { ...i, cantidad: newQty, precio: newPrice };
        });
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
      prev.map(i => {
        if (i.producto_id !== productoId) return i;
        
        let newPrice = i.precio;
        if (i.venta_lista && i.venta_lista.tipo === 'escalonada' && i.venta_lista.escalones && i.venta_costo) {
          const validEscalones = i.venta_lista.escalones
            .filter(e => cantidad >= e.cantidad_minima)
            .sort((a, b) => b.cantidad_minima - a.cantidad_minima);
          if (validEscalones.length > 0) {
            newPrice = Math.round(i.venta_costo * validEscalones[0].multiplicador);
          } else if (i.venta_lista.markup) {
            // Revert back to default explicit markup if they dropped below all tiers
            newPrice = Math.round(i.venta_costo * i.venta_lista.markup);
          }
        }
        
        return { ...i, cantidad, precio: newPrice };
      })
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
