
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

type ImportType = 'SALES' | 'EXPENSES' | 'CLIENTS';

interface ExcelImporterProps {
    type: ImportType;
    onSuccess: () => void;
}

export default function ExcelImporter({ type, onSuccess }: ExcelImporterProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setSuccessCount(null);

        try {
            const data = await parseExcel(file);
            await uploadData(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al procesar el archivo');
        } finally {
            setLoading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const parseExcel = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const ab = e.target?.result;
                    const wb = XLSX.read(ab, { type: 'array', cellDates: true });
                    const sheetName = wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };

    const uploadData = async (data: any[]) => {
        let endpoint = '/api/sales';
        if (type === 'EXPENSES') endpoint = '/api/expenses';
        if (type === 'CLIENTS') endpoint = '/api/clients';

        // Normalize data structure based on type
        const normalizedData = data.map((row: any) => {
            // Helper to find key case-insensitively
            const get = (key: string) => row[Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase()) || ''];

            if (type === 'SALES') {
                return {
                    id_ingreso: get('IDingreso'),
                    date: get('Fecha'),
                    observations: get('Observaciones'),
                    amount: get('Importe'),
                    branch: get('sucursal'),
                    month_number: get('mes nro')
                };
            } else if (type === 'EXPENSES') {
                return {
                    id_egreso: get('IDEgreso'),
                    date: get('Fecha'),
                    category: get('Categoria'),
                    amount: get('Importe'),
                    observations: get('Observaciones'),
                    branch: get('Sucursal')
                };
            } else {
                // CLIENTS
                return {
                    ClienteID: get('ClienteID'),
                    Nombre: get('Nombre'),
                    'Fecha de Ultima carga': get('Fecha de Ultima carga'),
                    Observaciones: get('Observaciones'),
                    Telefono: get('Telefono'),
                    UsuarioContraseña: get('UsuarioContraseña'),
                    UsuarioVer: get('UsuarioVer'),
                    UsuarioFoto: get('UsuarioFoto'),
                    UsuarioPerfil: get('UsuarioPerfil'),
                    UsuarioStatus: get('UsuarioStatus'),
                    'Cantidad de Monedas': get('Cantidad de Monedas'),
                    Imagen: get('Imagen')
                };
            }
        });

        // Check for essential data
        if (normalizedData.length === 0) throw new Error("El archivo parece estar vacío");

        // Send in batches of 100 to avoid payload limits if necessary, or just one big go for now
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedData)
        });

        if (!response.ok) {
            const res = await response.json();
            throw new Error(res.error || 'Error al subir datos al servidor');
        }

        const result = await response.json();
        setSuccessCount(result.count);
        onSuccess();
    };

    const getTypeLabel = () => {
        if (type === 'SALES') return 'VENTAS';
        if (type === 'EXPENSES') return 'EGRESOS';
        return 'CLIENTES';
    };

    const getFormatHint = () => {
        if (type === 'SALES') return 'IDingreso, Fecha, Sucursal, Importe...';
        if (type === 'EXPENSES') return 'IDEgreso, Fecha, Categoria...';
        return 'ClienteID, Nombre, Telefono, Observaciones...';
    };

    return (
        <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'center', borderStyle: 'dashed' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>IMPORTACIÓN MASIVA ({getTypeLabel()})</h3>

            <div style={{ position: 'relative', display: 'inline-block' }}>
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                    id={`file-upload-${type}`}
                    style={{
                        opacity: 0,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer'
                    }}
                />
                <label
                    htmlFor={`file-upload-${type}`}
                    style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        color: 'white'
                    }}
                >
                    {loading ? 'PROCESANDO...' : '📂 SELECCIONAR ARCHIVO EXCEL'}
                </label>
            </div>

            <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                Asegúrate de que las columnas coincidan con el formato solicitado ({getFormatHint()}).
            </p>

            {error && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,0,0,0.2)', borderRadius: '8px', color: '#ff6b6b' }}>
                    {error}
                </div>
            )}

            {successCount !== null && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,255,0,0.1)', borderRadius: '8px', color: '#4ade80' }}>
                    ¡Éxito! Se importaron {successCount} registros correctamente.
                </div>
            )}
        </div>
    );
}

