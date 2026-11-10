'use client';

import { useStoreConfig } from '@/hooks/useStoreConfig';

export default function MarqueeBar({ storeType = 'minorista' }: { storeType?: 'minorista' | 'mayorista' }) {
  const { config } = useStoreConfig(storeType === 'mayorista' ? 'marquesina_mayorista' : 'marquesina_minorista');

  if (!config || !config.activo || !config.mensajes || config.mensajes.length === 0) {
    return null; // Do not render if disabled or no messages
  }

  // Filter out empty messages
  const activeMessages = config.mensajes.filter((m) => m && m.trim().length > 0);
  if (activeMessages.length === 0) {
    return null;
  }

  // Duplicate messages to create a seamless infinite loop effect
  const displayMessages = [...activeMessages, ...activeMessages, ...activeMessages];

  return (
    <div style={{
      width: '100%',
      background: config.bg_color || '#111111',
      color: config.text_color || '#ffffff',
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
