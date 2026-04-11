'use client';

import { useEffect, useState } from 'react';

interface MarqueeConfig {
  activo: boolean;
  mensajes: string[];
}

export default function MarqueeBar({ storeType = 'minorista' }: { storeType?: 'minorista' | 'mayorista' }) {
  const [config, setConfig] = useState<MarqueeConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/ecommerce/configuraciones?clave=marquesina_${storeType}`);
        const data = await res.json();
        if (data && data.valor) {
          setConfig(data.valor);
        }
      } catch (err) {
        console.error('Error fetching marquee config:', err);
      }
    };
    fetchConfig();
  }, [storeType]);

  if (!config || !config.activo || !config.mensajes || config.mensajes.length === 0) {
    return null; // Do not render if disabled or no messages
  }

  // Duplicate messages to create a seamless infinite loop effect
  const displayMessages = [...config.mensajes, ...config.mensajes, ...config.mensajes];

  return (
    <div style={{
      width: '100%',
      background: '#222222', // Dark background for the marquee as in tiendanube
      color: '#ffffff',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 60,
      padding: '0.625rem 0',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="marquee-content">
        {displayMessages.map((msg, idx) => (
          <span key={idx} style={{ 
            padding: '0 2rem', 
            fontSize: '0.8125rem', 
            fontWeight: 600,
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
          }}>
            {msg}
          </span>
        ))}
      </div>

      <style jsx>{`
        .marquee-content {
          display: flex;
          white-space: nowrap;
          animation: scrollText 30s linear infinite;
        }

        .marquee-content:hover {
          animation-play-state: paused;
        }

        @keyframes scrollText {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%); /* Move exactly by 1/3 since we copied the array 3 times */
          }
        }
      `}</style>
    </div>
  );
}
