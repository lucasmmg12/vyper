
'use client';

import { Instagram, Linkedin, MessageCircle, Globe } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            padding: '3rem 1rem'
        }}>
            <div className="page-container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    alignItems: 'start'
                }}>

                    {/* Client Info */}
                    <div style={{
                        padding: '1.5rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)',
                        borderLeft: '4px solid #ffffff'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>Plataforma Exclusiva</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                            Esta plataforma ha sido desarrollada única y exclusivamente para
                            <span style={{ color: 'white', fontWeight: 'bold' }}> VYPER SUPLEMENTOS</span> y la gestión de sus sucursales.
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                            Optimización de rendimiento y gestión financiera.
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <img
                                src="/logogrow.png"
                                alt="Grow Labs"
                                style={{ height: '48px', width: '48px', objectFit: 'contain' }}
                            />
                            <div>
                                <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Grow Labs</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Technology & Performance</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <a
                                href="https://www.instagram.com/growsanjuan/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                }}
                            >
                                <Instagram size={18} />
                                Instagram
                            </a>

                            <a
                                href="https://www.linkedin.com/in/lucas-marinero-182521308/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: '#0077b5',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                }}
                            >
                                <Linkedin size={18} />
                                LinkedIn
                            </a>

                            <a
                                href="https://api.whatsapp.com/send/?phone=5492643229503&text&type=phone_number&app_absent=0"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: '#25D366',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                }}
                            >
                                <MessageCircle size={18} />
                                WhatsApp
                            </a>

                            <a
                                href="https://www.growlabs.lat"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: '#333',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    border: '1px solid #555'
                                }}
                            >
                                <Globe size={18} />
                                Sitio Web
                            </a>
                        </div>
                    </div>

                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                        © 2025 Grow Labs - Tecnología, IA & Automatización
                    </p>
                </div>
            </div>
        </footer>
    );
}
