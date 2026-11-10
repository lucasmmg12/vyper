'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Store, MessageCircle, MapPin, HelpCircle, Image as ImageIcon, Save, RotateCcw, Check,
  Loader2, Plus, Trash2, BookOpen, ChevronLeft, ChevronRight, X, Lightbulb, Sparkles,
  Send, AlertTriangle, Eye, EyeOff, History, Upload, ArrowUp, ArrowDown, Megaphone,
  Gift, Monitor, Smartphone, Palette, Clock
} from 'lucide-react';
import { STORE_DEFAULTS, StoreConfigKey, invalidateStoreConfigCache, BannerItem } from '@/hooks/useStoreConfig';

type TabKey =
  | 'identidad'
  | 'hero_mayorista'
  | 'hero_minorista'
  | 'banners_mayorista'
  | 'banners_minorista'
  | 'marquesina_mayorista'
  | 'marquesina_minorista'
  | 'incentivos'
  | 'footer'
  | 'whatsapp'
  | 'faqs_mayorista'
  | 'faqs_minorista';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; configKey: StoreConfigKey }[] = [
  { key: 'identidad', label: 'Identidad', icon: <Store size={16} />, configKey: 'tienda_identidad' },
  { key: 'hero_mayorista', label: 'Hero Mayorista', icon: <ImageIcon size={16} />, configKey: 'tienda_hero_mayorista' },
  { key: 'hero_minorista', label: 'Hero Minorista', icon: <ImageIcon size={16} />, configKey: 'tienda_hero_minorista' },
  { key: 'banners_mayorista', label: 'Banners Mayorista', icon: <ImageIcon size={16} />, configKey: 'tienda_banners_mayorista' },
  { key: 'banners_minorista', label: 'Banners Minorista', icon: <ImageIcon size={16} />, configKey: 'tienda_banners_minorista' },
  { key: 'marquesina_mayorista', label: 'Marquesina Mayorista', icon: <Megaphone size={16} />, configKey: 'marquesina_mayorista' },
  { key: 'marquesina_minorista', label: 'Marquesina Minorista', icon: <Megaphone size={16} />, configKey: 'marquesina_minorista' },
  { key: 'incentivos', label: 'Incentivos y Envíos', icon: <Gift size={16} />, configKey: 'tienda_incentivos' },
  { key: 'footer', label: 'Footer', icon: <MapPin size={16} />, configKey: 'tienda_footer' },
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} />, configKey: 'tienda_whatsapp' },
  { key: 'faqs_mayorista', label: 'FAQs Mayorista', icon: <HelpCircle size={16} />, configKey: 'tienda_faqs_mayorista' },
  { key: 'faqs_minorista', label: 'FAQs Minorista', icon: <HelpCircle size={16} />, configKey: 'tienda_faqs_minorista' },
];

// ═══════════════════════════════════════════════════════════
// TUTORIAL GUIADO — Definición de pasos
// ═══════════════════════════════════════════════════════════
interface TutorialStep {
  title: string;
  content: string;
  tip?: string;
  navigateTo?: TabKey;
  highlightArea?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '¡Bienvenido al Editor de Tienda! 🎨',
    content: 'Este editor te permite personalizar completamente la apariencia de tu tienda mayorista y minorista. Podés usar la Vista Previa en Vivo para ver cada cambio antes de guardar.',
    tip: 'Siempre podés volver a versiones anteriores con el botón "🕒 Historial" o a los valores originales con "Predeterminado".',
  },
  {
    title: '🏪 Identidad y Colores de Marca',
    content: 'Definí el nombre de tu marca, logo, colores institucionales, horarios y redes sociales (Instagram, TikTok, Facebook, Email).',
    tip: 'Podés subir tu logo directamente arrastrando el archivo o pegando una URL.',
    navigateTo: 'identidad',
  },
  {
    title: '🖼️ Hero y Banners Promocionales',
    content: 'Personalizá el banner principal (Hero) y agregá carruseles de Banners Promocionales independientes para Mayorista y Minorista.',
    tip: 'Activá o desactivá banners individuales según tus promociones vigentes.',
    navigateTo: 'banners_mayorista',
  },
  {
    title: '📢 Marquesinas y 🎁 Incentivos',
    content: 'Configurá los mensajes animados de la barra superior (Marquesina) y las metas de envío gratis o descuento por volumen en el carrito.',
    navigateTo: 'incentivos',
  },
  {
    title: '✨ Asesor IA con Acciones Directas',
    content: 'Abrí el Asesor IA (botón dorado abajo a la derecha) y pedile que redacte títulos, mensajes de marquesina o preguntas frecuentes. ¡Podés aplicar sus sugerencias con 1 clic!',
  },
];

// ═══════════════════════════════════════════════════════════
// COMPONENTE TUTORIAL OVERLAY
// ═══════════════════════════════════════════════════════════
function TutorialOverlay({ step, total, currentStep, onNext, onPrev, onClose }: {
  step: TutorialStep;
  total: number;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const progress = ((currentStep + 1) / total) * 100;
  const isLast = currentStep === total - 1;
  const isFirst = currentStep === 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext, onPrev, onClose]);

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 9998, backdropFilter: 'blur(2px)',
      }} onClick={onClose} />

      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(520px, calc(100vw - 2rem))',
        background: '#ffffff',
        borderRadius: 16,
        border: '2px solid #111111',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        zIndex: 9999,
        overflow: 'hidden',
      }}>
        <div style={{ height: 4, background: '#e5e7eb' }}>
          <div style={{
            height: '100%', background: '#111111',
            width: `${progress}%`, transition: 'width 0.4s ease',
          }} />
        </div>

        <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#111111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontSize: '0.75rem', fontWeight: 800,
            }}>
              {currentStep + 1}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paso {currentStep + 1} de {total}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#111111', borderRadius: 6,
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.75rem 1.25rem 1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111111' }}>
            {step.title}
          </h3>
          <p
            style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.65, marginBottom: step.tip ? '0.75rem' : 0 }}
            dangerouslySetInnerHTML={{ __html: step.content }}
          />
          {step.tip && (
            <div style={{
              display: 'flex', gap: '0.625rem', padding: '0.75rem',
              background: '#f8f9fa', border: '1px solid #111111',
              borderRadius: 10, fontSize: '0.8125rem', color: '#111111', lineHeight: 1.5,
            }}>
              <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 2, color: '#111111' }} />
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        <div style={{
          padding: '0.75rem 1.25rem', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa',
        }}>
          <button
            onClick={onPrev}
            disabled={isFirst}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0.5rem 0.875rem', borderRadius: 8,
              background: '#ffffff', border: '1px solid #111111',
              color: isFirst ? '#9ca3af' : '#111111',
              borderColor: isFirst ? '#e5e7eb' : '#111111',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem', fontWeight: 700,
              minHeight: 'auto', boxShadow: 'none',
            }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          <span style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 600 }}>← → o ESC</span>

          <button
            onClick={onNext}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0.5rem 0.875rem', borderRadius: 8,
              background: '#111111',
              border: '1px solid #111111', color: '#ffffff',
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
              minHeight: 'auto', boxShadow: 'none',
            }}
          >
            {isLast ? 'Completar ✓' : 'Siguiente'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ASESOR VIRTUAL — Chat con IA y Acciones Directas (Opción 14)
// ═══════════════════════════════════════════════════════════
interface SuggestedChanges {
  tab?: string;
  fields: Record<string, any>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedChanges?: SuggestedChanges;
  applied?: boolean;
}

const QUICK_QUESTIONS = [
  '✨ Sugerime textos atractivos para esta sección',
  '🔥 Generá 4 mensajes para la marquesina con emojis',
  '❓ Creá 5 preguntas frecuentes persuasivas',
  '🎨 ¿Cómo cambio el logo y los colores?',
  '🎁 ¿Cómo funcionan los incentivos de envío gratis?',
];

function AsesorChat({
  isOpen,
  onClose,
  activeTab,
  currentConfig,
  onApplyChanges,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  currentConfig: Record<string, any>;
  onApplyChanges: (changes: SuggestedChanges) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! 👋 Soy tu Asesor IA del Editor de Tienda. Podés preguntarme cómo usar cualquier función o pedirme que redacte títulos, marquesinas, descripciones o FAQs para aplicarlos con 1 clic en el editor.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ecommerce/asesor-tienda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          activeTab,
          currentConfig,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '❌ Hubo un error al consultar. Intentá de nuevo en unos segundos.' },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            suggestedChanges: data.suggestedChanges,
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ No pude conectar con el asesor. Verificá tu conexión.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9990 }}
        onClick={onClose}
      />

      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: 'min(440px, 100vw)',
        height: 'min(640px, calc(100vh - 2rem))',
        background: '#fff',
        borderTopLeftRadius: 20,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        zIndex: 9991,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 20,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Asesor IA con Acciones Directas</div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.85 }}>
                Editando: {TABS.find(t => t.key === activeTab)?.label || activeTab}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 'auto', padding: 0, boxShadow: 'none',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '88%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                  : '#f3f4f6',
                color: msg.role === 'user' ? '#fff' : '#1f2937',
                fontSize: '0.875rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}

                {msg.suggestedChanges && msg.suggestedChanges.fields && (
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e7eb',
                  }}>
                    <button
                      onClick={() => {
                        onApplyChanges(msg.suggestedChanges!);
                        setMessages(prev =>
                          prev.map((m, idx) => (idx === i ? { ...m, applied: true } : m))
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 10,
                        border: 'none',
                        background: msg.applied
                          ? '#10b981'
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                        minHeight: 'auto',
                      }}
                    >
                      {msg.applied ? (
                        <>
                          <Check size={15} /> ¡Cambios aplicados en el editor!
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} /> ✨ Aplicar cambios sugeridos en el editor
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '14px 14px 14px 4px',
                background: '#f3f4f6', display: 'flex', gap: 6, alignItems: 'center',
                fontSize: '0.8125rem', color: '#6b7280',
              }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Pensando sugerencias...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 2 && !loading && (
          <div style={{
            padding: '0 1rem 0.5rem',
            display: 'flex', flexWrap: 'wrap', gap: '0.375rem',
          }}>
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: 100,
                  background: '#f3f4f6', border: '1px solid #e5e7eb',
                  fontSize: '0.75rem', color: '#4b5563', cursor: 'pointer',
                  fontWeight: 500, minHeight: 'auto', boxShadow: 'none',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '0.75rem 1rem', borderTop: '1px solid #f3f4f6',
          display: 'flex', gap: '0.5rem', flexShrink: 0, background: '#fafafa',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Pedime textos o hacé tu consulta..."
            disabled={loading}
            style={{
              flex: 1, padding: '0.625rem 0.875rem', borderRadius: 10,
              border: '1px solid #e5e7eb', fontSize: '0.875rem',
              outline: 'none', background: '#fff',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: loading || !input.trim() ? '#e5e7eb' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 'auto', padding: 0, boxShadow: 'none', flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// CAMPOS REUTILIZABLES DEL FORMULARIO
// ═══════════════════════════════════════════════════════════
function TextField({ label, value, onChange, placeholder, multiline, type = 'text' }: {
  label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; type?: string;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="color"
          value={value || '#111111'}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 44, height: 40, padding: 2, borderRadius: 8,
            border: '1px solid var(--border-color)', cursor: 'pointer', background: '#fff',
          }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#111111"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}

/**
 * Componente reutilizable de subida directa de imagen o URL (Opción 2)
 */
function ImageUploadField({ label, value, onChange, hint, onError }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; onError?: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (onError) onError('El archivo seleccionado debe ser una imagen');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('file', file);
      const res = await fetch('/api/ecommerce/upload', { method: 'POST', body: formData });
      const data = await res.json();
      const uploadedUrl = data.urls?.[0] || data.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
      } else if (onError) {
        onError(data.error || 'Error al subir la imagen');
      }
    } catch {
      if (onError) onError('Error de conexión al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: 8 }}>{hint}</p>}

      {/* URL Input + Upload Button */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Pegá una URL (ej: /logovyper.png o https://...) o subí un archivo"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="secondary"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 0.875rem', fontSize: '0.8125rem', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>
      </div>

      {/* Dropzone + Preview */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-color)'}`,
          borderRadius: 12,
          padding: '1rem',
          cursor: 'pointer',
          background: dragOver ? 'var(--accent-blue-light)' : 'var(--bg-secondary)',
          transition: 'all 0.2s',
          textAlign: 'center',
        }}
      >
        {value ? (
          <div>
            <img
              src={value}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, objectFit: 'contain', margin: '0 auto', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Arrastrá otra imagen acá o hacé clic para reemplazarla
            </p>
          </div>
        ) : (
          <div>
            <ImageIcon size={28} style={{ color: 'var(--text-light)', margin: '0 auto 0.375rem' }} />
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {uploading ? 'Optimizando y subiendo a WebP...' : 'Arrastrá una imagen acá o hacé clic para subir'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 2 }}>
              PNG, JPG o WebP · Conversión automática a WebP
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

function VideoField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>

      <div style={{ background: 'var(--accent-amber-light)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: 10 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: 4 }}>📺 ¿Cómo obtener la URL de embed?</p>
        <ol style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.8 }}>
          <li>Abrí tu video en <strong>YouTube</strong></li>
          <li>Hacé clic en <strong>Compartir → Insertar</strong></li>
          <li>Copiá la URL del <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 4, fontSize: '0.7rem' }}>src=&quot;...&quot;</code> (ej: <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 4, fontSize: '0.7rem' }}>https://www.youtube.com/embed/XXXXXXXXXXX</code>)</li>
        </ol>
      </div>

      <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://www.youtube.com/embed/tu-video-id" />

      {value && value.includes('youtube.com/embed') && (
        <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '16/9', maxHeight: 220 }}>
          <iframe src={value} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowFullScreen title="Preview" />
        </div>
      )}
    </div>
  );
}

function ToggleField({ label, value, onChange, description }: {
  label: string; value: boolean; onChange: (v: boolean) => void; description?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-light)', marginBottom: '0.75rem' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
        {description && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: value ? '#10b981' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
          minHeight: 'auto', padding: 0,
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute',
          top: 3, left: value ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE DE VISTA PREVIA EN VIVO (Opción 1)
// ═══════════════════════════════════════════════════════════
function LiveStorePreview({
  configs,
  previewStore,
  setPreviewStore,
  previewDevice,
  setPreviewDevice,
}: {
  configs: Record<string, any>;
  previewStore: 'mayorista' | 'minorista';
  setPreviewStore: (s: 'mayorista' | 'minorista') => void;
  previewDevice: 'desktop' | 'mobile';
  setPreviewDevice: (d: 'desktop' | 'mobile') => void;
}) {
  const identidad = configs.tienda_identidad || STORE_DEFAULTS.tienda_identidad;
  const hero = previewStore === 'mayorista'
    ? (configs.tienda_hero_mayorista || STORE_DEFAULTS.tienda_hero_mayorista)
    : (configs.tienda_hero_minorista || STORE_DEFAULTS.tienda_hero_minorista);
  const marquee = previewStore === 'mayorista'
    ? (configs.marquesina_mayorista || STORE_DEFAULTS.marquesina_mayorista)
    : (configs.marquesina_minorista || STORE_DEFAULTS.marquesina_minorista);
  const bannersCfg = previewStore === 'mayorista'
    ? (configs.tienda_banners_mayorista || STORE_DEFAULTS.tienda_banners_mayorista)
    : (configs.tienda_banners_minorista || STORE_DEFAULTS.tienda_banners_minorista);
  const incentivos = configs.tienda_incentivos || STORE_DEFAULTS.tienda_incentivos;
  const footer = configs.tienda_footer || STORE_DEFAULTS.tienda_footer;
  const whatsapp = configs.tienda_whatsapp || STORE_DEFAULTS.tienda_whatsapp;

  const activeBanners = (bannersCfg.banners || []).filter((b: BannerItem) => b.activo && b.imagen_url);
  const primaryColor = identidad.color_primario || '#111111';
  const accentColor = identidad.color_acento || '#10b981';
  const freeShippingGoal = previewStore === 'mayorista'
    ? Number(incentivos.envio_gratis_mayorista || 150000)
    : Number(incentivos.envio_gratis_minorista || 45000);

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '1rem' }}>
      {/* Preview Toolbar */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        background: '#f8fafc',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={16} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>Vista Previa en Vivo</span>
          <span style={{
            fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 99,
            background: '#dcfce7', color: '#15803d', fontWeight: 600,
          }}>
            Tiempo real
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {/* Mayorista / Minorista selector */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 8, padding: 2 }}>
            <button
              type="button"
              onClick={() => setPreviewStore('mayorista')}
              style={{
                padding: '0.25rem 0.625rem', borderRadius: 6, border: 'none',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                background: previewStore === 'mayorista' ? '#fff' : 'transparent',
                color: previewStore === 'mayorista' ? '#111' : '#64748b',
                minHeight: 'auto', boxShadow: 'none',
              }}
            >
              Mayorista
            </button>
            <button
              type="button"
              onClick={() => setPreviewStore('minorista')}
              style={{
                padding: '0.25rem 0.625rem', borderRadius: 6, border: 'none',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                background: previewStore === 'minorista' ? '#fff' : 'transparent',
                color: previewStore === 'minorista' ? '#111' : '#64748b',
                minHeight: 'auto', boxShadow: 'none',
              }}
            >
              Minorista
            </button>
          </div>

          {/* Desktop / Mobile toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 8, padding: 2 }}>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              title="Vista Escritorio"
              style={{
                padding: '0.25rem 0.5rem', borderRadius: 6, border: 'none',
                cursor: 'pointer', minHeight: 'auto', boxShadow: 'none',
                background: previewDevice === 'desktop' ? '#fff' : 'transparent',
                color: previewDevice === 'desktop' ? '#111' : '#64748b',
              }}
            >
              <Monitor size={14} />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              title="Vista Celular"
              style={{
                padding: '0.25rem 0.5rem', borderRadius: 6, border: 'none',
                cursor: 'pointer', minHeight: 'auto', boxShadow: 'none',
                background: previewDevice === 'mobile' ? '#fff' : 'transparent',
                color: previewDevice === 'mobile' ? '#111' : '#64748b',
              }}
            >
              <Smartphone size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Browser Viewport */}
      <div style={{
        background: '#e2e8f0',
        padding: previewDevice === 'mobile' ? '1rem' : '0',
        display: 'flex',
        justifyContent: 'center',
        maxHeight: '75vh',
        overflowY: 'auto',
      }}>
        <div style={{
          width: previewDevice === 'mobile' ? 360 : '100%',
          background: '#ffffff',
          borderRadius: previewDevice === 'mobile' ? 20 : 0,
          boxShadow: previewDevice === 'mobile' ? '0 12px 32px rgba(0,0,0,0.18)' : 'none',
          overflow: 'hidden',
          position: 'relative',
          border: previewDevice === 'mobile' ? '4px solid #1e293b' : 'none',
        }}>
          {/* 1. Marquee Bar */}
          {marquee?.activo && Array.isArray(marquee.mensajes) && marquee.mensajes.length > 0 && (
            <div style={{
              background: marquee.bg_color || '#111111',
              color: marquee.text_color || '#ffffff',
              padding: '0.4rem 0.75rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}>
              {marquee.mensajes.join('   •   ')}
            </div>
          )}

          {/* 2. Store Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {identidad.logo_url && (
                <img
                  src={identidad.logo_url}
                  alt={identidad.nombre_marca}
                  style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: primaryColor, lineHeight: 1.1 }}>
                  {identidad.nombre_marca || 'VYPER'}
                </div>
                <div style={{ fontSize: '0.65rem', color: accentColor, fontWeight: 700, textTransform: 'uppercase' }}>
                  {previewStore === 'mayorista'
                    ? (identidad.subtitulo_mayorista || 'Mayorista')
                    : (identidad.subtitulo_minorista || 'Tienda Oficial')}
                </div>
              </div>
            </div>
            <div style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 99,
              background: primaryColor,
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}>
              🛒 $0
            </div>
          </div>

          {/* 3. Hero Banner */}
          <div style={{
            position: 'relative',
            padding: previewDevice === 'mobile' ? '1.75rem 1rem' : '2.25rem 1.5rem',
            background: hero.imagen_fondo_url
              ? `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.75)), url(${hero.imagen_fondo_url}) center/cover`
              : '#111827',
            color: '#fff',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: previewDevice === 'mobile' ? '1.25rem' : '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
              {hero.titulo || 'Título del Hero'}
            </h2>
            <p style={{ fontSize: '0.8125rem', opacity: 0.9, maxWidth: 460, margin: '0 auto 0.625rem', lineHeight: 1.4 }}>
              {hero.descripcion || ''}
            </p>
            {hero.subtexto && (
              <span style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                padding: '0.25rem 0.75rem',
                borderRadius: 99,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
              }}>
                {hero.subtexto}
              </span>
            )}
          </div>

          {/* 4. Promotional Banners */}
          {bannersCfg?.activo && activeBanners.length > 0 && (
            <div style={{ padding: '0.75rem 1rem', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                Banners Promocionales ({activeBanners.length})
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {activeBanners.slice(0, 2).map((b: BannerItem) => (
                  <div key={b.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', maxHeight: 110 }}>
                    <img src={b.imagen_url} alt={b.texto_alt || 'Banner'} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Cart Incentives Preview */}
          {incentivos?.activo && (
            <div style={{
              margin: '0.75rem 1rem',
              padding: '0.75rem',
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                🚚 ¡Envío gratis superando ${freeShippingGoal.toLocaleString('es-AR')}!
              </div>
              <div style={{ height: 6, background: '#dcfce7', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: '65%', height: '100%', background: accentColor }} />
              </div>
              {Number(incentivos.descuento_volumen_porcentaje) > 0 && (
                <div style={{ fontSize: '0.6875rem', color: '#15803d', marginTop: 4 }}>
                  🎁 {incentivos.descuento_volumen_porcentaje}% OFF extra superando ${Number(incentivos.descuento_volumen_minimo || 0).toLocaleString('es-AR')}
                </div>
              )}
            </div>
          )}

          {/* 6. Footer Preview */}
          <div style={{
            padding: '1.25rem 1rem',
            background: primaryColor,
            color: '#fff',
            fontSize: '0.75rem',
            marginTop: '0.5rem',
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {identidad.nombre_completo || 'VYPER SUPLEMENTOS'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, opacity: 0.85 }}>
              {footer.direccion && <div>{footer.direccion}</div>}
              {footer.telefono && <div>{footer.telefono}</div>}
              {(identidad.horario_atencion || footer.horario_atencion) && (
                <div>🕒 {identidad.horario_atencion || footer.horario_atencion}</div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                {footer.instagram && <span>IG: {footer.instagram}</span>}
                {(identidad.tiktok || footer.tiktok) && <span>TikTok: {identidad.tiktok || footer.tiktok}</span>}
                {(identidad.facebook || footer.facebook) && <span>FB: {identidad.facebook || footer.facebook}</span>}
              </div>
            </div>
          </div>

          {/* 7. WhatsApp Floating Button */}
          {whatsapp?.boton_flotante_activo && (
            <div style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#25D366',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,211,102,0.4)',
            }}>
              <MessageCircle size={20} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL DEL EDITOR DE TIENDA
// ═══════════════════════════════════════════════════════════
export default function PersonalizacionPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('identidad');
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ═══ Live Preview state (Opción 1) ═══
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStore, setPreviewStore] = useState<'mayorista' | 'minorista'>('minorista');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // ═══ Version History state (Opción 5) ═══
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySnapshots, setHistorySnapshots] = useState<{ fecha: string; valor: Record<string, any> }[]>([]);

  // ═══ Asesor virtual state (Opción 14) ═══
  const [asesorOpen, setAsesorOpen] = useState(false);

  // ═══ Tutorial state ═══
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const startTutorial = useCallback(() => {
    setTutorialActive(true);
    setTutorialStep(0);
  }, []);

  const closeTutorial = useCallback(() => {
    setTutorialActive(false);
    setTutorialStep(0);
  }, []);

  const nextTutorialStep = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      closeTutorial();
    }
  }, [tutorialStep, closeTutorial]);

  const prevTutorialStep = useCallback(() => {
    if (tutorialStep > 0) setTutorialStep(prev => prev - 1);
  }, [tutorialStep]);

  useEffect(() => {
    if (tutorialActive && TUTORIAL_STEPS[tutorialStep]?.navigateTo) {
      setActiveTab(TUTORIAL_STEPS[tutorialStep].navigateTo!);
    }
  }, [tutorialActive, tutorialStep]);

  // Auto-switch preview store mode when selecting a mayorista/minorista tab
  useEffect(() => {
    if (activeTab.includes('mayorista')) setPreviewStore('mayorista');
    else if (activeTab.includes('minorista')) setPreviewStore('minorista');
  }, [activeTab]);

  // Fetch all configs on mount using single batch call
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const result: Record<string, any> = {};
      try {
        const res = await fetch('/api/ecommerce/configuraciones');
        const rows = await res.json();
        const rowMap: Record<string, any> = {};
        if (Array.isArray(rows)) {
          for (const r of rows) {
            if (r && r.clave) rowMap[r.clave] = r.valor;
          }
        }
        for (const tab of TABS) {
          const defVal = STORE_DEFAULTS[tab.configKey];
          const dbVal = rowMap[tab.configKey];
          result[tab.configKey] = dbVal ? { ...defVal, ...dbVal } : { ...defVal };
        }
      } catch {
        for (const tab of TABS) {
          result[tab.configKey] = { ...STORE_DEFAULTS[tab.configKey] };
        }
      }
      setConfigs(result);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const currentTab = TABS.find(t => t.key === activeTab)!;
  const currentConfig = configs[currentTab.configKey] || {};

  const updateField = (field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [currentTab.configKey]: { ...prev[currentTab.configKey], [field]: value },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ecommerce/configuraciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: currentTab.configKey, valor: configs[currentTab.configKey] }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      invalidateStoreConfigCache(currentTab.configKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErrorMessage('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('¿Restaurar los valores predeterminados para esta sección?')) return;
    setConfigs(prev => ({ ...prev, [currentTab.configKey]: { ...STORE_DEFAULTS[currentTab.configKey] } }));
    setSaved(false);
  };

  const openHistoryModal = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/ecommerce/configuraciones?historial=${currentTab.configKey}`);
      const data = await res.json();
      setHistorySnapshots(Array.isArray(data.historial) ? data.historial : []);
    } catch {
      setHistorySnapshots([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRestoreSnapshot = (snapshotValor: Record<string, any>) => {
    setConfigs(prev => ({
      ...prev,
      [currentTab.configKey]: {
        ...STORE_DEFAULTS[currentTab.configKey],
        ...snapshotValor,
      },
    }));
    setSaved(false);
    setHistoryOpen(false);
  };

  const handleApplyAiChanges = (changes: SuggestedChanges) => {
    let targetTab = activeTab;
    if (changes.tab && TABS.some(t => t.key === changes.tab)) {
      targetTab = changes.tab as TabKey;
      setActiveTab(targetTab);
    }
    const targetConfigKey = TABS.find(t => t.key === targetTab)!.configKey;
    setConfigs(prev => ({
      ...prev,
      [targetConfigKey]: {
        ...prev[targetConfigKey],
        ...changes.fields,
      },
    }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 8 }}>
        <Loader2 size={24} style={{ color: 'var(--text-light)', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Cargando configuraciones...</span>
      </div>
    );
  }

  // ═══ RENDERS DE CADA SECCIÓN ═══

  const renderIdentidad = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <TextField label="Nombre de marca" value={currentConfig.nombre_marca || ''} onChange={v => updateField('nombre_marca', v)} placeholder="VYPER" />
        <TextField label="Nombre completo (footer)" value={currentConfig.nombre_completo || ''} onChange={v => updateField('nombre_completo', v)} placeholder="VYPER SUPLEMENTOS" />
        <TextField label="Subtítulo Mayorista" value={currentConfig.subtitulo_mayorista || ''} onChange={v => updateField('subtitulo_mayorista', v)} placeholder="Mayorista" />
        <TextField label="Subtítulo Minorista" value={currentConfig.subtitulo_minorista || ''} onChange={v => updateField('subtitulo_minorista', v)} placeholder="Tienda Oficial" />
      </div>

      <ImageUploadField
        label="Logo de la tienda"
        value={currentConfig.logo_url || ''}
        onChange={v => updateField('logo_url', v)}
        hint="Recomendado: formato cuadrado (200×200px). Podés pegar una URL o subir el archivo directamente."
        onError={setErrorMessage}
      />

      <div style={{
        marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)',
      }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Palette size={16} /> Colores de Marca y Contacto Extendido
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <ColorField label="Color Primario" value={currentConfig.color_primario || '#111111'} onChange={v => updateField('color_primario', v)} />
          <ColorField label="Color Acento" value={currentConfig.color_acento || '#10b981'} onChange={v => updateField('color_acento', v)} />
        </div>
        <TextField label="Horario de atención" value={currentConfig.horario_atencion || ''} onChange={v => updateField('horario_atencion', v)} placeholder="Lun a Vie 9:00 a 18:00 · Sáb 9:00 a 13:00" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <TextField label="Email de contacto" value={currentConfig.email || ''} onChange={v => updateField('email', v)} placeholder="contacto@vyper.com.ar" />
          <TextField label="TikTok" value={currentConfig.tiktok || ''} onChange={v => updateField('tiktok', v)} placeholder="@vyper_suplementos" />
          <TextField label="Facebook" value={currentConfig.facebook || ''} onChange={v => updateField('facebook', v)} placeholder="Vyper Suplementos" />
        </div>
      </div>
    </>
  );

  const renderHero = (key: 'tienda_hero_mayorista' | 'tienda_hero_minorista') => {
    const c = configs[key] || {};
    const update = (f: string, v: any) => {
      setConfigs(prev => ({ ...prev, [key]: { ...prev[key], [f]: v } }));
      setSaved(false);
    };
    return (
      <>
        <TextField label="Título del Hero" value={c.titulo || ''} onChange={v => update('titulo', v)} placeholder="Catálogo Mayorista 🛒" />
        <TextField label="Descripción" value={c.descripcion || ''} onChange={v => update('descripcion', v)} placeholder="Armá tu pedido..." multiline />
        <TextField label="Subtexto" value={c.subtexto || ''} onChange={v => update('subtexto', v)} placeholder="📦 Solo se muestran..." />
        <ImageUploadField label="Imagen de fondo" value={c.imagen_fondo_url || ''} onChange={v => update('imagen_fondo_url', v)} hint="Se usa como fondo del banner principal. Recomendado: 1920×800px" onError={setErrorMessage} />
        <VideoField label="Video de portada (YouTube)" value={c.video_url || ''} onChange={v => update('video_url', v)} />
        <ToggleField label="Video activo" value={c.video_activo ?? true} onChange={v => update('video_activo', v)} description="Mostrar/ocultar el video de portada" />
      </>
    );
  };

  const renderBanners = (key: 'tienda_banners_mayorista' | 'tienda_banners_minorista') => {
    const c = configs[key] || { activo: false, banners: [] };
    const banners: BannerItem[] = Array.isArray(c.banners) ? c.banners : [];

    const updateConfig = (next: Partial<typeof c>) => {
      setConfigs(prev => ({ ...prev, [key]: { ...prev[key], ...next } }));
      setSaved(false);
    };

    const addBanner = () => {
      const newBanner: BannerItem = {
        id: `banner_${Date.now()}`,
        imagen_url: '',
        link: '',
        texto_alt: `Banner ${banners.length + 1}`,
        activo: true,
        orden: banners.length + 1,
      };
      updateConfig({ banners: [...banners, newBanner], activo: true });
    };

    const updateBanner = (idx: number, patch: Partial<BannerItem>) => {
      const next = [...banners];
      next[idx] = { ...next[idx], ...patch };
      updateConfig({ banners: next });
    };

    const removeBanner = (idx: number) => {
      const next = banners.filter((_, i) => i !== idx).map((b, i) => ({ ...b, orden: i + 1 }));
      updateConfig({ banners: next });
    };

    const moveBanner = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= banners.length) return;
      const next = [...banners];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      updateConfig({ banners: next.map((b, i) => ({ ...b, orden: i + 1 })) });
    };

    return (
      <>
        <ToggleField
          label="Sección de Banners Promocionales activa"
          value={Boolean(c.activo)}
          onChange={v => updateConfig({ activo: v })}
          description="Mostrar el carrusel de banners promocionales debajo del Hero principal"
        />

        {banners.map((banner, i) => (
          <div key={banner.id || i} style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Banner #{i + 1}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => moveBanner(i, -1)}
                  disabled={i === 0}
                  style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 6, padding: 4, cursor: i === 0 ? 'not-allowed' : 'pointer', minHeight: 'auto' }}
                  title="Subir"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBanner(i, 1)}
                  disabled={i === banners.length - 1}
                  style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 6, padding: 4, cursor: i === banners.length - 1 ? 'not-allowed' : 'pointer', minHeight: 'auto' }}
                  title="Bajar"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeBanner(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: 4, minHeight: 'auto' }}
                  title="Eliminar banner"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <ImageUploadField
              label="Imagen del Banner"
              value={banner.imagen_url || ''}
              onChange={v => updateBanner(i, { imagen_url: v })}
              hint="Formato horizontal recomendado (ej: 1200×400px)"
              onError={setErrorMessage}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <TextField
                label="Texto alternativo (Alt)"
                value={banner.texto_alt || ''}
                onChange={v => updateBanner(i, { texto_alt: v })}
                placeholder="Promo 2x1 en Creatinas"
              />
              <TextField
                label="Link de destino (opcional)"
                value={banner.link || ''}
                onChange={v => updateBanner(i, { link: v })}
                placeholder="/minorista?categoria=Creatinas"
              />
            </div>

            <ToggleField
              label="Banner visible"
              value={banner.activo ?? true}
              onChange={v => updateBanner(i, { activo: v })}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addBanner}
          style={{
            width: '100%', padding: '0.75rem', background: '#fff', border: '2px dashed #d1d5db',
            borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: '0.875rem', fontWeight: 600, color: '#6b7280',
          }}
        >
          <Plus size={16} /> Agregar banner promocional
        </button>
      </>
    );
  };

  const renderMarquesina = (key: 'marquesina_mayorista' | 'marquesina_minorista') => {
    const c = configs[key] || STORE_DEFAULTS[key];
    const mensajes: string[] = Array.isArray(c.mensajes) ? c.mensajes : [];

    const updateConfig = (patch: Record<string, any>) => {
      setConfigs(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
      setSaved(false);
    };

    return (
      <>
        <ToggleField
          label="Marquesina superior activa"
          value={c.activo ?? true}
          onChange={v => updateConfig({ activo: v })}
          description="Muestra la barra animada con anuncios arriba del header de la tienda"
        />

        {/* Mini preview of marquee */}
        <div style={{
          marginBottom: '1rem',
          padding: '0.625rem 1rem',
          borderRadius: 10,
          background: c.bg_color || '#111111',
          color: c.text_color || '#ffffff',
          fontSize: '0.8125rem',
          fontWeight: 600,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}>
          {mensajes.length > 0 ? mensajes.join('   •   ') : 'Agregá mensajes para previsualizar la marquesina...'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <ColorField label="Color de fondo" value={c.bg_color || '#111111'} onChange={v => updateConfig({ bg_color: v })} />
          <ColorField label="Color de texto" value={c.text_color || '#ffffff'} onChange={v => updateConfig({ text_color: v })} />
        </div>

        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Mensajes en rotación ({mensajes.length})
        </label>

        {mensajes.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <input
              value={msg}
              onChange={e => {
                const next = [...mensajes];
                next[i] = e.target.value;
                updateConfig({ mensajes: next });
              }}
              placeholder="🔥 Envíos rápidos en San Juan"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => {
                const next = mensajes.filter((_, idx) => idx !== i);
                updateConfig({ mensajes: next });
              }}
              style={{
                background: '#fee2e2', border: 'none', borderRadius: 8, color: '#ef4444',
                padding: '0 0.75rem', cursor: 'pointer', minHeight: 'auto',
              }}
              title="Eliminar mensaje"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => updateConfig({ mensajes: [...mensajes, ''] })}
          style={{
            width: '100%', padding: '0.75rem', background: '#fff', border: '2px dashed #d1d5db',
            borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginTop: '0.5rem',
          }}
        >
          <Plus size={16} /> Agregar mensaje a la marquesina
        </button>
      </>
    );
  };

  const renderIncentivos = () => {
    const c = configs.tienda_incentivos || STORE_DEFAULTS.tienda_incentivos;
    const update = (f: string, v: any) => {
      setConfigs(prev => ({ ...prev, tienda_incentivos: { ...prev.tienda_incentivos, [f]: v } }));
      setSaved(false);
    };

    return (
      <>
        <div style={{ background: 'var(--accent-green-light)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--accent-green)', fontWeight: 600 }}>
            🎁 Estos umbrales alimentan la barra de progreso interactiva dentro del carrito para motivar un ticket promedio más alto.
          </p>
        </div>

        <ToggleField
          label="Barra de Incentivos activa en el Carrito"
          value={c.activo ?? true}
          onChange={v => update('activo', v)}
          description="Muestra cuánto falta para alcanzar envío gratis o descuento por volumen"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
          <TextField
            type="number"
            label="Meta Envío Gratis Mayorista ($ ARS)"
            value={c.envio_gratis_mayorista ?? 150000}
            onChange={v => update('envio_gratis_mayorista', Number(v))}
            placeholder="150000"
          />
          <TextField
            type="number"
            label="Meta Envío Gratis Minorista ($ ARS)"
            value={c.envio_gratis_minorista ?? 45000}
            onChange={v => update('envio_gratis_minorista', Number(v))}
            placeholder="45000"
          />
          <TextField
            type="number"
            label="Monto Mínimo para Descuento por Volumen ($ ARS)"
            value={c.descuento_volumen_minimo ?? 250000}
            onChange={v => update('descuento_volumen_minimo', Number(v))}
            placeholder="250000"
          />
          <TextField
            type="number"
            label="Porcentaje de Descuento por Volumen (%)"
            value={c.descuento_volumen_porcentaje ?? 5}
            onChange={v => update('descuento_volumen_porcentaje', Number(v))}
            placeholder="5"
          />
        </div>
      </>
    );
  };

  const renderFooter = () => (
    <>
      <TextField label="Dirección" value={currentConfig.direccion || ''} onChange={v => updateField('direccion', v)} placeholder="📍 Av. Libertador 4858 Oeste..." />
      <TextField label="Teléfono" value={currentConfig.telefono || ''} onChange={v => updateField('telefono', v)} placeholder="📱 +54 9 264..." />
      <TextField label="Horario de atención" value={currentConfig.horario_atencion || ''} onChange={v => updateField('horario_atencion', v)} placeholder="Lun a Vie 9:00 a 18:00 · Sáb 9:00 a 13:00" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <TextField label="Instagram" value={currentConfig.instagram || ''} onChange={v => updateField('instagram', v)} placeholder="@vyper_suplementos" />
        <TextField label="TikTok" value={currentConfig.tiktok || ''} onChange={v => updateField('tiktok', v)} placeholder="@vyper_suplementos" />
        <TextField label="Facebook" value={currentConfig.facebook || ''} onChange={v => updateField('facebook', v)} placeholder="Vyper Suplementos" />
        <TextField label="Email" value={currentConfig.email || ''} onChange={v => updateField('email', v)} placeholder="contacto@vyper.com.ar" />
      </div>
      <TextField label="Texto de créditos" value={currentConfig.texto_creditos || ''} onChange={v => updateField('texto_creditos', v)} placeholder="Desarrollado por Grow Labs" />
      <TextField label="URL de créditos" value={currentConfig.url_creditos || ''} onChange={v => updateField('url_creditos', v)} placeholder="https://www.growlabs.lat" />
    </>
  );

  const renderWhatsapp = () => (
    <>
      <div style={{ background: 'var(--accent-green-light)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--accent-green)', fontWeight: 600 }}>💬 Estos números y mensajes se usan en toda la tienda: header, botón flotante, checkout y como-comprar.</p>
      </div>
      <TextField label="Número Mayorista" value={currentConfig.numero_mayorista || ''} onChange={v => updateField('numero_mayorista', v)} placeholder="5492644193032" />
      <TextField label="Número Minorista" value={currentConfig.numero_minorista || ''} onChange={v => updateField('numero_minorista', v)} placeholder="5492646298880" />
      <TextField label="Mensaje pre-cargado Mayorista" value={currentConfig.mensaje_mayorista || ''} onChange={v => updateField('mensaje_mayorista', v)} multiline />
      <TextField label="Mensaje pre-cargado Minorista" value={currentConfig.mensaje_minorista || ''} onChange={v => updateField('mensaje_minorista', v)} multiline />
      <TextField label="Mensaje de consulta" value={currentConfig.mensaje_consulta || ''} onChange={v => updateField('mensaje_consulta', v)} multiline />
      <ToggleField label="Botón flotante activo" value={currentConfig.boton_flotante_activo ?? true} onChange={v => updateField('boton_flotante_activo', v)} description="Mostrar el botón verde de WhatsApp en la tienda" />
      <TextField label="URL Google Maps (Sucursal)" value={currentConfig.url_sucursal || ''} onChange={v => updateField('url_sucursal', v)} placeholder="https://www.google.com/maps/..." multiline />
    </>
  );

  const renderFaqs = (key: 'tienda_faqs_mayorista' | 'tienda_faqs_minorista') => {
    const c = configs[key] || { preguntas: [] };
    const preguntas = c.preguntas || [];
    const update = (newPreguntas: any[]) => {
      setConfigs(prev => ({ ...prev, [key]: { ...prev[key], preguntas: newPreguntas } }));
      setSaved(false);
    };
    return (
      <>
        <div style={{ background: 'var(--accent-blue-light)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--accent-blue)', fontWeight: 600 }}>❓ Estas preguntas se muestran en la página &ldquo;¿Cómo comprar?&rdquo;</p>
        </div>
        {preguntas.map((faq: any, i: number) => (
          <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PREGUNTA {i + 1}</span>
              <button onClick={() => { const n = [...preguntas]; n.splice(i, 1); update(n); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: 4, minHeight: 'auto', boxShadow: 'none' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <TextField label="Pregunta" value={faq.pregunta} onChange={v => { const n = [...preguntas]; n[i] = { ...n[i], pregunta: v }; update(n); }} />
            <TextField label="Respuesta" value={faq.respuesta} onChange={v => { const n = [...preguntas]; n[i] = { ...n[i], respuesta: v }; update(n); }} multiline />
          </div>
        ))}
        <button
          onClick={() => update([...preguntas, { pregunta: '', respuesta: '' }])}
          style={{
            width: '100%', padding: '0.75rem', background: '#fff', border: '2px dashed #d1d5db',
            borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: '0.875rem', fontWeight: 600, color: '#6b7280',
          }}
        >
          <Plus size={16} /> Agregar pregunta
        </button>
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'identidad': return renderIdentidad();
      case 'hero_mayorista': return renderHero('tienda_hero_mayorista');
      case 'hero_minorista': return renderHero('tienda_hero_minorista');
      case 'banners_mayorista': return renderBanners('tienda_banners_mayorista');
      case 'banners_minorista': return renderBanners('tienda_banners_minorista');
      case 'marquesina_mayorista': return renderMarquesina('marquesina_mayorista');
      case 'marquesina_minorista': return renderMarquesina('marquesina_minorista');
      case 'incentivos': return renderIncentivos();
      case 'footer': return renderFooter();
      case 'whatsapp': return renderWhatsapp();
      case 'faqs_mayorista': return renderFaqs('tienda_faqs_mayorista');
      case 'faqs_minorista': return renderFaqs('tienda_faqs_minorista');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: previewOpen ? 1440 : 1100, transition: 'max-width 0.25s ease' }}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem' }}>
              Editor de Tienda
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Personalizá la apariencia, marquesinas, banners e incentivos de tu ecommerce mayorista y minorista
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setPreviewOpen(prev => !prev)}
              className={previewOpen ? 'btn-blue' : 'secondary'}
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {previewOpen ? <EyeOff size={16} /> : <Eye size={16} />}
              👁️ Vista Previa en Vivo
            </button>
            <button
              type="button"
              onClick={startTutorial}
              className="secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              <BookOpen size={16} /> Modo Tutorial
            </button>
          </div>
        </div>
      </header>

      {/* Tab pills */}
      <div className="nav-pill-container" style={{ marginBottom: '1.5rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`nav-pill-button ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Layout: Split-Screen when previewOpen is active */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: previewOpen ? 'repeat(auto-fit, minmax(420px, 1fr))' : '1fr',
        gap: '1.5rem',
        alignItems: 'start',
      }}>
        {/* Editor Form Card */}
        <div className="glass-card" style={{ padding: 0 }}>
          {/* Card header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)',
            flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {currentTab.icon} {currentTab.label}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={openHistoryModal}
                className="btn-ghost"
                style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <History size={14} /> 🕒 Historial
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
                style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
              >
                <RotateCcw size={14} /> Predeterminado
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-blue"
                style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
              >
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={14} /> : <Save size={14} />}
                {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Card body */}
          <div style={{ padding: '1.5rem' }}>
            {renderContent()}
          </div>
        </div>

        {/* Live Preview Column */}
        {previewOpen && (
          <LiveStorePreview
            configs={configs}
            previewStore={previewStore}
            setPreviewStore={setPreviewStore}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ═══ Modal de Historial de Versiones (Opción 5) ═══ */}
      {historyOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9995, backdropFilter: 'blur(2px)', padding: '1rem',
        }} onClick={() => setHistoryOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: 16, width: 'min(580px, 100%)',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} style={{ color: '#6366f1' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Historial de Versiones — {currentTab.label}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                    Últimos 10 cambios guardados en esta sección
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', minHeight: 'auto', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
              {historyLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: 8, color: '#6b7280' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Cargando versiones anteriores...
                </div>
              ) : historySnapshots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Aún no hay versiones anteriores guardadas para <strong>{currentTab.label}</strong>. Cada vez que presiones &ldquo;Guardar&rdquo;, se creará un punto de restauración automático.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {historySnapshots.map((snap, idx) => (
                    <div key={idx} style={{
                      border: '1px solid #e5e7eb', borderRadius: 12, padding: '0.875rem 1rem',
                      background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>
                            Versión #{historySnapshots.length - idx}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 8 }}>
                            {new Date(snap.fecha).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(snap.valor)}
                          className="btn-blue"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', minHeight: 'auto' }}
                        >
                          <RotateCcw size={13} /> Restaurar esta versión
                        </button>
                      </div>
                      <pre style={{
                        margin: 0, padding: '0.5rem', borderRadius: 8, background: '#fff',
                        border: '1px solid #f1f5f9', fontSize: '0.7rem', color: '#475569',
                        maxHeight: 90, overflow: 'auto',
                      }}>
                        {JSON.stringify(snap.valor, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Floating Buttons (Tutorial + Asesor) ═══ */}
      {!tutorialActive && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 40 }}>
          <button
            onClick={() => setAsesorOpen(true)}
            aria-label="Abrir asesor virtual"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
              minHeight: 'auto', padding: 0,
            }}
          >
            <Sparkles size={22} />
          </button>

          <button
            onClick={startTutorial}
            aria-label="Activar tutorial guiado"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              minHeight: 'auto', padding: 0,
            }}
          >
            <BookOpen size={22} />
          </button>
        </div>
      )}

      {/* ═══ Tutorial Overlay ═══ */}
      {tutorialActive && (
        <TutorialOverlay
          step={TUTORIAL_STEPS[tutorialStep]}
          total={TUTORIAL_STEPS.length}
          currentStep={tutorialStep}
          onNext={nextTutorialStep}
          onPrev={prevTutorialStep}
          onClose={closeTutorial}
        />
      )}

      {/* ═══ Error Modal ═══ */}
      {errorMessage && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '2rem', width: 'min(400px, 90vw)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center',
            border: '2px solid #ef4444'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
            }}>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', marginBottom: '0.5rem' }}>Error</h3>
            <p style={{ color: '#4b5563', fontSize: '0.9375rem', marginBottom: '2rem' }}>{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} style={{
              width: '100%', padding: '0.75rem', background: '#ef4444', color: '#fff',
              borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
              fontSize: '0.9375rem'
            }}>
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ═══ Asesor Virtual Chat ═══ */}
      <AsesorChat
        isOpen={asesorOpen}
        onClose={() => setAsesorOpen(false)}
        activeTab={activeTab}
        currentConfig={currentConfig}
        onApplyChanges={handleApplyAiChanges}
      />
    </div>
  );
}
