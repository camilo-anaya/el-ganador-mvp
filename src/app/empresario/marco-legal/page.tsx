// app/empresario/marco-legal/page.tsx
// Página de Información Legal, Marco Normativo Coljuegos y Operación en Colombia
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BusinessSidebar from '@/components/business/BusinessSidebar';
import DesktopSidebar from '@/components/DesktopSidebar';
import ColjuegosLegalGuide from '@/components/ColjuegosLegalGuide';
import { useTheme } from '@/context/ThemeContext';
import { readSurface } from '@/lib/auth-role';

export default function MarcoLegalPage() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsBusiness(readSurface() === 'business');
  }, []);

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark' : ''}`}>
      {/* BARRA SUPERIOR ADAPTABLE: VOLVER A VITRINA O A PANEL SEGÚN EL USUARIO */}
      <header className="app-topbar">
        <div className="brand-cluster">
          <Link
            href={isBusiness ? "/empresario" : "/"}
            className="app-back-btn"
            title={isBusiness ? "Volver al Portal Empresarial" : "Volver a la Vitrina Principal"}
          >
            ←
          </Link>
          <div className="logo-brand">
            <span className="logo-text">EL GANADOR</span>
            <span className="logo-badge-pro">MARCO LEGAL &amp; COLJUEGOS</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title="Alternar tema Claro / Oscuro"
            aria-label="Alternar tema Claro y Oscuro"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link
            href={isBusiness ? "/empresario" : "/"}
            className="btn-back-store"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {isBusiness ? '🏪 Mi Panel' : '🏠 Vitrina'}
          </Link>
        </div>
      </header>

      <div className="desktop-workspace-grid">
        {isBusiness ? (
          <BusinessSidebar activeKey="legal" />
        ) : (
          <DesktopSidebar />
        )}

        <main className="app-scroll-canvas" style={{ paddingBottom: '120px' }}>
          {/* GUÍA LEGAL INTERACTIVA Y VISOR COLJUEGOS */}
          <ColjuegosLegalGuide />
        </main>
      </div>
    </div>
  );
}
