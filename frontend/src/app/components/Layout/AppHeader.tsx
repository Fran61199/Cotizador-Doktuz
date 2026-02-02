'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';

type AppHeaderProps = {
  onGenerate?: () => void;
  generating?: boolean;
};

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function AppHeader({ onGenerate, generating }: AppHeaderProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement | null>(null);

  const updateDropdownPosition = () => {
    if (profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: typeof window !== 'undefined' ? window.innerWidth - rect.right : 0,
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inTrigger = dropdownRef.current?.contains(target);
      const inDropdown = dropdownContentRef.current?.contains(target);
      if (!inTrigger && !inDropdown) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (dropdownOpen && profileButtonRef.current) {
      updateDropdownPosition();
      const onScrollOrResize = () => {
        updateDropdownPosition();
      };
      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('resize', onScrollOrResize);
      return () => {
        window.removeEventListener('scroll', onScrollOrResize, true);
        window.removeEventListener('resize', onScrollOrResize);
      };
    }
  }, [dropdownOpen]);

  const displayName = session?.user?.name || session?.user?.email || 'Usuario';

  const dropdownContent = dropdownOpen ? (
    <div
      ref={(el) => { dropdownContentRef.current = el; }}
      className="app-nav-profile-dropdown app-nav-profile-dropdown-portal"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        right: dropdownPosition.right,
        left: 'auto',
        minWidth: 240,
      }}
    >
      <div className="app-nav-profile-item app-nav-profile-item-name">
        <span className="app-nav-profile-icon">
          <IconGear />
        </span>
        <div className="app-nav-profile-name-block">
          <span className="app-nav-profile-label">Mi perfil</span>
          <span className="app-nav-profile-value">{displayName}</span>
        </div>
      </div>
      <Link
        href="/pruebas"
        className="app-nav-profile-item app-nav-profile-link"
        onClick={() => setDropdownOpen(false)}
      >
        <span className="app-nav-profile-icon">
          <IconDocument />
        </span>
        <span>Pruebas</span>
      </Link>
      <Link
        href="/usuarios"
        className="app-nav-profile-item app-nav-profile-link"
        onClick={() => setDropdownOpen(false)}
      >
        <span className="app-nav-profile-icon">
          <IconUsers />
        </span>
        <span>Usuarios</span>
      </Link>
      <button
        type="button"
        className="app-nav-profile-item app-nav-profile-link app-nav-profile-signout"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        <span className="app-nav-profile-icon">
          <IconLogout />
        </span>
        <span>Cerrar sesión</span>
      </button>
    </div>
  ) : null;

  return (
    <nav className="app-nav-doktuz">
      <div className="app-nav-inner">
        <Link href="/" className="app-nav-brand" aria-label="Inicio">
          <svg
            className="app-nav-logo"
            viewBox="0 0 761 271"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
          >
            <defs>
              <linearGradient id="doktuz-gradient" x1=".31%" x2="99.95%" y1="42.69%" y2="54.65%">
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
            <path d="m710.88 168.5c0.02-1.6-1.13-2.97-2.71-3.23h-0.32c-2.29 0-4.51 1.6-5.94 2.63-25.47 18.45-270.13 182-633 13.91-0.82-0.37-1.71-0.55-2.61-0.54h-7.66c-3.85 0-5.55 2.81-2.61 4.31 54.9 27.91 365.95 181.86 648.85-10.18 1.57-1.09 6.12-4.21 6-6.9z" fill="url(#doktuz-gradient)" />
          </svg>
          <span className="app-nav-text">Cotizador EMOs</span>
        </Link>

        <div className="app-nav-actions">
          {onGenerate != null && (
            <button
              className="app-nav-btn-generate"
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? 'Generando…' : '⬇ Generar ZIP'}
            </button>
          )}

          <button
            type="button"
            className="app-nav-profile-btn app-nav-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          >
            <span className="app-nav-profile-avatar">
              {theme === 'light' ? <IconMoon /> : <IconSun />}
            </span>
          </button>

          <div className="app-nav-profile-wrap" ref={dropdownRef}>
            <button
              ref={profileButtonRef}
              type="button"
              className="app-nav-profile-btn"
              onClick={() => {
                if (!dropdownOpen) updateDropdownPosition();
                setDropdownOpen((o) => !o);
              }}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <span className="app-nav-profile-avatar">
                <IconUser />
              </span>
            </button>
            {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
          </div>
        </div>
      </div>
    </nav>
  );
}
