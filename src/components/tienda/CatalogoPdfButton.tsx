'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Producto } from '@/types/ecommerce';

interface CatalogoPdfButtonProps {
  storeType: 'mayorista' | 'minorista';
  productos?: Producto[];
  nombreMarca?: string;
  logoUrl?: string;
  telefono?: string;
  direccion?: string;
}

export default function CatalogoPdfButton({
  storeType,
  productos: initialProductos = [],
  nombreMarca = 'VYPER SUPLEMENTOS',
  logoUrl = '/logovyper.png',
  telefono = '+54 9 264 679-6509',
  direccion = 'Av. Libertador 4858 Oeste, Rivadavia, San Juan',
}: CatalogoPdfButtonProps) {
  const [generating, setGenerating] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      let list: Producto[] = initialProductos;

      // Always fetch full active catalog so PDF has all products
      try {
        const query = storeType === 'minorista' ? '?limit=500&tienda=minorista' : '?limit=500';
        const res = await fetch(`/api/ecommerce/productos${query}`);
        const data = await res.json();
        if (data?.productos && data.productos.length > 0) {
          list = data.productos.filter((p: Producto) => p.activo !== false);
        }
      } catch {
        // Fallback to initialProductos
      }

      // Group by Categoria (or Marca)
      const grouped: Record<string, Producto[]> = {};
      list.forEach(p => {
        const groupName = p.categoria?.nombre || p.marca?.nombre || 'General';
        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push(p);
      });

      const today = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const titleType = storeType === 'mayorista' ? 'LISTA DE PRECIOS MAYORISTA' : 'CATÁLOGO OFICIAL MINORISTA';
      const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const resolvedLogo = logoUrl.startsWith('http') ? logoUrl : `${originUrl}${logoUrl}`;

      const sectionsHtml = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, items]) => {
          const rows = items
            .map(p => {
              const isOnSale = p.en_oferta && p.precio_oferta && p.precio_oferta > 0;
              const basePrice = isOnSale ? p.precio_oferta : p.precio_mayorista;
              const variantesText =
                p.variantes && p.variantes.length > 0
                  ? p.variantes.map(v => v.nombre).join(', ')
                  : 'Único';
              const comboBadge = p.es_combo ? '<span class="badge-combo">COMBO</span>' : '';
              const ofertaBadge = isOnSale ? '<span class="badge-sale">OFERTA</span>' : '';

              return `
                <tr>
                  <td class="sku-cell">${p.sku || '-'}</td>
                  <td>
                    <div class="prod-name">${p.nombre} ${comboBadge} ${ofertaBadge}</div>
                    ${p.marca?.nombre ? `<div class="prod-brand">${p.marca.nombre}</div>` : ''}
                  </td>
                  <td class="var-cell">${variantesText}</td>
                  <td class="price-cell">
                    <strong>${formatPrice(basePrice)}</strong>
                    ${isOnSale ? `<div class="old-price">${formatPrice(p.precio_mayorista)}</div>` : ''}
                  </td>
                </tr>
              `;
            })
            .join('');

          return `
            <div class="category-block">
              <div class="category-header">${group} (${items.length})</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 14%">SKU</th>
                    <th style="width: 44%">Producto / Marca</th>
                    <th style="width: 24%">Sabores / Variantes</th>
                    <th style="width: 18%; text-align: right;">Precio ${storeType === 'mayorista' ? 'Mayorista' : 'Final'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          `;
        })
        .join('');

      const printWindow = window.open('', '_blank', 'width=960,height=800');
      if (!printWindow) {
        alert('Por favor habilitá las ventanas emergentes para descargar el catálogo PDF.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>${nombreMarca} - ${titleType} (${today})</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #111827;
              background: #fff;
              padding: 28px;
              font-size: 12px;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px solid #111827;
              padding-bottom: 16px;
              margin-bottom: 22px;
            }
            .brand-box {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .brand-box img {
              width: 54px;
              height: 54px;
              object-fit: contain;
              border-radius: 10px;
            }
            .brand-title {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: -0.02em;
            }
            .brand-sub {
              font-size: 12px;
              font-weight: 700;
              color: #2563eb;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin-top: 2px;
            }
            .meta-box {
              text-align: right;
              font-size: 11px;
              color: #4b5563;
              line-height: 1.5;
            }
            .category-block {
              margin-bottom: 22px;
              page-break-inside: avoid;
            }
            .category-header {
              background: #111827;
              color: #ffffff;
              padding: 7px 12px;
              font-weight: 800;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-radius: 6px 6px 0 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #e5e7eb;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              text-align: left;
              padding: 7px 10px;
              font-size: 10.5px;
              text-transform: uppercase;
              border-bottom: 1px solid #d1d5db;
            }
            td {
              padding: 7px 10px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: middle;
            }
            tr:nth-child(even) td {
              background: #fafafa;
            }
            .sku-cell {
              font-family: monospace;
              color: #6b7280;
              font-size: 11px;
            }
            .prod-name {
              font-weight: 700;
              color: #111827;
              font-size: 12px;
            }
            .prod-brand {
              font-size: 10px;
              color: #6b7280;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .var-cell {
              color: #4b5563;
              font-size: 11px;
            }
            .price-cell {
              text-align: right;
              font-size: 13px;
              color: #111827;
              white-space: nowrap;
            }
            .old-price {
              font-size: 10px;
              color: #9ca3af;
              text-decoration: line-through;
            }
            .badge-sale {
              background: #ef4444;
              color: #fff;
              font-size: 9px;
              padding: 1px 5px;
              border-radius: 4px;
              margin-left: 4px;
              font-weight: 700;
            }
            .badge-combo {
              background: #2563eb;
              color: #fff;
              font-size: 9px;
              padding: 1px 5px;
              border-radius: 4px;
              margin-left: 4px;
              font-weight: 700;
            }
            .footer {
              margin-top: 24px;
              padding-top: 12px;
              border-top: 1px solid #d1d5db;
              text-align: center;
              font-size: 10.5px;
              color: #6b7280;
            }
            @media print {
              body { padding: 10px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="window.print()" style="background:#111827;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">
              🖨️ Imprimir / Guardar como PDF
            </button>
          </div>
          <div class="header">
            <div class="brand-box">
              <img src="${resolvedLogo}" alt="${nombreMarca}" onerror="this.style.display='none'" />
              <div>
                <div class="brand-title">${nombreMarca}</div>
                <div class="brand-sub">${titleType}</div>
              </div>
            </div>
            <div class="meta-box">
              <div><strong>Fecha de actualización:</strong> ${today}</div>
              <div>${direccion}</div>
              <div>WhatsApp Pedidos: <strong>${telefono}</strong></div>
            </div>
          </div>
          ${sectionsHtml}
          <div class="footer">
            Precios expresados en Pesos Argentinos (ARS), sujetos a actualización sin previo aviso. · ${nombreMarca} (${today})
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownloadPdf}
      disabled={generating}
      className="secondary"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.55rem 0.95rem',
        fontSize: '0.8125rem',
        fontWeight: 700,
        borderRadius: 8,
        background: '#ffffff',
        color: '#111827',
        border: '1px solid #d1d5db',
        cursor: generating ? 'wait' : 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      title="Descargar o imprimir catálogo actualizado en PDF"
    >
      {generating ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
      <span>Catálogo PDF</span>
    </button>
  );
}
