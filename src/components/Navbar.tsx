// src/components/Navbar.tsx
'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme, setThemePreference } = useTheme();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'max(env(safe-area-inset-top), 12px) 16px 10px 16px',
      backgroundColor: 'var(--bg-color, #000)',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Logo y Nombre Limpio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          aria-label="Menú"
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary, #fff)',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ≡
        </button>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary, #fff)', letterSpacing: '0.5px' }}>
            EL GANADOR
          </h1>
        </div>
      </div>

      {/* Controles de Tema (Claro / Oscuro) y Notificaciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'var(--card-bg, #1a1a1a)', padding: '3px 6px', borderRadius: '999px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => setThemePreference && setThemePreference('light')}
            aria-label="Modo Claro"
            style={{
              background: theme === 'light' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '999px',
              fontSize: '11px',
              padding: theme === 'light' ? '2px 5px' : '0',
              cursor: 'pointer'
            }}
          >
            ☀️
          </button>
          <button
            type="button"
            onClick={() => setThemePreference && setThemePreference('dark')}
            aria-label="Modo Oscuro"
            style={{
              background: theme === 'dark' ? '#d4af37' : 'transparent',
              border: 'none',
              borderRadius: '999px',
              fontSize: '11px',
              padding: '2px 5px',
              cursor: 'pointer'
            }}
          >
            🌙
          </button>
        </div>
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={onNotificationClick}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%'
              }}
            />
          )}
        </button>
      </div>
    </header>
  );
}
