'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function TerminosCondicionesPage() {
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
        {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCESOS RÁPIDOS */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.8rem',
                background: isDark ? 'rgba(212, 175, 55, 0.15)' : '#fef3c7',
                border: isDark ? '1px solid rgba(212, 175, 55, 0.35)' : '1px solid #fde68a',
                color: isDark ? '#f5d47a' : '#b45309',
                padding: '3px 9px',
                borderRadius: '6px',
                fontWeight: 800,
              }}
            >
              ⚖️ Versión 2.0 (Colombia · Ley 643/2001)
            </span>
          </div>
        </div>

        {/* ACCESOS DIRECTOS A FORMULARIO 8 Y MARCO LEGAL */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '10px',
            marginBottom: '26px',
          }}
        >
          <Link
            href="/empresario/formulario-8"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
              border: isDark ? '1.5px solid #10b981' : '1.5px solid #10b981',
              color: isDark ? '#6ee7b7' : '#065f46',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '12.5px',
            }}
          >
            <span style={{ fontSize: '20px' }}>📄</span>
            <div>
              <span style={{ display: 'block', fontSize: '13px' }}>Formulario 8 Oficial Coljuegos</span>
              <small style={{ fontWeight: 600, opacity: 0.85, fontSize: '10.5px' }}>
                Código CMI-FR-08 V7 · Ver y Descargar PDF →
              </small>
            </div>
          </Link>

          <Link
            href="/empresario/marco-legal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff',
              border: isDark ? '1.5px solid #38bdf8' : '1.5px solid #0284c7',
              color: isDark ? '#7dd3fc' : '#0369a1',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '12.5px',
            }}
          >
            <span style={{ fontSize: '20px' }}>📜</span>
            <div>
              <span style={{ display: 'block', fontSize: '13px' }}>Marco Legal &amp; Coljuegos</span>
              <small style={{ fontWeight: 600, opacity: 0.85, fontSize: '10.5px' }}>
                Normatividad, ISO 17025 y Decretos →
              </small>
            </div>
          </Link>
        </div>

        {/* TÍTULO PRINCIPAL */}
        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            color: isDark ? '#ffffff' : '#0f172a',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          Términos y Condiciones de Uso
        </h1>
        <p
          style={{
            fontSize: '0.92rem',
            color: isDark ? '#94a3b8' : '#64748b',
            lineHeight: 1.5,
            marginBottom: '24px',
          }}
        >
          Última actualización legal conforme a la reglamentación nacional de juegos de suerte y azar (Ley 643 de 2001, Decreto 1486 de 2024 y circulares vigentes de Coljuegos).
        </p>

        {/* CLÁUSULA MANDATORIA DE APPLE Y GOOGLE */}
        <div
          style={{
            background: isDark ? 'rgba(127, 29, 29, 0.28)' : '#fef2f2',
            border: isDark ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1.5px solid #fecaca',
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '26px',
          }}
        >
          <strong
            style={{
              color: isDark ? '#fca5a5' : '#b91c1c',
              display: 'block',
              marginBottom: '6px',
              fontSize: '1rem',
              fontWeight: 900,
            }}
          >
            ⚠️ Declaración Legal Obligatoria (Apple Inc. y Google LLC):
          </strong>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: isDark ? '#fecaca' : '#7f1d1d',
              lineHeight: 1.55,
            }}
          >
            <strong>Apple Inc. y Google LLC no son patrocinadores, organizadores ni están involucrados de ninguna manera</strong> en los sorteos, rifas, actividades promocionales o premiaciones que se publiquen o celebren a través de esta plataforma. Todos los premios son ofrecidos y garantizados directamente por los comerciantes autorizados y respaldados legalmente bajo la normativa colombiana de juegos de suerte y azar.
          </p>
        </div>

        {/* SECCIÓN 1 */}
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
            1. Objeto y Naturaleza de la Plataforma
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>El Ganador</strong> es una plataforma tecnológica que conecta a comerciantes, empresas legalmente constituidas y compradores en Colombia para la realización y participación en sorteos y rifas transparentes. Toda rifa publicada en la plataforma debe contar con su correspondiente resolución o permiso legal expedido por la autoridad territorial competente (Alcaldías Municipales, Gobernaciones o Coljuegos), en estricto cumplimiento de la <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Ley 643 de 2001</strong> y mediante el diligenciamiento oficial del Formulario 8 (CMI-FR-08).
          </p>
        </section>

        {/* SECCIÓN 2 */}
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
            2. Requisitos de Participación y Verificación de Identidad
          </h2>
          <ul
            style={{
              paddingLeft: '20px',
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            <li>Ser mayor de dieciocho (18) años de edad en pleno uso de facultades legales.</li>
            <li>Encontrarse ubicado en el territorio de la República de Colombia al momento de la adquisición de boletas.</li>
            <li>Suministrar información real y verificable (cédula de ciudadanía o extranjería, teléfono y correo electrónico) para la vinculación oficial del boleto.</li>
            <li>No incurrir en suplantación ni en compras mediante cuentas financieras de terceros no autorizados.</li>
          </ul>
        </section>

        {/* SECCIÓN 3 */}
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
            3. Emisión de Boletas y Sello Criptográfico Inmutable
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Cada boleta pagada exitosamente a través de la pasarela de pagos autorizada (Wompi · Grupo Bancolombia) recibe de forma automática un <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>sello criptográfico digital (HMAC-SHA256)</strong> con fecha y hora exactas, el cual es inmutable, infalsificable y garantiza con fe pública la propiedad exclusiva del número seleccionado por el comprador antes de la extracción.
          </p>
        </section>

        {/* SECCIÓN 4 */}
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
            4. Entrega de Premios y Certificado Digital de Ganador
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            El comerciante organizador es el responsable legal de la entrega material del premio ofertado en las condiciones publicadas. El Ganador emite un <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Certificado Notarial de Ganador</strong> con firma digital para respaldar la reclamación física y legal del premio ante las autoridades competentes. Los sorteos cumplen con la retención tributaria aplicable por ganancia ocasional estipulada en el Estatuto Tributario colombiano.
          </p>
        </section>

        {/* SECCIÓN 5 */}
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
            5. Ley Aplicable y Jurisdicción
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: isDark ? '#cbd5e1' : '#334155',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Estos términos se rigen, interpretan y ejecutan de conformidad con las leyes de la República de Colombia, especialmente la Ley 643 de 2001, la Ley 1581 de 2012 de Protección de Datos Personales, y la normatividad de comercio electrónico de la Ley 527 de 1999. Cualquier controversia será sometida a los jueces competentes de la República de Colombia.
          </p>
        </section>

        {/* PIE DE PÁGINA CON ENLACES */}
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
            href="/privacidad"
            style={{
              color: isDark ? '#38bdf8' : '#007AFF',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            🔒 Ver Política de Privacidad &amp; Tratamiento de Datos →
          </Link>
          <span>© 2026 El Ganador · Colombia</span>
        </div>
      </div>
    </div>
  );
}
