// components/Formulario8Modal.tsx
// Visualizador e Impresor Oficial del FORMULARIO 8 de Coljuegos (Código: CMI-FR-08, Versión 7)
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

  const formattedDate = data.drawDate
    ? new Date(data.drawDate).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : 'POR DEFINIR';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        overflowY: 'auto',
      }}
    >
      <div
        className="formulario8-container"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          borderRadius: '14px',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* BARRA SUPERIOR DE ACCIÓN (NO SE IMPRIME) */}
        <div
          className="no-print"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopLeftRadius: '14px',
            borderTopRightRadius: '14px',
            borderBottom: '2px solid #007AFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🏛️</span>
            <div>
              <strong style={{ fontSize: '0.92rem', display: 'block' }}>
                Formulario 8 Oficial Diligenciado por IA (Coljuegos CMI-FR-08 V7)
              </strong>
              <small style={{ opacity: 0.75, fontSize: '0.74rem' }}>
                Radicado asignado: {radicado} · Listo para radicación oficial
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#007AFF',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0, 122, 255, 0.4)',
              }}
            >
              <span>🖨️</span> Imprimir / Guardar como PDF Oficial
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL FORMULARIO 8 OFICIAL (FORMATO EXACTO COLJUEGOS) */}
        <div style={{ padding: '24px', fontSize: '11px', lineHeight: 1.35, fontFamily: 'Arial, sans-serif' }}>
          
          {/* ENCABEZADO INSTITUCIONAL */}
          <div
            style={{
              border: '1.5px solid #000000',
              marginBottom: '10px',
              display: 'grid',
              gridTemplateColumns: '180px 1fr 140px',
              textAlign: 'center',
              alignItems: 'center',
            }}
          >
            <div style={{ borderRight: '1.5px solid #000000', padding: '10px', fontWeight: 900, fontSize: '13px' }}>
              COLJUEGOS
              <div style={{ fontSize: '9px', fontWeight: 400, marginTop: '2px' }}>
                Monopolio Rentístico de Juegos de Suerte y Azar
              </div>
            </div>
            <div style={{ padding: '10px', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>
              FORMULARIO 8 - SOLICITUD DE AUTORIZACIÓN<br />DE RIFAS DE CARÁCTER NACIONAL
            </div>
            <div style={{ borderLeft: '1.5px solid #000000', padding: '6px', fontSize: '9px', textAlign: 'left' }}>
              <div><strong>Código:</strong> CMI-FR-08</div>
              <div><strong>Vigencia:</strong> 1/02/2023</div>
              <div><strong>Versión:</strong> 7</div>
              <div><strong>Radicado:</strong> {radicado}</div>
            </div>
          </div>

          {/* SECCIÓN I: INFORMACIÓN DEL SOLICITANTE */}
          <div style={{ border: '1.5px solid #000000', marginBottom: '10px' }}>
            <div style={{ background: '#e2e8f0', padding: '4px 8px', fontWeight: 900, fontSize: '11px', borderBottom: '1px solid #000000' }}>
              I. INFORMACIÓN DEL SOLICITANTE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>1. Razón Social ó Nombre Completo Responsable:</strong><br />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#003366' }}>
                  {data.storeName || 'MOTOS CARIBE S.A.S.'}
                </span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>2. Nit ó Cédula de Ciudadanía:</strong><br />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#003366' }}>
                  {data.nit || '901.834.192-5'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>3. Departamento:</strong><br />
                <span>{data.department || 'Bogotá D.C. / Cundinamarca'}</span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>4. Ciudad:</strong><br />
                <span>{data.city || 'Bogotá D.C.'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>5. Dirección:</strong><br />
                <span>{data.address || 'Carrera 15 # 85-30, Oficina 402'}</span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>6. Email:</strong><br />
                <span>{data.email || 'contacto@motoscaribe.com.co'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>7. Representante Legal: (Solo si es persona Jurídica)</strong><br />
                <span>{data.representative || data.storeName || 'Representante Legal Autorizado'}</span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>8. Teléfonos:</strong><br />
                <span>{data.phone || '+57 300 456 7890'}</span>
              </div>
            </div>

            <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
              <strong>9. Actividad Comercial:</strong><br />
              <span>{data.activity || 'Comercio al por menor y mayor de motocicletas, repuestos, accesorios y bienes muebles.'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>10. Nombre Contacto:</strong><br />
                <span>{data.representative || 'Área Legal y Financiera'}</span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>11. Teléfonos del Contacto:</strong><br />
                <span>{data.phone || '+57 300 456 7890'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>12. Dirección del Contacto:</strong><br />
                <span>{data.address || 'Carrera 15 # 85-30, Oficina 402'}</span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>13. Email del Contacto:</strong><br />
                <span>{data.email || 'contacto@motoscaribe.com.co'}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN II: INFORMACIÓN DE LA RIFA A AUTORIZAR */}
          <div style={{ border: '1.5px solid #000000', marginBottom: '10px' }}>
            <div style={{ background: '#e2e8f0', padding: '4px 8px', fontWeight: 900, fontSize: '11px', borderBottom: '1px solid #000000' }}>
              II. INFORMACIÓN DE LA RIFA A AUTORIZAR
            </div>

            <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
              <strong>14. Nombre de la Rifa:</strong><br />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#003366' }}>{data.raffleTitle}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', borderBottom: '1px solid #000000', alignItems: 'center' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>15. Cubrimiento de la rifa:</strong> Rifa de carácter nacional
              </div>
              <div style={{ padding: '4px 6px', display: 'flex', gap: '16px', fontWeight: 800 }}>
                <span>[X] SI</span>
                <span style={{ opacity: 0.35 }}>[ ] NO</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>16. Valor Venta al Público De Cada Boleta:</strong><br />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>$ {ticketPrice.toLocaleString('es-CO')} COP</span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>17. Número Total de boletas emitidas:</strong><br />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{totalTickets.toLocaleString('es-CO')} Boletas / Balotas</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>18. Número de Boletas que dan Derecho a Participar:</strong><br />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{totalTickets.toLocaleString('es-CO')}</span>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>19. Valor Total de la Publicación (Emisión Bruta):</strong><br />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#003366' }}>$ {totalRevenue.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000000' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                <strong>20. Vigencia de la Rifa:</strong><br />
                Inicio: <strong>{new Date().toLocaleDateString('es-CO')}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Cierre: <strong>{formattedDate}</strong>
              </div>
              <div style={{ padding: '4px 6px' }}>
                <strong>21. Nombre de la Lotería con la que se validará:</strong><br />
                <span style={{ fontWeight: 700 }}>{data.lotteryName || 'Lotería de Medellín (o Lotería Tradicional Oficial de Colombia)'}</span>
              </div>
            </div>

            <div style={{ padding: '4px 6px' }}>
              <strong>22. Del sorteo de la Lotería:</strong> &nbsp;&nbsp;
              Hora: <strong>22:30</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Fecha: <strong>{formattedDate}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Lugar: <strong>Colombia</strong>
            </div>
          </div>

          {/* NUMERAL 23: PLAN DE PREMIOS PRIMARIOS Y SECUNDARIOS */}
          <div style={{ border: '1.5px solid #000000', marginBottom: '10px' }}>
            <div style={{ background: '#e2e8f0', padding: '4px 8px', fontWeight: 900, fontSize: '11px', borderBottom: '1px solid #000000', display: 'flex', justifyContent: 'space-between' }}>
              <span>23. PLAN DE PREMIOS PRIMARIOS Y SECUNDARIOS (Valores en COP)</span>
              <span>Ganancia Ocasional: [X] Asumida por Empresa / Responsable &nbsp; [ ] Ganador</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000' }}>
                  <th style={{ padding: '4px 6px', borderRight: '1px solid #000000', width: '40px' }}>Ítem</th>
                  <th style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>Descripción Detallada del Premio</th>
                  <th style={{ padding: '4px 6px', borderRight: '1px solid #000000', width: '70px', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ padding: '4px 6px', borderRight: '1px solid #000000', width: '130px', textAlign: 'right' }}>Costo Unitario (IVA inc.)</th>
                  <th style={{ padding: '4px 6px', width: '130px', textAlign: 'right' }}>Costo Total</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                    <strong>{data.raffleTitle}</strong> - {data.prizeDescription || 'Bien mueble nuevo, libre de gravámenes y pignoraciones.'}
                  </td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000000', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000000', textAlign: 'right' }}>
                    $ {prizeCost.toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>
                    $ {prizeCost.toLocaleString('es-CO')}
                  </td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                  <td colSpan={4} style={{ padding: '4px 6px', borderRight: '1px solid #000000', textAlign: 'right' }}>
                    TOTAL PLAN DE PREMIOS:
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', color: '#003366', fontSize: '12px' }}>
                    $ {prizeCost.toLocaleString('es-CO')} COP
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ padding: '4px 6px', borderTop: '1px solid #000000', fontStyle: 'italic', fontSize: '10px' }}>
              <strong>En letras:</strong> {prizeInLetters}
            </div>
          </div>

          {/* NUMERAL 24: PAGO PARA LA AUTORIZACIÓN */}
          <div style={{ border: '1.5px solid #000000', marginBottom: '10px' }}>
            <div style={{ background: '#e2e8f0', padding: '4px 8px', fontWeight: 900, fontSize: '11px', borderBottom: '1px solid #000000' }}>
              24. PAGO PARA LA AUTORIZACIÓN (Liquidación Oficial de Ley)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                    <strong>Derechos de Explotación (14% de los ingresos brutos)</strong><br />
                    <small style={{ opacity: 0.8 }}>Correspondiente al 100% del valor de las boletas emitidas (${totalRevenue.toLocaleString('es-CO')} COP × 14%)</small>
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, width: '160px', fontSize: '12px' }}>
                    $ {coljuegosTax14.toLocaleString('es-CO')} COP
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                    <strong>Gastos de Administración (1% de los Derechos de Explotación)</strong><br />
                    <small style={{ opacity: 0.8 }}>Liquidación reglamentaria sobre el valor de los derechos de explotación ($ {coljuegosTax14.toLocaleString('es-CO')} × 1%)</small>
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, width: '160px', fontSize: '12px' }}>
                    $ {coljuegosAdmin1.toLocaleString('es-CO')} COP
                  </td>
                </tr>
                <tr style={{ background: '#f1f5f9', fontWeight: 900 }}>
                  <td style={{ padding: '6px', borderRight: '1px solid #000000', textAlign: 'right' }}>
                    TOTAL A PAGAR PREVIO A LA AUTORIZACIÓN:
                  </td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#b91c1c', fontSize: '13px' }}>
                    $ {totalTaxColjuegos.toLocaleString('es-CO')} COP
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ padding: '4px 6px', borderTop: '1px solid #000000', fontStyle: 'italic', fontSize: '10px' }}>
              <strong>En letras (Total Liquidado):</strong> {totalTaxInLetters}
            </div>
          </div>

          {/* NUMERAL 25: NOTIFICACIÓN ELECTRÓNICA Y NOTAS NORMATIVAS */}
          <div style={{ border: '1.5px solid #000000', padding: '6px 8px', marginBottom: '10px', fontSize: '9.5px', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong>25. AUTORIZACIÓN NOTIFICACIÓN POR CORREO ELECTRÓNICO (Ley 1437/2011 Art. 56):</strong>
              <span style={{ fontWeight: 800 }}>[X] SI AUTORIZO &nbsp;&nbsp; [ ] NO</span>
            </div>
            <p style={{ margin: '0 0 6px' }}>
              Autorizo la notificación electrónica de que trata el artículo 56 de la Ley 1437 de 2011 al correo electrónico de contacto diligenciado en el presente formulario.
            </p>

            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '4px', opacity: 0.9 }}>
              <div><strong>Nota 1:</strong> La ganancia ocasional es asumida por la Empresa / Responsable de la rifa y totalizada en el plan de premios.</div>
              <div><strong>Nota 2:</strong> Los valores liquidados en el numeral 24 son los que se pagan ante la entidad previo a la autorización. Realizada la rifa se ajustará el pago final.</div>
              <div><strong>Nota 3:</strong> Conforme al Decreto 1068 de 2015 Art. 2.7.3.3, cuando la rifa opere en dos o más departamentos o en un departamento y el Distrito Capital, la competencia exclusiva corresponde a Coljuegos.</div>
            </div>
          </div>

          {/* JURAMENTO Y FIRMAS */}
          <div style={{ border: '1.5px solid #000000', padding: '8px', fontSize: '9.5px', lineHeight: 1.35 }}>
            <p style={{ margin: '0 0 8px', textAlign: 'justify' }}>
              <strong>MANIFIESTO BAJO LA GRAVEDAD DE JURAMENTO</strong> no estar incurso en las inhabilidades consagradas en el Artículo 10 de la Ley 643 de 2001; que los premios aquí registrados son los que efectivamente han de ser entregados a el (los) ganador (es) y que para todos los efectos administrativos, disciplinarios, fiscales, penales y judiciales, tanto la información escrita en el formulario como los documentos anexos son veraces y auténticos.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginTop: '12px', alignItems: 'flex-end' }}>
              <div style={{ borderTop: '1px solid #000000', paddingTop: '4px' }}>
                <strong>26. Firma del Representante Legal / Responsable de la Rifa:</strong><br />
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#003366', fontWeight: 700 }}>
                  ✍️ FIRMADO DIGITALMENTE · MANDATO DIGITAL LEY 527 DE 1999
                </span><br />
                <span>{data.representative || data.storeName || 'Comerciante Responsable'}</span>
              </div>
              <div style={{ borderTop: '1px solid #000000', paddingTop: '4px' }}>
                <strong>27. No. de Identificación:</strong><br />
                <span>{data.nit || '901.834.192-5'}</span><br />
                <small style={{ fontSize: '9px', opacity: 0.8 }}>Radicado: {radicado}</small>
              </div>
            </div>
          </div>

        </div>

        {/* PIE DE PÁGINA DEL MODAL */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <span style={{ color: '#64748b' }}>
            ℹ️ Puedes imprimir este documento o guardarlo en PDF directamente desde tu navegador para radicar ante Coljuegos.
          </span>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#007AFF',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* ESTILOS DE IMPRESIÓN OFICIAL */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .formulario8-container, .formulario8-container * {
            visibility: visible;
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
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
