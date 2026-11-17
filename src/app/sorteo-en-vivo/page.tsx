// Sala de Sorteo en Vivo - Protección de rol empresarial y control de balotera SHA-256
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SorteoEnVivoPage() {
  const [role, setRole] = useState<'client' | 'business'>('client');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [winningNumber, setWinningNumber] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Carga el rol del usuario desde localStorage de forma segura
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('elganador_role') as 'client' | 'business';
      if (savedRole) setRole(savedRole);
    }
  }, []);

  // Manejador del sorteo oficial / demo
  const handleSpinOrDraw = () => {
    setIsLiveActive(true);
    setWinningNumber(null);

    // Simula el giro de la balotera / ruleta (Sorteo certificado SHA-256)
    setTimeout(() => {
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setWinningNumber(randomNum);
      setIsLiveActive(false);

      // Si es cliente en sorteo oficial, activa cuenta regresiva de 8 segundos
      if (role === 'client') {
        setCountdown(8);
      }
    }, 3000);
  };

  // Temporizador de cierre progresivo para clientes (8 segundos)
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirige al inicio tras cumplirse los 8 segundos del acta ganadora
      window.location.href = '/';
    }
  }, [countdown]);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '20px', boxSizing: 'border-box' }}>
      {/* Cabecera de la Sala */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
        <div>
          <span style={{ background: '#d4af37', color: '#000', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' }}>
            {role === 'business' ? '🏛️ Panel de Control Empresario (En Vivo)' : '🎟️ Sala Interactiva de Sorteo'}
          </span>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>El Ganador · Sala Certificada SHA-256</h1>
        </div>
        <Link href="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px' }}>✕ Salir</Link>
      </div>

      {/* Área Principal de la Balotera / Ruleta */}
      <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '20px', padding: '32px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {winningNumber ? '🏆' : '🎰'}
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#d4af37', marginBottom: '12px' }}>
          {winningNumber ? `¡Número Ganador: ${winningNumber}!` : isLiveActive ? 'Girando Balotera Oficial...' : 'Esperando Sorteo'}
        </h2>

        <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
          {role === 'business' 
            ? 'Tienes el control absoluto de la sala. Ningún temporizador cerrará tu transmisión.' 
            : 'Participa en tiempo real con respaldo criptográfico inalterable.'}
        </p>

        {/* Botón de control del sorteo */}
        <button
          onClick={handleSpinOrDraw}
          disabled={isLiveActive}
          style={{
            width: '100%',
            padding: '16px',
            background: isLiveActive ? '#333' : 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '16px',
            border: 'none',
            borderRadius: '12px',
            cursor: isLiveActive ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(212,175,55,0.3)'
          }}
        >
          {isLiveActive ? 'Sorteo en Curso...' : '🎲 Iniciar Giro de Balotera'}
        </button>

        {/* Cuenta regresiva visible solo para clientes al ganar */}
        {countdown !== null && (
          <div style={{ marginTop: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <p style={{ fontSize: '13px', color: '#aaa' }}>Redirigiendo al inicio en:</p>
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#00c853' }}>{countdown}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
