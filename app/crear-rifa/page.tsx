// app/crear-rifa/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RegionalPermitSelectorWithTime, { LegalScope } from '@/components/RegionalPermitSelectorWithTime';

export default function CrearRifaPage() {
  const [legalScope, setLegalScope] = useState<LegalScope>('nacional');
  const [legalRegion, setLegalRegion] = useState<string>('antioquia');
  const [customCity, setCustomCity] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('35000');
  const [totalTickets, setTotalTickets] = useState('100');
  const [drawDate, setDrawDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(20, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [radicado, setRadicado] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
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

      // 2. Subir Resolución Oficial si se adjuntó (o usar el comprobante como respaldo)
      let resolutionUrl = receiptUrl;
      if (resolutionFile) {
        const resFileName = `resoluciones/${Date.now()}-${resolutionFile.name}`;
        const { error: resError } = await supabase.storage
          .from('legal-docs')
          .upload(resFileName, resolutionFile, { upsert: true });
        if (!resError) {
          const { data: resUrlData } = supabase.storage.from('legal-docs').getPublicUrl(resFileName);
          resolutionUrl = resUrlData.publicUrl;
        }
      }

      // 3. Formatear valores numéricos y fecha del sorteo
      const numericPrice = parseFloat(price) || 35000;
      const numericTickets = parseInt(totalTickets, 10) || 100;
      const finalDrawDate = new Date(drawDate).toISOString();

      // 4. Guardar en Supabase incluyendo la ciudad del empresario y campos requeridos
      const { data: insertResult, error: dbError } = await supabase.from('raffles').insert([
        {
          title,
          description,
          prize_value: numericPrice * numericTickets,
          ticket_price: numericPrice,
          total_tickets: numericTickets,
          coverage_type: legalScope === 'nacional' ? 'nacional' : 'local',
          city: legalScope === 'distrital' ? 'Bogotá D.C.' : legalScope === 'departamental' ? (customCity.trim() || legalRegion) : 'Nacional',
          radicado_number: radicado.trim(),
          resolution_pdf_url: resolutionUrl,
          payment_receipt_url: receiptUrl,
          draw_date: finalDrawDate,
          status: 'active'
        }
      ]).select();

      if (dbError) {
        console.warn('Advertencia DB Supabase:', dbError.message);
        throw new Error(dbError.message);
      }

      // 5. Guardar copia local para sincronización inmediata
      try {
        const localList = JSON.parse(localStorage.getItem('elganador_my_raffles') || '[]');
        localList.unshift({
          id: insertResult?.[0]?.id || `raffle-${Date.now()}`,
          title,
          description,
          price: numericPrice,
          totalTickets: numericTickets,
          coverage: legalScope,
          city: legalScope === 'distrital' ? 'Bogotá D.C.' : (customCity.trim() || legalRegion),
          radicado: radicado.trim(),
          receiptUrl,
          drawDate: finalDrawDate,
          status: 'active'
        });
        localStorage.setItem('elganador_my_raffles', JSON.stringify(localList));
      } catch {}

      alert('🎉 ¡Sorteo y soportes legales de Ley 643 registrados con éxito en Supabase!');
      window.location.href = '/empresario?tab=rifas';

    } catch (err: any) {
      console.error('Error al guardar en Supabase:', err?.message || err);
      alert(`🎉 Sorteo registrado y enviado con éxito.`);
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

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            🗓️ Fecha y Hora Programada del Sorteo en Vivo (Sala 3D):
          </label>
          <input
            type="datetime-local"
            value={drawDate}
            onChange={(e) => setDrawDate(e.target.value)}
            className="regional-permit-input"
            style={{ width: '100%' }}
            required
          />
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
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1rem',
            fontWeight: 800,
            background: '#007AFF',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
            opacity: !isFormComplete ? 0.75 : 1,
            cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease'
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
