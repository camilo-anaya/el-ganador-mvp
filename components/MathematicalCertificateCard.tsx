'use client';

import React, { useState } from 'react';
import Link from 'next/link';

function triggerHaptic(ms = 15) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try { navigator.vibrate(ms); } catch {}
  }
}

export default function MathematicalCertificateCard({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic(15);
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className="math-cert-card"
      style={{
        marginTop: '8px',
        marginBottom: '8px',
        borderRadius: '12px',
        border: '1.5px solid #d4af37',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 16, 28, 0.99) 100%)',
        color: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        onTouchStart={() => triggerHaptic(12)}
        style={{
          width: '100%',
          padding: '11px 13px',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          textAlign: 'left',
          boxSizing: 'border-box',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
        title="Ver detalles del Certificado Matemático y Criptográfico Coljuegos"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
          <span style={{ fontSize: '19px', flexShrink: 0 }}>📐</span>
          <div style={{ pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '11.5px', color: '#f5d47a', letterSpacing: '-0.1px', fontWeight: 900 }}>
                CERTIFICADO MATEMÁTICO
              </strong>
              <span
                style={{
                  fontSize: '9px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 900,
                  letterSpacing: '0.2px',
                }}
              >
                ✓ 100% SIN SESGO
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#cbd5e1', display: 'block', marginTop: '2px', fontWeight: 600 }}>
              Coljuegos · GLI-19 · NIST SP 800-22
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: '#f5d47a',
            fontWeight: 800,
            flexShrink: 0,
            pointerEvents: 'none',
            padding: '2px 7px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            border: '1px solid rgba(245, 212, 122, 0.3)',
          }}
        >
          {isOpen ? '▲ Cerrar' : '▼ Ver'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            padding: '0 12px 14px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '12px',
            color: '#e2e8f0',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. DISTRIBUCIÓN UNIFORME */}
          <div
            style={{
              marginTop: '10px',
              background: '#090f1d',
              padding: '9px 11px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ color: '#f5d47a', fontWeight: 800, fontSize: '11.5px' }}>
                1. Equiprobabilidad Absoluta:
              </span>
              <span style={{ color: '#10b981', fontWeight: 900, fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                100% Imparcial
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
              Cada balota o número tiene exactamente la misma probabilidad matemática de ganar. Cero ventajas o favoritismos algorítmicos.
            </p>
          </div>

          {/* 2. DESCARTE DE MÓDULO 64-BIT */}
          <div
            style={{
              marginTop: '8px',
              background: '#090f1d',
              padding: '9px 11px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '11.5px' }}>
                2. Algoritmo Certificado GLI-19:
              </span>
              <span style={{ color: '#10b981', fontWeight: 900, fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                0.000000% Sesgo
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
              Muestreo criptográfico con descarte de sesgo residual de 64 bits bajo el estándar técnico internacional de juegos de azar GLI-19.
            </p>
          </div>

          {/* 3. BONDAD DE AJUSTE CHI-CUADRADO */}
          <div
            style={{
              marginTop: '8px',
              background: '#090f1d',
              padding: '9px 11px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '11.5px' }}>
                3. Prueba Estadística NIST SP 800-22:
              </span>
              <span style={{ color: '#10b981', fontWeight: 900, fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                98.4% Aprobada
              </span>
            </div>
            <div style={{ height: '5px', background: '#334155', borderRadius: '99px', overflow: 'hidden', margin: '5px 0' }}>
              <div style={{ width: '98.4%', height: '100%', background: '#16a34a', borderRadius: '99px' }} />
            </div>
            <span style={{ fontSize: '10.5px', color: '#cbd5e1', display: 'block', lineHeight: 1.4 }}>
              Aleatoriedad pura e independencia estadística comprobada por laboratorio acreditado ISO 17025.
            </span>
          </div>

          {/* 4. ENLACES DIRECTOS A MARCO LEGAL Y VERIFICADOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '10px' }}>
            <Link
              href="/empresario/marco-legal?tab=certificacion"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '8px 10px',
                borderRadius: '7px',
                background: '#007AFF',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '11.5px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.35)',
              }}
            >
              📜 Ver Marco Legal &amp; ISO 17025 →
            </Link>
            <Link
              href="/verificar"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '7px 10px',
                borderRadius: '7px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '11px',
                textDecoration: 'none',
              }}
            >
              🔍 Auditar en Verificador Notarial
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
