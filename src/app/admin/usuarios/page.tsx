'use client';

import { useState, useEffect } from 'react';
import { Plus, UserCog, Edit, Trash2, Shield, Eye, Loader2, X, Check } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  rol: 'superadmin' | 'administrador' | 'vendedor';
  activo: boolean;
  created_at: string;
  last_login: string | null;
}

const rolColors: Record<string, string> = {
  superadmin: '#7c3aed',
  administrador: '#3b82f6',
  vendedor: '#10b981',
};

const rolLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  administrador: 'Administrador',
  vendedor: 'Vendedor',
};

const rolDescriptions: Record<string, string> = {
  administrador: 'Puede ver y modificar todo excepto gestionar usuarios.',
  vendedor: 'Solo puede ver información, sin permisos de edición.',
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'vendedor' as 'administrador' | 'vendedor',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    const res = await fetch('/api/auth/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    try {
      if (editingId) {
        const payload: Record<string, unknown> = { nombre: form.nombre, rol: form.rol };
        if (form.password) payload.password = form.password;
        const res = await fetch(`/api/auth/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'Error');
          return;
        }
      } else {
        const res = await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'Error al crear usuario');
          return;
        }
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ email: '', password: '', nombre: '', rol: 'vendedor' });
      fetchUsers();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`/api/auth/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleToggle = async (user: AdminUser) => {
    await fetch(`/api/auth/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !user.activo }),
    });
    fetchUsers();
  };

  const handleEdit = (u: AdminUser) => {
    setForm({
      email: u.email,
      password: '',
      nombre: u.nombre,
      rol: u.rol === 'superadmin' ? 'administrador' : u.rol,
    });
    setEditingId(u.id);
    setShowForm(true);
    setError('');
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCog size={24} /> Gestión de Usuarios
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Solo el Super Admin puede crear y gestionar cuentas
          </p>
        </div>
        <button onClick={() => {
          setForm({ email: '', password: '', nombre: '', rol: 'vendedor' });
          setEditingId(null);
          setShowForm(true);
          setError('');
        }}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Roles info */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Shield size={14} /> Roles del sistema
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {Object.entries(rolDescriptions).map(([rol, desc]) => (
            <div key={rol} style={{
              padding: '0.625rem 0.75rem',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              borderLeft: `3px solid ${rolColors[rol]}`,
            }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: rolColors[rol] }}>
                {rolLabels[rol]}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="glass-card animate-scaleIn" style={{
            width: '100%', maxWidth: 440,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '0.625rem 0.75rem',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Fernando"
                />
              </div>
              <div>
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@email.com"
                  disabled={!!editingId}
                  style={editingId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                />
              </div>
              <div>
                <label>{editingId ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? '••••••••' : 'Mínimo 6 caracteres'}
                />
              </div>
              <div>
                <label>Rol *</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value as 'administrador' | 'vendedor' })}>
                  <option value="vendedor">🟢 Vendedor (solo lectura)</option>
                  <option value="administrador">🔵 Administrador (lectura + escritura)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.nombre || !form.email || (!editingId && !form.password)}
                style={{ flex: 1 }}
              >
                {saving ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
                ) : editingId ? (
                  <><Check size={16} /> Actualizar</>
                ) : (
                  <><Plus size={16} /> Crear Usuario</>
                )}
              </button>
              <button className="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)', margin: '0 auto' }} />
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Usuario', 'Rol', 'Estado', 'Último Login', 'Acciones'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '0.75rem 1rem',
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--border-light)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{u.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${rolColors[u.rol]}15`,
                        color: rolColors[u.rol],
                        border: `1px solid ${rolColors[u.rol]}30`,
                      }}>
                        {rolLabels[u.rol]}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${u.activo ? 'badge-green' : 'badge-gray'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {u.last_login
                        ? new Date(u.last_login).toLocaleDateString('es-AR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : 'Nunca'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.rol !== 'superadmin' ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn-ghost" onClick={() => handleEdit(u)} style={{ padding: '0.375rem' }}>
                            <Edit size={16} />
                          </button>
                          <button className="btn-ghost" onClick={() => handleToggle(u)} style={{ padding: '0.375rem' }}>
                            {u.activo ? <Eye size={16} /> : <Eye size={16} style={{ opacity: 0.4 }} />}
                          </button>
                          <button className="btn-ghost" onClick={() => handleDelete(u.id)} style={{ padding: '0.375rem', color: 'var(--accent-red)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
