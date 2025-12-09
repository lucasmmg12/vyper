
'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDeleteModal({ title, message, onConfirm, onCancel }: ConfirmDeleteModalProps) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '450px',
                width: '100%',
                background: '#000',
                border: '2px solid #ef4444',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertTriangle size={28} color="#ef4444" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#ef4444' }}>{title}</h2>
                </div>

                <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    color: '#ccc',
                    marginBottom: '2rem'
                }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={onCancel}
                        className="secondary"
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        ELIMINAR
                    </button>
                </div>
            </div>
        </div>
    );
}
