'use client';

import React, { useState } from 'react';

export type LegalScope = 'nacional' | 'distrital' | 'departamental';

export interface RegionalDepartmentInfo {
  name: string;
  department: string;
  city: string;
  primaryUrl: string;
  primaryLabel: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
  codePlaceholder: string;
  entityName: string;
  timeframe: string;
  authorityType: 'Departamental (Lotería / Beneficencia)' | 'Municipal / Distrital (Alcaldía)';
}

export const REGIONAL_DEPARTMENTS: Record<string, RegionalDepartmentInfo> = {
  antioquia: {
    name: 'Antioquia / Medellín',
    department: 'Antioquia',
    city: 'Medellín',
    primaryUrl: 'https://www.benedan.gov.co/',
    primaryLabel: '💳 BENEDAN — Lotería y Beneficencia de Antioquia ↗',
    secondaryUrl: 'https://www.medellin.gov.co/es/tramites-y-servicios/',
    secondaryLabel: '🏛️ Trámites Alcaldía de Medellín (Hacienda y Rifas) ↗',
    codePlaceholder: 'Ej: RAD-ANT-2026-08129',
    entityName: 'BENEDAN / Alcaldía de Medellín',
    timeframe: '⏱️ 3 a 8 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  valle: {
    name: 'Valle del Cauca / Cali',
    department: 'Valle del Cauca',
    city: 'Cali',
    primaryUrl: 'https://www.beneficenciadelvalle.com/',
    primaryLabel: '💳 Beneficencia del Valle — Lotería del Valle ↗',
    secondaryUrl: 'https://www.cali.gov.co/seguridad/',
    secondaryLabel: '🏛️ Alcaldía de Cali (Secretaría de Seguridad y Justicia) ↗',
    codePlaceholder: 'Ej: RAD-VALLE-2026-11402',
    entityName: 'Beneficencia del Valle / Alcaldía de Cali',
    timeframe: '⏱️ 5 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  atlantico: {
    name: 'Atlántico / Barranquilla',
    department: 'Atlántico',
    city: 'Barranquilla',
    primaryUrl: 'https://www.barranquilla.gov.co/hacienda',
    primaryLabel: '💳 Secretaría Distrital de Hacienda de Barranquilla ↗',
    secondaryUrl: 'https://atlantico.gov.co/',
    secondaryLabel: '🏛️ Gobernación del Atlántico / Lotería del Atlántico ↗',
    codePlaceholder: 'Ej: RAD-BAQ-2026-05912',
    entityName: 'Secretaría de Hacienda de Barranquilla / Lotería del Atlántico',
    timeframe: '⏱️ 3 a 8 días hábiles',
    authorityType: 'Municipal / Distrital (Alcaldía)',
  },
  santander: {
    name: 'Santander / Bucaramanga',
    department: 'Santander',
    city: 'Bucaramanga',
    primaryUrl: 'https://www.loteriasantander.gov.co/',
    primaryLabel: '💳 Portal Oficial Lotería de Santander ↗',
    secondaryUrl: 'https://www.bucaramanga.gov.co/',
    secondaryLabel: '🏛️ Trámites Alcaldía de Bucaramanga ↗',
    codePlaceholder: 'Ej: RAD-SANT-2026-03194',
    entityName: 'Lotería de Santander / Alcaldía de Bucaramanga',
    timeframe: '⏱️ 4 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  cundinamarca: {
    name: 'Cundinamarca (Municipios)',
    department: 'Cundinamarca',
    city: 'Soacha, Chía, Zipaquirá...',
    primaryUrl: 'https://www.loteriadecundinamarca.com.co/',
    primaryLabel: '💳 Lotería y Beneficencia de Cundinamarca ↗',
    secondaryUrl: 'https://www.cundinamarca.gov.co/',
    secondaryLabel: '🏛️ Gobernación de Cundinamarca ↗',
    codePlaceholder: 'Ej: RAD-CUND-2026-02941',
    entityName: 'Lotería de Cundinamarca',
    timeframe: '⏱️ 5 a 12 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  boyaca: {
    name: 'Boyacá / Tunja',
    department: 'Boyacá',
    city: 'Tunja, Duitama, Sogamoso',
    primaryUrl: 'https://www.loteriadeboyaca.gov.co/',
    primaryLabel: '💳 Portal Oficial Lotería de Boyacá ↗',
    secondaryUrl: 'https://www.boyaca.gov.co/',
    secondaryLabel: '🏛️ Gobernación de Boyacá ↗',
    codePlaceholder: 'Ej: RAD-BOY-2026-00412',
    entityName: 'Lotería de Boyacá',
    timeframe: '⏱️ 4 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  tolima: {
    name: 'Tolima / Ibagué',
    department: 'Tolima',
    city: 'Ibagué',
    primaryUrl: 'https://www.loteriadeltolima.com/',
    primaryLabel: '💳 Portal Oficial Lotería del Tolima ↗',
    secondaryUrl: 'https://www.ibague.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Ibagué ↗',
    codePlaceholder: 'Ej: RAD-TOL-2026-00918',
    entityName: 'Lotería del Tolima / Alcaldía de Ibagué',
    timeframe: '⏱️ 4 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  huila: {
    name: 'Huila / Neiva',
    department: 'Huila',
    city: 'Neiva',
    primaryUrl: 'https://www.loteriadelhuila.com/',
    primaryLabel: '💳 Portal Oficial Lotería del Huila ↗',
    secondaryUrl: 'https://www.alcaldianeiva.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Neiva ↗',
    codePlaceholder: 'Ej: RAD-HUI-2026-00287',
    entityName: 'Lotería del Huila / Alcaldía de Neiva',
    timeframe: '⏱️ 4 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  risaralda: {
    name: 'Risaralda / Pereira',
    department: 'Risaralda',
    city: 'Pereira',
    primaryUrl: 'https://www.loteriaderisaralda.com/',
    primaryLabel: '💳 Portal Oficial Lotería de Risaralda ↗',
    secondaryUrl: 'https://www.pereira.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Pereira ↗',
    codePlaceholder: 'Ej: RAD-RIS-2026-00512',
    entityName: 'Lotería de Risaralda / Alcaldía de Pereira',
    timeframe: '⏱️ 4 a 8 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  caldas: {
    name: 'Caldas / Manizales',
    department: 'Caldas',
    city: 'Manizales',
    primaryUrl: 'https://loteriademanizales.com/',
    primaryLabel: '💳 Portal Oficial Lotería de Manizales ↗',
    secondaryUrl: 'https://manizales.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Manizales ↗',
    codePlaceholder: 'Ej: RAD-CAL-2026-00331',
    entityName: 'Lotería de Manizales / Alcaldía de Manizales',
    timeframe: '⏱️ 4 a 8 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  quindio: {
    name: 'Quindío / Armenia',
    department: 'Quindío',
    city: 'Armenia',
    primaryUrl: 'https://loteriadelquindio.com.co/',
    primaryLabel: '💳 Portal Oficial Lotería del Quindío ↗',
    secondaryUrl: 'https://www.armenia.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Armenia ↗',
    codePlaceholder: 'Ej: RAD-QUI-2026-00192',
    entityName: 'Lotería del Quindío / Alcaldía de Armenia',
    timeframe: '⏱️ 4 a 8 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  bolivar: {
    name: 'Bolívar / Cartagena',
    department: 'Bolívar',
    city: 'Cartagena',
    primaryUrl: 'https://www.cartagena.gov.co/',
    primaryLabel: '🏛️ Alcaldía Mayor de Cartagena (Interior y Hacienda) ↗',
    secondaryUrl: 'https://hacienda.cartagena.gov.co/',
    secondaryLabel: '💰 Secretaría de Hacienda de Cartagena ↗',
    codePlaceholder: 'Ej: RAD-CTG-2026-00812',
    entityName: 'Alcaldía de Cartagena / Gobernación de Bolívar',
    timeframe: '⏱️ 5 a 12 días hábiles',
    authorityType: 'Municipal / Distrital (Alcaldía)',
  },
  meta: {
    name: 'Meta / Villavicencio',
    department: 'Meta',
    city: 'Villavicencio',
    primaryUrl: 'https://www.loteriadelmeta.gov.co/',
    primaryLabel: '💳 Portal Oficial Lotería del Meta ↗',
    secondaryUrl: 'https://www.villavicencio.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Villavicencio ↗',
    codePlaceholder: 'Ej: RAD-META-2026-00445',
    entityName: 'Lotería del Meta / Alcaldía de Villavicencio',
    timeframe: '⏱️ 4 a 9 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  cauca: {
    name: 'Cauca / Popayán',
    department: 'Cauca',
    city: 'Popayán',
    primaryUrl: 'https://loteriadelcauca.com.co/',
    primaryLabel: '💳 Portal Oficial Lotería del Cauca ↗',
    secondaryUrl: 'https://www.popayan.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Popayán ↗',
    codePlaceholder: 'Ej: RAD-CAU-2026-00128',
    entityName: 'Lotería del Cauca / Alcaldía de Popayán',
    timeframe: '⏱️ 5 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  narino: {
    name: 'Nariño / Pasto',
    department: 'Nariño',
    city: 'Pasto',
    primaryUrl: 'https://loteriadenarino.com/',
    primaryLabel: '💳 Portal Oficial Lotería de Nariño ↗',
    secondaryUrl: 'https://www.pasto.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Pasto ↗',
    codePlaceholder: 'Ej: RAD-NAR-2026-00219',
    entityName: 'Lotería de Nariño / Alcaldía de Pasto',
    timeframe: '⏱️ 5 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  nortedesantander: {
    name: 'Norte de Santander / Cúcuta',
    department: 'Norte de Santander',
    city: 'Cúcuta',
    primaryUrl: 'https://cucuta.gov.co/',
    primaryLabel: '🏛️ Alcaldía de Cúcuta (Hacienda y Gobierno) ↗',
    secondaryUrl: 'https://nortedesantander.gov.co/',
    secondaryLabel: '🏛️ Gobernación de Norte de Santander ↗',
    codePlaceholder: 'Ej: RAD-CUC-2026-00543',
    entityName: 'Alcaldía de Cúcuta / Gobernación',
    timeframe: '⏱️ 5 a 10 días hábiles',
    authorityType: 'Municipal / Distrital (Alcaldía)',
  },
  magdalena: {
    name: 'Magdalena / Santa Marta',
    department: 'Magdalena',
    city: 'Santa Marta',
    primaryUrl: 'https://www.loteriadelmagdalena.com.co/',
    primaryLabel: '💳 Portal Oficial Lotería del Magdalena ↗',
    secondaryUrl: 'https://www.santamarta.gov.co/',
    secondaryLabel: '🏛️ Alcaldía de Santa Marta ↗',
    codePlaceholder: 'Ej: RAD-MAG-2026-00388',
    entityName: 'Lotería del Magdalena / Alcaldía de Santa Marta',
    timeframe: '⏱️ 5 a 10 días hábiles',
    authorityType: 'Departamental (Lotería / Beneficencia)',
  },
  otro: {
    name: 'Todos los demás 1.102 Municipios de Colombia (GOV.CO)',
    department: 'Nacional / Departamental / Municipal',
    city: 'Cualquier ciudad o municipio',
    primaryUrl: 'https://www.gov.co/tramites/',
    primaryLabel: '🏛️ Buscador Oficial SUIT GOV.CO (Por Municipio) ↗',
    secondaryUrl: 'https://www.gov.co/',
    secondaryLabel: '🌐 Portal Único del Estado Colombiano ↗',
    codePlaceholder: 'Ej: RAD-ALC-2026-XXXX',
    entityName: 'Alcaldía Municipal o Gobernación Departamental',
    timeframe: '⏱️ 5 a 15 días hábiles',
    authorityType: 'Municipal / Distrital (Alcaldía)',
  },
};

export interface RegionalPermitSelectorProps {
  scope?: LegalScope;
  region?: string;
  customCity?: string;
  radicado?: string;
  receiptFile?: File | null;
  receiptFileName?: string | null;
  onScopeChange?: (scope: LegalScope) => void;
  onRegionChange?: (region: string) => void;
  onCustomCityChange?: (city: string) => void;
  onRadicadoChange?: (radicado: string) => void;
  onFileChange?: (file: File | null) => void;
  validationError?: boolean;
}

export default function RegionalPermitSelectorWithTime({
  scope: controlledScope,
  region: controlledRegion,
  customCity: controlledCustomCity,
  radicado: controlledRadicado,
  receiptFile: controlledReceiptFile,
  receiptFileName: controlledReceiptFileName,
  onScopeChange,
  onRegionChange,
  onCustomCityChange,
  onRadicadoChange,
  onFileChange,
  validationError = false,
}: RegionalPermitSelectorProps) {
  // Estado local para fallback no controlado
  const [localScope, setLocalScope] = useState<LegalScope>('nacional');
  const [localRegion, setLocalRegion] = useState<string>('antioquia');
  const [localCustomCity, setLocalCustomCity] = useState<string>('');
  const [localRadicado, setLocalRadicado] = useState<string>('');
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [showFullDirectory, setShowFullDirectory] = useState<boolean>(true);

  const scope = controlledScope !== undefined ? controlledScope : localScope;
  const region = controlledRegion !== undefined ? controlledRegion : localRegion;
  const customCity = controlledCustomCity !== undefined ? controlledCustomCity : localCustomCity;
  const radicado = controlledRadicado !== undefined ? controlledRadicado : localRadicado;
  const fileName = controlledReceiptFileName || (controlledReceiptFile ? controlledReceiptFile.name : localFileName);

  const handleScopeSelect = (newScope: LegalScope) => {
    if (onScopeChange) onScopeChange(newScope);
    else setLocalScope(newScope);
  };

  const handleRegionSelect = (newRegion: string) => {
    if (onRegionChange) onRegionChange(newRegion);
    else setLocalRegion(newRegion);
  };

  const handleQuickRegionPick = (key: string) => {
    handleScopeSelect('departamental');
    handleRegionSelect(key);
  };

  const handleCustomCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onCustomCityChange) onCustomCityChange(val);
    else setLocalCustomCity(val);
  };

  const handleRadicadoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onRadicadoChange) onRadicadoChange(val);
    else setLocalRadicado(val);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (onFileChange) onFileChange(file);
    setLocalFileName(file ? file.name : null);
  };

  const handleRemoveFile = () => {
    if (onFileChange) onFileChange(null);
    setLocalFileName(null);
  };

  const departmentInfo = REGIONAL_DEPARTMENTS[region] || REGIONAL_DEPARTMENTS.antioquia;

  const isFormComplete = Boolean(radicado.trim() && (fileName || controlledReceiptFile));

  return (
    <div
      className="regional-permit-card"
      style={{
        border: validationError && !isFormComplete ? '2px solid #ef4444' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <h3 className="regional-permit-header-title" style={{ margin: 0 }}>
          <span>🏛️</span> Autorización Legal y Radicado Oficial (Ley 643 de 2001)
        </h3>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            background: isFormComplete ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isFormComplete ? '#22c55e' : '#ef4444',
            border: `1px solid ${isFormComplete ? '#22c55e' : '#ef4444'}`,
          }}
        >
          {isFormComplete ? '✅ Requisitos Completos' : '⚠️ Adjuntos Obligatorios'}
        </span>
      </div>

      <p className="regional-permit-desc" style={{ marginBottom: '16px' }}>
        En Colombia, toda rifa exige autorización previa y pago de derechos de explotación ante la entidad
        competente (<strong>Coljuegos a nivel nacional, Secretaría de Gobierno/Hacienda en Bogotá D.C., o Loterías Departamentales y Alcaldías Municipales en las regiones</strong>).
        <strong> No es posible publicar tu sorteo sin adjuntar el comprobante emitido por la autoridad correspondiente.</strong>
      </p>

      {/* 1. SELECTOR PRINCIPAL DE JURISDICCIÓN / ALCANCE */}
      <div className="regional-permit-field">
        <label className="regional-permit-label">
          <strong>1. Alcance Territorial y Entidad Reguladora:</strong>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginTop: '6px' }}>
          {/* Opción A: Nacional Coljuegos */}
          <button
            type="button"
            onClick={() => handleScopeSelect('nacional')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: scope === 'nacional' ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
              background: scope === 'nacional' ? 'rgba(0, 122, 255, 0.1)' : 'var(--surface-subtle, #f8fafc)',
              color: scope === 'nacional' ? '#007AFF' : 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '18px',
                  height: '13px',
                  background: 'linear-gradient(to bottom, #FCD116 0%, #FCD116 50%, #003893 50%, #003893 75%, #CE1126 75%, #CE1126 100%)',
                  borderRadius: '2px',
                  boxShadow: '0 0 1px rgba(0,0,0,0.5)',
                }}
              />
              <strong>Nacional (Coljuegos)</strong>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>
              Redes sociales, internet o 2+ departamentos
            </span>
          </button>

          {/* Opción B: Distrital Bogotá D.C. */}
          <button
            type="button"
            onClick={() => handleScopeSelect('distrital')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: scope === 'distrital' ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
              background: scope === 'distrital' ? 'rgba(0, 122, 255, 0.1)' : 'var(--surface-subtle, #f8fafc)',
              color: scope === 'distrital' ? '#007AFF' : 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🏛️ <strong>Distrital (Bogotá D.C.)</strong></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>
              Secretaría Distrital de Gobierno y Hacienda
            </span>
          </button>

          {/* Opción C: Departamental / Local */}
          <button
            type="button"
            onClick={() => handleScopeSelect('departamental')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: scope === 'departamental' ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
              background: scope === 'departamental' ? 'rgba(0, 122, 255, 0.1)' : 'var(--surface-subtle, #f8fafc)',
              color: scope === 'departamental' ? '#007AFF' : 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📍 <strong>Departamental / Municipal</strong></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>
              Loterías departamentales y alcaldías locales
            </span>
          </button>
        </div>
      </div>

      {/* SELECTOR DE DEPARTAMENTO SI ES DEPARTAMENTAL / LOCAL */}
      {scope === 'departamental' && (
        <div className="regional-permit-field" style={{ marginTop: '12px' }}>
          <label className="regional-permit-label">
            <strong>Selecciona tu Departamento / Ciudad en Colombia:</strong>
          </label>
          <select
            value={region}
            onChange={(e) => handleRegionSelect(e.target.value)}
            className="regional-permit-select"
            style={{ width: '100%', fontWeight: 600 }}
          >
            {Object.entries(REGIONAL_DEPARTMENTS).map(([k, d]) => (
              <option key={k} value={k}>
                {d.name} — {d.entityName} ({d.authorityType})
              </option>
            ))}
          </select>

          <div style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Ciudad o Municipio específico donde se juega la rifa:
            </label>
            <input
              type="text"
              placeholder="Ej: Bello, Soledad, Palmira, Floridablanca, Chía, Duitama, Cartago..."
              value={customCity}
              onChange={handleCustomCityChange}
              className="regional-permit-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* 2. CUADRO INFORMATIVO CON ENLACES DIRECTOS OFICIALES DE PAGO Y RADICACIÓN */}
      <div className="regional-permit-info-box" style={{ marginTop: '14px' }}>
        {scope === 'nacional' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '14px',
                  background: 'linear-gradient(to bottom, #FCD116 0%, #FCD116 50%, #003893 50%, #003893 75%, #CE1126 75%, #CE1126 100%)',
                  borderRadius: '2px',
                  boxShadow: '0 0 1px rgba(0,0,0,0.5)',
                }}
              />
              <strong style={{ fontSize: '0.98rem' }}>Portal Oficial Coljuegos (Nacional)</strong>
            </div>
            <p className="regional-permit-info-text">
              Rifas y sorteos promocionales que operan por <strong>redes sociales, internet</strong> o con cobertura en 2 o más departamentos.
              Los <strong>Derechos de Explotación</strong> equivalen al <strong>14%</strong> sobre el valor de emisión (Ley 643 de 2001, Art. 30).
            </p>
            <p className="regional-permit-timeframe">
              ⏱️ Tiempo de Aprobación: 15 a 30 días hábiles (Requiere radicado previo en portal)
            </p>

            {/* BOTONES DE ENLACE DIRECTO EXACTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <a
                href="https://portaloperador.coljuegos.gov.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="regional-permit-link-btn"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
              >
                💳 Portal de Operador y Pago PSE en Línea Coljuegos ↗
              </a>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                <a
                  href="https://www.coljuegos.gov.co/publicaciones/301297/tramite-de-rifas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="regional-permit-link-btn"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', fontSize: '0.85rem' }}
                >
                  📄 Guía de Requisitos y Radicación Coljuegos ↗
                </a>
                <a
                  href="https://www.gov.co/servicios-y-tramites/T6612"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="regional-permit-link-btn"
                  style={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', fontSize: '0.85rem' }}
                >
                  🏛️ Ventanilla Única GOV.CO (Coljuegos) ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {scope === 'distrital' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.2rem' }}>🏛️</span>
              <strong style={{ fontSize: '0.98rem' }}>Secretaría Distrital de Gobierno y Hacienda (Bogotá D.C.)</strong>
            </div>
            <p className="regional-permit-info-text">
              Para rifas que circulan <strong>exclusivamente en Bogotá D.C.</strong> Tramita la autorización ante la Secretaría Distrital de Gobierno y liquida los derechos de explotación distritales en la Secretaría Distrital de Hacienda.
            </p>
            <p className="regional-permit-timeframe">
              ⏱️ Tiempo de Aprobación: 5 a 15 días hábiles
            </p>

            {/* BOTONES DE ENLACE DIRECTO EXACTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <a
                href="https://bogota.gov.co/servicios/guia-de-tramites-y-servicios/autorizacion-para-la-realizacion-de-rifas"
                target="_blank"
                rel="noopener noreferrer"
                className="regional-permit-link-btn"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
              >
                💳 Trámite Oficial Autorización de Rifas Bogotá (Alcaldía Mayor) ↗
              </a>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                <a
                  href="https://oficinavirtual.shd.gov.co/OficinaVirtual/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="regional-permit-link-btn"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', fontSize: '0.85rem' }}
                >
                  💰 Oficina Virtual Hacienda Bogotá (Pago) ↗
                </a>
                <a
                  href="https://www.gobiernobogota.gov.co/tramites-servicios/autorizacion-rifas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="regional-permit-link-btn"
                  style={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', fontSize: '0.85rem' }}
                >
                  🏛️ Ventanilla Virtual Secretaría de Gobierno ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {scope === 'departamental' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.2rem' }}>📍</span>
              <div>
                <strong style={{ fontSize: '0.98rem', display: 'block' }}>{departmentInfo.name} — {departmentInfo.entityName}</strong>
                <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>{departmentInfo.authorityType}</span>
              </div>
            </div>
            <p className="regional-permit-info-text">
              Para rifas operadas en el departamento de <strong>{departmentInfo.department}</strong> o en tu alcaldía municipal. Los derechos de explotación financian la salud departamental.
            </p>
            <p className="regional-permit-timeframe">
              {departmentInfo.timeframe}
            </p>

            {/* BOTONES DE ENLACE DIRECTO EXACTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <a
                href={departmentInfo.primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="regional-permit-link-btn"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
              >
                {departmentInfo.primaryLabel}
              </a>
              {departmentInfo.secondaryUrl && (
                <a
                  href={departmentInfo.secondaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="regional-permit-link-btn"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', fontSize: '0.85rem' }}
                >
                  {departmentInfo.secondaryLabel}
                </a>
              )}
            </div>
          </div>
        )}

        {/* INSTRUCCIONES PASO A PASO */}
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed rgba(148, 163, 184, 0.3)', fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
          <strong style={{ display: 'block', color: 'inherit', marginBottom: '4px' }}>
            💡 Pasos obligatorios para habilitar la publicación:
          </strong>
          <ol style={{ margin: '0 0 0 16px', padding: 0, lineHeight: 1.5 }}>
            <li>Haz clic en el enlace oficial de arriba y efectúa el pago de derechos de explotación / solicitud.</li>
            <li>Copia el <strong>Número de Radicado o Código de Pago</strong> emitido por la entidad y pégalo abajo.</li>
            <li>Descarga el <strong>Comprobante Oficial de Pago o Resolución</strong> (PDF o Imagen) y adjúntalo a continuación.</li>
          </ol>
        </div>
      </div>

      {/* =========================================================================
          DIRECTORIO VISUAL DE ENLACES DIRECTOS: DEPARTAMENTAL Y MUNICIPAL
          ========================================================================= */}
      <div style={{ marginTop: '16px', background: 'var(--surface-subtle, #f8fafc)', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: '12px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setShowFullDirectory(!showFullDirectory)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📂</span>
            <strong style={{ fontSize: '0.92rem' }}>
              Directorio de Enlaces Directos Oficiales (Departamentales y Municipales)
            </strong>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#007AFF', fontWeight: 'bold' }}>
            {showFullDirectory ? '▲ Ocultar Directorio' : '▼ Ver Todos los Enlaces Directos'}
          </span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>
          Accede directamente a la página exacta de tu departamento o ciudad haciendo clic en cualquiera de los enlaces a continuación:
        </p>

        {showFullDirectory && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {Object.entries(REGIONAL_DEPARTMENTS).map(([key, item]) => {
              const isSelected = scope === 'departamental' && region === key;
              return (
                <div
                  key={key}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.2)',
                    background: isSelected ? 'rgba(0, 122, 255, 0.08)' : 'var(--surface-primary, #ffffff)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>📍 {item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleQuickRegionPick(key)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid #007AFF',
                        background: isSelected ? '#007AFF' : 'transparent',
                        color: isSelected ? '#ffffff' : '#007AFF',
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <a
                      href={item.primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.76rem',
                        color: '#007AFF',
                        textDecoration: 'none',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🔗 {item.primaryLabel.replace(/💳 |🏛️ |↗/g, '').trim()} ↗
                    </a>
                    {item.secondaryUrl && (
                      <a
                        href={item.secondaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary, #64748b)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        🏛️ {item.secondaryLabel?.replace(/🏛️ |💰 |↗/g, '').trim()} ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. INPUT OBLIGATORIO: CÓDIGO DE RADICADO / RESOLUCIÓN */}
      <div className="regional-permit-field" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label className="regional-permit-label" style={{ margin: 0 }}>
            <strong>2. Número de Radicado / Resolución Oficial emitido por la entidad:</strong>
          </label>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: radicado.trim() ? '#22c55e' : '#ef4444',
            }}
          >
            {radicado.trim() ? '✓ Radicado ingresado' : '* Campo Obligatorio'}
          </span>
        </div>
        <input
          type="text"
          placeholder={
            scope === 'nacional'
              ? 'Ej: RAD-COLJ-2026-98124 o RES-CJ-10482'
              : scope === 'distrital'
              ? 'Ej: RAD-SDG-BOG-2026-44120'
              : departmentInfo.codePlaceholder
          }
          value={radicado}
          onChange={handleRadicadoInput}
          className="regional-permit-input"
          style={{
            borderColor: validationError && !radicado.trim() ? '#ef4444' : undefined,
          }}
          required
        />
        <small style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
          Ingresa el código suministrado directamente en la pantalla de confirmación o en el recibo de pago.
        </small>
      </div>

      {/* 4. ADJUNTAR COMPROBANTE OFICIAL DE PAGO (PDF O IMAGEN) */}
      <div className="regional-permit-field" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label className="regional-permit-label" style={{ margin: 0 }}>
            <strong>3. Adjuntar Comprobante de Pago de Derechos o Resolución (PDF o Imagen):</strong>
          </label>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: fileName ? '#22c55e' : '#ef4444',
            }}
          >
            {fileName ? '✓ Comprobante adjunto' : '* Archivo Obligatorio'}
          </span>
        </div>

        <div
          className="regional-permit-file-wrapper"
          style={{
            borderColor: validationError && !fileName ? '#ef4444' : undefined,
          }}
        >
          <label className="regional-permit-file-btn">
            <span>📎 Seleccionar Comprobante</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileInput}
              hidden
            />
          </label>
          <span className="regional-permit-file-name">
            {fileName ? `📄 ${fileName}` : 'Ningún comprobante seleccionado (Sube PDF, JPG o PNG expedido por la entidad)'}
          </span>
          {fileName && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="regional-permit-file-remove"
              title="Quitar archivo"
            >
              ✕
            </button>
          )}
        </div>
        <small style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
          Debe ser el recibo emitido por Coljuegos, Secretaría de Hacienda Distrital o la Lotería departamental donde conste el pago de derechos de explotación.
        </small>
      </div>

      {/* 5. AVISO DE CUMPLIMIENTO / BLOQUEO LEGAL */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 14px',
          borderRadius: '10px',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isFormComplete ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isFormComplete ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: isFormComplete ? '#15803d' : '#b91c1c',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>{isFormComplete ? '🛡️' : '⛔'}</span>
        <div>
          {isFormComplete ? (
            <span>
              <strong>Validación legal aprobada:</strong> Número de radicado registrado y comprobante oficial listo para ratificación. Tu sorteo cumple con el marco de la Ley 643 de 2001.
            </span>
          ) : (
            <span>
              <strong>Bloqueo Legal Preventivo (Ley 643 de 2001):</strong> El botón de publicación se desbloqueará una vez ingreses el radicado y adjuntes el comprobante de pago oficial de Coljuegos o la entidad territorial.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
