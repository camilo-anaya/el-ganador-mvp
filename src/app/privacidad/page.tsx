'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function PoliticaPrivacidadPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark
          ? 'radial-gradient(ellipse at 50% 18%, #0f172a 0%, #090d16 45%, #020617 100%)'
          : '#f1f5f9',
        color: isDark ? '#f8fafc' : '#0f172a',
        padding: '30px 16px 80px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          background: isDark
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 16, 28, 0.98) 100%)'
            : '#ffffff',
          borderRadius: '20px',
          padding: '32px 24px',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: isDark ? '1.5px solid rgba(212, 175, 55, 0.4)' : '1.5px solid #d4af37',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            paddingBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <Link
            href="/"
            style={{
              color: isDark ? '#38bdf8' : '#007AFF',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Volver a El Ganador
          </Link>
          <span
            style={{
              fontSize: '0.8rem',
              background: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid #bae6fd',
              color: isDark ? '#38bdf8' : '#0369a1',
              padding: '3px 9px',
              borderRadius: '6px',
              fontWeight: 800,
            }}
          >
            🔒 Ley Estatutaria 1581 de 2012
          </span>
        </div>

        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            color: isDark ? '#ffffff' : '#0f172a',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          Política de Privacidad y Tratamiento de Datos Personales
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            color: isDark ? '#cbd5e1' : '#334155',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          En <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>El Ganador</strong> (operado en la República de Colombia), protegemos la privacidad y confidencialidad de nuestros usuarios en cumplimiento de la <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Ley Estatutaria 1581 de 2012</strong>, el <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Decreto 1377 de 2013</strong> y los lineamientos de privacidad exigidos por <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Google Play Store</strong> y <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Apple App Store</strong>.
        </p>

        <section
          style={{
            marginBottom: '24px',
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
            padding: '18px',
            borderRadius: '14px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isDark ? '#f5d47a' : '#0f172a',
              marginBottom: '8px',
            }}
          >
            1. Información que Recopilamos
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.6,
            }}
          >
            Para garantizar la validez legal de las boletas, la emisión de certificados de ganador y la entrega transparente de premios, recopilamos:
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.65,
              marginTop: '8px',
            }}
          >
            <li><strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Datos de contacto e identificación:</strong> Nombre completo, correo electrónico, número de teléfono celular y número de identificación (cédula) para el reclamo oficial de premios.</li>
            <li><strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Historial de boletas y transacciones:</strong> Números seleccionados, identificador de referencia de pago y sellos criptográficos SHA-256 inmutables.</li>
            <li><strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Datos técnicos y de geolocalización:</strong> Ubicación en Colombia (exigida por la normativa de juegos de suerte y azar) y datos de diagnóstico para optimizar el rendimiento.</li>
          </ul>
        </section>

        <section
          style={{
            marginBottom: '24px',
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
            padding: '18px',
            borderRadius: '14px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isDark ? '#f5d47a' : '#0f172a',
              marginBottom: '8px',
            }}
          >
            2. Pasarelas de Pago y Seguridad Financiera
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            El Ganador <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>NO almacena números de tarjetas de crédito ni credenciales bancarias</strong>. Todas las transacciones se procesan mediante <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Wompi</strong> (entidad certificada PCI-DSS vinculada al Grupo Bancolombia) bajo estándares bancarios internacionales y encriptación de 256 bits.
          </p>
        </section>

        <section
          style={{
            marginBottom: '24px',
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
            padding: '18px',
            borderRadius: '14px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isDark ? '#f5d47a' : '#0f172a',
              marginBottom: '8px',
            }}
          >
            3. Derechos del Usuario (Habeas Data) y Eliminación de Cuenta
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.6,
            }}
          >
            Usted tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales. De conformidad con las políticas de Google Play y Apple App Store, usted puede solicitar la <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>eliminación total de su cuenta y sus datos</strong> en cualquier momento:
          </p>
          <div
            style={{
              background: isDark ? 'rgba(56, 189, 248, 0.1)' : '#f1f5f9',
              borderLeft: isDark ? '4px solid #38bdf8' : '4px solid #007AFF',
              padding: '14px 18px',
              borderRadius: '8px',
              marginTop: '12px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                color: isDark ? '#e2e8f0' : '#334155',
                lineHeight: 1.5,
              }}
            >
              Para eliminar su cuenta, ingrese a la sección <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Mi Cuenta &gt; Seguridad</strong> y presione <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Eliminar mi Cuenta</strong>, o envíe una solicitud a <strong style={{ color: isDark ? '#38bdf8' : '#007AFF' }}>soporte@elganador.co</strong> con el asunto &quot;Solicitud de Eliminación de Cuenta&quot;.
            </p>
          </div>
        </section>

        <section
          style={{
            marginBottom: '24px',
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
            padding: '18px',
            borderRadius: '14px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isDark ? '#f5d47a' : '#0f172a',
              marginBottom: '8px',
            }}
          >
            4. Contacto del Responsable
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Razón Social: El Ganador S.A.S.<br />
            Domicilio: Bogotá D.C., Colombia<br />
            Correo de contacto legal: legal@elganador.co
          </p>
        </section>

        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.86rem',
            color: isDark ? '#94a3b8' : '#64748b',
          }}
        >
          <Link
            href="/terminos"
            style={{
              color: isDark ? '#38bdf8' : '#007AFF',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            📄 Ver Términos y Condiciones de Uso →
          </Link>
          <span>© 2026 El Ganador · Colombia</span>
        </div>
      </div>
    </div>
  );
}
