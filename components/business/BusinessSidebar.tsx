// components/business/BusinessSidebar.tsx
// Navegación de escritorio EXCLUSIVA de la superficie empresarial.
'use client';

import React from 'react';
import Link from 'next/link';
import { performLogout } from '@/lib/logout';

export type BusinessNavKey = 'perfil' | 'estados' | 'rifas' | 'publicidad' | 'crm' | 'kyb' | 'envivo';

export const BUSINESS_NAV_ITEMS: Array<{ key: BusinessNavKey; label: string; href: string; icon: string }> = [
  { key: 'perfil', label: 'Mi Tienda', href: '/empresario?tab=perfil', icon: '🏪' },
  { key: 'rifas', label: 'Publicar Rifa y Cartón', href: '/empresario?tab=rifas', icon: '🎟️' },
  { key: 'estados', label: 'Subir Estado (Story 24h)', href: '/empresario?tab=estados', icon: '📸' },
  { key: 'publicidad', label: 'Publicidad y Banner', href: '/empresario/publicidad', icon: '📢' },
  { key: 'crm', label: 'CRM Compradores', href: '/empresario?tab=crm', icon: '👥' },
  { key: 'kyb', label: 'Validación KYB', href: '/empresario?tab=kyb', icon: '🏢' },
  { key: 'envivo', label: 'Sorteo en Vivo', href: '/sorteo-en-vivo', icon: '🎱' },
];

export default function BusinessSidebar({ activeKey }: { activeKey?: BusinessNavKey | string }) {
  return (
    <aside className="desktop-toc-sidebar" aria-label="Navegación del portal empresarial">
      <div className="toc-section">
        <span className="toc-heading">💼 PORTAL EMPRESARIAL</span>
        <nav className="toc-nav-list">
          {BUSINESS_NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`toc-link ${activeKey === item.key ? 'active' : ''}`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="toc-section">
        <span className="toc-heading">🔐 CUENTA EMPRESARIAL</span>
        <nav className="toc-nav-list">
          <button
            type="button"
            onClick={() => void performLogout()}
            className="toc-link"
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </nav>
      </div>

      <div className="toc-pro-summary">
        <strong>⚡ Suite Empresarial</strong>
        <p>Gestiona sorteos, publicidad, validación legal y CRM de compradores desde un solo lugar.</p>
      </div>
    </aside>
  );
}
