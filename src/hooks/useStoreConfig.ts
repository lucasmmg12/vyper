'use client';

import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════
// DEFAULTS — Valores actuales hardcodeados como fallback
// Si la DB no responde, la tienda se ve EXACTAMENTE como ahora
// ═══════════════════════════════════════════════

export const STORE_DEFAULTS = {
  tienda_identidad: {
    nombre_marca: 'VYPER',
    subtitulo_mayorista: 'Mayorista',
    subtitulo_minorista: 'Tienda Oficial',
    nombre_completo: 'VYPER SUPLEMENTOS',
    logo_url: '/logovyper.png',
  },
  tienda_hero_mayorista: {
    titulo: 'Catálogo Mayorista 🛒',
    descripcion: 'Armá tu pedido con precios exclusivos. Suplementos, indumentaria y accesorios deportivos.',
    subtexto: '📦 Solo se muestran productos con stock disponible',
    imagen_fondo_url: '/bg-hero.webp',
    video_url: 'https://www.youtube.com/embed/XBfY8ZtRqQk?autoplay=1&mute=1&loop=1&playlist=XBfY8ZtRqQk&controls=0&rel=0&showinfo=0',
    video_activo: true,
  },
  tienda_hero_minorista: {
    titulo: 'Tienda Oficial 🛒',
    descripcion: 'Suplementos, indumentaria y accesorios deportivos.',
    subtexto: '📦 Solo se muestran productos con stock disponible',
    imagen_fondo_url: '/bg-hero.webp',
    video_url: 'https://www.youtube.com/embed/XBfY8ZtRqQk?autoplay=1&mute=1&loop=1&playlist=XBfY8ZtRqQk&controls=0&rel=0&showinfo=0',
    video_activo: true,
  },
  tienda_footer: {
    direccion: '📍 Dr. Ortega 192, Villa Krause, San Juan',
    telefono: '📱 +54 264 629 8880',
    instagram: '@vyper_suplementos',
    texto_creditos: 'Desarrollado por Grow Labs',
    url_creditos: 'https://www.growlabs.lat',
  },
  tienda_whatsapp: {
    numero_mayorista: '5492644193032',
    numero_minorista: '5492646298880',
    mensaje_mayorista: 'Hola Vyper! Quiero hacer un pedido mayorista 🛒',
    mensaje_minorista: 'Hola Vyper!',
    mensaje_consulta: 'Hola Vyper! Tengo una consulta',
    boton_flotante_activo: true,
    url_sucursal: 'https://www.google.com/maps/dir//Dr.+Ortega+192,+J5425+Villa+Krause,+San+Juan/@-31.578636,-68.6178966,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x96813f9a5a4f7b97:0x7159753af0ace75a!2m2!1d-68.5354807!2d-31.5786279?entry=ttu&g_ep=EgoyMDI0MTIwMi4wIKXMDSoASAFQAw%3D%3D',
  },
  tienda_faqs_mayorista: {
    preguntas: [
      { pregunta: '¿Cuál es el pedido mínimo?', respuesta: 'Cada producto tiene su cantidad mínima mayorista indicada en la ficha. No hay un monto mínimo total para hacer el pedido.' },
      { pregunta: '¿Los precios incluyen IVA?', respuesta: 'Los precios mostrados son finales. Podemos facturar A o B según lo que necesites.' },
      { pregunta: '¿Hacen envíos?', respuesta: 'Sí, hacemos envíos dentro de San Juan. Para el interior consultanos las opciones de transporte.' },
      { pregunta: '¿Puedo retirar en el local?', respuesta: 'Sí, podés retirar tu pedido en Dr. Ortega 192, Villa Krause. Te avisamos cuando está listo.' },
      { pregunta: '¿Qué formas de pago aceptan?', respuesta: 'Efectivo, transferencia bancaria y tarjetas (débito y crédito). Para pagos en cuotas consultanos.' },
      { pregunta: '¿Cuánto tarda el pedido?', respuesta: 'Si el pedido tiene stock disponible, lo preparamos en el día. Te confirmamos el plazo exacto por WhatsApp.' },
    ],
  },
  tienda_faqs_minorista: {
    preguntas: [
      { pregunta: '¿Cuál es el pedido mínimo?', respuesta: 'Cada producto tiene su cantidad mínima mayorista indicada en la ficha. No hay un monto mínimo total para hacer el pedido.' },
      { pregunta: '¿Los precios incluyen IVA?', respuesta: 'Los precios mostrados son finales. Podemos facturar A o B según lo que necesites.' },
      { pregunta: '¿Hacen envíos?', respuesta: 'Sí, hacemos envíos dentro de San Juan. Para el interior consultanos las opciones de transporte.' },
      { pregunta: '¿Puedo retirar en el local?', respuesta: 'Sí, podés retirar tu pedido en Dr. Ortega 192, Villa Krause. Te avisamos cuando está listo.' },
      { pregunta: '¿Qué formas de pago aceptan?', respuesta: 'Efectivo, transferencia bancaria y tarjetas (débito y crédito). Para pagos en cuotas consultanos.' },
      { pregunta: '¿Cuánto tarda el pedido?', respuesta: 'Si el pedido tiene stock disponible, lo preparamos en el día. Te confirmamos el plazo exacto por WhatsApp.' },
    ],
  },
  tienda_banners_mayorista: {
    activo: false,
    banners: [] as { id: string; imagen_url: string; link: string; texto_alt: string; activo: boolean; orden: number }[],
  },
  tienda_banners_minorista: {
    activo: false,
    banners: [] as { id: string; imagen_url: string; link: string; texto_alt: string; activo: boolean; orden: number }[],
  },
} as const;

export type StoreConfigKey = keyof typeof STORE_DEFAULTS;

// Cache global para evitar refetches por componente
const configCache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 60_000; // 1 minuto

/**
 * Hook para obtener una configuración de la tienda con fallback a defaults.
 * Si la API falla o no hay datos, retorna el default hardcodeado.
 */
export function useStoreConfig<K extends StoreConfigKey>(clave: K): {
  config: typeof STORE_DEFAULTS[K];
  loading: boolean;
  refetch: () => void;
} {
  const defaultVal = STORE_DEFAULTS[clave];
  const [config, setConfig] = useState<typeof STORE_DEFAULTS[K]>(defaultVal);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    // Check cache first
    const cached = configCache[clave];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setConfig(cached.data as typeof STORE_DEFAULTS[K]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/ecommerce/configuraciones?clave=${clave}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      if (data && data.valor) {
        // Merge with defaults to fill any missing fields
        const merged = { ...defaultVal, ...data.valor };
        configCache[clave] = { data: merged, ts: Date.now() };
        setConfig(merged);
      }
    } catch {
      // Silently fall back to defaults — la tienda funciona igual
      console.warn(`[useStoreConfig] Usando defaults para "${clave}"`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return { config, loading, refetch: fetchConfig };
}

/**
 * Fetch server-side para usar en componentes que no son hooks
 */
export async function fetchStoreConfig<K extends StoreConfigKey>(
  clave: K,
  baseUrl?: string
): Promise<typeof STORE_DEFAULTS[K]> {
  const defaultVal = STORE_DEFAULTS[clave];
  try {
    const url = `${baseUrl || ''}/api/ecommerce/configuraciones?clave=${clave}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (data && data.valor) {
      return { ...defaultVal, ...data.valor };
    }
  } catch {
    console.warn(`[fetchStoreConfig] Usando defaults para "${clave}"`);
  }
  return defaultVal;
}
