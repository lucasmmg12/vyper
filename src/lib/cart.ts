'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/types/ecommerce';

const CART_KEY = 'vyper_cart';

export function getItemKey(productoId: string, variante?: string): string {
  return variante ? `${productoId}__${variante}` : productoId;
}

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

    const handleStorageSync = (e: Event) => {
      const custom = e as CustomEvent<CartItem[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setItems(custom.detail);
      } else {
        setItems(getStoredCart());
      }
    };
    window.addEventListener('cart-sync', handleStorageSync);
    return () => window.removeEventListener('cart-sync', handleStorageSync);
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
      const targetKey = item.cart_key || getItemKey(item.producto_id, item.variante);
      const existing = prev.find(
        i => (i.cart_key || getItemKey(i.producto_id, i.variante)) === targetKey
      );
      if (existing) {
        return prev.map(i => {
          const itemKey = i.cart_key || getItemKey(i.producto_id, i.variante);
          if (itemKey !== targetKey) return i;

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

          return { ...i, cantidad: newQty, precio: newPrice, cart_key: targetKey };
        });
      }
      return [...prev, { ...item, cart_key: targetKey }];
    });
  }, []);

  const removeItem = useCallback((productoId: string, variante?: string) => {
    setItems(prev => {
      if (variante !== undefined) {
        const targetKey = getItemKey(productoId, variante);
        return prev.filter(i => (i.cart_key || getItemKey(i.producto_id, i.variante)) !== targetKey);
      }
      return prev.filter(i => i.producto_id !== productoId && (i.cart_key || i.producto_id) !== productoId);
    });
  }, []);

  const updateQuantity = useCallback((productoId: string, cantidad: number, variante?: string) => {
    const matchesItem = (i: CartItem) => {
      if (variante !== undefined) {
        return (i.cart_key || getItemKey(i.producto_id, i.variante)) === getItemKey(productoId, variante);
      }
      return i.producto_id === productoId || (i.cart_key || i.producto_id) === productoId;
    };

    if (cantidad <= 0) {
      setItems(prev => prev.filter(i => !matchesItem(i)));
      return;
    }
    setItems(prev =>
      prev.map(i => {
        if (!matchesItem(i)) return i;

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

  const replaceCart = useCallback((newItems: CartItem[]) => {
    const normalized = newItems.map(i => ({
      ...i,
      cart_key: i.cart_key || getItemKey(i.producto_id, i.variante),
    }));
    setItems(normalized);
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
    replaceCart,
    clearCart,
    getTotal,
    getItemCount,
  };
}
