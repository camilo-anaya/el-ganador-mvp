// src/components/DesktopSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DesktopSidebarProps {
  activeEmpresarioTab?:
    | 'resumen'
    | 'crear'
    | 'clientes'
    | 'sala3d'
    | 'perfil'
    | 'estados'
    | 'pauta'
    | 'rifas'
    | 'crm'
    | 'kyb'
    | string;
  onSelectEmpresarioTab?: (tab: any) => void;
}

export default function DesktopSidebar({
  activeEmpresarioTab,
  onSelectEmpresarioTab,
}: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="desktop-toc-sidebar" aria-label="Tabla de contenido y navegación rápida">
      {/* Bloque 1: Navegación General y Acciones Rápidas */}
      <div className="toc-section">
        <span className="toc-heading">📌 ACCESOS Y VITRINA</span>
        <nav className="toc-nav-list">
          <Link href="/" className={`toc-link ${pathname === '/' ? 'active' : ''}`}>
            <span>🏠</span> Inicio / Vitrina General
          </Link>

          {/* ACCESOS DIRECTOS EMPRESARIALES DEBAJO DE INICIO */}
          <Link
            href="/empresario?tab=crear"
            onClick={() => onSelectEmpresarioTab && onSelectEmpresarioTab('crear')}
            className={`toc-link highlight-action ${
              pathname === '/empresario' &&
              (activeEmpresarioTab === 'crear' || activeEmpresarioTab === 'rifas')
                ? 'active'
                : ''
            }`}
          >
            <span>➕</span> Publicar Rifa o Cartón
          </Link>
          <Link
            href="/empresario?tab=estados"
            onClick={() => onSelectEmpresarioTab && onSelectEmpresarioTab('estados')}
            className={`toc-link highlight-action ${
              pathname === '/empresario' && activeEmpresarioTab === 'estados' ? 'active' : ''
            }`}
          >
            <span>📸</span> Subir Estado (Story)
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

      {/* Bloque: Planes Publicitarios Unificados */}
      <div className="toc-section">
        <span className="toc-heading">📢 PUBLICIDAD</span>
        <nav className="toc-nav-list">
          <Link
            href="/publicidad"
            className={`toc-link highlight-action ${pathname === '/publicidad' ? 'active' : ''}`}
          >
            <span>📢</span> Planes Publicitarios
          </Link>
        </nav>
      </div>

      {/* Bloque 2: Suite de Trabajo para Empresarios (PC / Tablet) */}
      <div className="toc-section">
        <span className="toc-heading">💼 PANEL EMPRESARIAL (B2B)</span>
        <nav className="toc-nav-list">
          {pathname === '/empresario' && onSelectEmpresarioTab ? (
            <>
              <button
                type="button"
                onClick={() => onSelectEmpresarioTab('resumen')}
                className={`toc-link ${
                  activeEmpresarioTab === 'resumen' || activeEmpresarioTab === 'perfil'
                    ? 'active'
                    : ''
                }`}
              >
                <span>📊</span> Mis Sorteos y Ventas
              </button>
              <button
                type="button"
                onClick={() => onSelectEmpresarioTab('crear')}
                className={`toc-link ${
                  activeEmpresarioTab === 'crear' || activeEmpresarioTab === 'rifas' ? 'active' : ''
                }`}
              >
                <span>➕</span> Publicar Nuevo Sorteo
              </button>
              <button
                type="button"
                onClick={() => onSelectEmpresarioTab('sala3d')}
                className={`toc-link ${activeEmpresarioTab === 'sala3d' ? 'active' : ''}`}
              >
                <span>🎱</span> Control Sala 3D
              </button>
              <button
                type="button"
                onClick={() => onSelectEmpresarioTab('clientes')}
                className={`toc-link ${
                  activeEmpresarioTab === 'clientes' || activeEmpresarioTab === 'crm'
                    ? 'active'
                    : ''
                }`}
              >
                <span>👥</span> CRM Compradores
              </button>
            </>
          ) : (
            <>
              <Link href="/empresario" className="toc-link">
                <span>🏪</span> Abrir Panel de Empresario
              </Link>
            </>
          )}
          <Link href="/sorteo-en-vivo" className="toc-link">
            <span>🎱</span> Balotera & Ruleta en Vivo
          </Link>
        </nav>
      </div>

      {/* Bloque 3: Zona del Cliente */}
      <div className="toc-section">
        <span className="toc-heading">👤 MI CUENTA</span>
        <nav className="toc-nav-list">
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
        </nav>
      </div>

      <div className="toc-pro-summary">
        <strong>⚡ Modo Escritorio Activo</strong>
        <p>Gestiona tus sorteos, validaciones legales y CRM de compradores con vista extendida en PC/Tablet.</p>
      </div>
    </aside>
  );
}
