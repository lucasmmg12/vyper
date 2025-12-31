
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MapPin,
    Facebook,
    Radio,
    Tv,
    Smartphone,
    Trophy,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Search,
    TrendingUp,
    PieChart as PieChartIcon,
    Award
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend as ReLegend } from 'recharts';

// Dynamically import Map with no SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const LCircle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

// Leaflet CSS Link (placed here for client-side injection if needed, or better in a useEffect)
import 'leaflet/dist/leaflet.css';

const COMPETITORS = [
    {
        id: 3,
        name: 'SCIMMIA SUPLEMENTOS',
        address: 'Centro / Rawson / Hiper Libertad',
        coords: [-31.5375, -68.5250] as [number, number],
        ads: 'ACTIVOS',
        adLink: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&q=Scimmia%20Suplementos',
        media: { social: true, tv: true, radio: true, events: true },
        strength: 'Líder absoluto de mercado, 4 sucursales.',
        weakness: 'Atención saturada por volumen.',
        marketShare: 45,
        score: 98
    },
    {
        id: 1,
        name: 'PIRKA SUPLEMENTOS',
        address: 'Rivadavia - Av. Libertador 5230',
        coords: [-31.5305, -68.5950] as [number, number],
        ads: 'ACTIVOS',
        adLink: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&view_all_page_id=100063625484841',
        media: { social: true, tv: false, radio: true, events: true },
        strength: 'Cercanía a Sede Rivadavia, mucha variedad.',
        weakness: 'Sobreprecio percibido.',
        marketShare: 12,
        score: 75
    },
    {
        id: 5,
        name: 'DISFIT',
        address: 'San Juan Centro',
        coords: [-31.5340, -68.5200] as [number, number],
        ads: 'ACTIVOS',
        adLink: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&q=Disfit',
        media: { social: true, tv: false, radio: false, events: true },
        strength: 'Especialistas en importados premium.',
        weakness: 'Stock inestable.',
        marketShare: 15,
        score: 82
    },
    {
        id: 2,
        name: 'KICK SUPLEMENTOS',
        address: 'Rivadavia - Av. Libertador 3120',
        coords: [-31.5310, -68.5680] as [number, number],
        ads: 'INACTIVOS',
        adLink: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=AR&q=KICK%20Suplementos',
        media: { social: true, tv: false, radio: false, events: true },
        strength: 'Comunidad activa en redes.',
        weakness: 'Bajo alcance físico.',
        marketShare: 8,
        score: 60
    },
    {
        id: 6,
        name: 'STRONGMAN',
        address: 'Villa Krause, Rawson',
        coords: [-31.5850, -68.5320] as [number, number],
        ads: 'INACTIVOS',
        adLink: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=AR&q=Strongman',
        media: { social: true, tv: false, radio: true, events: false },
        strength: 'Precios competitivos en nacionales.',
        weakness: 'Imagen de marca tradicional.',
        marketShare: 10,
        score: 55
    },
    {
        id: 4,
        name: 'FRACCIÓN DEPORTES',
        address: 'San Juan Centro',
        coords: [-31.5360, -68.5220] as [number, number],
        ads: 'INACTIVOS',
        adLink: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=AR&q=Fraccion%20Deportes',
        media: { social: true, tv: false, radio: false, events: false },
        strength: 'Ubicación céntrica (Mendoza N).',
        weakness: 'Suplementos es categoría secundaria.',
        marketShare: 5,
        score: 40
    }
];

const MARKET_DATA = [
    { name: 'Scimmia', value: 45, color: '#000000' },
    { name: 'Disfit', value: 15, color: '#444444' },
    { name: 'Pirka', value: 12, color: '#666666' },
    { name: 'Strongman', value: 10, color: '#888888' },
    { name: 'Vyper / Otros', value: 18, color: '#cccccc' },
];

const VYPER_STORES = [
    { name: 'VYPER RIVADAVIA', coords: [-31.5312, -68.5910] as [number, number], color: '#000000' },
    { name: 'VYPER RAWSON', coords: [-31.5835, -68.5280] as [number, number], color: '#000000' }
];

export default function CompetitorsPage() {
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        // Fix Leaflet marker icons in Next.js
        import('leaflet').then((leaflet) => {
            const DefaultIcon = leaflet.Icon.Default.prototype as any;
            delete DefaultIcon._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
            setL(leaflet);
        });
    }, []);

    const opportunities = [
        {
            title: "GAP de Publicidad en Rivadavia",
            desc: "KICK Suplementos no tiene anuncios activos. Vyper puede dominar el feed local de Meta con una campaña geolocalizada a 3km del local de Libertador.",
            type: "Estratégica"
        },
        {
            title: "Fallo en Atención de Scimmia",
            desc: "Usuarios reportan demoras en Rawson. Mejorar el sistema de pick-up en 5 min en Vyper Rawson capturará clientes insatisfechos.",
            type: "Servicio"
        },
        {
            title: "Presencia en Eventos",
            desc: "Ningún competidor está patrocinando torneos de CrossFit menores. Oportunidad para brandeo de marca con bajo presupuesto.",
            type: "Marketing"
        }
    ];

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#ffffff', fontWeight: 900, textTransform: 'uppercase' }}>
                        INTELIGENCIA COMPETITIVA
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Análisis de Mercado - San Juan, Argentina</p>
                </div>
                <Link href="/admin">
                    <button className="secondary">VOLVER</button>
                </Link>
            </header>

            {/* MARKET STRUCTURE SECTION */}
            <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
                {/* Market Share Donut */}
                <div className="glass-card" style={{ height: '350px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <PieChartIcon size={20} /> SHARE DE MERCADO (ESTIMADO)
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Distribución estimada de las ventas locales. Identifica quién domina el volumen de facturación en San Juan.
                    </p>
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie
                                data={MARKET_DATA}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {MARKET_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                                ))}
                            </Pie>
                            <ReTooltip
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '0.8rem' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <ReLegend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Leaderboard Ranking */}
                <div className="glass-card" style={{ height: '350px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Award size={20} /> RANKING DE COMPETITIVIDAD
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Clasificación basada en el 'MKT Power', que evalúa presencia física, alcance digital y capacidad publicitaria.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', maxHeight: '250px' }}>
                        {[...COMPETITORS].sort((a, b) => b.score - a.score).map((c, i) => (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: i === 0 ? '#facc15' : 'rgba(255,255,255,0.2)' }}>#{i + 1}</span>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.name}</div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', width: '100px', marginTop: '4px' }}>
                                            <div style={{ height: '100%', background: 'white', width: `${c.score}%`, borderRadius: '2px' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.score} pts</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MKT Power</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAP SECTION */}
            <div className="glass-card" style={{ marginBottom: '2rem', height: '500px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={20} /> MAPA DE COBERTURA & OVERLAP
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Visualización de los 'Radios de Acción'. Las zonas donde los círculos se cruzan son áreas de alta competencia.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'black' }}></div> Vyper
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div> Competencia
                        </span>
                    </div>
                </div>
                <div style={{ height: '400px', borderRadius: '15px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {typeof window !== 'undefined' && L && (
                        <MapContainer center={[-31.55, -68.55]} zoom={12} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                            {/* VYPER STORES */}
                            {VYPER_STORES.map((s, i) => (
                                <div key={i}>
                                    <Marker position={s.coords}>
                                        <Popup><b>{s.name}</b><br />Sede Central Vyper</Popup>
                                    </Marker>
                                    <LCircle center={s.coords} radius={2500} pathOptions={{ color: 'black', fillColor: 'black', fillOpacity: 0.1 }} />
                                </div>
                            ))}

                            {/* COMPETITORS */}
                            {COMPETITORS.map((c) => (
                                <div key={c.id}>
                                    <Marker position={c.coords}>
                                        <Popup><b>{c.name}</b><br />{c.address}</Popup>
                                    </Marker>
                                    <LCircle center={c.coords} radius={2000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }} />
                                </div>
                            ))}
                        </MapContainer>
                    )}
                </div>
            </div>

            <div className="grid-layout" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>

                {/* COMPETITOR GRID & ADS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Facebook size={20} /> AUDITORÍA DE ANUNCIOS & MEDIOS
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Control en tiempo real de la actividad publicitaria y canales de difusión de tus competidores.
                    </p>
                    <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        {COMPETITORS.map(c => (
                            <div key={c.id} className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem' }}>{c.name}</h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.address}</p>
                                    </div>
                                    <span style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '50px',
                                        fontSize: '0.65rem',
                                        fontWeight: '700',
                                        background: c.ads === 'ACTIVOS' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: c.ads === 'ACTIVOS' ? '#4ade80' : '#f87171',
                                        border: `1px solid ${c.ads === 'ACTIVOS' ? '#4ade80' : '#f87171'}33`
                                    }}>
                                        ADS: {c.ads}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ opacity: c.media.social ? 1 : 0.2 }} title="Social Media"><Smartphone size={16} /></div>
                                    <div style={{ opacity: c.media.tv ? 1 : 0.2 }} title="TV / Audiovisual"><Tv size={16} /></div>
                                    <div style={{ opacity: c.media.radio ? 1 : 0.2 }} title="Radio"><Radio size={16} /></div>
                                    <div style={{ opacity: c.media.events ? 1 : 0.2 }} title="Eventos Sport"><Trophy size={16} /></div>
                                </div>

                                <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    <p style={{ color: '#4ade80', marginBottom: '0.2rem' }}><b>+</b> {c.strength}</p>
                                    <p style={{ color: '#f87171' }}><b>-</b> {c.weakness}</p>
                                </div>

                                <a href={c.adLink} target="_blank" rel="noopener noreferrer">
                                    <button className="secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem' }}>
                                        BIBLIOTECA DE ANUNCIOS <ExternalLink size={14} />
                                    </button>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* OPPORTUNITIES & INSIGHTS */}
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <TrendingUp size={20} /> DETECCIÓN DE OPORTUNIDADES
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Hallazgos estratégicos listos para ejecutar basados en las debilidades detectadas en la competencia local.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {opportunities.map((o, idx) => (
                            <div key={idx} className="glass-card" style={{ borderLeft: '4px solid white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>{o.type.toUpperCase()}</span>
                                    {o.type === 'Estratégica' ? <AlertCircle size={14} color="#facc15" /> : <CheckCircle2 size={14} color="#4ade80" />}
                                </div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{o.title}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>{o.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(0,0,0,0))' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#06b6d4' }}>
                            <TrendingUp size={16} /> INSIGHT DE MERCADO
                        </h4>
                        <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                            El mercado de San Juan está fragmentado. La competencia en Rawson es agresiva en medios tradicionales (Radio/TV), mientras que en Rivadavia la batalla es puramente Digital/Precios.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
