// Vyper Coins Tier System
// Bronce: 0-99 | Plata: 100-499 | Oro: 500-999 | Diamante: 1000+

import React from 'react';

export interface TierInfo {
    name: string;
    emoji: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    minCoins: number;
    maxCoins: number | null;
    nextTier: string | null;
    coinsToNext: number | null;
}

export function getTier(coins: number): TierInfo {
    if (coins >= 1000) {
        return {
            name: 'Diamante',
            emoji: '💎',
            color: '#b9f2ff',
            bgColor: 'rgba(185, 242, 255, 0.1)',
            borderColor: 'rgba(185, 242, 255, 0.4)',
            glowColor: 'rgba(185, 242, 255, 0.3)',
            minCoins: 1000,
            maxCoins: null,
            nextTier: null,
            coinsToNext: null,
        };
    }
    if (coins >= 500) {
        return {
            name: 'Oro',
            emoji: '🥇',
            color: '#fbbf24',
            bgColor: 'rgba(251, 191, 36, 0.1)',
            borderColor: 'rgba(251, 191, 36, 0.4)',
            glowColor: 'rgba(251, 191, 36, 0.3)',
            minCoins: 500,
            maxCoins: 999,
            nextTier: 'Diamante 💎',
            coinsToNext: 1000 - coins,
        };
    }
    if (coins >= 100) {
        return {
            name: 'Plata',
            emoji: '🥈',
            color: '#c0c0c0',
            bgColor: 'rgba(192, 192, 192, 0.1)',
            borderColor: 'rgba(192, 192, 192, 0.4)',
            glowColor: 'rgba(192, 192, 192, 0.3)',
            minCoins: 100,
            maxCoins: 499,
            nextTier: 'Oro 🥇',
            coinsToNext: 500 - coins,
        };
    }
    return {
        name: 'Bronce',
        emoji: '🥉',
        color: '#cd7f32',
        bgColor: 'rgba(205, 127, 50, 0.1)',
        borderColor: 'rgba(205, 127, 50, 0.4)',
        glowColor: 'rgba(205, 127, 50, 0.3)',
        minCoins: 0,
        maxCoins: 99,
        nextTier: 'Plata 🥈',
        coinsToNext: 100 - coins,
    };
}

// For use in WhatsApp messages (plain text)
export function getTierText(coins: number): string {
    const tier = getTier(coins);
    return `${tier.emoji} ${tier.name}`;
}

// Progress to next tier as percentage (0-100)
export function getTierProgress(coins: number): number {
    const tier = getTier(coins);
    if (tier.maxCoins === null) return 100;
    const range = (tier.maxCoins + 1) - tier.minCoins;
    const progress = coins - tier.minCoins;
    return Math.min(100, Math.round((progress / range) * 100));
}

// React component for tier badge
export function TierBadge({ coins, size = 'md' }: { coins: number; size?: 'sm' | 'md' | 'lg' }): React.ReactElement {
    const tier = getTier(coins);

    const sizes = {
        sm: { padding: '2px 8px', fontSize: '0.7rem', gap: '3px' },
        md: { padding: '4px 12px', fontSize: '0.8rem', gap: '5px' },
        lg: { padding: '6px 16px', fontSize: '0.95rem', gap: '6px' },
    };

    const s = sizes[size];

    return React.createElement('span', {
        style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: s.gap,
            padding: s.padding,
            fontSize: s.fontSize,
            fontWeight: 700,
            color: tier.color,
            background: tier.bgColor,
            border: `1px solid ${tier.borderColor}`,
            borderRadius: '50px',
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap' as const,
        }
    }, `${tier.emoji} ${tier.name}`);
}

// Progress bar component
export function TierProgressBar({ coins }: { coins: number }): React.ReactElement {
    const tier = getTier(coins);
    const progress = getTierProgress(coins);

    return React.createElement('div', { style: { width: '100%' } },
        React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
            }
        },
            React.createElement('span', null, `${tier.emoji} ${tier.name}`),
            tier.nextTier
                ? React.createElement('span', null,
                    'Faltan ',
                    React.createElement('strong', { style: { color: tier.color } }, tier.coinsToNext),
                    ` para ${tier.nextTier}`
                )
                : React.createElement('span', { style: { color: tier.color } }, '¡Nivel máximo!')
        ),
        React.createElement('div', {
            style: {
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '3px',
                overflow: 'hidden',
            }
        },
            React.createElement('div', {
                style: {
                    width: `${progress}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${tier.color}, ${tier.glowColor})`,
                    borderRadius: '3px',
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 8px ${tier.glowColor}`,
                }
            })
        )
    );
}
