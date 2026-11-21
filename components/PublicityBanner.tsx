// components/PublicityBanner.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicityBanner() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', 
      border: '1.5px solid #007AFF', 
      borderRadius: '20px', 
      padding: '24px', 
      color: '#fff',
      textAlign: 'center',
      margin: '20px 0',
      boxShadow: '0 8px 30px rgba(0, 122, 255, 0.2)'
    }}>
      <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase' }}>
        Vitrina Comercial B2B
      </span>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0', color: '#ffffff' }}>¿Tienes un Negocio o Marca en Colombia?</h3>
      <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', lineHeight: '1.5' }}>
        Publicita tus productos, patrocina sorteos y llega a miles de compradores activos con nuestros planes corporativos.
      </p>

      {/* Enlace directo a Planes Publicitarios Oficiales */}
      <Link
        href="/publicidad"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
          color: '#ffffff',
          fontWeight: 800,
          borderRadius: '10px',
          textDecoration: 'none',
          fontSize: '14px',
          boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)'
        }}
      >
        📢 Ver Planes Publicitarios Oficiales ↗
      </Link>
    </div>
  );
}
