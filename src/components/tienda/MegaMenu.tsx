'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rubro, Categoria, Marca } from '@/types/ecommerce';
import { ChevronDown } from 'lucide-react';

export default function MegaMenu({ baseUrl = '/minorista' }: { baseUrl?: string }) {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [rubrosRes, categoriasRes, marcasRes] = await Promise.all([
          fetch('/api/ecommerce/rubros'),
          fetch('/api/ecommerce/categorias'),
          fetch('/api/ecommerce/marcas'),
        ]);
        const [rubrosData, categoriasData, marcasData] = await Promise.all([
          rubrosRes.json(),
          categoriasRes.json(),
          marcasRes.json(),
        ]);
        setRubros(rubrosData.rubros || []);
        setCategorias(categoriasData.categorias || []);
        setMarcas(marcasData.marcas || []);
      } catch (err) {
        console.error("Failed to load filters for mega menu", err);
      }
    };
    fetchFilters();
  }, []);

  const categoriesByRubro = rubros.map(rubro => {
    return {
      ...rubro,
      categorias: categorias.filter(c => c.rubro_id === rubro.id)
    }
  }).filter(r => r.categorias.length > 0 || r.nombre.toLowerCase().includes('combo') || r.nombre.toLowerCase().includes('sale'));

  return (
    <div 
      style={{ position: 'relative' }} 
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link href={baseUrl}>
        <button 
          className="btn-ghost" 
          style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          Productos <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>
      </Link>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: '1200px',
          background: 'white',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          borderRadius: '12px',
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          zIndex: 100,
          border: '1px solid var(--border-color)',
          marginTop: '0.5rem',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          {categoriesByRubro.map(rubro => (
            <div key={rubro.id}>
              <Link href={`${baseUrl}?rubro=${rubro.id}`} onClick={() => setIsOpen(false)}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', textTransform: 'uppercase' }}>
                  {rubro.nombre}
                </h3>
              </Link>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rubro.categorias.map(cat => (
                  <li key={cat.id}>
                    <Link 
                      href={`${baseUrl}?categoria=${cat.id}`}
                      onClick={() => setIsOpen(false)}
                      style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      - {cat.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {marcas.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', textTransform: 'uppercase' }}>
                Marcas
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {marcas.map(marca => (
                  <li key={marca.id}>
                    <Link 
                      href={`${baseUrl}?marca=${marca.id}`}
                      onClick={() => setIsOpen(false)}
                      style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      - {marca.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
