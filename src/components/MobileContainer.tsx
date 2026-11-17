// components/MobileContainer.tsx
'use client';

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function MobileContainer({ children, className = '', style }: ContainerProps) {
  return (
    <div
      className={`mobile-container full-bleed-container ${className}`.trim()}
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: '80px', // Espacio para la barra de navegación inferior fija
        boxSizing: 'border-box',
        overflowX: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
