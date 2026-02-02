'use client';

import Link from 'next/link';
import { useState } from 'react';
import { forgotPassword, getApiError } from '@/api';

export default function OlvideClavePage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(getApiError(err).detail || 'No se pudo enviar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-inner">
        <Link href="/login" className="login-back-link">← Iniciar sesión</Link>
        <h1 className="login-title">Olvidé mi contraseña</h1>
        <p className="login-intro">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
        {success ? (
          <p className="login-success-msg">
            Si el correo existe, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).
          </p>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email" className="login-label">Email</label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn-submit" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        )}
        <p className="login-register-link">
          <Link href="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    </main>
  );
}
