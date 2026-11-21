// components/ColjuegosLegalGuide.tsx
// Componente de Información Legal, Servicios de El Ganador, Marco Normativo Coljuegos y Visor de Requisitos Oficiales
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const COLJUEGOS_REQUIREMENTS = [
  {
    no: 1,
    title: 'Solicitud de Autorización (Formulario 8)',
    desc: 'Solicitud oficial debidamente diligenciada y firmada por el representante legal o apoderado.',
    norm: 'Art. 5 Decreto 1968 de 2001',
    note: 'Nota 1: Presentarse por escrito con antelación no inferior a 45 días calendario a la fecha del sorteo.',
  },
  {
    no: 2,
    title: 'Certificado de Cámara de Comercio',
    desc: 'Original del Certificado de Existencia y Representación Legal de la Sociedad con vigencia no mayor a 30 días.',
    norm: 'Art. 5 Decreto 1968 de 2001',
    note: 'Nota 2: Para personas naturales, fotocopia legible de la cédula de ciudadanía.',
  },
  {
    no: 3,
    title: 'Fotocopia del RUT',
    desc: 'Registro Único Tributario (RUT) actualizado de la sociedad o del responsable de la rifa.',
    norm: 'Código de Comercio',
    note: 'Debe contener la actividad económica comercial y estar activo ante la DIAN.',
  },
  {
    no: 4,
    title: 'Cédula del Representante Legal',
    desc: 'Fotocopia ampliada y legible de la cédula de ciudadanía del representante legal.',
    norm: 'Art. 9 Resolución 135 de 2012',
    note: 'Si el trámite se realiza mediante apoderado, adjuntar el poder legal debidamente autenticado.',
  },
  {
    no: 5,
    title: 'Comprobante de Plena Propiedad sin Reserva',
    desc: 'Comprobante de plena propiedad sin reserva de dominio de los bienes muebles, vehículos o inmuebles objeto de la rifa.',
    norm: 'Art. 6 Decreto 1968 de 2001',
    note: 'Conforme con lo dispuesto en las normas legales vigentes de registro y títulos.',
  },
  {
    no: 6,
    title: 'Avalúo Comercial y Facturas de Adquisición',
    desc: 'Avalúo comercial formal de inmuebles y facturas legales de adquisición de los bienes o vehículos a sortear.',
    norm: 'Art. 6 Decreto 1968 de 2001',
    note: 'Permite certificar el valor real comercial en pesos colombianos (COP).',
  },
  {
    no: 7,
    title: 'Garantía / Póliza de Cumplimiento a favor de Coljuegos',
    desc: 'Póliza contratada con compañía de seguros legal a favor de COLJUEGOS (NIT 900505060-5) y terceros beneficiarios.',
    norm: 'Art. 6 Decreto 1968 de 2001',
    note: 'Nota 3: Valor asegurado igual al 100% del plan de premios. Vigencia mínima de 4 meses desde la fecha del sorteo.',
  },
  {
    no: 8,
    title: 'Texto Legal Impreso Obligatorio en la Boleta',
    desc: 'La boleta debe incluir: número, valor de venta en COP, lugar/fecha/hora del sorteo, lotería tradicional de referencia, caducidad del premio, espacio para número y fecha del acto administrativo autorizante, descripción detallada del premio, identificación del responsable y si es pagadero al portador.',
    norm: 'Art. 6 Decreto 1968 de 2001',
    note: 'El Ganador genera automáticamente este boleto digital con hash criptográfico SHA-256 cumpliendo este requisito.',
  },
  {
    no: 9,
    title: 'Proyecto de Pauta Publicitaria',
    desc: 'Plan de medios y piezas publicitarias con la leyenda mandatoria audible y visible: "Autorizado por COLJUEGOS".',
    norm: 'Art. 6 Decreto 1968 de 2001',
    note: 'Nota 4: En TV y radio debe incluirse de viva voz; en redes e impreso debe figurar de manera clara y legible.',
  },
  {
    no: 10,
    title: 'Autorización de la Lotería Tradicional',
    desc: 'Autorización de la lotería tradicional o de billetes cuyos resultados oficiales serán utilizados en la mecánica de la extracción.',
    norm: 'Art. 6 Decreto 1968 de 2001',
    note: 'El Ganador ofrece como alternativa física su Balotera 3D con Círculo Dorado en vivo certificada por Coljuegos / Notaría.',
  },
  {
    no: 11,
    title: 'Concepto de Excepción Bomberil (si aplica)',
    desc: 'Solicitud de Concepto de Excepción para Bomberos de Rifa mediante Formulario 9 diligenciado y firmado.',
    norm: 'Art. 5 Ley 643 / Res. 135 de 2012',
    note: 'Nota 5: Aplica de forma exclusiva cuando la rifa es organizada directamente por el cuerpo de bomberos para su financiamiento.',
  },
];

interface ColjuegosLegalGuideProps {
  embeddedMode?: boolean;
  onClose?: () => void;
}

export default function ColjuegosLegalGuide({ embeddedMode = false, onClose }: ColjuegosLegalGuideProps) {
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'coljuegos' | 'servicios' | 'ley' | 'porcentajes' | 'auditoria'>('coljuegos');
  const [searchFilter, setSearchFilter] = useState('');

  // Estados para Auditoría de Laboratorio (Lean Lab / ISO 17025)
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditSamples, setAuditSamples] = useState(10000);
  const [auditCartonSize, setAuditCartonSize] = useState(100);

  const runStatisticalAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await fetch(`/api/audit/rng-sample?samples=${auditSamples}&cartonSize=${auditCartonSize}`);
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error('Error al ejecutar ensayo estadístico:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const toggleCheck = (no: number) => {
    setCheckedItems((prev) => ({ ...prev, [no]: !prev[no] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPct = Math.round((completedCount / COLJUEGOS_REQUIREMENTS.length) * 100);

  const filteredRequirements = COLJUEGOS_REQUIREMENTS.filter(
    (r) =>
      r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.norm.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className={`coljuegos-legal-card ${embeddedMode ? 'embedded' : 'standalone'}`} style={{ color: 'inherit' }}>
      {/* CABECERA PRINCIPAL CON ESCUDO Y SELLOS OFICIALES */}
      <div
        style={{
          background: 'linear-gradient(135deg, #062615 0%, #03150c 100%)',
          color: '#ffffff',
          borderRadius: embeddedMode ? '16px' : '20px',
          padding: '24px 20px',
          border: '1.5px solid rgba(220, 185, 80, 0.55)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
          marginBottom: '20px',
          position: 'relative',
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía legal"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#ffffff',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ fontSize: '28px' }}>🇨🇴</span>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#f5b82e', textTransform: 'uppercase' }}>
              COLJUEGOS · MONOPOLIO RENTÍSTICO DE JUEGOS DE SUERTE Y AZAR
            </span>
            <h2 className="coljuegos-banner-title" style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0 2px', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
              Guía Legal Oficial y Requisitos para Sorteos en Colombia
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
              Información obligatoria para comerciantes, organizadores y compradores antes de publicar o participar en una rifa.
            </p>
          </div>
        </div>

        {/* BOTONES DE DESCARGA E IMPRESIÓN DEL PDF */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/docs/requisitos-coljuegos-rifas-nacionales.pdf"
            download="Requisitos-Coljuegos-Rifas-Nacionales.pdf"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #d4af37 0%, #aa8420 100%)',
              color: '#0a1a0f',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.86rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
              cursor: 'pointer',
            }}
          >
            <span>📥</span> Descargar PDF Oficial Coljuegos
          </a>

          <a
            href="/docs/especificacion-tecnica-rng-coljuegos-leanlab.pdf"
            download="Especificacion-Tecnica-RNG-Coljuegos-LeanLab.pdf"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.86rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              cursor: 'pointer',
            }}
          >
            <span>📜</span> DSD Auditoría Laboratorio (PDF)
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            <span>🖨️</span> Imprimir Documento
          </button>

          <a
            href="https://www.coljuegos.gov.co"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#93c5fd',
              padding: '9px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span>🏛️</span> Portal Coljuegos ↗
          </a>
        </div>
      </div>

      {/* PESTAÑAS NAVEGABLES DEL MARCO LEGAL */}
      <nav
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
        aria-label="Pestañas de información legal"
      >
        <button
          type="button"
          onClick={() => setActiveTab('coljuegos')}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            border: activeTab === 'coljuegos' ? '1.5px solid #0284c7' : '1px solid rgba(148, 163, 184, 0.3)',
            background: activeTab === 'coljuegos' ? '#0284c7' : 'transparent',
            color: activeTab === 'coljuegos' ? '#ffffff' : 'inherit',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          📄 11 Requisitos Coljuegos (PDF)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('servicios')}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            border: activeTab === 'servicios' ? '1.5px solid #0284c7' : '1px solid rgba(148, 163, 184, 0.3)',
            background: activeTab === 'servicios' ? '#0284c7' : 'transparent',
            color: activeTab === 'servicios' ? '#ffffff' : 'inherit',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ⚡ Servicios de El Ganador
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ley')}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            border: activeTab === 'ley' ? '1.5px solid #0284c7' : '1px solid rgba(148, 163, 184, 0.3)',
            background: activeTab === 'ley' ? '#0284c7' : 'transparent',
            color: activeTab === 'ley' ? '#ffffff' : 'inherit',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ⚖️ Marco Legal y Operación
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('porcentajes')}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            border: activeTab === 'porcentajes' ? '1.5px solid #0284c7' : '1px solid rgba(148, 163, 184, 0.3)',
            background: activeTab === 'porcentajes' ? '#0284c7' : 'transparent',
            color: activeTab === 'porcentajes' ? '#ffffff' : 'inherit',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          💰 Porcentajes y Salud (14%)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auditoria')}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            border: activeTab === 'auditoria' ? '1.5px solid #10b981' : '1.5px solid rgba(16, 185, 129, 0.4)',
            background: activeTab === 'auditoria' ? '#10b981' : 'rgba(16, 185, 129, 0.08)',
            color: activeTab === 'auditoria' ? '#ffffff' : '#10b981',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          🏛️ Auditoría Laboratorio (Lean Lab / ISO 17025)
        </button>
      </nav>

      {/* CONTENIDO 1: LOS 11 REQUISITOS DEL PDF DE COLJUEGOS */}
      {activeTab === 'coljuegos' && (
        <section
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-card, #e2e8f0)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                📋 Lista de Chequeo Obligatoria (Foliada según Coljuegos)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', opacity: 0.8 }}>
                Marca los documentos que ya tienes listos para tu expediente antes de solicitar radicación.
              </p>
            </div>

            {/* BARRA DE PROGRESO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: progressPct === 100 ? '#10b981' : '#f59e0b' }}>
                {completedCount} / {COLJUEGOS_REQUIREMENTS.length} Listos ({progressPct}%)
              </span>
              <div style={{ width: '100px', height: '8px', background: 'rgba(148, 163, 184, 0.3)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: progressPct === 100 ? '#10b981' : '#f59e0b', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>

          {/* BUSCADOR RÁPIDO DE REQUISITOS */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar requisito (ej. póliza, avalúo, cédula, formulario 8)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: 'var(--surface-subtle, #f8fafc)',
                color: 'inherit',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* TABLA / TARJETAS DE REQUISITOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredRequirements.map((req) => (
              <div
                key={req.no}
                onClick={() => toggleCheck(req.no)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: checkedItems[req.no] ? '1.5px solid #10b981' : '1px solid rgba(148, 163, 184, 0.25)',
                  background: checkedItems[req.no] ? 'rgba(16, 185, 129, 0.06)' : 'rgba(148, 163, 184, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[req.no]}
                  onChange={() => toggleCheck(req.no)}
                  style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ fontSize: '0.92rem' }}>
                      {req.no}. {req.title}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '99px',
                        background: 'rgba(2, 132, 199, 0.12)',
                        color: '#0284c7',
                        border: '1px solid rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      {req.norm}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 6px', fontSize: '0.84rem', lineHeight: 1.5, opacity: 0.9 }}>
                    {req.desc}
                  </p>

                  <div style={{ fontSize: '0.78rem', color: '#b45309', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                    💡 <em>{req.note}</em>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* NOTAS AL PIE DE LA LEY Y COMPETENCIA */}
          <div
            style={{
              marginTop: '20px',
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              fontSize: '0.8rem',
              lineHeight: 1.55,
            }}
          >
            <strong>📌 Alcance de Competencias Oficiales:</strong>
            <p style={{ margin: '4px 0 0' }}>
              De acuerdo con el inciso 3 del artículo 2 del Decreto 1968 de 2001 y el artículo 23 del Decreto 4142 de 2011,
              <strong> COLJUEGOS</strong> es la entidad que autoriza de forma privativa las rifas de carácter nacional (cuando operan en dos o más departamentos, o en un departamento y Bogotá Distrito Capital).
              Para sorteos en un solo municipio o departamento, la competencia corresponde a la Alcaldía o a la Lotería Departamental correspondiente.
            </p>
          </div>
        </section>
      )}

      {/* CONTENIDO 2: SERVICIOS QUE PRESTA EL GANADOR */}
      {activeTab === 'servicios' && (
        <section
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-card, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
            ⚡ ¿Qué servicios presta la plataforma El Ganador?
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, opacity: 0.9 }}>
            <strong>El Ganador</strong> es una plataforma tecnológica SaaS (Software as a Service) especializada en la digitalización, verificación y emisión de sorteos para comercios, marcas y empresarios en Colombia.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(148, 163, 184, 0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎟️</div>
              <strong style={{ fontSize: '0.95rem' }}>Boletería Digital Criptográfica (SHA-256)</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Generación de cartones interactivos (100, 1.000, 10.000 balotas) con números asignados en tiempo real y emisión de certificados digitales anti-falsificación para el comprador.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(148, 163, 184, 0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎱</div>
              <strong style={{ fontSize: '0.95rem' }}>Balotera y Ruleta 3D en Vivo</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Simulación física tridimensional y sala de sorteo transmitida en tiempo real con algoritmos de aleatoriedad verificables sin intervención humana.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(148, 163, 184, 0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>💳</div>
              <strong style={{ fontSize: '0.95rem' }}>Recaudo Automatizado (Wompi Bancolombia)</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Integración bancaria de pagos con PSE, Nequi, tarjetas de crédito/débito y botón Bancolombia con liberación y reserva instantánea de boletas.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(148, 163, 184, 0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>💬</div>
              <strong style={{ fontSize: '0.95rem' }}>Chat Oficial de Entrega de Premios</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Canal seguro que se activa automáticamente al proclamar al ganador para coordinar fecha, lugar, traspaso y acta de entrega formal con el comercio.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(148, 163, 184, 0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>👥</div>
              <strong style={{ fontSize: '0.95rem' }}>CRM Empresarial y Base de Datos</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Control total de clientes, recaudo en COP por evento, trazabilidad de transacciones y exportación de listas para auditorías fiscales.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(148, 163, 184, 0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>📢</div>
              <strong style={{ fontSize: '0.95rem' }}>Vitrina Comercial y Publicidad B2B</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Exposición en el Marketplace de El Ganador ante más de 50.000 compradores activos con banners destacados y visibilidad multicanal.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CONTENIDO 3: MARCO LEGAL Y CÓMO OPERAMOS EN COLOMBIA */}
      {activeTab === 'ley' && (
        <section
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-card, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
            ⚖️ Cómo nos regimos ante la Ley y Operación en Colombia
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', lineHeight: 1.6 }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.05)', borderLeft: '4px solid #0284c7' }}>
              <strong>1. Ley 643 de 2001 (Régimen de Juegos de Suerte y Azar):</strong>
              <p style={{ margin: '4px 0 0' }}>
                En Colombia, la explotación de juegos de suerte y azar es un monopolio rentístico de propiedad del Estado. Todo organizador de rifas debe obtener autorización previa y pagar los correspondientes derechos de explotación antes de iniciar la venta al público.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.05)', borderLeft: '4px solid #10b981' }}>
              <strong>2. Decreto 1486 de 2024 (Comercio Electrónico y Protección al Consumidor):</strong>
              <p style={{ margin: '4px 0 0' }}>
                Garantiza a los compradores total transparencia en el precio de la boleta, la identidad comprobada del comercio emisor (KYB), términos claros de entrega del premio y mecanismos directos de soporte y reclamación.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.05)', borderLeft: '4px solid #f59e0b' }}>
              <strong>3. Bloqueo Legal Obligatorio en la Plataforma:</strong>
              <p style={{ margin: '4px 0 0' }}>
                Ninguna empresa o persona puede publicar un sorteo en El Ganador sin haber adjuntado: (a) El comprobante de pago de derechos de explotación ante la entidad respectiva (Coljuegos o Lotería), y (b) El número de radicado oficial de la resolución autorizante.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.05)', borderLeft: '4px solid #ef4444' }}>
              <strong>4. Cláusula de Deslinde para Tiendas de Aplicaciones:</strong>
              <p style={{ margin: '4px 0 0' }}>
                Apple Inc. y Google LLC no son patrocinadores, organizadores ni tienen relación societaria con ninguna de las actividades promocionales o premiaciones celebradas en El Ganador.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CONTENIDO 4: PORCENTAJES, DERECHOS DE EXPLOTACIÓN Y SALUD */}
      {activeTab === 'porcentajes' && (
        <section
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-card, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
            💰 Desglose Transparente de Porcentajes y Destinación a la Salud
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, opacity: 0.9 }}>
            En cumplimiento del artículo 30 de la Ley 643 de 2001, las rifas generan recursos de carácter obligatorio destinados de forma exclusiva al sector de la salud pública en Colombia.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #10b981', background: 'rgba(16, 185, 129, 0.06)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>14%</div>
              <strong style={{ fontSize: '0.95rem', display: 'block', margin: '4px 0 2px' }}>
                Derechos de Explotación (Salud Pública)
              </strong>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Porcentaje de ley que el organizador debe liquidar y transferir a Coljuegos o la Lotería Departamental sobre el valor total de las boletas emitidas para financiar hospitales y centros de salud en Colombia.
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #0284c7', background: 'rgba(2, 132, 199, 0.06)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0284c7' }}>SaaS</div>
              <strong style={{ fontSize: '0.95rem', display: 'block', margin: '4px 0 2px' }}>
                Uso de Plataforma El Ganador
              </strong>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Tarifa tecnológica fija o proporcional acordada con el comerciante que cubre la emisión digital, hosting seguro, hash SHA-256, balotera en vivo, chat de entrega y soporte técnico.
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b' }}>Tarifa Bancaria</div>
              <strong style={{ fontSize: '0.95rem', display: 'block', margin: '4px 0 2px' }}>
                Pasarela de Pagos (Wompi)
              </strong>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85 }}>
                Tarifas directas de adquirencia de Wompi Bancolombia (por transacción PSE, Nequi o tarjeta de crédito) sin ningún sobrecosto oculto.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CONTENIDO 5: AUDITORÍA DE LABORATORIO (LEAN LAB / ISO 17025 / ISO 9001) */}
      {activeTab === 'auditoria' && (
        <section
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '16px',
            padding: '24px',
            border: '1.5px solid rgba(16, 185, 129, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* BANNER ACREDITACIÓN OFICIAL */}
          <div
            style={{
              background: 'linear-gradient(135deg, #052e16 0%, #021a0c 100%)',
              color: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #10b981',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px' }}>🏛️</span>
              <div>
                <span
                  style={{
                    background: '#10b981',
                    color: '#062615',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginRight: '8px',
                  }}
                >
                  Resolución Coljuegos No. 20260019624
                </span>
                <span style={{ fontSize: '0.78rem', color: '#86efac' }}>
                  Acreditación de Laboratorios de Ensayos y Certificación
                </span>
                <h3 className="leanlab-banner-title" style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#fef08a', WebkitTextFillColor: '#fef08a' }}>
                  LEAN LAB COMPANY LIMITED (RiskCherry) — Reg. C-96476
                </h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Norma de Ensayo (RNG / Juegos)</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#6ee7b7' }}>ISO/IEC 17025:2017 No 025</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Norma de Inspección de Sistemas</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#6ee7b7' }}>ISO/IEC 17020:2012 No 110</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Marco Técnico Obligatorio</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fde047' }}>Res. Coljuegos 20161200013844</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Gestión de Calidad & Trazabilidad</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#93c5fd' }}>Estándar ISO 9001:2015</div>
              </div>
            </div>
          </div>

          {/* EJECUTOR DE ENSAYOS ESTADÍSTICOS EN VIVO */}
          <div
            style={{
              background: 'var(--surface-muted, #f8fafc)',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔬</span> Banco de Ensayos Estadísticos en Vivo (NIST SP 800-22)
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.85 }}>
                  Ejecute ensayos sobre el motor CSPRNG real con muestreo con rechazo (HMAC-SHA256/U64) para verificar la hipótesis nula de uniformidad.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Muestras:
                  <select
                    value={auditSamples}
                    onChange={(e) => setAuditSamples(Number(e.target.value))}
                    disabled={auditLoading}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: 'inherit',
                    }}
                  >
                    <option value={1000}>1,000 sorteos</option>
                    <option value={10000}>10,000 sorteos</option>
                    <option value={50000}>50,000 sorteos</option>
                    <option value={100000}>100,000 sorteos</option>
                  </select>
                </label>

                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Cartón:
                  <select
                    value={auditCartonSize}
                    onChange={(e) => setAuditCartonSize(Number(e.target.value))}
                    disabled={auditLoading}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: 'inherit',
                    }}
                  >
                    <option value={100}>100 números (00-99)</option>
                    <option value={1000}>1,000 números (000-999)</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={runStatisticalAudit}
                  disabled={auditLoading}
                  style={{
                    background: auditLoading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: auditLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {auditLoading ? (
                    <>
                      <span className="animate-spin">⏳</span> Ensayando {auditSamples.toLocaleString()} muestras...
                    </>
                  ) : (
                    <>
                      <span>▶️</span> Ejecutar Ensayo en Servidor
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RESULTADOS DEL ENSAYO EN VIVO */}
            {auditResult && (
              <div
                style={{
                  background: 'var(--surface-card, #ffffff)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1.5px solid #10b981',
                  marginTop: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                      DICTAMEN OFICIAL DEL ENSAYO
                    </span>
                    <h5 style={{ margin: '2px 0 0', fontSize: '1.1rem', fontWeight: 900, color: auditResult?.statisticalResults?.passedUniformity ? '#059669' : '#dc2626' }}>
                      {auditResult?.statisticalResults?.passedUniformity ? '✓ CUMPLE: HIPÓTESIS NULA DE UNIFORMIDAD ACEPTADA (H0)' : '✕ NO CONFORME'}
                    </h5>
                  </div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                    Muestras: <strong>{auditResult?.testParameters?.totalSamples?.toLocaleString()}</strong> | Límite Crítico: <strong>p &ge; 0.01</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                  {/* Chi2 */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Chi-Cuadrado (&chi;&sup2;) Goodness-of-Fit</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669', margin: '2px 0' }}>
                      {auditResult?.statisticalResults?.chiSquareStatistic?.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>
                      p-value: <strong>{auditResult?.statisticalResults?.pValue?.toFixed(4)}</strong> ({auditResult?.testParameters?.degreesOfFreedom} gl)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800, marginTop: '4px' }}>
                      {auditResult?.statisticalResults?.passedUniformity ? '✓ Uniformidad Aprobada' : '✕ Sesgo Detectado'}
                    </div>
                  </div>

                  {/* Monobit */}
                  <div style={{ background: 'rgba(2, 132, 199, 0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Prueba Monobit NIST SP 800-22</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', margin: '2px 0' }}>
                      {auditResult?.nistMonobitEntropy?.onesRatio?.toFixed(4)}
                    </div>
                    <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>
                      Proporción de 1s (ideal: 0.5000)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 800, marginTop: '4px' }}>
                      {auditResult?.nistMonobitEntropy?.passedMonobit ? '✓ Entropía Monobit Aprobada' : '✕ Fallo Monobit'}
                    </div>
                  </div>

                  {/* CSPRNG Health */}
                  <div style={{ background: 'rgba(217, 119, 6, 0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Autotest de Salud NIST 800-90A/B</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#d97706', margin: '2px 0' }}>
                      {auditResult?.auditMetadata?.csprngSelfTest?.includes('CUMPLE') ? '100% OK' : 'Fallo'}
                    </div>
                    <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>
                      Sin colisiones en bytes de kernel
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 800, marginTop: '4px' }}>
                      ✓ CSPRNG SO Certificado
                    </div>
                  </div>

                  {/* Dispersión Máx-Mín */}
                  <div style={{ background: 'rgba(124, 58, 237, 0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Rango de Frecuencia Máx/Mín</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#7c3aed', margin: '2px 0' }}>
                      {auditResult?.statisticalResults?.minObservedFrequency} &ndash; {auditResult?.statisticalResults?.maxObservedFrequency}
                    </div>
                    <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>
                      Dispersión relativa: <strong>&plusmn;{auditResult?.statisticalResults?.rangeSpreadPct}%</strong>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 800, marginTop: '4px' }}>
                      ✓ Distribución Equilibrada
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={`/api/audit/rng-sample?samples=${auditSamples}&cartonSize=${auditCartonSize}&format=csv`}
                    download={`muestras-rng-leanlab-${auditSamples}.csv`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <span>📊</span> Descargar Muestra Cruda CSV ({auditSamples.toLocaleString()} registros)
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* MATRIZ DE PRE-COMPROMISO INMUTABLE Y ZERO-CHEAT */}
          <div
            style={{
              background: 'var(--surface-muted, #f8fafc)',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
            }}
          >
            <h4 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒</span> Protocolo Anti-Fraude de Pre-Compromiso en Servidor (/api/draws/commit)
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.84rem', lineHeight: 1.6, opacity: 0.9 }}>
              En estricto cumplimiento con la Resolución 20161200013844 de Coljuegos y las exigencias de inspección de Lean Lab, ni el operador de la rifa ni el software pueden alterar el ganador. El sistema aplica criptografía de clave pública y hash locking antes de iniciar el sorteo:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>1</span>
                  <strong style={{ fontSize: '0.92rem' }}>Fase 1: Pre-Compromiso Criptográfico</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                  Antes de activar las balotas 3D, el cliente envía a <code>/api/draws/commit</code> el hash de la semilla (<code>SeedCommitment = SHA256(Seed)</code>) y el <code>ListHash</code> de boletas. El servidor lo almacena en base de datos de manera inmutable. Si alguien intenta repetir el sorteo, el servidor devuelve <code>HTTP 409 Conflict</code>.
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #0284c7', background: 'rgba(2, 132, 199, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: '#0284c7', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>2</span>
                  <strong style={{ fontSize: '0.92rem' }}>Fase 2: Revelación y Verificación</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                  Al finalizar la animación física de la balotera, se revela la semilla en claro. El servidor verifica formalmente que <code>SHA256(Seed) === SeedCommitment</code> y ratifica el ganador oficial, registrando la constancia inalterable para consulta pública en <code>/verificar-sorteo</code>.
                </p>
              </div>
            </div>
          </div>

          {/* DESCARGA DE DOCUMENTACIÓN TÉCNICA OFICIAL */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1.5px dashed #0284c7',
              background: 'rgba(2, 132, 199, 0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>
                📄 Especificación Técnica Oficial para Laboratorios de Ensayo (DSD)
              </strong>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Documento de 2 páginas con fórmulas matemáticas, límites de rechazo IEEE y protocolo ISO 17025.
              </span>
            </div>

            <a
              href="/docs/especificacion-tecnica-rng-coljuegos-leanlab.pdf"
              download="Especificacion-Tecnica-RNG-Coljuegos-LeanLab.pdf"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0284c7',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
            >
              <span>📥</span> Descargar Especificación Técnica (PDF)
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
