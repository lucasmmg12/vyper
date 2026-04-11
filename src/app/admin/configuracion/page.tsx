'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CheckCircle, Loader2 } from 'lucide-react';

interface Config {
  clave: string;
  valor: {
    activo: boolean;
    mensajes: string[];
  };
}

export default function ConfiguracionAdminPage() {
  const [configMinorista, setConfigMinorista] = useState<Config | null>(null);
  const [configMayorista, setConfigMayorista] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const resMinorista = await fetch('/api/ecommerce/configuraciones?clave=marquesina_minorista');
      const minData = await resMinorista.json();
      if (minData?.clave) setConfigMinorista(minData);

      const resMayorista = await fetch('/api/ecommerce/configuraciones?clave=marquesina_mayorista');
      const mayData = await resMayorista.json();
      if (mayData?.clave) setConfigMayorista(mayData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!configMinorista || !configMayorista) return;
    
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/ecommerce/configuraciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: 'marquesina_minorista', valor: configMinorista.valor })
      });

      await fetch('/api/ecommerce/configuraciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: 'marquesina_mayorista', valor: configMayorista.valor })
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error guardando configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const updateMensaje = (configId: 'marquesina_minorista' | 'marquesina_mayorista', index: number, value: string) => {
    const isMin = configId === 'marquesina_minorista';
    const config = isMin ? configMinorista : configMayorista;
    if (!config) return;

    const newMsgs = [...config.valor.mensajes];
    newMsgs[index] = value;

    if (isMin) {
      setConfigMinorista({ ...config, valor: { ...config.valor, mensajes: newMsgs } });
    } else {
      setConfigMayorista({ ...config, valor: { ...config.valor, mensajes: newMsgs } });
    }
  };

  const addMensaje = (configId: 'marquesina_minorista' | 'marquesina_mayorista') => {
    const isMin = configId === 'marquesina_minorista';
    const config = isMin ? configMinorista : configMayorista;
    if (!config) return;

    if (isMin) {
      setConfigMinorista({ ...config, valor: { ...config.valor, mensajes: [...config.valor.mensajes, 'Nuevo mensaje'] } });
    } else {
      setConfigMayorista({ ...config, valor: { ...config.valor, mensajes: [...config.valor.mensajes, 'Nuevo mensaje'] } });
    }
  };

  const removeMensaje = (configId: 'marquesina_minorista' | 'marquesina_mayorista', index: number) => {
    const isMin = configId === 'marquesina_minorista';
    const config = isMin ? configMinorista : configMayorista;
    if (!config) return;

    const newMsgs = config.valor.mensajes.filter((_, i) => i !== index);

    if (isMin) {
      setConfigMinorista({ ...config, valor: { ...config.valor, mensajes: newMsgs } });
    } else {
      setConfigMayorista({ ...config, valor: { ...config.valor, mensajes: newMsgs } });
    }
  };

  const toggleActive = (configId: 'marquesina_minorista' | 'marquesina_mayorista') => {
    const isMin = configId === 'marquesina_minorista';
    const config = isMin ? configMinorista : configMayorista;
    if (!config) return;

    if (isMin) {
      setConfigMinorista({ ...config, valor: { ...config.valor, activo: !config.valor.activo } });
    } else {
      setConfigMayorista({ ...config, valor: { ...config.valor, activo: !config.valor.activo } });
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, padding: '2rem 3rem' }}>
        <div style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>Cargando configuraciones...</div>
      </div>
    );
  }

  // Si no existen, es porque no corrieron la migración
  if (!configMinorista || !configMayorista) {
    return (
      <div style={{ flex: 1, padding: '2rem 3rem' }}>
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--accent-red-light)', color: 'var(--accent-red)', borderRadius: 12 }}>
          ⚠️ No se encontraron las configuraciones iniciales. Por favor, ejecutá la migración SQL 008 en Supabase.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '2rem 3rem' }}>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem' }}>
        {/* Marquesina Minorista */}
        <div className="glass-card" style={{ flex: 1, padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Marquesina Minorista</h2>
            <button 
              className={`btn-ghost ${configMinorista.valor.activo ? 'active' : ''}`}
              onClick={() => toggleActive('marquesina_minorista')}
              style={{ padding: '0.5rem 1rem', background: configMinorista.valor.activo ? 'var(--accent-green-light)' : 'var(--bg-tertiary)', color: configMinorista.valor.activo ? 'var(--accent-green)' : 'var(--text-light)' }}
            >
              {configMinorista.valor.activo ? 'Activada' : 'Desactivada'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {configMinorista.valor.mensajes.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  value={msg}
                  onChange={(e) => updateMensaje('marquesina_minorista', i, e.target.value)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                />
                <button 
                  className="btn-ghost" 
                  onClick={() => removeMensaje('marquesina_minorista', i)}
                  style={{ color: 'var(--accent-red)', padding: '0.75rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <button 
            className="btn-ghost" 
            onClick={() => addMensaje('marquesina_minorista')}
            style={{ marginTop: '1rem', width: '100%', fontSize: '0.875rem' }}
          >
            <Plus size={16} /> Agregar Mensaje
          </button>
        </div>

        {/* Marquesina Mayorista */}
        <div className="glass-card" style={{ flex: 1, padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Marquesina Mayorista</h2>
            <button 
              className={`btn-ghost ${configMayorista.valor.activo ? 'active' : ''}`}
              onClick={() => toggleActive('marquesina_mayorista')}
              style={{ padding: '0.5rem 1rem', background: configMayorista.valor.activo ? 'var(--accent-green-light)' : 'var(--bg-tertiary)', color: configMayorista.valor.activo ? 'var(--accent-green)' : 'var(--text-light)' }}
            >
              {configMayorista.valor.activo ? 'Activada' : 'Desactivada'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {configMayorista.valor.mensajes.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  value={msg}
                  onChange={(e) => updateMensaje('marquesina_mayorista', i, e.target.value)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                />
                <button 
                  className="btn-ghost" 
                  onClick={() => removeMensaje('marquesina_mayorista', i)}
                  style={{ color: 'var(--accent-red)', padding: '0.75rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button 
            className="btn-ghost" 
            onClick={() => addMensaje('marquesina_mayorista')}
            style={{ marginTop: '1rem', width: '100%', fontSize: '0.875rem' }}
          >
            <Plus size={16} /> Agregar Mensaje
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)', fontWeight: 600 }}>
            <CheckCircle size={16} /> Guardado localmente
          </div>
        )}
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', fontWeight: 600, background: 'var(--accent)', color: 'var(--bg-color)', borderRadius: 12, border: 'none', cursor: 'pointer' }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Cambios
        </button>
      </div>

      <style jsx>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
