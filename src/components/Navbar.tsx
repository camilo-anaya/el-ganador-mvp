// src/components/Navbar.tsx
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
          }}
        >
          ≡
        </button>
        <div>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              margin: 0,
              color: 'var(--text-primary, #fff)',
              letterSpacing: '0.6px',
            }}
          >
            EL GANADOR
          </h1>
        </div>
      </div>

      {/* Campana de Notificaciones (Tema trasladado al perfil) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={onNotificationClick}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            position: 'relative',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🔔
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
