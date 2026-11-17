// src/components/RaffleCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';

interface RaffleCardProps {
  raffleId: string;
  title: string;
  price: number;
  totalTickets: number;
  image?: string;
}

export default function RaffleCard({ raffleId, title, price, totalTickets }: RaffleCardProps) {
  return (
    <div
      className="compact-raffle-card"
      style={{
        borderRadius: '16px',
        padding: '16px',
        transition: 'all 0.2s ease',
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-color)' }}>{title}</h3>
      <p style={{ fontSize: '13px', opacity: 0.75, marginBottom: '14px', color: 'var(--text-color)' }}>
        Boleta oficial · {totalTickets} números · $ {price.toLocaleString('es-CO')} COP
      </p>

      {/* Enlace dinámico con ID único para evitar redirecciones vacías */}
      <Link 
        href={`/comprar?raffleId=${raffleId}`}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '12px',
          background: '#007AFF', // Azul oficial nativo
          color: '#ffffff',
          fontWeight: 'bold',
          borderRadius: '10px',
          textDecoration: 'none',
          fontSize: '14px',
          boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
          transition: 'transform 0.15s ease',
        }}
      >
        🎟️ Elegir Número y Jugar
      </Link>
    </div>
  );
}
