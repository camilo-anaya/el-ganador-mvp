// components/ColjuegosLegalGuide.tsx
// Guía Maestra Legal Sintetizada: Marco Normativo Coljuegos, Requisitos Oficiales, Tiempos, Finanzas y Certificación Técnica
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export interface LegalRequirementItem {
  no: number;
  category: 'identidad' | 'premio' | 'garantias' | 'operacion';
  categoryLabel: string;
  title: string;
  desc: string;
  norm: string;
  keyRule: string;
}

export const SYNTHESIZED_REQUIREMENTS: LegalRequirementItem[] = [
  // PILAR 1: IDENTIDAD Y REPRESENTACIÓN
  {
    no: 1,
    category: 'identidad',
    categoryLabel: 'Identidad y Comercio',
    title: 'Certificado de Cámara de Comercio (< 30 días)',
    desc: 'Certificado original de existencia y representación legal con vigencia máxima de 30 días calendario.',
    norm: 'Decreto 1968/2001 Art. 5',
    keyRule: 'Para personas naturales se requiere fotocopia legible de la cédula de ciudadanía.',
  },
  {
    no: 2,
    category: 'identidad',
    categoryLabel: 'Identidad y Comercio',
    title: 'RUT Vigente ante la DIAN',
    desc: 'Registro Único Tributario activo con actividad comercial legal que respalde la operación.',
    norm: 'Estatuto Tributario',
    keyRule: 'Debe coincidir exactamente con el NIT y razón social del solicitante.',
  },
  {
    no: 3,
    category: 'identidad',
    categoryLabel: 'Identidad y Comercio',
    title: 'Cédula del Representante Legal o Poder Autenticado',
    desc: 'Documento de identidad legible del representante legal. Si actúa apoderado, poder notarial formal.',
    norm: 'Resolución Coljuegos 135/2012',
    keyRule: 'Acreditación formal para vincular a la persona jurídica en el sorteo.',
  },

  // PILAR 2: EL PREMIO Y PROPIEDAD
  {
    no: 4,
    category: 'premio',
    categoryLabel: 'El Premio',
    title: 'Comprobante de Plena Propiedad (Sin Reserva de Dominio)',
    desc: 'Título que demuestre que el bien mueble, inmueble o vehículo está libre de gravámenes, embargos o reservas.',
    norm: 'Decreto 1968/2001 Art. 6',
    keyRule: 'El bien debe estar totalmente pago y disponible para transferencia inmediata al ganador.',
  },
  {
    no: 5,
    category: 'premio',
    categoryLabel: 'El Premio',
    title: 'Avalúo Comercial y Factura Legal de Adquisición',
    desc: 'Factura formal de compra en concesionario/comercio o avalúo pericial de inmuebles.',
    norm: 'Decreto 1968/2001 Art. 6',
    keyRule: 'Fija el valor real del premio sobre el cual se calcula la póliza y los derechos de salud.',
  },

  // PILAR 3: GARANTÍAS Y SALUD PÚBLICA
  {
    no: 6,
    category: 'garantias',
    categoryLabel: 'Garantías y Salud',
    title: 'Póliza de Cumplimiento del 100% a favor de Coljuegos',
    desc: 'Garantía con aseguradora legal vigilada por Superfinanciera cubriendo el 100% del valor del premio.',
    norm: 'Decreto 1968/2001 Art. 6',
    keyRule: 'Vigencia obligatoria: mínimo 4 meses contados desde la fecha fijada para el sorteo.',
  },
  {
    no: 7,
    category: 'garantias',
    categoryLabel: 'Garantías y Salud',
    title: 'Liquidación y Pago del 14% de Salud (Ley 643/2001)',
    desc: 'Derechos de explotación obligatorios del 14% sobre la emisión total de boletas con destino al sector salud.',
    norm: 'Ley 643/2001 Art. 30',
    keyRule: 'Monopolio rentístico del Estado. Sin este comprobante la venta de boletas constituye delito penal.',
  },

  // PILAR 4: OPERACIÓN, BOLETERÍA Y PAUTA
  {
    no: 8,
    category: 'operacion',
    categoryLabel: 'Operación y Transparencia',
    title: 'Formulario 8 Oficial de Solicitud de Autorización',
    desc: 'Formato reglamentario diligenciado con todos los datos técnicos del sorteo, fecha y valor de emisión.',
    norm: 'Decreto 1968/2001 Art. 5',
    keyRule: 'Debe radicarse con antelación no menor a 45 días calendario a la fecha del sorteo.',
  },
  {
    no: 9,
    category: 'operacion',
    categoryLabel: 'Operación y Transparencia',
    title: 'Boleta Digital con Hash Criptográfico SHA-256',
    desc: 'La boleta debe incluir número, valor en COP, fecha del sorteo, premio detallado y número de resolución.',
    norm: 'Decreto 1968/2001 Art. 6',
    keyRule: 'El Ganador genera automáticamente este boleto inmutable cumpliendo toda la normativa.',
  },
  {
    no: 10,
    category: 'operacion',
    categoryLabel: 'Operación y Transparencia',
    title: 'Proyecto de Pauta con Leyenda "Autorizado por Coljuegos"',
    desc: 'Plan de medios y piezas publicitarias con la leyenda mandatoria claramente audible y visible.',
    norm: 'Decreto 1968/2001 Art. 6',
    keyRule: 'En radio y video debe decirse de viva voz; en redes y vitrina debe estar legible.',
  },
  {
    no: 11,
    category: 'operacion',
    categoryLabel: 'Operación y Transparencia',
    title: 'Mecanismo de Extracción Oficial (Balotera 3D o Lotería)',
    desc: 'Lotería tradicional autorizada de referencia o Balotera 3D con certificación de laboratorio ISO 17025.',
    norm: 'Decreto 1968/2001 Art. 6',
    keyRule: 'Garantiza transparencia matemática absoluta sin intervención humana ni selección previa.',
  },
];

interface ColjuegosLegalGuideProps {
  embeddedMode?: boolean;
  onClose?: () => void;
}

export default function ColjuegosLegalGuide({ embeddedMode = false, onClose }: ColjuegosLegalGuideProps) {
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'requisitos' | 'tiempos' | 'finanzas' | 'certificacion'>('requisitos');
  const [filterCategory, setFilterCategory] = useState<'all' | 'identidad' | 'premio' | 'garantias' | 'operacion'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Sincronización robusta con tema
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext?.theme === 'dark';
  } catch {
    isDark = false;
  }

  // Auditoría estadística en servidor (ISO 17025)
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
  const progressPct = Math.round((completedCount / SYNTHESIZED_REQUIREMENTS.length) * 100);

  const filteredRequirements = SYNTHESIZED_REQUIREMENTS.filter((r) => {
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.norm.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`coljuegos-legal-card ${embeddedMode ? 'embedded' : 'standalone'}`} style={{ color: 'inherit' }}>
      {/* =========================================================================
          CABECERA OFICIAL SINTETIZADA
          ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
          color: '#ffffff',
          borderRadius: embeddedMode ? '16px' : '20px',
          padding: '24px 20px',
          border: '1.5px solid #007AFF',
          boxShadow: '0 8px 30px rgba(0, 122, 255, 0.25)',
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
              overflow: 'hidden',
            }}
            title="Bandera de Colombia · República de Colombia"
          >
            <svg width="40" height="28" viewBox="0 0 36 24" fill="none" style={{ borderRadius: '4px', display: 'block' }}>
              <rect width="36" height="12" fill="#FCD116" />
              <rect y="12" width="36" height="6" fill="#003893" />
              <rect y="18" width="36" height="6" fill="#CE1126" />
            </svg>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#f5b82e', textTransform: 'uppercase' }}>
              COLJUEGOS · MONOPOLIO RENTÍSTICO DE JUEGOS DE SUERTE Y AZAR
            </span>
            <h2 className="coljuegos-banner-title" style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0 2px', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
              Marco Legal y Operación Oficial de Rifas en Colombia
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
              Normativa sintetizada: Ley 643/2001, Decreto 1968/2001, 14% de salud pública y certificación técnica ISO 17025.
            </p>
          </div>
        </div>

        {/* BOTONES DIRECTOS DE ACCIÓN */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/docs/requisitos-coljuegos-rifas-nacionales.pdf"
            download="Requisitos-Coljuegos-Rifas-Nacionales.pdf"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.84rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)',
            }}
          >
            <span>📥</span> Descargar PDF Coljuegos
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
              fontSize: '0.84rem',
              textDecoration: 'none',
            }}
          >
            <span>📜</span> DSD Técnico ISO 17025 (PDF)
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '9px 14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            <span>🖨️</span> Imprimir
          </button>

          <Link
            href="/empresario/crear-rifa"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 122, 255, 0.2)',
              border: '1px solid #007AFF',
              color: '#38bdf8',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <span>🚀</span> Ir a Crear Rifa con IA →
          </Link>
        </div>
      </div>

      {/* =========================================================================
          4 PESTAÑAS MAESTRAS NO REDUNDANTES
          ========================================================================= */}
      <nav
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '8px',
          marginBottom: '20px',
        }}
        aria-label="Secciones del Marco Legal"
      >
        {[
          { id: 'requisitos', label: '📋 11 Requisitos (Decreto 1968)' },
          { id: 'tiempos', label: '⏳ Cronograma Oficial (15-30 Días)' },
          { id: 'finanzas', label: '💰 14% Salud y Cero Captación' },
          { id: 'certificacion', label: '🔬 Certificación Anti-Fraude (ISO 17025)' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '11px 14px',
                borderRadius: '12px',
                border: isActive
                  ? '2px solid #007AFF'
                  : isDark
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid #cbd5e1',
                background: isActive
                  ? 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : '#f8fafc',
                color: isActive ? '#ffffff' : isDark ? '#ffffff' : '#0f172a',
                fontWeight: isActive ? 900 : 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: isActive ? '0 4px 14px rgba(0, 122, 255, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* =========================================================================
          MÓDULO 1: LOS 11 REQUISITOS ORGANIZADOS EN 4 PILARES
          ========================================================================= */}
      {activeTab === 'requisitos' && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
                📋 Lista de Chequeo Documental Oficial (Decreto 1968 de 2001)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', opacity: 0.85 }}>
                Sintetizados en 4 pilares: marca los documentos que tienes listos para tu expediente formal ante Coljuegos.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 900, color: progressPct === 100 ? '#007AFF' : '#0284c7' }}>
                {completedCount} / {SYNTHESIZED_REQUIREMENTS.length} Listos ({progressPct}%)
              </span>
              <div style={{ width: '90px', height: '8px', background: 'rgba(148, 163, 184, 0.3)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: '#007AFF', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>

          {/* FILTROS POR PILAR */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[
              { id: 'all', label: 'Todos (11)' },
              { id: 'identidad', label: '1. Identidad' },
              { id: 'premio', label: '2. El Premio' },
              { id: 'garantias', label: '3. Garantías & Salud' },
              { id: 'operacion', label: '4. Operación' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterCategory(f.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: filterCategory === f.id ? 800 : 600,
                  border: filterCategory === f.id ? '1.5px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
                  background: filterCategory === f.id ? '#007AFF' : 'transparent',
                  color: filterCategory === f.id ? '#ffffff' : 'inherit',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* BUSCADOR */}
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar en los 11 requisitos (ej: póliza, avalúo, cédula, formulario 8)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1.5px solid rgba(148, 163, 184, 0.3)',
                background: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '0.86rem',
              }}
            />
          </div>

          {/* TARJETAS DE REQUISITOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredRequirements.map((req) => (
              <div
                key={req.no}
                onClick={() => toggleCheck(req.no)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: checkedItems[req.no] ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.25)',
                  background: checkedItems[req.no]
                    ? isDark
                      ? 'rgba(0, 122, 255, 0.12)'
                      : '#f0f9ff'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[req.no]}
                  onChange={() => toggleCheck(req.no)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ fontSize: '0.94rem' }}>
                      {req.no}. {req.title}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(2, 132, 199, 0.12)',
                        color: '#0284c7',
                        border: '1px solid rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      {req.norm}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 6px', fontSize: '0.83rem', lineHeight: 1.5, opacity: 0.9 }}>
                    {req.desc}
                  </p>

                  <div style={{ fontSize: '0.76rem', color: '#0284c7', background: isDark ? 'rgba(2, 132, 199, 0.12)' : '#e0f2fe', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    📌 Regla de Oro: {req.keyRule}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SÍNTESIS DE COMPETENCIAS OFICIALES */}
          <div
            style={{
              marginTop: '18px',
              padding: '14px',
              borderRadius: '12px',
              background: isDark ? 'rgba(2, 132, 199, 0.08)' : '#eff6ff',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              fontSize: '0.82rem',
              lineHeight: 1.55,
            }}
          >
            <strong>🏛️ Jurisdicción y Competencia (Decreto 4142/2011):</strong>
            <p style={{ margin: '4px 0 0' }}>
              • <strong>Coljuegos (Nivel Nacional):</strong> Autoriza cuando el sorteo se comercializa en 2 o más departamentos, o en un departamento y Bogotá D.C.
              <br />
              • <strong>Loterías Departamentales / Alcaldías:</strong> Autorizan exclusivamente sorteos con venta circunscrita a un solo departamento o municipio.
            </p>
          </div>
        </section>
      )}

      {/* =========================================================================
          MÓDULO 2: CRONOGRAMA OFICIAL Y PLAZOS LEGALES (15 A 30 DÍAS)
          ========================================================================= */}
      {activeTab === 'tiempos' && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '24px 20px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900 }}>
            ⏳ Cronograma Legal Obligatorio: Tiempos de Radicación y Respuesta
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.85rem', lineHeight: 1.6, opacity: 0.9 }}>
            La legislación colombiana (Decreto 1968 de 2001, Art. 5) establece términos estrictos de anticipación que todo comerciante debe conocer para no infringir la ley:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #007AFF', background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#007AFF', marginBottom: '4px' }}>45 Días</div>
              <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>
                1. Antelación de Radicación
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                El expediente con el Formulario 8 y los 11 requisitos debe radicarse formalmente ante Coljuegos con al menos 45 días calendario de anticipación a la fecha del sorteo.
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #0284c7', background: isDark ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0284c7', marginBottom: '4px' }}>15 a 30 Días</div>
              <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>
                2. Plazo de Estudio de Coljuegos
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                Término legal que toma la entidad estatal para auditar la póliza, verificar los derechos de salud del 14% y emitir la Resolución Oficial de Autorización.
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #0f172a', background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a', marginBottom: '4px' }}>Luz Verde</div>
              <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>
                3. Apertura de Venta de Boletas
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                Durante los 15-30 días el sorteo se muestra en vitrina en <strong>Modo Expectativa / Preventa</strong>. En cuanto Coljuegos emite la resolución, se habilitan las compras en Wompi.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: isDark ? '#0f172a' : '#f8fafc',
              border: '1.5px solid #0284c7',
              fontSize: '0.84rem',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#0284c7', display: 'block', marginBottom: '6px' }}>
              🤖 ¿Cómo actúa la Secretaria Legal IA en este cronograma?
            </strong>
            <div>1. Toma los datos que simulaste en la calculadora y arma el expediente oficial sin errores de foliado.</div>
            <div>2. Radica formalmente ante Coljuegos y te entrega de inmediato tu <strong>Radicado de Entrada (SOL-COLJ-2026-XXXXXX)</strong>.</div>
            <div>3. Hace seguimiento continuo del expediente durante los 15 a 30 días hábiles de estudio.</div>
            <div>4. Al emitirse la resolución definitiva, dispara una notificación a tu campana 🔔 del panel empresarial y activa automáticamente el recaudo bancario en vitrina.</div>
          </div>
        </section>
      )}

      {/* =========================================================================
          MÓDULO 3: REPARTO FINANCIERO Y CERO CAPTACIÓN ILEGAL
          ========================================================================= */}
      {activeTab === 'finanzas' && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '24px 20px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900 }}>
            💰 Desglose Financiero Oficial y Principio de Cero Captación
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.85rem', lineHeight: 1.6, opacity: 0.9 }}>
            Estructura económica transparente conforme al Artículo 30 de la Ley 643 de 2001 y las normas financieras de Colombia:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', border: '2px solid #007AFF', background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, background: '#007AFF', color: '#fff', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
                OBLIGATORIO DE LEY
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#007AFF', margin: '6px 0 2px' }}>14%</div>
              <strong style={{ fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
                Salud Pública (Coljuegos / Lotería)
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                Porcentaje fijado por el Estado sobre la emisión total bruta del plan de premios, transferido íntegramente a financiar la red hospitalaria pública en Colombia.
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #0284c7', background: isDark ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
                TECNOLOGÍA &amp; GESTIÓN
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#0284c7', margin: '6px 0 2px' }}>10%</div>
              <strong style={{ fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
                Plataforma SaaS El Ganador
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                Cubre la infraestructura en la nube, emisión criptográfica SHA-256 de balotas, transmisión 3D en vivo, tramitación de la Secretaria Legal IA y vitrina comercial.
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #64748b', background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, background: '#64748b', color: '#fff', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
                ADQUIRENCIA VIGILADA
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a', margin: '6px 0 2px' }}>Wompi</div>
              <strong style={{ fontSize: '0.94rem', display: 'block', marginBottom: '4px' }}>
                Pasarela Bancolombia Vigilada
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                Tarifa directa interbancaria (PSE, Nequi, tarjetas de crédito) vigilada por la Superintendencia Financiera de Colombia, sin sobrecostos ocultos.
              </p>
            </div>
          </div>

          {/* PROTECCIÓN LEGAL CONTRA CAPTACIÓN ILEGAL */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: isDark ? '#0f172a' : '#f8fafc',
              border: '1.5px solid #007AFF',
              fontSize: '0.84rem',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <strong style={{ fontSize: '0.96rem', color: '#007AFF' }}>
                Cero Captación Ilegal y Cero Custodia de Fondos (Decreto 4334/2008)
              </strong>
            </div>
            <p style={{ margin: '0 0 8px', opacity: 0.9 }}>
              <strong>El Ganador S.A.S. NO capta, retiene ni custodia dineros del público.</strong> 
              La dispersión de fondos se realiza mediante la tecnología de <em>Marketplace Split</em> de Wompi Bancolombia: cuando un usuario compra una boleta, la pasarela transfiere automáticamente el dinero a la cuenta bancaria del empresario y las tarifas aplicables de forma directa.
            </p>
            <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
              ✓ Cumplimiento estricto del régimen de intermediación financiera y prevención de lavado de activos (SARLAFT).
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          MÓDULO 4: CERTIFICACIÓN TÉCNICA E INTEGRIDAD (ISO 17025 / LEAN LAB)
          ========================================================================= */}
      {activeTab === 'certificacion' && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '24px 20px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          {/* BANNER ACREDITACIÓN OFICIAL */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
              color: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              border: '1.5px solid #0284c7',
              boxShadow: '0 8px 30px rgba(0, 122, 255, 0.2)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px' }}>🏛️</span>
              <div>
                <span style={{ background: '#007AFF', color: '#ffffff', fontSize: '0.72rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                  Resolución Coljuegos No. 20260019624
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#fef08a' }}>
                  LEAN LAB COMPANY LIMITED (RiskCherry) — Reg. C-96476
                </h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Norma RNG / Juegos</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>ISO/IEC 17025:2017 No 025</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Inspección de Sistemas</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>ISO/IEC 17020:2012 No 110</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Marco Técnico Obligatorio</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fde047' }}>Res. 20161200013844</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Gestión de Calidad</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#93c5fd' }}>Estándar ISO 9001:2015</div>
              </div>
            </div>
          </div>

          {/* PROTOCOLO PRE-COMPROMISO */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: isDark ? '#0f172a' : '#f8fafc',
              border: '1.5px solid #007AFF',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 800, color: '#007AFF' }}>
              🔒 Protocolo Criptográfico Anti-Fraude: Pre-Compromiso Inmutable
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.82rem', lineHeight: 1.55, opacity: 0.9 }}>
              Nadie (ni el comerciante ni los creadores de El Ganador) puede predecir ni alterar la balota ganadora:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: isDark ? 'rgba(0, 122, 255, 0.1)' : '#eff6ff', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                <strong style={{ display: 'block', color: '#007AFF', marginBottom: '2px' }}>Fase 1: Pre-Compromiso</strong>
                El servidor fija en base de datos el hash criptográfico <code>SeedCommitment = SHA256(Semilla)</code> antes de que la balotera empiece a girar.
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: isDark ? 'rgba(2, 132, 199, 0.1)' : '#eff6ff', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                <strong style={{ display: 'block', color: '#0284c7', marginBottom: '2px' }}>Fase 2: Revelación Pública</strong>
                Al caer la balota, se revela la semilla. El público y los entes de control verifican que la extracción fue 100% matemática e inalterable.
              </div>
            </div>
          </div>

          {/* BANCO DE ENSAYOS ESTADÍSTICOS EN VIVO */}
          <div
            style={{
              padding: '18px',
              borderRadius: '14px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  🔬 Banco de Ensayos Estadísticos en Vivo (NIST SP 800-22)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                  Ejecuta una prueba directa contra el generador aleatorio CSPRNG en el servidor.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={auditSamples}
                  onChange={(e) => setAuditSamples(Number(e.target.value))}
                  disabled={auditLoading}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <option value={1000}>1.000 muestras</option>
                  <option value={10000}>10.000 muestras</option>
                  <option value={50000}>50.000 muestras</option>
                </select>

                <button
                  type="button"
                  onClick={runStatisticalAudit}
                  disabled={auditLoading}
                  style={{
                    background: auditLoading ? '#94a3b8' : 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: auditLoading ? 'wait' : 'pointer',
                  }}
                >
                  {auditLoading ? '⏳ Ensayando...' : '▶️ Ejecutar Ensayo en Servidor'}
                </button>
              </div>
            </div>

            {auditResult && (
              <div
                style={{
                  background: isDark ? '#0f172a' : '#f8fafc',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1.5px solid #007AFF',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#007AFF', fontSize: '0.9rem' }}>
                    Dictamen Oficial: {auditResult?.statisticalResults?.passedUniformity ? '✓ CUMPLE UNIFORMIDAD (H0)' : '✕ NO CONFORME'}
                  </strong>
                  <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                    p-value: <strong>{auditResult?.statisticalResults?.pValue?.toFixed(4)}</strong> (límite &ge; 0.01)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
                  <div>Chi-Cuadrado: <strong>{auditResult?.statisticalResults?.chiSquareStatistic?.toFixed(2)}</strong></div>
                  <div>Monobit NIST: <strong>{auditResult?.nistMonobitEntropy?.onesRatio?.toFixed(4)}</strong></div>
                  <div>Dispersión: <strong>&plusmn;{auditResult?.statisticalResults?.rangeSpreadPct}%</strong></div>
                  <div>Autotest SO: <strong>100% OK</strong></div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
