'use client';

import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════
// DEFAULTS — Valores actuales hardcodeados como fallback
// Si la DB no responde, la tienda se ve EXACTAMENTE como ahora
// ═══════════════════════════════════════════════

export interface BannerItem {
  id: string;
  imagen_url: string;
  link: string;
  texto_alt: string;
  activo: boolean;
  orden: number;
}

export interface FaqItem {
  pregunta: string;
  respuesta: string;
}

export const STORE_DEFAULTS = {
  tienda_identidad: {
    nombre_marca: 'VYPER' as string,
    subtitulo_mayorista: 'Mayorista' as string,
    subtitulo_minorista: 'Tienda Oficial' as string,
    nombre_completo: 'VYPER SUPLEMENTOS' as string,
    logo_url: '/logovyper.png' as string,
    color_primario: '#111111' as string,
    color_acento: '#10b981' as string,
    horario_atencion: 'Lun a Vie 9:00 a 18:00 · Sáb 9:00 a 13:00' as string,
    email: '' as string,
    tiktok: '' as string,
    facebook: '' as string,
  },
  tienda_hero_mayorista: {
    titulo: 'Catálogo Mayorista 🛒' as string,
    descripcion: 'Armá tu pedido con precios exclusivos. Suplementos, indumentaria y accesorios deportivos.' as string,
    subtexto: '📦 Solo se muestran productos con stock disponible' as string,
    imagen_fondo_url: '/bg-hero.webp' as string,
    video_url: 'https://www.youtube.com/embed/XBfY8ZtRqQk?autoplay=1&mute=1&loop=1&playlist=XBfY8ZtRqQk&controls=0&rel=0&showinfo=0' as string,
    video_activo: true as boolean,
  },
  tienda_hero_minorista: {
    titulo: 'Tienda Oficial 🛒' as string,
    descripcion: 'Suplementos, indumentaria y accesorios deportivos.' as string,
    subtexto: '📦 Solo se muestran productos con stock disponible' as string,
    imagen_fondo_url: '/bg-hero.webp' as string,
    video_url: 'https://www.youtube.com/embed/XBfY8ZtRqQk?autoplay=1&mute=1&loop=1&playlist=XBfY8ZtRqQk&controls=0&rel=0&showinfo=0' as string,
    video_activo: true as boolean,
  },
  tienda_footer: {
    direccion: '📍 Av. Libertador 4858 Oeste, Rivadavia, San Juan' as string,
    telefono: '📱 +54 9 264 679-6509' as string,
    instagram: '@vyper_suplementos' as string,
    texto_creditos: 'Desarrollado por Grow Labs' as string,
    url_creditos: 'https://www.growlabs.lat' as string,
    horario_atencion: 'Lun a Vie 9:00 a 18:00 · Sáb 9:00 a 13:00' as string,
    email: '' as string,
    tiktok: '' as string,
    facebook: '' as string,
  },
  tienda_whatsapp: {
    numero_mayorista: '5492646796509' as string,
    numero_minorista: '5492646796509' as string,
    mensaje_mayorista: 'Hola Vyper! Quiero hacer un pedido mayorista 🛒' as string,
    mensaje_minorista: 'Hola Vyper!' as string,
    mensaje_consulta: 'Hola Vyper! Tengo una consulta' as string,
    boton_flotante_activo: true as boolean,
    url_sucursal: 'https://www.google.com/maps/search/?api=1&query=Av.+Libertador+4858+Oeste,+Rivadavia,+San+Juan' as string,
  },
  tienda_faqs_mayorista: {
    preguntas: [
      { pregunta: '¿Cuál es el pedido mínimo?', respuesta: 'Cada producto tiene su cantidad mínima mayorista indicada en la ficha. No hay un monto mínimo total para hacer el pedido.' },
      { pregunta: '¿Los precios incluyen IVA?', respuesta: 'Los precios mostrados son finales. Podemos facturar A o B según lo que necesites.' },
      { pregunta: '¿Hacen envíos?', respuesta: 'Sí, hacemos envíos dentro de San Juan. Para el interior consultanos las opciones de transporte.' },
      { pregunta: '¿Puedo retirar en el local?', respuesta: 'Sí, podés retirar tu pedido en Av. Libertador 4858 Oeste, Rivadavia. Te avisamos cuando está listo.' },
      { pregunta: '¿Qué formas de pago aceptan?', respuesta: 'Efectivo, transferencia bancaria y tarjetas (débito y crédito). Para pagos en cuotas consultanos.' },
      { pregunta: '¿Cuánto tarda el pedido?', respuesta: 'Si el pedido tiene stock disponible, lo preparamos en el día. Te confirmamos el plazo exacto por WhatsApp.' },
    ] as FaqItem[],
  },
  tienda_faqs_minorista: {
    preguntas: [
      { pregunta: '¿Cuál es el pedido mínimo?', respuesta: 'Cada producto tiene su cantidad mínima mayorista indicada en la ficha. No hay un monto mínimo total para hacer el pedido.' },
      { pregunta: '¿Los precios incluyen IVA?', respuesta: 'Los precios mostrados son finales. Podemos facturar A o B según lo que necesites.' },
      { pregunta: '¿Hacen envíos?', respuesta: 'Sí, hacemos envíos dentro de San Juan. Para el interior consultanos las opciones de transporte.' },
      { pregunta: '¿Puedo retirar en el local?', respuesta: 'Sí, podés retirar tu pedido en Av. Libertador 4858 Oeste, Rivadavia. Te avisamos cuando está listo.' },
      { pregunta: '¿Qué formas de pago aceptan?', respuesta: 'Efectivo, transferencia bancaria y tarjetas (débito y crédito). Para pagos en cuotas consultanos.' },
      { pregunta: '¿Cuánto tarda el pedido?', respuesta: 'Si el pedido tiene stock disponible, lo preparamos en el día. Te confirmamos el plazo exacto por WhatsApp.' },
    ] as FaqItem[],
  },
  tienda_banners_mayorista: {
    activo: false as boolean,
    banners: [] as BannerItem[],
  },
  tienda_banners_minorista: {
    activo: false as boolean,
    banners: [] as BannerItem[],
  },
  marquesina_mayorista: {
    activo: true as boolean,
    mensajes: [
      '🚚 Envíos a todo San Juan y el país',
      '📦 Precios exclusivos para revendedores, gimnasios y dietéticas',
      '💳 Efectivo y Transferencia Bancaria',
    ] as string[],
    bg_color: '#111111' as string,
    text_color: '#ffffff' as string,
  },
  marquesina_minorista: {
    activo: true as boolean,
    mensajes: [
      '🔥 Envíos rápidos en San Juan',
      '💪 Suplementos 100% originales',
      '🪙 Sumá Vyper Coins con cada compra',
    ] as string[],
    bg_color: '#111111' as string,
    text_color: '#ffffff' as string,
  },
  tienda_incentivos: {
    activo: true as boolean,
    envio_gratis_mayorista: 150000 as number,
    envio_gratis_minorista: 45000 as number,
    descuento_volumen_minimo: 250000 as number,
    descuento_volumen_porcentaje: 5 as number,
  },
};

export type StoreConfigKey = keyof typeof STORE_DEFAULTS;

// Cache global para evitar refetches por componente
const configCache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 60_000; // 1 minuto
let batchFetchPromise: Promise<void> | null = null;

/**
 * Invalida el cache de configuraciones (una clave específica o todas)
 */
export function invalidateStoreConfigCache(clave?: string) {
  if (clave) {
    delete configCache[clave];
  } else {
    for (const k of Object.keys(configCache)) {
      delete configCache[k];
    }
  }
  batchFetchPromise = null;
}

/**
 * Carga todas las configuraciones en una sola petición coalescida
 */
async function ensureBatchConfigLoaded(): Promise<void> {
  if (!batchFetchPromise) {
    batchFetchPromise = (async () => {
      try {
        const res = await fetch('/api/ecommerce/configuraciones');
        if (!res.ok) throw new Error('API error');
        const rows = await res.json();
        const now = Date.now();
        const rowMap: Record<string, Record<string, unknown>> = {};

        if (Array.isArray(rows)) {
          for (const row of rows) {
            if (row && typeof row.clave === 'string' && row.valor && typeof row.valor === 'object') {
              rowMap[row.clave] = row.valor as Record<string, unknown>;
            }
          }
        }

        const allKeys = Object.keys(STORE_DEFAULTS) as StoreConfigKey[];
        for (const k of allKeys) {
          const defVal = STORE_DEFAULTS[k];
          const dbVal = rowMap[k];
          const merged = dbVal ? { ...defVal, ...dbVal } : { ...defVal };
          configCache[k] = { data: merged, ts: now };
        }
      } catch {
        console.warn('[useStoreConfig] Usando defaults para batch fetch');
      } finally {
        batchFetchPromise = null;
      }
    })();
  }
  return batchFetchPromise;
}

/**
 * Hook para obtener una configuración de la tienda con fallback a defaults y batch loading.
 * Si la API falla o no hay datos, retorna el default hardcodeado.
 */
export function useStoreConfig<K extends StoreConfigKey>(clave: K): {
  config: typeof STORE_DEFAULTS[K];
  loading: boolean;
  refetch: () => void;
} {
  const defaultVal = STORE_DEFAULTS[clave];
  const cachedInitial = configCache[clave];
  const isInitialValid = Boolean(cachedInitial && Date.now() - cachedInitial.ts < CACHE_TTL);

  const [config, setConfig] = useState<typeof STORE_DEFAULTS[K]>(
    isInitialValid ? (cachedInitial.data as typeof STORE_DEFAULTS[K]) : defaultVal
  );
  const [loading, setLoading] = useState(!isInitialValid);

  const fetchConfig = useCallback(async (force = false) => {
    if (force) {
      invalidateStoreConfigCache(clave);
    }

    const cached = configCache[clave];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setConfig(cached.data as typeof STORE_DEFAULTS[K]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await ensureBatchConfigLoaded();
      const afterBatch = configCache[clave];
      if (afterBatch) {
        setConfig(afterBatch.data as typeof STORE_DEFAULTS[K]);
      } else {
        // Fallback individual fetch if not populated by batch
        const res = await fetch(`/api/ecommerce/configuraciones?clave=${clave}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.valor) {
            const merged = { ...defaultVal, ...data.valor };
            configCache[clave] = { data: merged, ts: Date.now() };
            setConfig(merged);
          }
        }
      }
    } catch {
      console.warn(`[useStoreConfig] Usando defaults para "${clave}"`);
    } finally {
      setLoading(false);
    }
  }, [clave, defaultVal]);

  useEffect(() => {
    fetchConfig(false);
  }, [fetchConfig]);

  return { config, loading, refetch: () => fetchConfig(true) };
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
