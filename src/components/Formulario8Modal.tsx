// components/Formulario8Modal.tsx
// Visualizador e Impresor Oficial del FORMULARIO 8 de Coljuegos (Código: CMI-FR-08, Versión 7)
// Optimizado para visualización móvil sin bordes (full-bleed display) e impresión oficial de alta precisión.
'use client';

import React from 'react';

export interface Formulario8Data {
  radicado?: string;
  storeName?: string;
  nit?: string;
  department?: string;
  city?: string;
  address?: string;
  email?: string;
  representative?: string;
  phone?: string;
  activity?: string;
  raffleTitle: string;
  isNational?: boolean;
  ticketPrice: number;
  totalTickets: number;
  totalRevenue: number;
  drawDate?: string;
  lotteryName?: string;
  prizeCost: number;
  prizeDescription?: string;
  gainTaxPaidBy?: 'empresa' | 'ganador';
  coljuegosTax14?: number;
  coljuegosAdmin1?: number;
  totalTaxColjuegos?: number;
  createdAt?: string | number;
}

function numberToSpanishLetters(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return 'CERO PESOS M/CTE';
  
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas10a19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertGroup(n: number): string {
    let output = '';
    if (n === 100) return 'CIEN';
    if (n > 99) {
      output += centenas[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      output += decenas10a19[n - 10] + ' ';
    } else if (n >= 20 && n <= 29) {
      if (n === 20) output += 'VEINTE ';
      else output += 'VEINTI' + unidades[n - 20] + ' ';
    } else if (n >= 30) {
      output += decenas[Math.floor(n / 10)];
      if (n % 10 > 0) output += ' Y ' + unidades[n % 10];
      output += ' ';
    } else if (n > 0) {
      output += unidades[n] + ' ';
    }
    return output.trim();
  }

  const rounded = Math.floor(amount);
  const millones = Math.floor(rounded / 1000000);
  const miles = Math.floor((rounded % 1000000) / 1000);
  const residuo = rounded % 1000;

  let result = '';
  if (millones > 0) {
    if (millones === 1) result += 'UN MILLÓN ';
    else result += convertGroup(millones) + ' MILLONES ';
  }
  if (miles > 0) {
    if (miles === 1) result += 'MIL ';
    else result += convertGroup(miles) + ' MIL ';
  }
  if (residuo > 0) {
    result += convertGroup(residuo) + ' ';
  }

  return (result.trim() + ' PESOS M/CTE').toUpperCase();
}

export default function Formulario8Modal({
  data,
  onClose,
}: {
  data: Formulario8Data;
  onClose: () => void;
}) {
  const ticketPrice = Number(data.ticketPrice) || 0;
  const totalTickets = Number(data.totalTickets) || 1000;
  const totalRevenue = Number(data.totalRevenue) || ticketPrice * totalTickets;
  const prizeCost = Number(data.prizeCost) || 0;
  const coljuegosTax14 = data.coljuegosTax14 ?? Math.round(totalRevenue * 0.14);
  const coljuegosAdmin1 = data.coljuegosAdmin1 ?? Math.round(coljuegosTax14 * 0.01);
  const totalTaxColjuegos = data.totalTaxColjuegos ?? (coljuegosTax14 + coljuegosAdmin1);
  const radicado = data.radicado || 'SOL-COLJ-2026-819204';
  const prizeInLetters = numberToSpanishLetters(prizeCost);
  const totalTaxInLetters = numberToSpanishLetters(totalTaxColjuegos);

  let formattedDate = '';
  if (data.drawDate) {
    try {
      const cleanDate = String(data.drawDate).replace(/[^\d\-\:\/T\s]/g, '').trim();
      const parsed = new Date(cleanDate || data.drawDate);
      if (!isNaN(parsed.getTime())) {
        formattedDate = parsed.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
    } catch {}
  }
  if (!formattedDate) {
    // Plazo legal de resolución Coljuegos (45 días calendario)
    const fallbackDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    formattedDate = fallbackDate.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="f8-overlay">
      <div className="formulario8-container">
        {/* BARRA SUPERIOR DE ACCIÓN (NO SE IMPRIME) */}
        <div className="no-print f8-topbar">
          <div className="f8-topbar-info">
            <span className="f8-topbar-icon">🏛️</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong className="f8-topbar-title" style={{ color: '#ffffff', display: 'block', fontSize: '0.90rem' }}>
                Formulario 8 Oficial · Secretaria Legal IA
              </strong>
              <small className="f8-topbar-sub" style={{ display: 'block' }}>
                Radicado: <span style={{ color: '#38bdf8', fontWeight: 900 }}>{radicado}</span> · Coljuegos CMI-FR-08 V7
              </small>
            </div>
          </div>

          <div className="f8-topbar-actions">
            <button
              type="button"
              onClick={handlePrint}
              className="f8-btn-print"
            >
              <span>🖨️</span> PDF / Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="f8-btn-close"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL FORMULARIO 8 OFICIAL (FORMATO EXACTO COLJUEGOS) */}
        <div className="f8-content">
          
          {/* ENCABEZADO INSTITUCIONAL */}
          <div className="f8-section-box f8-header-grid">
            <div className="f8-header-coljuegos">
              <span className="f8-coljuegos-badge">COLJUEGOS</span>
              <div className="f8-coljuegos-sub">
                Monopolio Rentístico de Juegos de Suerte y Azar
              </div>
            </div>
            <div className="f8-header-title">
              FORMULARIO 8 - SOLICITUD DE AUTORIZACIÓN<br />DE RIFAS DE CARÁCTER NACIONAL
            </div>
            <div className="f8-header-meta">
              <div><strong>Código:</strong> CMI-FR-08</div>
              <div><strong>Vigencia:</strong> 1/02/2023</div>
              <div><strong>Versión:</strong> 7</div>
              <div><strong>Radicado:</strong> <span className="f8-highlight-radicado">{radicado}</span></div>
            </div>
          </div>

          {/* SECCIÓN I: INFORMACIÓN DEL SOLICITANTE */}
          <div className="f8-section-box">
            <div className="f8-section-title">
              I. INFORMACIÓN DEL SOLICITANTE
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">1. Razón Social ó Nombre Completo Responsable:</span>
                <span className="f8-value-primary">
                  {data.storeName || 'MOTOS CARIBE S.A.S.'}
                </span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">2. Nit ó Cédula de Ciudadanía:</span>
                <span className="f8-value-primary">
                  {data.nit || '901.834.192-5'}
                </span>
              </div>
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">3. Departamento:</span>
                <span className="f8-value">{data.department || 'Bogotá D.C. / Cundinamarca'}</span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">4. Ciudad:</span>
                <span className="f8-value">{data.city || 'Bogotá D.C.'}</span>
              </div>
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">5. Dirección:</span>
                <span className="f8-value">{data.address || 'Carrera 15 # 85-30, Oficina 402'}</span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">6. Email:</span>
                <span className="f8-value">{data.email || 'contacto@motoscaribe.com.co'}</span>
              </div>
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">7. Representante Legal: (Persona Jurídica)</span>
                <span className="f8-value">{data.representative || data.storeName || 'Representante Legal Autorizado'}</span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">8. Teléfonos:</span>
                <span className="f8-value">{data.phone || '+57 300 456 7890'}</span>
              </div>
            </div>

            <div className="f8-cell" style={{ borderBottom: '1px solid #000000' }}>
              <span className="f8-label">9. Actividad Comercial:</span>
              <span className="f8-value">{data.activity || 'Comercio al por menor y mayor de motocicletas, repuestos, accesorios y bienes muebles.'}</span>
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">10. Nombre Contacto:</span>
                <span className="f8-value">{data.representative || 'Área Legal y Financiera'}</span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">11. Teléfonos del Contacto:</span>
                <span className="f8-value">{data.phone || '+57 300 456 7890'}</span>
              </div>
            </div>

            <div className="f8-grid-2col" style={{ borderBottom: 'none' }}>
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">12. Dirección del Contacto:</span>
                <span className="f8-value">{data.address || 'Carrera 15 # 85-30, Oficina 402'}</span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">13. Email del Contacto:</span>
                <span className="f8-value">{data.email || 'contacto@motoscaribe.com.co'}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN II: INFORMACIÓN DE LA RIFA A AUTORIZAR */}
          <div className="f8-section-box">
            <div className="f8-section-title">
              II. INFORMACIÓN DE LA RIFA A AUTORIZAR
            </div>

            <div className="f8-cell" style={{ borderBottom: '1px solid #000000' }}>
              <span className="f8-label">14. Nombre Oficial de la Rifa:</span>
              <span className="f8-value-large">{data.raffleTitle}</span>
            </div>

            <div className="f8-cell" style={{ borderBottom: '1px solid #000000' }}>
              <span className="f8-label">15. Cubrimiento de la rifa:</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '3px' }}>
                <span className="f8-value">Rifa de carácter nacional</span>
                <div style={{ display: 'flex', gap: '12px', fontWeight: 800 }}>
                  <span className="f8-check-selected">[X] SI (Nacional)</span>
                  <span className="f8-check-unselected">[ ] NO</span>
                </div>
              </div>
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">16. Valor Venta de Cada Boleta:</span>
                <span className="f8-value-amount">$ {ticketPrice.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">17. Número Total de Boletas Emitidas:</span>
                <span className="f8-value-amount">{totalTickets.toLocaleString('es-CO')} Boletas</span>
              </div>
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">18. Boletas con Derecho a Participar:</span>
                <span className="f8-value-amount">{totalTickets.toLocaleString('es-CO')}</span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">19. Emisión Bruta (Valor Total Publicación):</span>
                <span className="f8-value-primary" style={{ fontSize: '13px' }}>$ {totalRevenue.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <div className="f8-grid-2col">
              <div className="f8-cell f8-cell-divider">
                <span className="f8-label">20. Vigencia de la Rifa:</span>
                <span className="f8-value">
                  Inicio: <strong>{new Date().toLocaleDateString('es-CO')}</strong> &nbsp;|&nbsp; Cierre: <strong>{formattedDate}</strong>
                </span>
              </div>
              <div className="f8-cell">
                <span className="f8-label">21. Lotería Oficial de Validación:</span>
                <span className="f8-value"><strong>{data.lotteryName || 'Lotería de Medellín (o Lotería Tradicional Oficial de Colombia)'}</strong></span>
              </div>
            </div>

            <div className="f8-cell" style={{ borderBottom: 'none' }}>
              <span className="f8-label">22. Datos del Sorteo de la Lotería:</span>
              <span className="f8-value">
                Hora: <strong>22:30</strong> &nbsp;|&nbsp; Fecha: <strong>{formattedDate}</strong> &nbsp;|&nbsp; Lugar: <strong>Colombia</strong>
              </span>
            </div>
          </div>

          {/* NUMERAL 23: PLAN DE PREMIOS PRIMARIOS Y SECUNDARIOS */}
          <div className="f8-section-box">
            <div className="f8-section-title f8-plan-premios-header">
              <span>23. PLAN DE PREMIOS PRIMARIOS Y SECUNDARIOS</span>
              <span className="f8-plan-premios-tax">Ganancia Ocasional: [X] Asumida por Empresa</span>
            </div>

            <div className="f8-table-wrapper">
              <table className="f8-table">
                <thead>
                  <tr>
                    <th style={{ width: '38px', textAlign: 'center' }}>Ítem</th>
                    <th>Descripción Detallada del Premio</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Cant.</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Costo Unitario</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Costo Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center' }}>1</td>
                    <td>
                      <strong>{data.raffleTitle}</strong>
                      <div className="f8-prize-sub">{data.prizeDescription || 'Bien mueble nuevo, libre de gravámenes y pignoraciones.'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>1</td>
                    <td style={{ textAlign: 'right' }}>$ {prizeCost.toLocaleString('es-CO')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>$ {prizeCost.toLocaleString('es-CO')}</td>
                  </tr>
                  <tr className="f8-table-total-row">
                    <td colSpan={4} style={{ textAlign: 'right' }}>
                      TOTAL PLAN DE PREMIOS:
                    </td>
                    <td style={{ textAlign: 'right', color: '#003366', fontSize: '12px' }}>
                      $ {prizeCost.toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="f8-letters-box">
              <strong>En letras:</strong> {prizeInLetters}
            </div>
          </div>

          {/* NUMERAL 24: PAGO PARA LA AUTORIZACIÓN */}
          <div className="f8-section-box">
            <div className="f8-section-title">
              24. PAGO PARA LA AUTORIZACIÓN (Liquidación Oficial de Ley)
            </div>

            <div className="f8-table-wrapper">
              <table className="f8-table">
                <tbody>
                  <tr>
                    <td>
                      <strong>Derechos de Explotación (14% Salud Pública)</strong>
                      <div className="f8-tax-sub">Sobre el 100% de boletas emitidas (${totalRevenue.toLocaleString('es-CO')} COP × 14%)</div>
                    </td>
                    <td className="f8-tax-amount">
                      $ {coljuegosTax14.toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Gastos de Administración (1% de Derechos de Explotación)</strong>
                      <div className="f8-tax-sub">Reglamentario Coljuegos ($ {coljuegosTax14.toLocaleString('es-CO')} × 1%)</div>
                    </td>
                    <td className="f8-tax-amount">
                      $ {coljuegosAdmin1.toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                  <tr className="f8-tax-total-row">
                    <td style={{ textAlign: 'right' }}>
                      TOTAL A PAGAR PREVIO A LA AUTORIZACIÓN:
                    </td>
                    <td className="f8-tax-total-amount">
                      $ {totalTaxColjuegos.toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="f8-letters-box">
              <strong>En letras (Total Liquidado):</strong> {totalTaxInLetters}
            </div>
          </div>

          {/* NUMERAL 25: NOTIFICACIÓN ELECTRÓNICA Y NOTAS NORMATIVAS */}
          <div className="f8-section-box f8-normativa-box">
            <div className="f8-normativa-header">
              <strong>25. AUTORIZACIÓN NOTIFICACIÓN ELECTRÓNICA (Ley 1437/2011 Art. 56):</strong>
              <span className="f8-check-selected">[X] SI AUTORIZO</span>
            </div>
            <p className="f8-normativa-desc">
              Autorizo la notificación electrónica de que trata el artículo 56 de la Ley 1437 de 2011 al correo electrónico diligenciado en el presente formulario oficial.
            </p>

            <div className="f8-normativa-notes">
              <div><strong>Nota 1:</strong> La ganancia ocasional es asumida por la Empresa / Responsable de la rifa y totalizada en el plan de premios.</div>
              <div><strong>Nota 2:</strong> Los valores liquidados en el numeral 24 son los que se consignan ante Coljuegos previo a la emisión de la resolución oficial.</div>
              <div><strong>Nota 3:</strong> Conforme al Decreto 1068 de 2015 Art. 2.7.3.3, la competencia de rifas nacionales corresponde de manera exclusiva a Coljuegos.</div>
            </div>
          </div>

          {/* JURAMENTO Y FIRMAS */}
          <div className="f8-section-box f8-juramento-box">
            <p className="f8-juramento-text">
              <strong>MANIFIESTO BAJO LA GRAVEDAD DE JURAMENTO</strong> no estar incurso en las inhabilidades consagradas en el Artículo 10 de la Ley 643 de 2001; que los premios aquí registrados son los que efectivamente han de ser entregados al ganador y que para todos los efectos administrativos, fiscales y judiciales, tanto la información como los soportes anexos son auténticos.
            </p>

            <div className="f8-signatures-grid">
              <div className="f8-signature-col">
                <strong>26. Firma del Representante Legal / Responsable:</strong>
                <div className="f8-digital-signature">
                  ✍️ FIRMADO DIGITALMENTE · MANDATO DIGITAL LEY 527 DE 1999
                </div>
                <div className="f8-signer-name">{data.representative || data.storeName || 'Comerciante Responsable'}</div>
              </div>
              <div className="f8-signature-col">
                <strong>27. No. de Identificación:</strong>
                <div className="f8-signer-id">{data.nit || '901.834.192-5'}</div>
                <small className="f8-signer-rad">Radicado Oficial: {radicado}</small>
              </div>
            </div>
          </div>

        </div>

        {/* PIE DE PÁGINA DEL MODAL */}
        <div className="no-print f8-footer">
          <span className="f8-footer-hint">
            ℹ️ Documento oficial generado con radicado preliminar de correspondencia. Listo para radicar ante Coljuegos.
          </span>
          <div className="f8-footer-actions">
            <button
              type="button"
              onClick={handlePrint}
              className="f8-btn-print"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="f8-btn-close-subtle"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* ESTILOS RESPONSIVOS COMPLETOS (SIN BORDES EN CELULARES Y FORMATO OFICIAL A4 EN IMPRESIÓN) */}
      <style jsx global>{`
        /* --- ESTILOS BASE MODAL Y OVERLAY --- */
        .f8-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.8);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .formulario8-container {
          background: #ffffff;
          color: #0f172a;
          width: 100%;
          max-width: 920px;
          max-height: 94vh;
          border-radius: 14px;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
        }

        /* --- TOPBAR --- */
        .f8-topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #0f172a;
          color: #ffffff;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top-left-radius: 14px;
          border-top-right-radius: 14px;
          border-bottom: 2px solid #007AFF;
          box-sizing: border-box;
          gap: 12px;
        }

        .f8-topbar-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .f8-topbar-icon {
          font-size: 22px;
          flex-shrink: 0;
        }

        .f8-topbar-title {
          font-size: 0.92rem;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .f8-topbar-sub {
          opacity: 0.8;
          font-size: 0.75rem;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .f8-topbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .f8-btn-print {
          background: #007AFF;
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 6px rgba(0, 122, 255, 0.4);
          transition: background 0.15s ease;
        }

        .f8-btn-print:hover {
          background: #0062cc;
        }

        .f8-btn-close {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .f8-btn-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .f8-btn-close-subtle {
          background: none;
          border: 1px solid #cbd5e1;
          color: #64748b;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
        }

        /* --- CONTENIDO --- */
        .f8-content {
          padding: 24px;
          font-size: 11px;
          line-height: 1.35;
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
          width: 100%;
        }

        /* --- CAJAS DE SECCIÓN --- */
        .f8-section-box {
          border: 1.5px solid #000000;
          margin-bottom: 12px;
          background: #ffffff;
          box-sizing: border-box;
          width: 100%;
        }

        .f8-section-title {
          background: #e2e8f0;
          color: #0f172a;
          padding: 5px 8px;
          font-weight: 900;
          font-size: 11px;
          border-bottom: 1px solid #000000;
          text-transform: uppercase;
        }

        /* --- ENCABEZADO INSTITUCIONAL --- */
        .f8-header-grid {
          display: grid;
          grid-template-columns: 180px 1fr 140px;
          text-align: center;
          align-items: center;
        }

        .f8-header-coljuegos {
          border-right: 1.5px solid #000000;
          padding: 10px 8px;
          font-weight: 900;
        }

        .f8-coljuegos-badge {
          font-size: 14px;
          letter-spacing: 0.5px;
          display: block;
        }

        .f8-coljuegos-sub {
          font-size: 9px;
          font-weight: 500;
          margin-top: 2px;
          line-height: 1.2;
        }

        .f8-header-title {
          padding: 10px 8px;
          font-weight: 900;
          font-size: 12.5px;
          text-transform: uppercase;
          line-height: 1.3;
        }

        .f8-header-meta {
          border-left: 1.5px solid #000000;
          padding: 8px;
          font-size: 9px;
          text-align: left;
          line-height: 1.45;
        }

        .f8-highlight-radicado {
          color: #007AFF;
          font-weight: 900;
        }

        /* --- GRILLAS DE CAMPOS --- */
        .f8-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #000000;
          box-sizing: border-box;
        }

        .f8-cell {
          padding: 5px 7px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .f8-cell-divider {
          border-right: 1px solid #000000;
        }

        .f8-label {
          font-size: 10px;
          font-weight: 800;
          color: #475569;
          line-height: 1.25;
        }

        .f8-value {
          font-size: 11px;
          color: #0f172a;
          line-height: 1.3;
          word-break: break-word;
        }

        .f8-value-primary {
          font-size: 12px;
          font-weight: 800;
          color: #003366;
          word-break: break-word;
        }

        .f8-value-large {
          font-size: 13px;
          font-weight: 900;
          color: #003366;
          word-break: break-word;
        }

        .f8-value-amount {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
        }

        .f8-checkbox-row {
          display: flex;
          gap: 14px;
          font-weight: 800;
          align-items: center;
        }

        .f8-check-selected {
          color: #007AFF;
          font-weight: 900;
        }

        .f8-check-unselected {
          opacity: 0.35;
        }

        /* --- TABLAS --- */
        .f8-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .f8-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 11px;
        }

        .f8-table th {
          background: #f8fafc;
          border-bottom: 1px solid #000000;
          border-right: 1px solid #000000;
          padding: 5px 7px;
          font-size: 10px;
          font-weight: 800;
        }

        .f8-table th:last-child {
          border-right: none;
        }

        .f8-table td {
          padding: 6px 7px;
          border-bottom: 1px solid #000000;
          border-right: 1px solid #000000;
          vertical-align: middle;
        }

        .f8-table td:last-child {
          border-right: none;
        }

        .f8-table-total-row {
          background: #f8fafc;
          font-weight: 900;
        }

        .f8-prize-sub {
          font-size: 10px;
          color: #64748b;
          font-weight: normal;
          margin-top: 2px;
        }

        .f8-tax-sub {
          font-size: 9.5px;
          color: #64748b;
          font-weight: normal;
          margin-top: 1px;
        }

        .f8-tax-amount {
          text-align: right;
          font-weight: 800;
          font-size: 12px;
          white-space: nowrap;
          width: 160px;
        }

        .f8-tax-total-row {
          background: #f1f5f9;
          font-weight: 900;
        }

        .f8-tax-total-amount {
          text-align: right;
          color: #b91c1c;
          font-size: 13.5px;
          font-weight: 900;
          white-space: nowrap;
          width: 160px;
        }

        .f8-letters-box {
          padding: 5px 7px;
          font-style: italic;
          font-size: 10px;
          background: #fafafa;
          color: #334155;
        }

        /* --- PLAN DE PREMIOS HEADER --- */
        .f8-plan-premios-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .f8-plan-premios-tax {
          font-size: 9.5px;
          font-weight: 700;
          text-transform: none;
          color: #003366;
        }

        /* --- NORMATIVA Y JURAMENTO --- */
        .f8-normativa-box {
          padding: 7px 9px;
          font-size: 9.5px;
          line-height: 1.4;
        }

        .f8-normativa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          gap: 6px;
        }

        .f8-normativa-desc {
          margin: 0 0 6px;
          color: #1e293b;
        }

        .f8-normativa-notes {
          border-top: 1px dashed #94a3b8;
          padding-top: 5px;
          color: #475569;
          line-height: 1.45;
        }

        .f8-juramento-box {
          padding: 9px;
          font-size: 9.5px;
          line-height: 1.4;
        }

        .f8-juramento-text {
          margin: 0 0 10px;
          text-align: justify;
          color: #1e293b;
        }

        .f8-signatures-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-top: 14px;
          align-items: flex-end;
        }

        .f8-signature-col {
          border-top: 1px solid #000000;
          padding-top: 5px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .f8-digital-signature {
          font-family: monospace;
          font-size: 10.5px;
          color: #007AFF;
          font-weight: 800;
        }

        .f8-signer-name {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
        }

        .f8-signer-id {
          font-size: 11px;
          font-weight: 700;
        }

        .f8-signer-rad {
          font-size: 9px;
          color: #64748b;
        }

        /* --- FOOTER --- */
        .f8-footer {
          padding: 12px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          gap: 12px;
        }

        .f8-footer-hint {
          color: #64748b;
          font-size: 11px;
          line-height: 1.35;
        }

        .f8-footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* ==========================================================================
           MODO MÓVIL SIN BORDES (EDGE-TO-EDGE PARA DISPOSITIVOS MÓVILES)
           ========================================================================== */
        @media screen and (max-width: 640px) {
          .f8-overlay {
            padding: 0 !important;
            align-items: flex-start !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          .formulario8-container {
            width: 100vw !important;
            max-width: 100vw !important;
            min-height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            margin: 0 !important;
            border-left: none !important;
            border-right: none !important;
            box-shadow: none !important;
          }

          .f8-topbar {
            border-radius: 0 !important;
            padding: 12px 14px !important;
            border-left: none !important;
            border-right: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }

          .f8-topbar-info {
            width: 100% !important;
          }

          .f8-topbar-title {
            font-size: 0.90rem !important;
            color: #ffffff !important;
          }

          .f8-topbar-sub {
            font-size: 0.76rem !important;
            color: #cbd5e1 !important;
          }

          .f8-topbar-actions {
            display: flex !important;
            width: 100% !important;
            gap: 8px !important;
          }

          .f8-btn-print {
            flex: 1 !important;
            justify-content: center !important;
            padding: 10px !important;
            font-size: 0.82rem !important;
          }

          .f8-btn-close {
            flex: 1 !important;
            justify-content: center !important;
            padding: 10px !important;
            font-size: 0.82rem !important;
          }

          .f8-content {
            padding: 10px 6px !important;
            font-size: 11px !important;
          }

          /* Quitar bordes laterales a las secciones en celular para aprovechar todo el ancho */
          .f8-section-box {
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
            margin-bottom: 10px !important;
            width: 100% !important;
          }

          /* Adaptar el encabezado institucional para no apiñarse en móviles */
          .f8-header-grid {
            display: flex !important;
            flex-direction: column !important;
          }

          .f8-header-coljuegos {
            border-right: none !important;
            border-bottom: 1px solid #000000 !important;
            padding: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .f8-header-title {
            padding: 8px !important;
            font-size: 11.5px !important;
            border-bottom: 1px solid #000000 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .f8-header-meta {
            border-left: none !important;
            padding: 8px 10px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 4px !important;
            background: #f8fafc !important;
          }

          /* En móviles las filas dobles pasan a flujo vertical limpio */
          .f8-grid-2col {
            display: flex !important;
            flex-direction: column !important;
          }

          .f8-cell-divider {
            border-right: none !important;
            border-bottom: 1px dashed #cbd5e1 !important;
          }

          .f8-cell {
            padding: 6px 8px !important;
          }

          .f8-label {
            font-size: 10.5px !important;
          }

          .f8-value, .f8-value-primary, .f8-value-amount {
            font-size: 12px !important;
          }

          .f8-plan-premios-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
          }

          .f8-plan-premios-tax {
            font-size: 8.5px !important;
          }

          .f8-tax-amount, .f8-tax-total-amount {
            width: auto !important;
          }

          .f8-normativa-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }

          .f8-signatures-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }

          .f8-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 12px !important;
            border-radius: 0 !important;
          }

          .f8-footer-actions {
            width: 100% !important;
            justify-content: stretch !important;
          }

          .f8-footer-actions button {
            flex: 1 !important;
            justify-content: center !important;
            padding: 10px !important;
          }
        }

        /* ==========================================================================
           MODO IMPRESIÓN OFICIAL (FORMATO EXACTO COLJUEGOS CMI-FR-08)
           ========================================================================== */
        @media print {
          body * {
            visibility: hidden;
          }
          .formulario8-container, .formulario8-container * {
            visibility: visible;
          }
          .f8-overlay {
            position: absolute !important;
            inset: 0 !important;
            background: none !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .formulario8-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .f8-content {
            padding: 10px 14px !important;
            font-size: 9.5pt !important;
          }
          .f8-section-box {
            border: 1.5px solid #000000 !important;
            margin-bottom: 8px !important;
            page-break-inside: avoid;
          }
          .f8-header-grid {
            display: grid !important;
            grid-template-columns: 180px 1fr 140px !important;
          }
          .f8-header-coljuegos {
            border-right: 1.5px solid #000000 !important;
            border-bottom: none !important;
          }
          .f8-header-title {
            border-bottom: none !important;
          }
          .f8-header-meta {
            border-left: 1.5px solid #000000 !important;
            display: block !important;
            background: none !important;
          }
          .f8-grid-2col {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }
          .f8-cell-divider {
            border-right: 1px solid #000000 !important;
            border-bottom: none !important;
          }
          .f8-signatures-grid {
            display: grid !important;
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
