'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { register as registerApi, getApiError } from '@/api';

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
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
    setLoading(true);
    try {
      await registerApi({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      router.push('/login?registered=1');
    } catch (err) {
      const apiErr = getApiError(err);
      const msg = apiErr.detail || apiErr.message || 'No se pudo registrar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-inner">
        <Link href="/login" className="login-back-link">← Iniciar sesión</Link>
        <h1 className="login-title">Registrarse</h1>
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
          <label htmlFor="name" className="login-label">Nombre (opcional)</label>
          <input
            id="name"
            type="text"
            className="login-input"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="password" className="login-label">Contraseña</label>
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
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="login-btn-submit" disabled={loading}>
            {loading ? 'Registrando…' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </main>
  );
}
