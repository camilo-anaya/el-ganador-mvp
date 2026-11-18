// src/components/BottomNav.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  currentTab?: 'explorar' | 'favoritos' | 'envivo' | 'boletas' | 'perfil';
  onExploreClick?: () => void;
}

/* =========================================================================
   ICONOS VECTORIALES PREMIUM (GAMA AZUL ELÉCTRICO / ROYAL SAPPHIRE)
   ========================================================================= */

function NavHomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3.5L21 10.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V15C14 14.4477 13.5523 14 13 14H11C10.4477 14 10 14.4477 10 15V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        fill={active ? 'url(#homeBlueGrad)' : 'none'}
        stroke={active ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="homeBlueGrad" x1="12" y1="3.5" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NavHeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={active ? 'url(#heartRubyGrad)' : 'none'}
        stroke={active ? '#ff3b30' : 'rgba(255, 255, 255, 0.65)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="heartRubyGrad" x1="12" y1="3" x2="12" y2="21.35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff6b6b" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NavLiveIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      {/* Radar de pulso de transmisión */}
      {active && (
        <circle cx="14" cy="14" r="12" stroke="#ff3b30" strokeWidth="1.2" opacity="0.45">
          <animate attributeName="r" values="10;13;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Esfera 3D brillante */}
      <circle
        cx="14"
        cy="14"
        r="9.5"
        fill={active ? 'url(#liveRubyGrad)' : 'rgba(255, 255, 255, 0.08)'}
        stroke={active ? '#ff3b30' : 'rgba(255, 255, 255, 0.65)'}
        strokeWidth="1.6"
      />
      {/* Reflejo de luz */}
      <ellipse cx="11.5" cy="9.5" rx="3.5" ry="1.8" fill="#ffffff" opacity={active ? 0.5 : 0.2} />
      {/* Símbolo Play */}
      <path d="M12 10.5L18 14L12 17.5V10.5Z" fill="#ffffff" />
      {/* Indicador rojo parpadeante de señal viva */}
      <circle cx="21" cy="7" r="3" fill="#ff3b30" stroke="#ffffff" strokeWidth="1.2" />
      <defs>
        <radialGradient id="liveRubyGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff7b7b" />
          <stop offset="55%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function NavTicketIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 9C3.10457 9 4 8.10457 4 7V5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 8.10457 20.8954 9 22 9V15C20.8954 15 20 15.8954 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17C4 15.8954 3.10457 15 2 15V9Z"
        fill={active ? 'url(#ticketBlueGrad)' : 'none'}
        stroke={active ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Estrella grabada de autenticidad VIP */}
      <path
        d="M12 8.5L12.9 10.3L15 10.6L13.5 12.1L13.8 14.1L12 13.1L10.2 14.1L10.5 12.1L9 10.6L11.1 10.3L12 8.5Z"
        fill={active ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
      />
      <defs>
        <linearGradient id="ticketBlueGrad" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NavProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="4"
        fill={active ? 'url(#profileBlueGrad)' : 'none'}
        stroke={active ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
        fill={active ? 'url(#profileBlueGrad)' : 'none'}
        stroke={active ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Corona minimalista superior en azul eléctrico */}
      {active && (
        <path
          d="M10 2L12 3.5L14 2L13.5 4.5H10.5L10 2Z"
          fill="#38bdf8"
        />
      )}
      <defs>
        <linearGradient id="profileBlueGrad" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function BottomNav({ currentTab: propTab, onExploreClick }: BottomNavProps = {}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>('explorar');

  // Sincronizar automáticamente la pestaña activa con la ruta actual
  useEffect(() => {
    if (propTab) {
      setActiveTab(propTab);
      return;
    }
    if (!pathname || pathname === '/') {
      setActiveTab('explorar');
    } else if (pathname.startsWith('/favoritos')) {
      setActiveTab('favoritos');
    } else if (pathname.startsWith('/sorteo-en-vivo')) {
      setActiveTab('envivo');
    } else if (pathname.startsWith('/mis-boletas')) {
      setActiveTab('boletas');
    } else if (pathname.startsWith('/perfil') || pathname.startsWith('/empresario')) {
      setActiveTab('perfil');
    }
  }, [pathname, propTab]);

  const navItems = [
    { id: 'explorar', renderIcon: (active: boolean) => <NavHomeIcon active={active} />, href: '/', label: 'Explorar' },
    { id: 'favoritos', renderIcon: (active: boolean) => <NavHeartIcon active={active} />, href: '/favoritos', label: 'Favoritos' },
    { id: 'envivo', renderIcon: (active: boolean) => <NavLiveIcon active={active} />, href: '/sorteo-en-vivo', label: 'En Vivo' },
    { id: 'boletas', renderIcon: (active: boolean) => <NavTicketIcon active={active} />, href: '/mis-boletas', label: 'Boletas' },
    { id: 'perfil', renderIcon: (active: boolean) => <NavProfileIcon active={active} />, href: '/perfil', label: 'Perfil' },
  ];

  return (
    <nav
      className="floating-island-nav"
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '400px',
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
        padding: '0 6px',
        boxSizing: 'border-box',
      }}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.label}
            onClick={(e) => {
              setActiveTab(item.id);
              if (item.id === 'explorar' && onExploreClick && pathname === '/') {
                e.preventDefault();
                onExploreClick();
              }
            }}
            style={{
              position: 'relative',
              width: '50px',
              height: '50px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textDecoration: 'none',
              borderRadius: '50%',
              backgroundColor: isActive ? 'rgba(2, 132, 199, 0.18)' : 'transparent',
              border: isActive ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent',
              transition: 'background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
              transform: isActive ? 'scale(1.06)' : 'scale(1)',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {item.renderIcon(isActive)}

            {/* Micro-LED activo en Azul Eléctrico (#38bdf8) / Rojo (#ff3b30) para En Vivo */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: item.id === 'envivo' ? '#ff3b30' : '#38bdf8',
                  boxShadow: item.id === 'envivo' ? '0 0 8px #ff3b30' : '0 0 8px #38bdf8',
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
