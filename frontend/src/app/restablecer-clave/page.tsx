'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { resetPassword, getApiError } from '@/api';

function RestablecerClaveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!token) {
      setError('Falta el enlace. Solicita uno nuevo desde Olvidé mi contraseña.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      router.push('/login?reset=1');
    } catch (err) {
      setError(getApiError(err).detail || 'No se pudo restablecer.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="login-page">
        <div className="login-inner">
          <Link href="/login" className="login-back-link">← Iniciar sesión</Link>
          <h1 className="login-title">Restablecer contraseña</h1>
          <p className="login-error">Falta el enlace. Solicita uno nuevo desde <Link href="/olvide-clave">Olvidé mi contraseña</Link>.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-inner">
        <Link href="/login" className="login-back-link">← Iniciar sesión</Link>
        <h1 className="login-title">Nueva contraseña</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="password" className="login-label">Nueva contraseña</label>
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <label htmlFor="confirmPassword" className="login-label">Repetir contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            className="login-input"
            placeholder="Repetir contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn-submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function RestablecerClavePage() {
  return (
    <Suspense fallback={
      <main className="login-page">
        <div className="login-inner"><p className="login-intro">Cargando…</p></div>
      </main>
    }>
      <RestablecerClaveContent />
    </Suspense>
  );
}
