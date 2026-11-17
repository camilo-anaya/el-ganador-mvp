// components/PublicityBanner.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicityBanner() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #046a38 0%, #002e17 100%)', 
      border: '1px solid #d4af37', 
      borderRadius: '20px', 
      padding: '24px', 
      color: '#fff',
      textAlign: 'center',
      margin: '20px 0'
    }}>
      <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', color: '#ffe082', textTransform: 'uppercase' }}>
        Vitrina Comercial B2B
      </span>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0' }}>¿Tienes un Negocio o Marca en Colombia?</h3>
      <p style={{ fontSize: '13px', color: '#ddd', marginBottom: '16px', lineHeight: '1.5' }}>
        Publicita tus productos, patrocina sorteos y llega a miles de compradores activos con nuestros planes corporativos.
      </p>

      {/* Enlace directo a Planes Publicitarios Oficiales */}
      <Link
        href="/publicidad"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#d4af37',
          color: '#000',
          fontWeight: 'bold',
          borderRadius: '10px',
          textDecoration: 'none',
          fontSize: '14px',
          boxShadow: '0 4px 14px rgba(212,175,55,0.3)'
        }}
      >
        📢 Ver Planes Publicitarios Oficiales ↗
      </Link>
    </div>
  );
}
