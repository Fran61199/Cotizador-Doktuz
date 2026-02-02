'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'CredentialsSignin') {
      // Mostrar el error solo después de un breve retraso para evitar parpadeo
      // cuando el login tiene éxito y la página redirige al instante
      const t = setTimeout(() => {
        setError('Credenciales inválidas. Verifica tu email y contraseña.');
      }, 150);
      return () => clearTimeout(t);
    }
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    setLoading(true);
    try {
      await signIn('credentials', {
        email: email.trim(),
        password,
        callbackUrl: '/',
        redirect: true,
      });
      // Con redirect: true, si no hay error nos redirige y no llegamos aquí.
      // Solo quitamos loading cuando hay error de conexión para poder reintentar.
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
      // Se mantiene loading para que siga mostrando "Ingresando…" hasta que pueda reintentar (p. ej. recargar).
    }
  };

  return (
    <main className="login-page">
      <div className="login-inner">
      <Link href="/" className="login-logo" aria-label="Doktuz Plus">
        <svg
          className="login-logo-svg"
          viewBox="0 0 761 271"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
        >
          <defs>
            <linearGradient id="login-doktuz-grad" x1=".31%" x2="99.95%" y1="42.69%" y2="54.65%">
              <stop stopColor="#fff" stopOpacity={0} offset="0" />
              <stop stopColor="#EF3B4C" offset=".47" />
              <stop stopColor="#EF364C" offset="1" />
            </linearGradient>
          </defs>
          <g fill="currentColor">
            <path d="m50.59 0.67h-43.41c-1.6443-0.005313-3.2235 0.64281-4.3899 1.8018-1.1665 1.159-1.8248 2.7339-1.8301 4.3782v12.47c-0.012144 1.4156 0.47667 2.79 1.38 3.88l0.3 0.3c0.1 0.1 0.2 0.3 0.39 0.4 0.11395 0.12352 0.24951 0.22519 0.4 0.3 0.11209 0.12134 0.24396 0.22278 0.39 0.3 0.3 0.2 0.59 0.3 0.89 0.5 0.1 0 0.2 0.1 0.3 0.1 0.2138 0.1134 0.4487 0.18148 0.69 0.2 0.1 0 0.19 0.1 0.29 0.1 0.35703 0.083123 0.7238 0.11677 1.09 0.1h43.42c24.008 0 43.47 19.462 43.47 43.47s-19.462 43.47-43.47 43.47h-43.42c-0.36629-0.02119-0.73368 0.012516-1.09 0.1-0.1069-0.01306-0.21387 0.023824-0.29 0.1-0.23407 0.051722-0.46455 0.11853-0.69 0.2-0.1 0-0.2 0.1-0.3 0.1-0.3168 0.12797-0.61591 0.29601-0.89 0.5-0.11005 0.12356-0.24235 0.22533-0.39 0.3-0.1 0.1-0.3 0.2-0.4 0.4l-0.69 0.69c-0.86095 1.1175-1.3442 2.4798-1.38 3.89v12.47c-1.5976e-4 3.3898 2.7303 6.1471 6.12 6.18h43.42c37.39 0 67.69-30.61 67.69-68.4s-30.3-68.3-67.6-68.3z" />
            <path d="m183.81 35.67c-27.83 0-50.33 22.73-50.33 50.85s22.5 50.85 50.33 50.85 50.32-22.73 50.32-50.85-22.5-50.85-50.32-50.85zm0 76.87c-10.538 0.10133-20.095-6.1687-24.198-15.876-4.1032-9.7071-1.9409-20.931 5.475-28.419s18.618-9.7585 28.365-5.7493c9.7463 4.0092 16.108 13.505 16.109 24.044 0.049883 14.283-11.468 25.912-25.75 26z" />
            <path d="m625.08 42c1.6e-4 -3.3898-2.7303-6.1471-6.12-6.18h-81.21c-3.3858 0.038352-6.1102 2.794-6.11 6.18v12.46c-2.17e-4 3.386 2.7242 6.1416 6.11 6.18h49l-50.13 50.65-2.57 2.6c-1.5726 1.1772-2.4871 3.0358-2.46 5v12.47c-2.17e-4 3.386 2.7242 6.1416 6.11 6.18h81.3c3.3897-0.032911 6.1202-2.7902 6.12-6.18v-12.44c1.6e-4 -3.3898-2.7303-6.1471-6.12-6.18h-48.88l50.42-50.95 2.86-2.89c1.151-1.17 1.7911-2.7487 1.78-4.39v-12.51h-0.1z" />
            <path d="m405 60.59h4c3.3897-0.032911 6.1202-2.7902 6.12-6.18v-12.41c1.6e-4 -3.3898-2.7303-6.1471-6.12-6.18h-15.8v-28.97c-0.016526-3.4219-2.7981-6.1856-6.22-6.18h-12.34c-3.3858 0.038352-6.1102 2.794-6.11 6.18v28.92h-14.8c-3.3897 0.032911-6.1202 2.7902-6.12 6.18v12.46c-1.6e-4 3.3898 2.7303 6.1471 6.12 6.18h14.8v50.85c-0.049883 14.283 11.468 25.912 25.75 26h14.72c3.3897-0.032911 6.1202-2.7902 6.12-6.18v-12.44c1.6e-4 -3.3898-2.7303-6.1471-6.12-6.18h-11.17c-2.5564-0.01099-4.6245-2.0836-4.63-4.64v-47.41h11.8z" />
            <path d="m516.24 42c1.6e-4 -3.3898-2.7303-6.1471-6.12-6.18h-12.33c-3.3897 0.032911-6.1202 2.7902-6.12 6.18v52.1c-0.016355 4.8797-1.9274 9.5623-5.33 13.06-0.40318 0.42121-0.83057 0.81855-1.28 1.19l-0.1 0.1-1.28 1c-0.1 0.1-0.2 0.1-0.3 0.2-0.37052 0.26981-0.76559 0.50418-1.18 0.7-0.2 0.1-0.3 0.2-0.49 0.2-0.34321 0.20744-0.70889 0.37519-1.09 0.5-0.18141 0.10345-0.38231 0.16815-0.59 0.19-0.4 0.1-0.69 0.3-1.09 0.4s-0.69 0.2-1 0.3-0.5 0.1-0.79 0.2-0.79 0.1-1.19 0.2c-0.19 0-0.39 0.1-0.69 0.1-0.61967 0.083117-1.245 0.11656-1.87 0.1-0.62833 0.016579-1.257-0.01686-1.88-0.1-0.2 0-0.39-0.1-0.69-0.1s-0.79-0.1-1.18-0.2c-0.23407-0.051722-0.46455-0.11853-0.69-0.2l-1-0.3c-0.39-0.1-0.69-0.3-1.09-0.4-0.19-0.1-0.39-0.1-0.59-0.19-0.39-0.2-0.69-0.3-1.08-0.5-0.2-0.1-0.3-0.2-0.5-0.2-0.39-0.2-0.79-0.5-1.18-0.7-0.1-0.1-0.2-0.1-0.3-0.2-0.44857-0.30431-0.87619-0.6384-1.28-1l-0.1-0.1c-4.2037-3.5473-6.6534-8.7499-6.71-14.25v-52.1c2.17e-4 -3.386-2.7242-6.1416-6.11-6.18h-12.31c-3.3897 0.032911-6.1202 2.7902-6.12 6.18v52.1c-0.030411 9.3219 2.947 18.405 8.49 25.9 0.80477 1.129 1.694 2.1954 2.66 3.19 2.7817 3.0851 5.9711 5.7766 9.48 8 13.652 8.3724 30.848 8.3724 44.5 0 2.3476-1.4669 4.5597-3.1402 6.61-5 2.0458-1.8665 3.8954-3.9373 5.52-6.18 5.5191-7.5149 8.4936-16.596 8.49-25.92v-52.09h-0.1z" />
            <path d="m344 112.54c-6.847 0.021965-13.406-2.752-18.16-7.68l-0.69-0.69-16.78-16.95 8.29-8.38c10.032-9.6255 15.687-22.937 15.65-36.84 1.6e-4 -3.3898-2.7303-6.1471-6.12-6.18h-12.33c-3.3897 0.032911-6.1202 2.7902-6.12 6.18 0.035547 6.8865-2.7039 13.497-7.6 18.34l-0.69 0.7-25.36 25.63v-79.82c2.17e-4 -3.386-2.7242-6.1416-6.11-6.18h-12.34c-3.3897 0.032911-6.1202 2.7902-6.12 6.18v124.34c-1.6e-4 3.3898 2.7303 6.1471 6.12 6.18h12.36c3.3858-0.038352 6.1102-2.794 6.11-6.18v-9.28l16.88-17 16.57 16.75c9.4432 10.122 22.667 15.866 36.51 15.86 3.3897-0.032911 6.1202-2.7902 6.12-6.18v-12.52c-0.036603-3.4182-2.7726-6.1941-6.19-6.28z" />
          </g>
          <path d="m761 82.21c0-4.9-3.95-8.89-8.85-8.94h-22.45v-22.63c0-4.9-3.95-8.89-8.85-8.94h-8.85c-4.9 0.05-8.85 4.04-8.85 8.94v22.49h-22.4c-4.94 0.08-8.89 4.14-8.85 9.08v8.94c0 4.9 3.95 8.89 8.85 8.94h22.25v22.49c0 4.9 3.94 8.88 8.84 8.93h8.85c4.9 0 8.85-4.03 8.85-8.93v-22.49h22.25c4.9 0 8.85-4.04 8.85-8.94v-8.94z" fill="#EF3B4C" />
          <path d="m710.88 168.5c0.02-1.6-1.13-2.97-2.71-3.23h-0.32c-2.29 0-4.51 1.6-5.94 2.63-25.47 18.45-270.13 182-633 13.91-0.82-0.37-1.71-0.55-2.61-0.54h-7.66c-3.85 0-5.55 2.81-2.61 4.31 54.9 27.91 365.95 181.86 648.85-10.18 1.57-1.09 6.12-4.21 6-6.9z" fill="url(#login-doktuz-grad)" />
        </svg>
      </Link>

      <button
        type="button"
        className="login-btn-google"
        onClick={() => signIn('google', { callbackUrl: '/' })}
      >
        <svg className="login-google-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917" />
          <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917" />
        </svg>
        Inicio de sesión con Google
      </button>

      <div className="login-divider">O</div>

      <form className="login-form" onSubmit={handleCredentialsSubmit}>
        <label htmlFor="email" className="login-label">Email:</label>
        <input
          id="email"
          type="email"
          className="login-input"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password" className="login-label">Contraseña:</label>
        <div className="login-input-wrap">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="login-input login-input-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg className="login-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="login-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <div className="login-forgot-row">
          <Link href="/olvide-clave" className="login-forgot">
            Olvidé mi contraseña
          </Link>
        </div>
        {error && (
          <p className="login-error">
            {error}
            {error.includes('conectar') && loading && (
              <> — <button type="button" className="login-retry" onClick={() => { setError(''); setLoading(false); }}>Reintentar</button></>
            )}
          </p>
        )}
        <button type="submit" className="login-btn-submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Iniciar Sesión'}
        </button>
        <p className="login-register-link">
          ¿No tienes cuenta? <Link href="/registro">Registrarse</Link>
        </p>
      </form>
      </div>
    </main>
  );
}
