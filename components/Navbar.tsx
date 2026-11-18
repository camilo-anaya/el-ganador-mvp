// src/components/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
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
    <header
      className="native-top-navbar"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'max(env(safe-area-inset-top), 16px) 16px 12px 16px',
        backgroundColor: 'var(--bg-color, #000)',
        borderBottom: '1px solid var(--border-color, #222)',
        boxSizing: 'border-box',
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          aria-label="Menú principal"
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary, #fff)',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ≡
        </button>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1
            style={{
              fontSize: '15px',
              fontWeight: 'bold',
              margin: 0,
              color: 'var(--text-primary, #fff)',
              lineHeight: '1.2',
            }}
          >
            EL GANADOR
          </h1>
          <small style={{ fontSize: '10px', color: '#888', display: 'block' }}>
            Marketplace de Sorteos
          </small>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            background: theme === 'dark' ? '#1a1a1a' : '#f1f5f9',
            padding: '4px 8px',
            borderRadius: '999px',
            display: 'flex',
            gap: '4px',
            border: theme === 'dark' ? '1px solid #333' : '1px solid #cbd5e1',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setThemePreference('light')}
            aria-label="Modo Claro"
            style={{
              background: theme === 'light' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '999px',
              fontSize: '12px',
              padding: '2px 6px',
              cursor: 'pointer',
              boxShadow: theme === 'light' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            ☀️
          </button>
          <button
            type="button"
            onClick={() => setThemePreference('dark')}
            aria-label="Modo Oscuro"
            style={{
              background: theme === 'dark' ? '#d4af37' : 'transparent',
              border: 'none',
              borderRadius: '999px',
              fontSize: '12px',
              padding: '2px 6px',
              cursor: 'pointer',
              boxShadow: theme === 'dark' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
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
            position: 'relative',
            padding: '4px',
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
