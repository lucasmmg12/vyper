'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_TEMPLATE_MAPPING,
  WhatsAppTemplateMapping,
} from '@/lib/builderbot';

interface Config {
  clave: string;
  valor: {
    activo: boolean;
    mensajes: string[];
  };
}

interface MetaTemplate {
  id?: string;
  name: string;
  language?: string;
  status?: string;
  category?: string;
  components?: {
    type: string;
    text?: string;
  }[];
}

const META_TEMPLATES_CATALOG = [
  {
    key: 'universal',
    recommendedName: 'vyper_notificacion_general',
    title: '⭐ Plantilla Universal (1 sola plantilla para todo el sistema)',
    category: 'UTILITY (Utilidad)',
    varsCount: 4,
    body: `👋 Hola *{{1}}*, te enviamos una actualización de *Vyper Suplementos*:

📌 *Motivo:* {{2}}
📊 *Detalle:* {{3}}

💡 {{4}}

────────────────────
🤖 Automatización creada por *Grow Labs*.`,
    examples: [
      '{{1}}: Lucas',
      '{{2}}: Compra registrada por $45.000',
      '{{3}}: Sumaste puntos y ya tenés 120 Vyper Coins acumuladas (Nivel Plata).',
      '{{4}}: Te faltan 30 coins para subir a Oro. ¡Gracias por tu compra!',
    ],
  },
  {
    key: 'compra_coins',
    recommendedName: 'vyper_compra_coins',
    title: '1. Compra y Suma de Vyper Coins',
    category: 'UTILITY (Utilidad)',
    varsCount: 5,
    body: `👋 Hola, *{{1}}*
Has realizado una compra por *{{2}}* 💸
¡Ya tenés *{{3}} Vyper Coins*! 🪙

🏅 Tu nivel: *{{4}}*
🎯 {{5}}

👉 Cuanto más comprás, más recompensas acumulás 🔥

────────────────────
🤖 Automatización creada por *Grow Labs*.`,
    examples: [
      '{{1}}: Juan Pérez',
      '{{2}}: $35.000',
      '{{3}}: 120',
      '{{4}}: Plata',
      '{{5}}: Te faltan 30 coins para subir a Oro',
    ],
  },
  {
    key: 'ctacte_cargo',
    recommendedName: 'vyper_ctacte_cargo',
    title: '2. Cuenta Corriente — Nueva Compra a Crédito',
    category: 'UTILITY (Utilidad)',
    varsCount: 3,
    body: `🛒 Hola, *{{1}}*
Has realizado una compra en *Cuenta Corriente* por *{{2}}* 💳

📊 Tu nuevo saldo es: *{{3}}*

💡 Recordá que podés abonar tu cuenta en cualquier momento en nuestras sucursales o mediante transferencia 💰

────────────────────
🤖 Automatización creada por *Grow Labs*.`,
    examples: ['{{1}}: Martín Gómez', '{{2}}: $50.000', '{{3}}: $85.000'],
  },
  {
    key: 'ctacte_pago',
    recommendedName: 'vyper_ctacte_pago',
    title: '3. Cuenta Corriente — Pago Registrado',
    category: 'UTILITY (Utilidad)',
    varsCount: 4,
    body: `✅ Hola, *{{1}}*
¡Gracias por tu pago de *{{2}}*! 💚

📊 Tu nuevo saldo es: *{{3}}*

✨ {{4}}

────────────────────
🤖 Automatización creada por *Grow Labs*.`,
    examples: [
      '{{1}}: Martín Gómez',
      '{{2}}: $50.000',
      '{{3}}: $0',
      '{{4}}: ¡Felicitaciones! Tu cuenta está al día',
    ],
  },
  {
    key: 'estado_pedido',
    recommendedName: 'vyper_estado_pedido',
    title: '4. Actualización de Estado de Pedido Web',
    category: 'UTILITY (Utilidad)',
    varsCount: 6,
    body: `📦 *Actualización de tu Pedido #{{1}}*

👋 Hola *{{2}}*, te informamos que tu pedido por *{{3}}* se encuentra en estado: *{{4}}*.

💬 {{5}}

🔗 Seguí tu pedido en vivo acá: {{6}}

────────────────────
🤖 *Vyper Suplementos* · Grow Labs`,
    examples: [
      '{{1}}: 0045',
      '{{2}}: Federico',
      '{{3}}: $120.000',
      '{{4}}: LISTO PARA RETIRO / ENTREGA',
      '{{5}}: Tu pedido ya fue completado y está listo para retirar.',
      '{{6}}: https://vyper.com/pedido/1234',
    ],
  },
  {
    key: 'recordatorio_saldo',
    recommendedName: 'vyper_recordatorio_saldo',
    title: '5. Recordatorio de Saldo Pendiente (Cta. Corriente)',
    category: 'UTILITY (Utilidad)',
    varsCount: 2,
    body: `👋 Hola *{{1}}*, ¿cómo estás?

Te escribimos de *Vyper Suplementos* para recordarte amablemente que tu cuenta corriente registra un saldo pendiente de *{{2}}* 💳

💡 Podés abonar por transferencia o acercándote a nuestras sucursales cuando gustes. Si ya realizaste el pago, por favor desestimá este mensaje 🙏

¡Muchas gracias por tu confianza de siempre! 🦾

────────────────────
🤖 Automatización creada por *Grow Labs*.`,
    examples: ['{{1}}: Carlos Ruiz', '{{2}}: $42.500'],
  },
  {
    key: 'resumen_diario',
    recommendedName: 'vyper_resumen_diario',
    title: '6. Resumen Financiero Diario (Al Dueño)',
    category: 'UTILITY (Utilidad)',
    varsCount: 11,
    body: `📋 *RESUMEN DEL DÍA — VYPER*
📅 Fecha: *{{1}}*

━━━━━━━━━━━━━━━━━━━━
💰 Ventas: *{{2}}* ({{3}} ops)
💸 Egresos: *{{4}}* ({{5}} ops)
📈 Ganancia Neta: *{{6}}*
🎫 Ticket Promedio: *{{7}}*
📊 Comparativa semanal: {{8}}

🏪 Sucursales: {{9}}
💳 Cta. Corriente hoy: {{10}}
🚨 Alertas: {{11}}

────────────────────
🤖 Automatización creada por *Grow Labs*.`,
    examples: [
      '{{1}}: Lunes 16 de Noviembre',
      '{{2}}: $850.000',
      '{{3}}: 18',
      '{{4}}: $120.000',
      '{{5}}: 3',
      '{{6}}: $730.000',
      '{{7}}: $47.222',
      '{{8}}: +14.5% vs semana pasada',
      '{{9}}: Rivadavia $550.000 | Rawson $300.000',
      '{{10}}: Cargos $40.000 | Cobros $65.000',
      '{{11}}: Sin alertas críticas hoy',
    ],
  },
];

export default function ConfiguracionAdminPage() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'marquesinas'>('whatsapp');

  // Meta Templates state
  const [metaTemplates, setMetaTemplates] = useState<MetaTemplate[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<WhatsAppTemplateMapping>(DEFAULT_TEMPLATE_MAPPING);
  const [savingMapping, setSavingMapping] = useState(false);
  const [savedMapping, setSavedMapping] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Test Sender state
  const [testTo, setTestTo] = useState('5492646796509');
  const [testTemplateName, setTestTemplateName] = useState('vyper_notificacion_general');
  const [testLang, setTestLang] = useState('es_AR');
  const [testParams, setTestParams] = useState('Juan, Compra registrada por $35.000, Sumaste 35 Vyper Coins en tu cuenta, ¡Gracias por elegir Vyper Suplementos!');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Marquesinas state
  const [configMinorista, setConfigMinorista] = useState<Config | null>(null);
  const [configMayorista, setConfigMayorista] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMetaTemplates();
    fetchConfig();
  }, []);

  const fetchMetaTemplates = async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const res = await fetch('/api/whatsapp-templates?limit=50');
      const data = await res.json();
      if (data.mapping) {
        setMapping(data.mapping);
        setTestTemplateName(
          data.mapping.modo === 'universal'
            ? data.mapping.universalTemplateName
            : data.mapping.templates?.compra_coins || 'hello_world'
        );
        setTestLang(data.mapping.languageCode || 'es');
      }
      if (data.success) {
        setMetaTemplates(data.templates || []);
      } else {
        setMetaError(data.error || 'No se pudieron obtener las plantillas de Meta');
      }
    } catch (e: any) {
      setMetaError(e?.message || 'Error de conexión');
    } finally {
      setMetaLoading(false);
    }
  };

  const handleSaveMapping = async () => {
    setSavingMapping(true);
    setSavedMapping(false);
    try {
      const res = await fetch('/api/whatsapp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-mapping', mapping }),
      });
      if (!res.ok) throw new Error('Error guardando mapeo');
      setSavedMapping(true);
      setTimeout(() => setSavedMapping(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Error guardando la configuración de plantillas');
    } finally {
      setSavingMapping(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);
    try {
      const parameters = testParams
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/whatsapp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-test',
          to: testTo,
          templateName: testTemplateName,
          languageCode: testLang,
          parameters,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({ ok: true, msg: '✅ Plantilla enviada correctamente vía BuilderBot Meta API' });
      } else {
        setTestResult({
          ok: false,
          msg: `❌ Error al enviar: ${data.error || JSON.stringify(data.details || data)}`,
        });
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: `❌ Error: ${err?.message}` });
    } finally {
      setSendingTest(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
        body: JSON.stringify({ clave: 'marquesina_minorista', valor: configMinorista.valor }),
      });

      await fetch('/api/ecommerce/configuraciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: 'marquesina_mayorista', valor: configMayorista.valor }),
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

  const updateMensaje = (
    configId: 'marquesina_minorista' | 'marquesina_mayorista',
    index: number,
    value: string
  ) => {
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
      setConfigMinorista({
        ...config,
        valor: { ...config.valor, mensajes: [...config.valor.mensajes, 'Nuevo mensaje'] },
      });
    } else {
      setConfigMayorista({
        ...config,
        valor: { ...config.valor, mensajes: [...config.valor.mensajes, 'Nuevo mensaje'] },
      });
    }
  };

  const removeMensaje = (
    configId: 'marquesina_minorista' | 'marquesina_mayorista',
    index: number
  ) => {
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
      setConfigMinorista({
        ...config,
        valor: { ...config.valor, activo: !config.valor.activo },
      });
    } else {
      setConfigMayorista({
        ...config,
        valor: { ...config.valor, activo: !config.valor.activo },
      });
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1120 }}>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>
          Configuración del Sistema
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Plantillas de WhatsApp Business (Meta API vía BuilderBot) y Marquesinas de Tienda
        </p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        <button
          onClick={() => setActiveTab('whatsapp')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: '0.85rem',
            background: activeTab === 'whatsapp' ? '#111111' : '#FFFFFF',
            color: activeTab === 'whatsapp' ? '#FFFFFF' : '#111111',
            border: '1px solid #111111',
            cursor: 'pointer',
          }}
        >
          📲 Plantillas WhatsApp Meta API
        </button>
        <button
          onClick={() => setActiveTab('marquesinas')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: '0.85rem',
            background: activeTab === 'marquesinas' ? '#111111' : '#FFFFFF',
            color: activeTab === 'marquesinas' ? '#FFFFFF' : '#111111',
            border: '1px solid #111111',
            cursor: 'pointer',
          }}
        >
          📢 Marquesinas de Tienda
        </button>
      </div>

      {activeTab === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. Estado de Plantillas en Meta (GET /whatsapp-template) */}
          <div className="glass-card" style={{ border: '2px solid #111111' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  1. Plantillas Aprobadas en tu Cuenta de Meta
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  Consultadas en vivo desde <code>GET /api/v2/&#123;id&#125;/whatsapp-template</code>
                </p>
              </div>
              <button
                onClick={fetchMetaTemplates}
                disabled={metaLoading}
                className="secondary"
                style={{ fontSize: '0.8125rem', borderColor: '#111111', color: '#111111' }}
              >
                <RefreshCw size={15} className={metaLoading ? 'animate-spin' : ''} /> Sincronizar con Meta
              </button>
            </div>

            {metaLoading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Consultando plantillas en BuilderBot / Meta...
              </div>
            ) : metaError ? (
              <div
                style={{
                  padding: '1rem',
                  background: '#FEF2F2',
                  border: '1px solid #EF4444',
                  borderRadius: 10,
                  color: '#991B1B',
                  fontSize: '0.85rem',
                }}
              >
                ⚠️ {metaError}
              </div>
            ) : metaTemplates.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  background: '#F8F9FA',
                  border: '1px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                }}
              >
                <strong>Conexión con Meta exitosa (200 OK)</strong>, pero aún no tenés plantillas aprobadas en esta cuenta (<code>data: []</code>).
                Copiá la <strong>Plantilla Universal</strong> de abajo y pegala en tu panel de Meta / BuilderBot para empezar a enviar.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#111111', color: '#FFFFFF', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem 1rem' }}>Nombre (templateName)</th>
                      <th style={{ padding: '0.65rem 1rem' }}>Idioma</th>
                      <th style={{ padding: '0.65rem 1rem' }}>Categoría</th>
                      <th style={{ padding: '0.65rem 1rem' }}>Estado</th>
                      <th style={{ padding: '0.65rem 1rem' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaTemplates.map((tpl, idx) => (
                      <tr key={tpl.id || idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>
                          <code>{tpl.name}</code>
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>{tpl.language || 'es'}</td>
                        <td style={{ padding: '0.65rem 1rem' }}>{tpl.category || 'UTILITY'}</td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>
                          {tpl.status || 'APPROVED'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <button
                            onClick={() => {
                              setTestTemplateName(tpl.name);
                              if (tpl.language) setTestLang(tpl.language);
                              setMapping(prev => ({
                                ...prev,
                                universalTemplateName: tpl.name,
                                languageCode: tpl.language || prev.languageCode,
                              }));
                            }}
                            className="secondary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', minHeight: 'auto' }}
                          >
                            Usar como Universal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Mapeo de Plantillas del Sistema */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              2. Modo de Envío y Mapeo de Nombres de Plantilla
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Elegí si querés usar <strong>1 sola plantilla universal</strong> para todas las notificaciones (más rápido de aprobar en Meta) o <strong>plantillas individuales por módulo</strong>.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setMapping(prev => ({ ...prev, modo: 'universal' }))}
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: '1rem',
                  borderRadius: 10,
                  textAlign: 'left',
                  background: mapping.modo === 'universal' ? '#111111' : '#F8F9FA',
                  color: mapping.modo === 'universal' ? '#FFFFFF' : '#111111',
                  border: '2px solid #111111',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  ⭐ Modo Plantilla Única Universal (Recomendado)
                </div>
                <div style={{ fontSize: '0.775rem', opacity: 0.85 }}>
                  Todos los avisos del sistema usan 1 sola plantilla aprobada en Meta con 4 variables dinámicas.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMapping(prev => ({ ...prev, modo: 'especifico' }))}
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: '1rem',
                  borderRadius: 10,
                  textAlign: 'left',
                  background: mapping.modo === 'especifico' ? '#111111' : '#F8F9FA',
                  color: mapping.modo === 'especifico' ? '#FFFFFF' : '#111111',
                  border: '2px solid #111111',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  🗂️ Modo Plantillas Específicas por Evento
                </div>
                <div style={{ fontSize: '0.775rem', opacity: 0.85 }}>
                  Cada evento (Coins, Cuenta Corriente, Pedidos, Resumen Diario) llama a su propia plantilla.
                </div>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Código de Idioma en Meta (<code>languageCode</code>)
                </label>
                <input
                  value={mapping.languageCode}
                  onChange={e => setMapping(prev => ({ ...prev, languageCode: e.target.value }))}
                  placeholder="es o es_AR"
                />
              </div>

              {mapping.modo === 'universal' ? (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Nombre de la Plantilla Universal (<code>templateName</code>)
                  </label>
                  <input
                    value={mapping.universalTemplateName}
                    onChange={e =>
                      setMapping(prev => ({ ...prev, universalTemplateName: e.target.value }))
                    }
                    placeholder="vyper_notificacion_general"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Compra + Vyper Coins</label>
                    <input
                      value={mapping.templates.compra_coins}
                      onChange={e =>
                        setMapping(prev => ({
                          ...prev,
                          templates: { ...prev.templates, compra_coins: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Cta. Corriente — Cargo</label>
                    <input
                      value={mapping.templates.ctacte_cargo}
                      onChange={e =>
                        setMapping(prev => ({
                          ...prev,
                          templates: { ...prev.templates, ctacte_cargo: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Cta. Corriente — Pago</label>
                    <input
                      value={mapping.templates.ctacte_pago}
                      onChange={e =>
                        setMapping(prev => ({
                          ...prev,
                          templates: { ...prev.templates, ctacte_pago: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Estado de Pedido Web</label>
                    <input
                      value={mapping.templates.estado_pedido}
                      onChange={e =>
                        setMapping(prev => ({
                          ...prev,
                          templates: { ...prev.templates, estado_pedido: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Recordatorio de Deuda</label>
                    <input
                      value={mapping.templates.recordatorio_saldo}
                      onChange={e =>
                        setMapping(prev => ({
                          ...prev,
                          templates: { ...prev.templates, recordatorio_saldo: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Resumen Diario (Dueño)</label>
                    <input
                      value={mapping.templates.resumen_diario}
                      onChange={e =>
                        setMapping(prev => ({
                          ...prev,
                          templates: { ...prev.templates, resumen_diario: e.target.value },
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
              {savedMapping && (
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111' }}>
                  ✓ Configuración de plantillas guardada
                </span>
              )}
              <button
                onClick={handleSaveMapping}
                disabled={savingMapping}
                style={{ background: '#111111', color: '#FFFFFF' }}
              >
                {savingMapping ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{' '}
                Guardar Mapeo de Plantillas
              </button>
            </div>
          </div>

          {/* 3. Textos Listos para Copiar y Pegar en Meta */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              3. Plantillas Listas para Copiar y Pegar en Meta Business Suite
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Copiá el nombre sugerido y el cuerpo con variables <code>&#123;&#123;1&#125;&#125;</code>, <code>&#123;&#123;2&#125;&#125;</code> para darlas de alta en Meta en categoría <strong>Utilidad (Utility)</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {META_TEMPLATES_CATALOG.map(tpl => (
                <div
                  key={tpl.key}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 12,
                    border: tpl.key === 'universal' ? '2px solid #111111' : '1px solid #E5E7EB',
                    background: tpl.key === 'universal' ? '#F8F9FA' : '#FFFFFF',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111111' }}>
                        {tpl.title}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        Nombre sugerido en Meta: <code>{tpl.recommendedName}</code> · Categoría:{' '}
                        <strong>{tpl.category}</strong> · Variables: <strong>{tpl.varsCount}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tpl.key, tpl.body)}
                      className="secondary"
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.775rem',
                        minHeight: 'auto',
                        borderColor: '#111111',
                        color: '#111111',
                      }}
                    >
                      {copiedKey === tpl.key ? (
                        <>
                          <Check size={14} /> ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copiar Cuerpo para Meta
                        </>
                      )}
                    </button>
                  </div>

                  <pre
                    style={{
                      background: '#111111',
                      color: '#FFFFFF',
                      padding: '1rem',
                      borderRadius: 8,
                      fontSize: '0.8125rem',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {tpl.body}
                  </pre>

                  <div style={{ fontSize: '0.775rem', color: '#374151' }}>
                    <strong>Ejemplos de variables (para pegar en Meta al crearla):</strong>{' '}
                    {tpl.examples.join('  |  ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Probador en Vivo de Envío de Plantilla (POST /whatsapp-template) */}
          <div className="glass-card" style={{ border: '1px solid #111111' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              4. Probar Envío de Plantilla en Vivo (<code>POST /whatsapp-template</code>)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Una vez que tengas una plantilla aprobada en Meta, probá el envío real desde acá.
            </p>

            <form onSubmit={handleSendTest}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Teléfono destino (sin +)</label>
                  <input
                    value={testTo}
                    onChange={e => setTestTo(e.target.value)}
                    placeholder="5492646796509"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Nombre de Plantilla (templateName)</label>
                  <input
                    value={testTemplateName}
                    onChange={e => setTestTemplateName(e.target.value)}
                    placeholder="vyper_notificacion_general"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Idioma (languageCode)</label>
                  <input
                    value={testLang}
                    onChange={e => setTestLang(e.target.value)}
                    placeholder="es"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Parámetros del Body separados por coma (<code>&#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;, ...</code> — dejá vacío si la plantilla no lleva variables)
                </label>
                <input
                  value={testParams}
                  onChange={e => setTestParams(e.target.value)}
                  placeholder="Juan, Compra por $35.000, Sumaste 35 Vyper Coins, ¡Gracias!"
                />
              </div>

              {testResult && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 8,
                    marginBottom: '1rem',
                    background: testResult.ok ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${testResult.ok ? '#10B981' : '#EF4444'}`,
                    color: testResult.ok ? '#065F46' : '#991B1B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {testResult.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingTest}
                style={{ background: '#111111', color: '#FFFFFF' }}
              >
                {sendingTest ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{' '}
                Enviar Plantilla de Prueba
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'marquesinas' && (
        <div>
          {loading ? (
            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
              Cargando configuraciones...
            </div>
          ) : !configMinorista || !configMayorista ? (
            <div
              style={{
                padding: '1rem',
                background: 'var(--accent-red-light)',
                color: 'var(--accent-red)',
                borderRadius: 12,
              }}
            >
              ⚠️ No se encontraron las configuraciones iniciales de marquesina.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Marquesina Minorista */}
                <div className="glass-card" style={{ flex: 1, minWidth: 300, padding: '1.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Marquesina Minorista</h2>
                    <button
                      className={`btn-ghost ${configMinorista.valor.activo ? 'active' : ''}`}
                      onClick={() => toggleActive('marquesina_minorista')}
                      style={{
                        padding: '0.45rem 0.9rem',
                        background: configMinorista.valor.activo ? '#111111' : 'var(--bg-tertiary)',
                        color: configMinorista.valor.activo ? '#FFFFFF' : 'var(--text-light)',
                      }}
                    >
                      {configMinorista.valor.activo ? 'Activada' : 'Desactivada'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {configMinorista.valor.mensajes.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          value={msg}
                          onChange={e => updateMensaje('marquesina_minorista', i, e.target.value)}
                          style={{ marginBottom: 0 }}
                        />
                        <button
                          className="btn-ghost"
                          onClick={() => removeMensaje('marquesina_minorista', i)}
                          style={{ color: 'var(--accent-red)', padding: '0.65rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn-ghost"
                    onClick={() => addMensaje('marquesina_minorista')}
                    style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem' }}
                  >
                    <Plus size={16} /> Agregar Mensaje
                  </button>
                </div>

                {/* Marquesina Mayorista */}
                <div className="glass-card" style={{ flex: 1, minWidth: 300, padding: '1.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Marquesina Mayorista</h2>
                    <button
                      className={`btn-ghost ${configMayorista.valor.activo ? 'active' : ''}`}
                      onClick={() => toggleActive('marquesina_mayorista')}
                      style={{
                        padding: '0.45rem 0.9rem',
                        background: configMayorista.valor.activo ? '#111111' : 'var(--bg-tertiary)',
                        color: configMayorista.valor.activo ? '#FFFFFF' : 'var(--text-light)',
                      }}
                    >
                      {configMayorista.valor.activo ? 'Activada' : 'Desactivada'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {configMayorista.valor.mensajes.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          value={msg}
                          onChange={e => updateMensaje('marquesina_mayorista', i, e.target.value)}
                          style={{ marginBottom: 0 }}
                        />
                        <button
                          className="btn-ghost"
                          onClick={() => removeMensaje('marquesina_mayorista', i)}
                          style={{ color: 'var(--accent-red)', padding: '0.65rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn-ghost"
                    onClick={() => addMensaje('marquesina_mayorista')}
                    style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem' }}
                  >
                    <Plus size={16} /> Agregar Mensaje
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                }}
              >
                {saved && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#111111',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle size={16} /> Guardado
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ background: '#111111', color: '#FFFFFF' }}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{' '}
                  Guardar Cambios
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
