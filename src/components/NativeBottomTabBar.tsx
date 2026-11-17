// src/components/NativeBottomTabBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export function IosHomeIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.182V20a1 1 0 0 0 1 1h4.8a1 1 0 0 0 1-1v-4.5a1.2 1.2 0 0 1 2.4 0V20a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1v-9.818a1 1 0 0 0-.372-.781l-7-5.444a1 1 0 0 0-1.256 0l-7 5.444A1 1 0 0 0 3 10.182z"/>
    </svg>
  );
}

export function IosLiveBallIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Esfera Dorada 3D Estilo Apple iOS */}
      <circle cx="12" cy="12" r="9.5" fill="url(#iosBallGrad)" stroke={active ? '#38bdf8' : 'rgba(255,255,255,0.35)'} strokeWidth="1.2" />
      <ellipse cx="9" cy="7.5" rx="3.5" ry="1.8" fill="#ffffff" opacity="0.5" />
      {/* Símbolo Play fotorrealista */}
      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="#ffffff" />
      {/* Indicador LIVE rojo brillante Apple */}
      <circle cx="18" cy="6" r="2.8" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
      <defs>
        <radialGradient id="iosBallGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function IosTicketIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3z" />
      <circle cx="9" cy="12" r="1" fill={active ? '#000' : 'currentColor'} />
      <circle cx="12" cy="12" r="1" fill={active ? '#000' : 'currentColor'} />
      <circle cx="15" cy="12" r="1" fill={active ? '#000' : 'currentColor'} />
    </svg>
  );
}

export function IosProfileIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={active ? 'currentColor' : 'none'} />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill={active ? 'currentColor' : 'none'} />
    </svg>
  );
}

export function IosPlusIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" fill={active ? 'rgba(245, 184, 46, 0.15)' : 'none'} stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function IosStoreIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-5h16l1 5v2a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3V9z"/>
      <path d="M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/>
      <path d="M9 21v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/>
    </svg>
  );
}

interface NativeBottomTabBarProps {
  currentTab: 'explorar' | 'en-vivo' | 'boletas' | 'perfil';
  onExploreClick?: () => void;
}

export default function NativeBottomTabBar({
  currentTab,
  onExploreClick,
}: NativeBottomTabBarProps) {
  return (
    <nav
      className="native-bottom-tabbar mobile-bottom-nav"
      aria-label="Navegación inferior"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 9999,
      }}
    >
      <Link
        className={`tab-item ${currentTab === 'explorar' ? 'active' : ''}`}
        href="/"
        onClick={(e) => {
          if (onExploreClick) {
            e.preventDefault();
            onExploreClick();
          }
        }}
      >
        <span className="tab-icon">
          <IosHomeIcon active={currentTab === 'explorar'} />
        </span>
        <span className="tab-text">Explorar</span>
      </Link>

      <Link
        className={`tab-item ${currentTab === 'en-vivo' ? 'active' : ''}`}
        href="/sorteo-en-vivo"
      >
        <span className="tab-icon">
          <IosLiveBallIcon active={currentTab === 'en-vivo'} />
        </span>
        <span className="tab-text">Sorteo en Vivo</span>
      </Link>

      <Link
        className={`tab-item ${currentTab === 'boletas' ? 'active' : ''}`}
        href="/mis-boletas"
      >
        <span className="tab-icon">
          <IosTicketIcon active={currentTab === 'boletas'} />
        </span>
        <span className="tab-text">Mis Boletas</span>
      </Link>

      <Link
        className={`tab-item ${currentTab === 'perfil' ? 'active' : ''}`}
        href="/perfil"
      >
        <span className="tab-icon">
          <IosProfileIcon active={currentTab === 'perfil'} />
        </span>
        <span className="tab-text">Perfil</span>
      </Link>
    </nav>
  );
}
