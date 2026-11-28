'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MathematicalCertificateCard({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="math-cert-card"
      style={{
        marginTop: '8px',
        marginBottom: '8px',
        borderRadius: '12px',
        border: '1.5px solid #d4af37',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 16, 28, 0.98) 100%)',
        color: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          padding: '10px 12px',
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
        }}
        title="Ver detalles del Certificado Matemático y Criptográfico Coljuegos"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>📐</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '11px', color: '#f5d47a', letterSpacing: '-0.2px' }}>
                CERTIFICADO MATEMÁTICO
              </strong>
              <span
                style={{
                  fontSize: '8.5px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 900,
                }}
              >
                ✓ 100% SIN SESGO
              </span>
            </div>
            <small style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              Coljuegos · GLI-19 · NIST SP 800-22
            </small>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#f5d47a', fontWeight: 800, flexShrink: 0 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            padding: '0 12px 12px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            color: '#cbd5e1',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. DISTRIBUCIÓN UNIFORME */}
          <div
            style={{
              marginTop: '10px',
              background: '#090f1d',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ color: '#f5d47a', fontWeight: 800, fontSize: '10.5px' }}>1. Distribución Uniforme:</span>
              <span style={{ color: '#10b981', fontWeight: 900, fontSize: '11px' }}>P(X = k) = 1 / N</span>
            </div>
            <p style={{ margin: 0, fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.4 }}>
              Equiprobabilidad matemática absoluta: ninguna balota tiene ventaja probabilística.
            </p>
          </div>

          {/* 2. DESCARTE DE MÓDULO 64-BIT */}
          <div
            style={{
              marginTop: '8px',
              background: '#090f1d',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '10.5px' }}>2. Descarte de Módulo 64-bit:</span>
              <span style={{ color: '#10b981', fontWeight: 900, fontSize: '10.5px' }}>0.000000% Sesgo</span>
            </div>
            <code style={{ fontSize: '10px', color: '#ffd700', display: 'block', marginBottom: '3px', background: 'rgba(0,0,0,0.4)', padding: '2px 4px', borderRadius: '4px' }}>
              L = 2⁶⁴ − (2⁶⁴ mod N)
            </code>
            <p style={{ margin: 0, fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.4 }}>
              Muestreo con rechazo (Rejection Sampling) bajo estándar de laboratorios GLI-19.
            </p>
          </div>

          {/* 3. BONDAD DE AJUSTE CHI-CUADRADO */}
          <div
            style={{
              marginTop: '8px',
              background: '#090f1d',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 800, fontSize: '10px' }}>Prueba Chi-Cuadrado (χ²):</span>
              <span style={{ color: '#10b981', fontWeight: 900, fontSize: '10px' }}>98.4% Aprobada</span>
            </div>
            <div style={{ height: '5px', background: '#334155', borderRadius: '99px', overflow: 'hidden', margin: '4px 0' }}>
              <div style={{ width: '98.4%', height: '100%', background: '#16a34a' }} />
            </div>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>
              NIST SP 800-22 (p-valor &gt; 0.95) · Certificación de laboratorio
            </span>
          </div>

          {/* 4. ENLACES DIRECTOS A MARCO LEGAL Y VERIFICADOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <Link
              href="/empresario/marco-legal?tab=certificacion"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '7px 10px',
                borderRadius: '6px',
                background: '#007AFF',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '11px',
                textDecoration: 'none',
              }}
            >
              📜 Ver Marco Legal &amp; ISO 17025 →
            </Link>
            <Link
              href="/verificar"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '10.5px',
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
