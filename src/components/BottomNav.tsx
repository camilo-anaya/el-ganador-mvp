// src/components/BottomNav.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  currentTab?: 'explorar' | 'favoritos' | 'envivo' | 'boletas' | 'perfil';
  onExploreClick?: () => void;
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
    { id: 'explorar', icon: '🏠', href: '/', label: 'Explorar' },
    { id: 'favoritos', icon: '❤️', href: '/favoritos', label: 'Favoritos' },
    { id: 'envivo', icon: '🔴', href: '/sorteo-en-vivo', label: 'En Vivo' },
    { id: 'boletas', icon: '🎟️', href: '/mis-boletas', label: 'Boletas' },
    { id: 'perfil', icon: '👤', href: '/perfil', label: 'Perfil' },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes navPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.22); opacity: 0.85; }
        }
      `}</style>
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
          backgroundColor: 'rgba(18, 18, 20, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 999,
          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)',
          padding: '0 8px',
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
                width: '48px',
                height: '48px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '22px',
                textDecoration: 'none',
                borderRadius: '50%',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Efecto de pulso en el icono rojo de en vivo si está activo */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: item.id === 'envivo' && isActive ? 'navPulse 1.8s infinite ease-in-out' : 'none',
                  filter: isActive ? 'drop-shadow(0 2px 8px rgba(255,255,255,0.3))' : 'none',
                }}
              >
                {item.icon}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
