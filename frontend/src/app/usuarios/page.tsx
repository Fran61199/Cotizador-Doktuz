'use client';

import { useState, useEffect, useCallback } from 'react';
import AppHeader from '../components/Layout/AppHeader';
import AuthGuard from '../components/AuthGuard';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { getUsers, addUser, inviteUser } from '@/api';
import type { UserItem } from '@/api';
import { getApiError } from '@/api';

export default function UsuariosPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    getUsers()
      .then(setUsers)
      .catch((err) => setError(getApiError(err).detail || 'Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) {
      toast.error('Email obligatorio');
      return;
    }
    setAddLoading(true);
    try {
      await addUser(email, newName.trim() || undefined);
      setNewEmail('');
      setNewName('');
      toast.success('Usuario añadido');
      loadUsers();
    } catch (err) {
      toast.error(getApiError(err).detail || 'No se pudo añadir');
    } finally {
      setAddLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      toast.error('Email obligatorio');
      return;
    }
    setInviteLoading(true);
    try {
      await inviteUser(email, inviteName.trim() || undefined);
      setInviteEmail('');
      setInviteName('');
      toast.success('Usuario creado. Se envió la contraseña por email (revisa spam). Si no llega, puede usar Olvidé mi contraseña.');
      loadUsers();
    } catch (err) {
      toast.error(getApiError(err).detail || 'No se pudo invitar');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div>
        {toast.toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => toast.removeToast(t.id)} />
        ))}
        <AppHeader />
        <main className="app-content">
          <div className="container" style={{ maxWidth: 800 }}>
            <section className="usuarios-section">
              <h6 className="section-title">Usuarios autorizados</h6>
              <p className="usuarios-intro small text-muted mb-3">
                Añade usuarios para Google o invita con email y contraseña (se envía por correo).
              </p>

              <div className="app-card mb-4">
                <h6 className="small fw-semibold mb-3">Invitar usuario (email + contraseña)</h6>
                <p className="usuarios-muted small mb-2">Se crea el usuario y se envía una contraseña aleatoria por email. La contraseña se guarda solo hasheada.</p>
                <form onSubmit={handleInvite} className="d-flex flex-wrap gap-2 align-items-end">
                  <div>
                    <label className="form-label usuarios-label small text-muted mb-1">Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm app-input"
                      placeholder="email@ejemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      style={{ minWidth: 220 }}
                    />
                  </div>
                  <div>
                    <label className="form-label usuarios-label small text-muted mb-1">Nombre (opcional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm app-input"
                      placeholder="Nombre"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      style={{ minWidth: 140 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={inviteLoading}>
                    {inviteLoading ? '…' : 'Enviar invitación'}
                  </button>
                </form>
              </div>

              <div className="app-card mb-4">
                <h6 className="small fw-semibold mb-3">Añadir usuario (solo Google)</h6>
                <p className="usuarios-muted small mb-2">Para que puedan entrar solo con Google. No reciben contraseña.</p>
                <form onSubmit={handleAdd} className="d-flex flex-wrap gap-2 align-items-end">
                  <div>
                    <label className="form-label usuarios-label small text-muted mb-1">Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm app-input"
                      placeholder="email@ejemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={{ minWidth: 220 }}
                    />
                  </div>
                  <div>
                    <label className="form-label usuarios-label small text-muted mb-1">Nombre (opcional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm app-input"
                      placeholder="Nombre"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{ minWidth: 140 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm" disabled={addLoading}>
                    {addLoading ? '…' : 'Añadir'}
                  </button>
                </form>
              </div>

              <div className="app-card">
                <h6 className="small fw-semibold mb-3">Tabla de usuarios</h6>
                {error && <div className="text-danger small mb-2">{error}</div>}
                {loading ? (
                  <span className="usuarios-muted small">Cargando…</span>
                ) : users.length === 0 ? (
                  <span className="usuarios-muted small">Sin usuarios</span>
                ) : (
                  <div className="table-responsive usuarios-table-wrap">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="small usuarios-th">Email</th>
                          <th className="small usuarios-th">Nombre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td className="small">{u.email}</td>
                            <td className="small usuarios-muted">{u.name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
