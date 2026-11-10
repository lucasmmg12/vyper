'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, X, Send, Plus, Check, ShoppingCart, Bot, Loader2 } from 'lucide-react';
import { Producto } from '@/types/ecommerce';
import { useCart } from '@/lib/cart';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: Producto[];
}

export default function PersonalShopperIA({
  storeType = 'mayorista',
}: {
  storeType?: 'mayorista' | 'minorista';
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const [selectedVariantByProd, setSelectedVariantByProd] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts =
    storeType === 'mayorista'
      ? [
          '¿Qué combo me recomendás para revender en mi gimnasio?',
          '¿Cuáles son las proteínas y creatinas más vendidas?',
          '¿Qué productos están en oferta hoy?',
        ]
      : [
          '¿Qué tomo para ganar masa muscular?',
          '¿Qué me recomendás para tener más energía al entrenar?',
          '¿Cuáles son las ofertas destacadas de hoy?',
        ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        storeType === 'mayorista'
          ? '¡Hola! Soy tu **Asesor Mayorista IA de Vyper** 🤖⚡. Preguntame qué productos rinden mejor para tu gimnasio o dietética, o qué objetivo buscás cubrir y te armo el pedido en segundos.'
          : '¡Hola! Soy tu **Personal Shopper & Nutricionista IA de Vyper** 🤖💪. Contame cuál es tu objetivo (ganar masa muscular, energía, definición) y te recomiendo el suplemento ideal.',
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price || 0);

  const sendPrompt = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ecommerce/personal-shopper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          storeType,
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Acá tenés las mejores opciones de Vyper para vos:',
          products: data.recommendedProducts || [],
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Hubo un problema de conexión. Probá nuevamente en unos segundos.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (p: Producto) => {
    const activeVariantes = (p.variantes || []).filter(v => v.activo !== false);
    const chosenVar =
      selectedVariantByProd[p.id] ||
      (activeVariantes.length > 0 ? activeVariantes[0].nombre : undefined);

    const price =
      p.en_oferta && p.precio_oferta && p.precio_oferta > 0
        ? p.precio_oferta
        : p.precio_mayorista;

    const displayName = chosenVar ? `${p.nombre} (${chosenVar})` : p.nombre;

    addItem({
      producto_id: p.id,
      nombre: displayName,
      variante: chosenVar,
      precio: price,
      cantidad: 1,
      imagen: p.imagenes?.[0],
      stock: p.stock || 999,
      cantidad_minima: p.cantidad_minima || 1,
    });

    const key = `${p.id}_${chosenVar || ''}`;
    setAddedKey(key);
    setTimeout(() => setAddedKey(null), 1500);
  };

  const baseUrl = storeType === 'minorista' ? '/minorista' : '/tienda';

  return (
    <>
      {/* Floating Trigger Button — positioned bottom-left so it never overlaps WhatsApp on bottom-right */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Abrir Personal Shopper IA"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          zIndex: 55,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.15rem',
          borderRadius: '100px',
          background: 'linear-gradient(135deg, #111827 0%, #1e40af 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 24px rgba(30, 64, 175, 0.35)',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        <Sparkles size={18} color="#60a5fa" />
        <span>Asesor IA Vyper</span>
      </button>

      {/* Drawer / Modal */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '5.25rem',
            left: '1.5rem',
            width: 'min(390px, calc(100vw - 2rem))',
            height: 'min(580px, calc(100vh - 7.5rem))',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 60,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #1e3a8a 100%)',
              color: '#ffffff',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={20} color="#93c5fd" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.925rem', lineHeight: 1.2 }}>
                  Personal Shopper IA
                </div>
                <div style={{ fontSize: '0.7rem', color: '#bfdbfe' }}>
                  Nutrición Deportiva & Ventas {storeType === 'mayorista' ? 'B2B' : 'Oficial'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: 30,
                height: 30,
                borderRadius: '50%',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                }}
              >
                <div
                  style={{
                    background: m.role === 'user' ? '#1e40af' : '#ffffff',
                    color: m.role === 'user' ? '#ffffff' : '#111827',
                    padding: '0.75rem 0.95rem',
                    borderRadius:
                      m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: '0.835rem',
                    lineHeight: 1.45,
                    border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {m.content}
                </div>

                {/* Mini Product Cards */}
                {m.products && m.products.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      marginTop: '0.55rem',
                    }}
                  >
                    {m.products.map(p => {
                      const isOnSale = p.en_oferta && p.precio_oferta && p.precio_oferta > 0;
                      const price = isOnSale ? p.precio_oferta : p.precio_mayorista;
                      const activeVars = (p.variantes || []).filter(v => v.activo !== false);
                      const chosenVar =
                        selectedVariantByProd[p.id] ||
                        (activeVars.length > 0 ? activeVars[0].nombre : '');
                      const key = `${p.id}_${chosenVar}`;
                      const isAdded = addedKey === key;

                      return (
                        <div
                          key={p.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0.6rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                            <Link
                              href={`${baseUrl}/producto/${p.id}`}
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 8,
                                background: '#f1f5f9',
                                position: 'relative',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {p.imagenes?.[0] ? (
                                <Image
                                  src={p.imagenes[0]}
                                  alt={p.nombre}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  sizes="46px"
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <ShoppingCart size={16} color="#94a3b8" />
                                </div>
                              )}
                            </Link>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link href={`${baseUrl}/producto/${p.id}`}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    color: '#0f172a',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {p.nombre}
                                </div>
                              </Link>
                              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#1e40af' }}>
                                {formatPrice(price)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(p)}
                              style={{
                                background: isAdded ? '#10b981' : '#111827',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.4rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                flexShrink: 0,
                              }}
                            >
                              {isAdded ? <Check size={13} /> : <Plus size={13} />}
                              {isAdded ? 'Listo' : 'Agregar'}
                            </button>
                          </div>

                          {activeVars.length > 0 && (
                            <select
                              value={chosenVar}
                              onChange={e =>
                                setSelectedVariantByProd(prev => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                margin: 0,
                              }}
                            >
                              {activeVars.map(v => (
                                <option key={v.id || v.nombre} value={v.nombre}>
                                  Sabor / Variante: {v.nombre}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Quick Suggestion Chips on initial state */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                  Consultas frecuentes:
                </span>
                {quickPrompts.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendPrompt(q)}
                    style={{
                      textAlign: 'left',
                      background: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.6rem 0.9rem',
                  fontSize: '0.8rem',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Loader2 size={15} className="animate-spin" /> Buscando los mejores suplementos...
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              sendPrompt(input);
            }}
            style={{
              padding: '0.7rem',
              borderTop: '1px solid #e5e7eb',
              background: '#ffffff',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ej: ¿Qué tomo para ganar masa muscular?"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                flex: 1,
                margin: 0,
                padding: '0.55rem 0.85rem',
                fontSize: '0.825rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: '#1e40af',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                width: 38,
                height: 38,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
