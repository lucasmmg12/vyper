'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Store, Type, MessageCircle, MapPin, HelpCircle, Image as ImageIcon, Video, Save, RotateCcw, Check, Loader2, ChevronDown, Plus, Trash2, GripVertical, BookOpen, ChevronLeft, ChevronRight, X, Lightbulb, ExternalLink, Sparkles, Send } from 'lucide-react';
import { STORE_DEFAULTS, StoreConfigKey } from '@/hooks/useStoreConfig';

type TabKey = 'identidad' | 'hero_mayorista' | 'hero_minorista' | 'footer' | 'whatsapp' | 'faqs_mayorista' | 'faqs_minorista';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; configKey: StoreConfigKey }[] = [
  { key: 'identidad', label: 'Identidad', icon: <Store size={16} />, configKey: 'tienda_identidad' },
  { key: 'hero_mayorista', label: 'Hero Mayorista', icon: <ImageIcon size={16} />, configKey: 'tienda_hero_mayorista' },
  { key: 'hero_minorista', label: 'Hero Minorista', icon: <ImageIcon size={16} />, configKey: 'tienda_hero_minorista' },
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
  navigateTo?: TabKey;        // Auto-navega a esta tab al mostrar el paso
  highlightArea?: string;     // ID del área a resaltar
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '¡Bienvenido al Editor de Tienda! 🎨',
    content: 'Este editor te permite personalizar completamente la apariencia de tu tienda mayorista y minorista. Cada cambio que hagas acá se refleja en tiempo real en las tiendas públicas.',
    tip: 'Siempre podés volver a los valores originales con el botón "Predeterminado".',
  },
  {
    title: 'Navegación por secciones',
    content: 'A la izquierda tenés el menú con todas las secciones configurables. Hacé clic en cada una para editarla. En celular, tocá el selector desplegable arriba del formulario.',
    tip: 'Cada sección se guarda de forma independiente. Podés editar y guardar una sin afectar las demás.',
    highlightArea: 'tabs-sidebar',
  },
  {
    title: '🏪 Identidad de Marca',
    content: 'Acá definís lo fundamental: el nombre de tu marca que aparece en el header, el logo y los subtítulos que diferencian la tienda mayorista de la minorista. El "Nombre completo" se muestra en el footer.',
    tip: 'Para el logo, subí la imagen a tu hosting y pegá la URL acá. Recomendamos formato cuadrado (ej: 200x200px).',
    navigateTo: 'identidad',
    highlightArea: 'content-area',
  },
  {
    title: '🖼️ Hero Mayorista',
    content: 'El Hero es el banner principal que ven tus clientes al entrar a la tienda mayorista. Personalizá el título, la descripción y la imagen de fondo. También podés agregar o quitar el video de portada.',
    tip: 'Para el video, usá URLs de YouTube en formato embed: "https://www.youtube.com/embed/TU_VIDEO_ID?autoplay=1&mute=1&loop=1"',
    navigateTo: 'hero_mayorista',
    highlightArea: 'content-area',
  },
  {
    title: '🖼️ Hero Minorista',
    content: 'Igual que el anterior, pero para la tienda minorista. Podés usar textos y multimedia diferentes para cada tienda, lo que te permite comunicar mensajes distintos a cada público.',
    tip: 'Usá un tono más cercano y "retail" para minorista, y más profesional/B2B para mayorista.',
    navigateTo: 'hero_minorista',
  },
  {
    title: '📍 Footer (Pie de página)',
    content: 'Editá la información que aparece al final de ambas tiendas: dirección del local, teléfono, Instagram, y los créditos del desarrollador.',
    tip: 'Usá emojis como 📍 y 📱 antes de la dirección y teléfono para mejor legibilidad visual.',
    navigateTo: 'footer',
    highlightArea: 'content-area',
  },
  {
    title: '💬 WhatsApp',
    content: 'Configurá los números de WhatsApp para cada tienda. Los mensajes pre-cargados son los que se envían cuando un cliente toca el botón de WhatsApp o envía un pedido. También podés activar/desactivar el botón flotante verde.',
    tip: 'El formato del número debe ser: código de país + código de área + número, sin guiones ni espacios. Ej: 5492644193032',
    navigateTo: 'whatsapp',
    highlightArea: 'content-area',
  },
  {
    title: '❓ FAQs Mayorista',
    content: 'Las preguntas frecuentes aparecen en la página "¿Cómo comprar?" de la tienda mayorista. Podés agregar, editar o eliminar preguntas. Se muestran como acordeones expandibles.',
    tip: 'Incluí preguntas sobre medios de pago, envíos, montos mínimos y plazos de entrega. Son las dudas más comunes.',
    navigateTo: 'faqs_mayorista',
    highlightArea: 'content-area',
  },
  {
    title: '❓ FAQs Minorista',
    content: 'Igual que las FAQs mayoristas, pero para la tienda minorista. Podés tener preguntas completamente diferentes para cada público.',
    navigateTo: 'faqs_minorista',
  },
  {
    title: '💾 Guardar y Restaurar',
    content: 'Cuando terminás de editar una sección, hacé clic en <strong>"Guardar"</strong> (botón azul). Los cambios se aplican inmediatamente en la tienda. Si algo sale mal, usá <strong>"Predeterminado"</strong> para volver a los valores originales.',
    tip: '¡Importante! Cada sección se guarda por separado. Asegurate de guardar antes de cambiar de sección.',
    highlightArea: 'save-buttons',
  },
  {
    title: '🎉 ¡Todo listo!',
    content: 'Ya sabés cómo personalizar tu tienda completamente. Podés cambiar textos, imágenes, videos, números de WhatsApp y preguntas frecuentes sin tocar código. ¡Hacé tu tienda única!',
    tip: 'Podés volver a activar este tutorial en cualquier momento con el botón "Modo Tutorial".',
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

  // Keyboard navigation
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
      {/* Overlay backdrop */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 9998, backdropFilter: 'blur(2px)',
      }} onClick={onClose} />

      {/* Tutorial card */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(520px, calc(100vw - 2rem))',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'tutorialSlideUp 0.3s ease-out',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: '#f3f4f6' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
            width: `${progress}%`, transition: 'width 0.4s ease',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.75rem', fontWeight: 800,
            }}>
              {currentStep + 1}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paso {currentStep + 1} de {total}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#9ca3af', borderRadius: 6,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0.75rem 1.25rem 1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111' }}>
            {step.title}
          </h3>
          <p
            style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.65, marginBottom: step.tip ? '0.75rem' : 0 }}
            dangerouslySetInnerHTML={{ __html: step.content }}
          />

          {/* Tip */}
          {step.tip && (
            <div style={{
              display: 'flex', gap: '0.625rem', padding: '0.75rem',
              background: '#fefce8', border: '1px solid #fde68a',
              borderRadius: 10, fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.5,
            }}>
              <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          padding: '0.75rem 1.25rem', borderTop: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa',
        }}>
          <button
            onClick={onPrev}
            disabled={isFirst}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0.5rem 0.875rem', borderRadius: 8,
              background: '#fff', border: '1px solid #e5e7eb',
              color: isFirst ? '#d1d5db' : '#374151',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem', fontWeight: 500,
              minHeight: 'auto', boxShadow: 'none', letterSpacing: 'normal', textTransform: 'none' as const,
            }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          <span style={{ fontSize: '0.6875rem', color: '#d1d5db' }}>← → o ESC</span>

          <button
            onClick={onNext}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0.5rem 0.875rem', borderRadius: 8,
              background: isLast ? '#10b981' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none', color: '#fff',
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
              minHeight: 'auto', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', letterSpacing: 'normal', textTransform: 'none' as const,
            }}
          >
            {isLast ? 'Completar ✓' : 'Siguiente'} <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes tutorialSlideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ASESOR VIRTUAL — Chat con IA
// ═══════════════════════════════════════════════════════════
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  '¿Cómo cambio el logo?',
  '¿Cómo agrego un video?',
  '¿Cómo cambio el número de WhatsApp?',
  '¿Cómo agrego preguntas frecuentes?',
  '¿Qué formato tiene que tener el número?',
  '¿Cómo vuelvo a los valores originales?',
];

function AsesorChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! 👋 Soy tu asesor virtual del Editor de Tienda. Preguntame lo que necesites sobre cómo personalizar tu ecommerce: logo, hero, footer, WhatsApp, FAQs y más.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Hubo un error al consultar. Intentá de nuevo en unos segundos.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ No pude conectar con el asesor. Verificá tu conexión.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9990 }}
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: 'min(420px, 100vw)',
        height: 'min(600px, calc(100vh - 2rem))',
        background: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 0,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        zIndex: 9991,
        display: 'flex',
        flexDirection: 'column',
        animation: 'asesorSlideIn 0.3s ease-out',
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
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Asesor de Tienda</div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.75 }}>Impulsado por IA • Siempre disponible</div>
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
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '85%',
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
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '14px 14px 14px 4px',
                background: '#f3f4f6', display: 'flex', gap: 4, alignItems: 'center',
              }}>
                <span className="typing-dot" style={{ animationDelay: '0s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions (only when few messages) */}
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
                  fontSize: '0.75rem', color: '#6b7280', cursor: 'pointer',
                  fontWeight: 500, transition: 'all 0.15s',
                  minHeight: 'auto', boxShadow: 'none', letterSpacing: 'normal', textTransform: 'none' as const,
                }}
                onMouseEnter={e => {
                  (e.currentTarget).style.background = '#ede9fe';
                  (e.currentTarget).style.borderColor = '#8b5cf6';
                  (e.currentTarget).style.color = '#6d28d9';
                }}
                onMouseLeave={e => {
                  (e.currentTarget).style.background = '#f3f4f6';
                  (e.currentTarget).style.borderColor = '#e5e7eb';
                  (e.currentTarget).style.color = '#6b7280';
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
            placeholder="Escribí tu consulta..."
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

        <style jsx>{`
          @keyframes asesorSlideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .typing-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: #9ca3af; display: inline-block;
            animation: typingBounce 1s infinite;
          }
          @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
          }
        `}</style>
      </div>
    </>
  );
}

function TextField({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function ImageField({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await fetch('/api/ecommerce/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.urls?.[0]) onChange(data.urls[0]);
      else alert('Error al subir la imagen');
    } catch { alert('Error de conexión'); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {hint && <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: 8 }}>{hint}</p>}

      {/* Preview + Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-color)'}`,
          borderRadius: 12, padding: '1.25rem', cursor: 'pointer',
          background: dragOver ? 'var(--accent-blue-light)' : 'var(--bg-secondary)',
          transition: 'all 0.2s', textAlign: 'center',
        }}
      >
        {value ? (
          <div>
            <img
              src={value} alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, objectFit: 'contain', margin: '0 auto', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Hacé clic o arrastrá una imagen para reemplazar
            </p>
          </div>
        ) : (
          <div>
            <ImageIcon size={32} style={{ color: 'var(--text-light)', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {uploading ? 'Subiendo...' : 'Arrastrá una imagen acá o hacé clic'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>
              PNG, JPG o WebP · Se convierte automáticamente a WebP
            </p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </div>

      {/* Manual URL fallback */}
      <div style={{ marginTop: 8 }}>
        <details>
          <summary style={{ fontSize: '0.75rem', color: 'var(--text-light)', cursor: 'pointer' }}>O ingresá una URL manualmente</summary>
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="/bg-hero.webp" style={{ marginTop: 6 }} />
        </details>
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

      {/* Instructions */}
      <div style={{ background: 'var(--accent-amber-light)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: 10 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: 4 }}>📺 ¿Cómo obtener la URL de embed?</p>
        <ol style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.8 }}>
          <li>Abrí tu video en <strong>YouTube</strong></li>
          <li>Hacé clic en <strong>Compartir → Insertar</strong></li>
          <li>Copiá solo la URL del <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 4, fontSize: '0.7rem' }}>src="..."</code></li>
          <li>Ejemplo: <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 4, fontSize: '0.7rem' }}>https://www.youtube.com/embed/XXXXXXXXXXX</code></li>
        </ol>
      </div>

      <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://www.youtube.com/embed/tu-video-id" />

      {/* Live preview */}
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-light)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
        {description && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: value ? '#10b981' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
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

export default function PersonalizacionPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('identidad');
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mobileTabOpen, setMobileTabOpen] = useState(false);

  // ═══ Asesor virtual state ═══
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

  // Auto-navigate to the tab when tutorial step changes
  useEffect(() => {
    if (tutorialActive && TUTORIAL_STEPS[tutorialStep]?.navigateTo) {
      setActiveTab(TUTORIAL_STEPS[tutorialStep].navigateTo!);
    }
  }, [tutorialActive, tutorialStep]);

  // Fetch all configs on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const result: Record<string, any> = {};
      for (const tab of TABS) {
        try {
          const res = await fetch(`/api/ecommerce/configuraciones?clave=${tab.configKey}`);
          const data = await res.json();
          result[tab.configKey] = data?.valor ? { ...STORE_DEFAULTS[tab.configKey], ...data.valor } : { ...STORE_DEFAULTS[tab.configKey] };
        } catch {
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('¿Restaurar los valores predeterminados para esta sección?')) return;
    setConfigs(prev => ({ ...prev, [currentTab.configKey]: { ...STORE_DEFAULTS[currentTab.configKey] } }));
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

  const renderIdentidad = () => (
    <>
      <TextField label="Nombre de marca" value={currentConfig.nombre_marca || ''} onChange={v => updateField('nombre_marca', v)} placeholder="VYPER" />
      <TextField label="Nombre completo (footer)" value={currentConfig.nombre_completo || ''} onChange={v => updateField('nombre_completo', v)} placeholder="VYPER SUPLEMENTOS" />
      <TextField label="Subtítulo Mayorista" value={currentConfig.subtitulo_mayorista || ''} onChange={v => updateField('subtitulo_mayorista', v)} placeholder="Mayorista" />
      <TextField label="Subtítulo Minorista" value={currentConfig.subtitulo_minorista || ''} onChange={v => updateField('subtitulo_minorista', v)} placeholder="Tienda Oficial" />
      <ImageField label="Logo de la tienda" value={currentConfig.logo_url || ''} onChange={v => updateField('logo_url', v)} hint="Recomendado: formato cuadrado (200×200px)" />
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
        <ImageField label="Imagen de fondo" value={c.imagen_fondo_url || ''} onChange={v => update('imagen_fondo_url', v)} hint="Se usa como fondo del banner principal. Recomendado: 1920×800px" />
        <VideoField label="Video de portada (YouTube)" value={c.video_url || ''} onChange={v => update('video_url', v)} />
        <ToggleField label="Video activo" value={c.video_activo ?? true} onChange={v => update('video_activo', v)} description="Mostrar/ocultar el video de portada" />
      </>
    );
  };

  const renderFooter = () => (
    <>
      <TextField label="Dirección" value={currentConfig.direccion || ''} onChange={v => updateField('direccion', v)} placeholder="📍 Dr. Ortega 192..." />
      <TextField label="Teléfono" value={currentConfig.telefono || ''} onChange={v => updateField('telefono', v)} placeholder="📱 +54 264..." />
      <TextField label="Instagram" value={currentConfig.instagram || ''} onChange={v => updateField('instagram', v)} placeholder="@vyper_suplementos" />
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
          <p style={{ fontSize: '0.875rem', color: 'var(--accent-blue)', fontWeight: 600 }}>❓ Estas preguntas se muestran en la página "¿Cómo comprar?"</p>
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
      case 'footer': return renderFooter();
      case 'whatsapp': return renderWhatsapp();
      case 'faqs_mayorista': return renderFaqs('tienda_faqs_mayorista');
      case 'faqs_minorista': return renderFaqs('tienda_faqs_minorista');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem' }}>
              Editor de Tienda
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Personalizá la apariencia de tu ecommerce mayorista y minorista
            </p>
          </div>
          <button
            onClick={startTutorial}
            className="secondary"
            style={{ fontSize: '0.8125rem' }}
          >
            <BookOpen size={16} /> Modo Tutorial
          </button>
        </div>
      </header>

      {/* Tab pills */}
      <div className="nav-pill-container" style={{ marginBottom: '1.5rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setMobileTabOpen(false); }}
            className={`nav-pill-button ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content card */}
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleReset} className="btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}>
              <RotateCcw size={14} /> Predeterminado
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-blue" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
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

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ═══ Floating Buttons (Tutorial + Asesor) ═══ */}
      {!tutorialActive && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 40 }}>
          {/* Asesor button */}
          <button
            onClick={() => setAsesorOpen(true)}
            aria-label="Abrir asesor virtual"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              minHeight: 'auto', padding: 0, letterSpacing: 'normal', textTransform: 'none' as const,
            }}
            onMouseEnter={e => {
              (e.currentTarget).style.transform = 'scale(1.1)';
              (e.currentTarget).style.boxShadow = '0 6px 28px rgba(245,158,11,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.transform = 'scale(1)';
              (e.currentTarget).style.boxShadow = '0 4px 20px rgba(245,158,11,0.4)';
            }}
          >
            <Sparkles size={22} />
          </button>

          {/* Tutorial button */}
          <button
            onClick={startTutorial}
            aria-label="Activar tutorial guiado"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              minHeight: 'auto', padding: 0, letterSpacing: 'normal', textTransform: 'none' as const,
            }}
            onMouseEnter={e => {
              (e.currentTarget).style.transform = 'scale(1.1)';
              (e.currentTarget).style.boxShadow = '0 6px 28px rgba(99,102,241,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.transform = 'scale(1)';
              (e.currentTarget).style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)';
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

      {/* ═══ Asesor Virtual Chat ═══ */}
      <AsesorChat isOpen={asesorOpen} onClose={() => setAsesorOpen(false)} />
    </div>
  );
}
