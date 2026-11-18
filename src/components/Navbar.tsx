'use client';

import React from 'react';

interface NavbarProps {
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  unreadCount?: number;
}

export default function Navbar({
  onMenuClick,
  onNotificationClick,
  unreadCount = 0,
}: NavbarProps) {
  return (
    <header
      className="app-topbar main-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'max(calc(env(safe-area-inset-top, 0px) + 16px), 54px) 16px 12px 16px',
        backgroundColor: 'var(--bg-color, #000)',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
        width: '100%',
        boxSizing: 'border-box',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
    >
      {/* Logo y Menú */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          aria-label="Menú"
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary, #fff)',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '2px 4px',
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          ≡
        </button>
        <div>
          <h1
            style={{
              fontSize: '17px',
              fontWeight: 900,
              margin: 0,
              color: 'var(--text-primary, #fff)',
              letterSpacing: '-0.2px',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              lineHeight: 1.1,
              filter: 'none',
            }}
          >
            EL GANADOR
          </h1>
        </div>
      </div>

      {/* Campana de Notificaciones Recta y Símétrica (Tema en el perfil) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={onNotificationClick}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block', color: 'var(--text-primary, #fff)' }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
      </div>
    </header>
  );
}
