// components/DesktopSidebar.tsx
// Navegación de escritorio EXCLUSIVA de la superficie CLIENTE.
// La navegación empresarial vive en components/business/BusinessSidebar.tsx.
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { performLogout } from '@/lib/logout';
import { readSurface } from '@/lib/auth-role';

export default function DesktopSidebar() {
  const pathname = usePathname();
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => {
    setIsBusiness(readSurface() === 'business');
  }, []);

  return (
    <aside className="desktop-toc-sidebar" aria-label="Tabla de contenido y navegación rápida">
      {isBusiness && (
        <div className="toc-section" style={{ background: 'rgba(56, 189, 248, 0.08)', borderRadius: '12px', padding: '10px', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '14px' }}>
          <span className="toc-heading" style={{ color: '#38bdf8' }}>💼 MI PORTAL EMPRESARIAL</span>
          <nav className="toc-nav-list">
            <Link
              href="/empresario"
              className="toc-link"
              style={{ color: '#38bdf8', fontWeight: 800, background: 'rgba(56, 189, 248, 0.12)' }}
            >
              <span>🏪</span> Volver a Mi Tienda / Panel
            </Link>
          </nav>
        </div>
      )}
      {/* Bloque 1: Navegación general de la vitrina */}
      <div className="toc-section">
        <span className="toc-heading">📌 ACCESOS Y VITRINA</span>
        <nav className="toc-nav-list">
          <Link href="/" className={`toc-link ${pathname === '/' ? 'active' : ''}`}>
            <span>🏠</span> Inicio / Vitrina General
          </Link>
          <Link href="/favoritos" className={`toc-link ${pathname === '/favoritos' ? 'active' : ''}`}>
            <span>⭐</span> Mis Favoritos &amp; Seguidos
          </Link>
          <Link
            href="/sorteo-en-vivo?mode=demo"
            className={`toc-link ${pathname === '/sorteo-en-vivo' ? 'active' : ''}`}
          >
            <span>🎮</span> Demo Interactiva (Balotera/Ruleta)
          </Link>

          <a href="/#estacion-historias" className="toc-link sub-link">
            <span>⭕</span> Historias de Tiendas
          </a>
          <a href="/#estacion-en-vivo" className="toc-link sub-link">
            <span>🔴</span> Sorteos en Vivo (Sala 3D)
          </a>
          <a href="/#estacion-urgentes" className="toc-link sub-link">
            <span>⏳</span> A pocas horas de jugar
          </a>
          <a href="/#estacion-proximos" className="toc-link sub-link">
            <span>🎟️</span> Próximos Sorteos Activos
          </a>
        </nav>
      </div>

      {/* Bloque 2: Zona del cliente */}
      <div className="toc-section">
        <span className="toc-heading">👤 MI CUENTA</span>
        <nav className="toc-nav-list">
          <Link
            href="/favoritos"
            className={`toc-link ${pathname === '/favoritos' ? 'active' : ''}`}
          >
            <span>❤️</span> Mis Empresas y Favoritos
          </Link>
          <Link
            href="/mis-boletas"
            className={`toc-link ${pathname === '/mis-boletas' ? 'active' : ''}`}
          >
            <span>🎟️</span> Mis Boletas y Certificados
          </Link>
          <Link
            href="/perfil"
            className={`toc-link ${pathname === '/perfil' ? 'active' : ''}`}
          >
            <span>⚙️</span> Perfil y Ajustes
          </Link>
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
              marginTop: '6px',
            }}
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </nav>
      </div>

      <div className="toc-pro-summary">
        <strong>⚡ Modo Escritorio Activo</strong>
        <p>Explora sorteos, sigue tiendas y gestiona tus boletas con vista extendida en PC/Tablet.</p>
      </div>
    </aside>
  );
}
