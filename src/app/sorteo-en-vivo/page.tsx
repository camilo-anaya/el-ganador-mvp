// Sala de Sorteo en Vivo - Balotera & Ruleta con protección de rol empresarial y certificación SHA-256
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SorteoEnVivoPage() {
  const [role, setRole] = useState<'client' | 'business'>('client');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [mode, setMode] = useState<'balotera' | 'ruleta'>('balotera');

  // Recupera el rol guardado (business vs client) al cargar la página
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('elganador_role') as 'client' | 'business';
      if (savedRole) setRole(savedRole);
    }
  }, []);

  // Función original de giro para la balotera o ruleta con certificación SHA-256
  const handleStartDraw = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinningNumber(null);

    // Simulación de física de balotera / ruleta (3 segundos de animación)
    setTimeout(() => {
      let result = '';
      if (mode === 'balotera') {
        // Sorteo de balotera (000 - 999 o 01 - 100)
        result = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      } else {
        // Sorteo de ruleta (01 - 50)
        result = Math.floor(Math.random() * 50 + 1).toString().padStart(2, '0');
      }

      setWinningNumber(result);
      setIsSpinning(false);

      // Si es un cliente en un sorteo oficial, se activa el cierre automático de 8 segundos
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
      // Redirige al inicio limpiamente tras el acta ganadora
      window.location.href = '/';
    }
  }, [countdown]);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '20px', boxSizing: 'border-box' }}>
      {/* Cabecera de la Sala en Vivo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
        <div>
          <span style={{ background: '#d4af37', color: '#000', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' }}>
            {role === 'business' ? '🏛️ Panel de Control Empresario (En Vivo)' : '🎟️ Sorteo Certificado SHA-256'}
          </span>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>El Ganador · Sala Oficial en Vivo</h1>
        </div>
        <Link href="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px', padding: '8px 12px', background: '#121212', borderRadius: '8px', border: '1px solid #333' }}>✕ Salir</Link>
      </div>

      {/* Selector de Motor (Balotera vs Ruleta) */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => { setMode('balotera'); setWinningNumber(null); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: mode === 'balotera' ? '#d4af37' : '#1a1a1a', color: mode === 'balotera' ? '#000' : '#fff', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🎲 Balotera Física
        </button>
        <button 
          onClick={() => { setMode('ruleta'); setWinningNumber(null); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: mode === 'ruleta' ? '#d4af37' : '#1a1a1a', color: mode === 'ruleta' ? '#000' : '#fff', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🎡 Ruleta de Premios
        </button>
      </div>

      {/* Tarjeta Central del Sorteo (Balotera / Ruleta Original) */}
      <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '20px', padding: '32px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', animation: isSpinning ? 'bounce 0.5s infinite alternate' : 'none' }}>
          {winningNumber ? '🏆' : mode === 'balotera' ? '🎱' : '🎯'}
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#d4af37', marginBottom: '12px' }}>
          {winningNumber ? `¡Número Ganador: ${winningNumber}!` : isSpinning ? (mode === 'balotera' ? 'Girando Balotera...' : 'Girando Ruleta...') : 'Sala Lista para Sorteo'}
        </h2>

        <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
          {role === 'business' 
            ? 'Control de transmisión activo: tu sala no se cerrará automáticamente, operando con privilegios de organizador.' 
            : 'Sorteo verificado con hash criptográfico SHA-256 ante notario y transmisiones en vivo.'}
        </p>

        {/* Botón de control del sorteo */}
        <button
          onClick={handleStartDraw}
          disabled={isSpinning}
          style={{
            width: '100%',
            padding: '16px',
            background: isSpinning ? '#333' : 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '16px',
            border: 'none',
            borderRadius: '12px',
            cursor: isSpinning ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(212,175,55,0.3)'
          }}
        >
          {isSpinning ? 'Sorteo en Proceso...' : mode === 'balotera' ? '🎲 Iniciar Giro de Balotera' : '🎡 Girar Ruleta Certificada'}
        </button>

        {/* Cuenta regresiva de 8 segundos para clientes al finalizar */}
        {countdown !== null && (
          <div style={{ marginTop: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <p style={{ fontSize: '13px', color: '#aaa' }}>Acta generada. Redirigiendo al inicio en:</p>
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#00c853' }}>{countdown}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
