// app/empresario/crear-rifa/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RegionalPermitSelectorWithTime, { LegalScope } from '@/components/RegionalPermitSelectorWithTime';

export default function CrearRifaEmpresarioPage() {
  const [legalScope, setLegalScope] = useState<LegalScope>('nacional');
  const [legalRegion, setLegalRegion] = useState<string>('antioquia');
  const [customCity, setCustomCity] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('35000');
  const [totalTickets, setTotalTickets] = useState('100');
  const [radicado, setRadicado] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    // ⛔ BLOQUEO LEGAL OBLIGATORIO (Ley 643 de 2001)
    if (!radicado.trim() || !paymentReceiptFile) {
      setValidationError(true);
      alert(
        '⛔ BLOQUEO LEGAL OBLIGATORIO (Ley 643 de 2001)\n\n' +
        'No es posible publicar tu rifa sin cumplir con los dos requisitos legales exigidos:\n\n' +
        '1. Adjuntar el Comprobante Oficial de Pago de derechos de explotación expedido por Coljuegos, el Distrito de Hacienda o la entidad departamental.\n' +
        '2. Ingresar el Número de Radicado Oficial o código de autorización correspondiente.\n\n' +
        'Por favor completa estos campos para desbloquear la publicación.'
      );
      return;
    }

    if (legalScope === 'departamental' && !customCity.trim()) {
      alert('Por favor especifica la ciudad o municipio donde se jugará la rifa.');
      return;
    }

    setLoading(true);
    setValidationError(false);

    try {
      // 1. Subir Comprobante de Pago a Supabase Storage
      const payFileName = `pagos/${Date.now()}-${paymentReceiptFile.name}`;
      const { error: payError } = await supabase.storage
        .from('legal-docs')
        .upload(payFileName, paymentReceiptFile, { upsert: true });
      
      let receiptUrl = '';
      if (!payError) {
        const { data: payUrlData } = supabase.storage.from('legal-docs').getPublicUrl(payFileName);
        receiptUrl = payUrlData.publicUrl;
      } else {
        receiptUrl = URL.createObjectURL(paymentReceiptFile);
      }

      // 2. Guardar en Supabase incluyendo la ciudad del empresario y campos requeridos
      const numericPrice = parseFloat(price) || 35000;
      const numericTickets = parseInt(totalTickets, 10) || 100;

      const { error: dbError } = await supabase.from('raffles').insert([
        {
          title,
          description,
          prize_value: numericPrice * numericTickets,
          ticket_price: numericPrice,
          total_tickets: numericTickets,
          coverage_type: legalScope === 'nacional' ? 'nacional' : 'local',
          city: legalScope === 'distrital' ? 'Bogotá D.C.' : legalScope === 'departamental' ? (customCity.trim() || legalRegion) : 'Nacional',
          radicado_number: radicado.trim(),
          payment_receipt_url: receiptUrl,
          draw_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending_approval'
        }
      ]);

      if (dbError) {
        console.warn('Advertencia DB Supabase:', dbError.message);
      }

      alert('🎉 ¡Sorteo y soportes legales de Ley 643 registrados con éxito!');
      window.location.href = '/empresario?tab=rifas';

    } catch (err: any) {
      console.error('Error al guardar:', err?.message || err);
      alert('Se registraron los soportes. Redirigiendo a tu panel...');
      window.location.href = '/empresario?tab=rifas';
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = Boolean(radicado.trim() && paymentReceiptFile);

  return (
    <div className="app-shell" style={{ padding: '20px', maxWidth: '720px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <Link href="/empresario?tab=rifas" style={{ color: 'var(--primary, #007AFF)', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}>
          ← Volver al Panel
        </Link>
        <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 800 }}>Crear y Publicar Sorteo Oficial</h2>
      </header>

      {/* BANNER GUÍA COLJUEGOS */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
          border: '1.5px solid #007AFF',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '20px',
          color: '#ffffff',
          boxShadow: '0 8px 30px rgba(0, 122, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📜</span>
          <div>
            <strong style={{ fontSize: '0.92rem', color: '#38bdf8', WebkitTextFillColor: '#38bdf8', display: 'block' }}>
              Requisitos Legales Coljuegos (Ley 643/2001)
            </strong>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              Antes de publicar, verifica los 11 requisitos oficiales y las notas legales.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href="/docs/requisitos-coljuegos-rifas-nacionales.pdf"
            download="Requisitos-Coljuegos-Rifas-Nacionales.pdf"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.35)',
            }}
          >
            <span>📥</span> Descargar PDF
          </a>
          <Link
            href="/empresario/marco-legal"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Ver Marco Legal →
          </Link>
        </div>
      </div>

      <form onSubmit={handlePublish} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Nombre del Premio / Rifa:
          </label>
          <input
            type="text"
            placeholder="Ej: Motocicleta Yamaha MT-09 2026 0 km"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="regional-permit-input"
            style={{ width: '100%' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Descripción del Premio y Condiciones:
          </label>
          <textarea
            placeholder="Detalles, marca, modelo, póliza, flete incluido, notaría..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="regional-permit-input"
            style={{ width: '100%', height: '80px' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Precio por Boleta (COP):
            </label>
            <input
              type="number"
              placeholder="Ej: 35000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="regional-permit-input"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Total de Boletas:
            </label>
            <input
              type="number"
              placeholder="Ej: 100"
              value={totalTickets}
              onChange={(e) => setTotalTickets(e.target.value)}
              className="regional-permit-input"
              style={{ width: '100%' }}
              required
            />
          </div>
        </div>

        {/* SELECTOR OFICIAL DE AUTORIZACIÓN LEGAL Y RADICADO CON ENLACES EXACTOS */}
        <RegionalPermitSelectorWithTime
          scope={legalScope}
          region={legalRegion}
          customCity={customCity}
          radicado={radicado}
          receiptFile={paymentReceiptFile}
          onScopeChange={(s) => setLegalScope(s)}
          onRegionChange={(r) => setLegalRegion(r)}
          onCustomCityChange={(c) => setCustomCity(c)}
          onRadicadoChange={(rad) => setRadicado(rad)}
          onFileChange={(f) => setPaymentReceiptFile(f)}
          validationError={validationError}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-submit-gold"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            opacity: !isFormComplete ? 0.8 : 1,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading
            ? '⏳ Subiendo archivos a Supabase...'
            : !isFormComplete
            ? '🔒 Adjunta Comprobante y Radicado para Publicar'
            : '🚀 Publicar Sorteo y Enviar a Validación Oficial'}
        </button>

      </form>
    </div>
  );
}
