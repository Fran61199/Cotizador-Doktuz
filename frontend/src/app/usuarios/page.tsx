'use client';

import { useState, useEffect, useCallback } from 'react';
import AppHeader from '../components/Layout/AppHeader';
import AuthGuard from '../components/AuthGuard';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { getUsers, inviteUser } from '@/api';
import type { UserItem } from '@/api';
import { getApiError } from '@/api';

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function UsuariosPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterEmail, setFilterEmail] = useState('');
  const [filterName, setFilterName] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
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

  const filteredUsers = users.filter((u) => {
    const e = (u.email || '').toLowerCase();
    const n = (u.name || '').toLowerCase();
    const fe = filterEmail.trim().toLowerCase();
    const fn = filterName.trim().toLowerCase();
    if (fe && !e.includes(fe)) return false;
    if (fn && !n.includes(fn)) return false;
    return true;
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      toast.error('Email obligatorio');
      return;
    }
    setInviteLoading(true);
    try {
      const res = await inviteUser(email, inviteName.trim() || undefined);
      setInviteEmail('');
      setInviteName('');
      if (res.email_sent) {
        toast.success('Usuario creado. Se envió la contraseña por email (revisa spam).');
      } else {
        toast.success('Usuario creado. No se pudo enviar el correo; puede usar Olvidé mi contraseña.');
      }
      loadUsers();
    } catch (err) {
      toast.error(getApiError(err).detail || 'No se pudo invitar');
    } finally {
      setInviteLoading(false);
    }
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setInviteEmail('');
    setInviteName('');
  };

  return (
    <AuthGuard>
      <div className="usuarios-page">
        {toast.toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => toast.removeToast(t.id)} />
        ))}
        <AppHeader />
        <main className="app-content">
          <div className="container usuarios-container">
            <header className="usuarios-header">
              <h1 className="usuarios-title">
                <span className="usuarios-title-icon" aria-hidden>
                  <IconUsers />
                </span>
                Usuarios
              </h1>
              <button type="button" className="btn btn-primary usuarios-btn-add" onClick={() => setAddModalOpen(true)}>
                Añadir usuario
              </button>
            </header>

            <div className="app-card usuarios-table-card">
              {error && <div className="usuarios-error text-danger small mb-2">{error}</div>}
              {loading ? (
                <div className="usuarios-loading text-muted small py-4">Cargando…</div>
              ) : (
                <div className="usuarios-table-wrap">
                  <table className="table table-sm usuarios-table mb-0">
                    <thead>
                      <tr>
                        <th className="usuarios-th">Usuario</th>
                        <th className="usuarios-th">Nombre</th>
                      </tr>
                      <tr className="usuarios-filter-row">
                        <th>
                          <input
                            type="text"
                            className="form-control form-control-sm app-input usuarios-filter-input"
                            placeholder="Buscar…"
                            value={filterEmail}
                            onChange={(e) => setFilterEmail(e.target.value)}
                            aria-label="Filtrar por usuario (email)"
                          />
                        </th>
                        <th>
                          <input
                            type="text"
                            className="form-control form-control-sm app-input usuarios-filter-input"
                            placeholder="Buscar…"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            aria-label="Filtrar por nombre"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="usuarios-empty text-muted small text-center py-4">
                            {users.length === 0 ? 'Sin usuarios' : 'Ningún resultado con los filtros aplicados'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id}>
                            <td className="usuarios-cell-email">{u.email}</td>
                            <td className="usuarios-cell-name">{u.name || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {addModalOpen && (
          <div className="modal show d-block usuarios-add-modal" role="dialog" aria-labelledby="usuarios-add-title" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered usuarios-add-dialog">
              <div className="modal-content usuarios-add-content">
                <div className="modal-header usuarios-add-header">
                  <h5 id="usuarios-add-title" className="modal-title usuarios-add-title">Añadir usuario</h5>
                  <button type="button" className="btn-close" onClick={closeAddModal} aria-label="Cerrar" />
                </div>
                <div className="modal-body usuarios-add-body">
                  <section className="usuarios-add-section">
                    <p className="usuarios-add-section-desc mb-2">
                      Se crea el usuario y se envía una contraseña aleatoria por correo.
                    </p>
                    <form onSubmit={handleInvite} className="usuarios-add-form">
                      <div className="usuarios-add-form-grid">
                        <div className="usuarios-add-field">
                          <label className="form-label usuarios-add-label">Correo electrónico</label>
                          <input
                            type="email"
                            className="form-control form-control-sm app-input"
                            placeholder="Correo electrónico"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="usuarios-add-field">
                          <label className="form-label usuarios-add-label">Nombres (opcional)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm app-input"
                            placeholder="Nombres"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="usuarios-add-form-actions">
                        <button type="submit" className="btn btn-primary usuarios-add-btn-submit" disabled={inviteLoading}>
                          {inviteLoading ? 'Enviando…' : 'Enviar invitación'}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
                <div className="modal-footer usuarios-add-footer">
                  <button type="button" className="btn btn-secondary usuarios-add-btn-cancel" onClick={closeAddModal}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
