// components/business/BusinessBottomNav.tsx
// Barra inferior flotante EXCLUSIVA de la superficie empresarial.
// Mismo lenguaje visual (glassmorphism) que la del cliente, pero con rutas,
// iconos y acciones propias de un comercio. No importa nada del lado cliente.
'use client';

import React from 'react';
import Link from 'next/link';
import type { BusinessNavKey } from './BusinessSidebar';

type Props = { activeKey?: BusinessNavKey | string };

const STROKE = 'rgba(255, 255, 255, 0.72)';
const ACTIVE = '#38bdf8';

function Icon({ name, active }: { name: BusinessNavKey; active: boolean }) {
  const c = active ? ACTIVE : STROKE;
  const common = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'marketplace':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...common} d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9.5Z" />
          <path {...common} d="M9 21V12H15V21" />
        </svg>
      );
    case 'perfil':
      return (
        <svg width="23" height="23" viewBox="0 0 24 24">
          <path {...common} d="M3 9L5 4H19L21 9M3 9V11C3 12.1 3.9 13 5 13C6.1 13 7 12.1 7 11C7 12.1 7.9 13 9 13C10.1 13 11 12.1 11 11C11 12.1 11.9 13 13 13C14.1 13 15 12.1 15 11C15 12.1 15.9 13 17 13C18.1 13 19 12.1 19 11V9M5 13V20H19V13" />
        </svg>
      );
    case 'rifas':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} strokeWidth={2} d="M12 8V16M8 12H16" />
        </svg>
      );
    case 'publicidad':
      return (
        <svg width="23" height="23" viewBox="0 0 24 24">
          <path {...common} stroke={active ? ACTIVE : '#f5b82e'} d="M3 11V13C3 14.1 3.9 15 5 15H7L12 19V5L7 9H5C3.9 9 3 9.9 3 11Z" />
          <path {...common} stroke={active ? ACTIVE : '#f5b82e'} d="M16 9.5C17.2 10.7 17.2 13.3 16 14.5M19 7C21.5 9.8 21.5 14.2 19 17" />
        </svg>
      );
    case 'crm':
      return (
        <svg width="23" height="23" viewBox="0 0 24 24">
          <circle {...common} cx="9" cy="8" r="3.5" />
          <path {...common} d="M2.5 20C2.5 16.7 5.4 14.5 9 14.5C12.6 14.5 15.5 16.7 15.5 20" />
          <path {...common} d="M16 5.2C17.8 5.6 19 7 19 8.8C19 10.4 18 11.7 16.5 12.2M18.5 14.8C20.3 15.5 21.5 17.1 21.5 19.5" />
        </svg>
      );
    default:
      return (
        <svg width="25" height="25" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="9.5" fill="rgba(255,255,255,0.08)" stroke={c} strokeWidth="1.6" />
          <path d="M12 10.5L18 14L12 17.5V10.5Z" fill="#ffffff" />
          <circle cx="21" cy="7" r="3" fill="#ff3b30" stroke="#ffffff" strokeWidth="1.2" />
        </svg>
      );
  }
}

const ITEMS: Array<{ key: BusinessNavKey; label: string; href: string }> = [
  { key: 'marketplace', label: 'Vitrina', href: '/' },
  { key: 'perfil', label: 'Mi Tienda', href: '/empresario?tab=perfil' },
  { key: 'rifas', label: 'Crear Rifa', href: '/empresario?tab=rifas' },
  { key: 'publicidad', label: 'Publicidad', href: '/empresario/publicidad' },
  { key: 'crm', label: 'Clientes', href: '/empresario?tab=crm' },
  { key: 'envivo', label: 'En Vivo', href: '/sorteo-en-vivo' },
];

export default function BusinessBottomNav({ activeKey }: Props) {
  return (
    <nav
      className="floating-island-nav business-bottom-nav"
      aria-label="Navegación empresarial"
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '94%',
        maxWidth: '430px',
        height: '64px',
        backgroundColor: 'rgba(18, 18, 20, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 999,
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
        padding: '0 4px',
        boxSizing: 'border-box',
      }}
    >
      {ITEMS.map((item) => {
        const active = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              textDecoration: 'none',
              backgroundColor: active ? 'rgba(2, 132, 199, 0.22)' : 'transparent',
              border: active ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
              transform: active ? 'scale(1.06)' : 'scale(1)',
              transition: 'all 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon name={item.key} active={active} />
            {active && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: ACTIVE,
                  boxShadow: `0 0 8px ${ACTIVE}`,
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
