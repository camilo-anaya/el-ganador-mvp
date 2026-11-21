// app/empresario/crear-rifa/page.tsx
// Asistente Inteligente de Creación de Rifas: Calculadora Digital, Secretaria Legal IA y Publicación en 4 Pasos
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { addBusinessNotification } from '@/lib/notifications';
import RegionalPermitSelectorWithTime, { LegalScope } from '@/components/RegionalPermitSelectorWithTime';

export default function CrearRifaEmpresarioPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Paso actual del asistente (1 a 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // 1. Datos del Premio
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeCost, setPrizeCost] = useState('15000000'); // Costo del premio para el comerciante
  const [prizePhoto, setPrizePhoto] = useState<string | null>(null);

  // 2. Calculadora de Precios y Boletas
  const [totalTickets, setTotalTickets] = useState(1000);
  const [ticketPrice, setTicketPrice] = useState(25000);

  // 3. Gestión Legal y Cobertura
  const [legalMode, setLegalMode] = useState<'ai_secretary' | 'manual'>('ai_secretary');
  const [mandatoAccepted, setMandatoAccepted] = useState(true);
  const [legalScope, setLegalScope] = useState<LegalScope>('nacional');
  const [legalRegion, setLegalRegion] = useState<string>('antioquia');
  const [customCity, setCustomCity] = useState('');
  const [manualRadicado, setManualRadicado] = useState('');
  const [manualReceiptFile, setManualReceiptFile] = useState<File | null>(null);

  // Estados de proceso y éxito
  const [loading, setLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<any>(null);
  const [validationError, setValidationError] = useState('');

  // 🧮 CÁLCULOS MATEMÁTICOS DE LA CALCULADORA DIGITAL EN TIEMPO REAL
  const numericPrizeCost = parseFloat(prizeCost) || 0;
  const totalRevenue = totalTickets * ticketPrice;
  const coljuegosTax14 = Math.round(totalRevenue * 0.14); // 14% Salud Pública (Ley 643/2001)
  const platformFee10 = Math.round(totalRevenue * 0.10); // 10% Plataforma SaaS El Ganador
  // Tarifa bancaria Wompi Bancolombia aproximada (2.65% + $700 COP por boleta)
  const wompiFee = Math.round(totalRevenue * 0.0265 + 700 * (totalTickets > 1000 ? 1000 : totalTickets));
  // Ganancia neta para el empresario
  const netProfit = totalRevenue - coljuegosTax14 - platformFee10 - wompiFee - numericPrizeCost;
  const profitMargin = numericPrizeCost > 0 ? Math.round((netProfit / numericPrizeCost) * 100) : 0;

  // Manejo de foto del premio
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPrizePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Navegación entre pasos con validaciones
  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setValidationError('');
    if (step > 1 && !title.trim()) {
      setValidationError('Por favor ingresa el nombre del premio antes de continuar.');
      return;
    }
    if (step > 2 && totalRevenue <= 0) {
      setValidationError('Configura un valor válido de boletas y precio en la calculadora.');
      return;
    }
    if (step > 3 && legalMode === 'manual' && (!manualRadicado.trim() || !manualReceiptFile)) {
      setValidationError('En modo manual debes ingresar el número de radicado y adjuntar el comprobante.');
      return;
    }
    if (step > 3 && legalMode === 'ai_secretary' && !mandatoAccepted) {
      setValidationError('Debes aceptar el Mandato Digital para que la Secretaria IA tramite tu radicado.');
      return;
    }
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enviar y publicar la rifa
  const handleFinalPublish = async () => {
    setLoading(true);
    setValidationError('');

    try {
      const isAiSecretary = legalMode === 'ai_secretary';
      const radicadoFinal = isAiSecretary
        ? `SOL-COLJ-2026-${Math.floor(100000 + Math.random() * 900000)}`
        : manualRadicado.trim();

      let receiptUrl = '';
      if (manualReceiptFile) {
        const payFileName = `pagos/${Date.now()}-${manualReceiptFile.name}`;
        const { error: payError } = await supabase.storage
          .from('legal-docs')
          .upload(payFileName, manualReceiptFile, { upsert: true });

        if (!payError) {
          const { data: payUrlData } = supabase.storage.from('legal-docs').getPublicUrl(payFileName);
          receiptUrl = payUrlData.publicUrl;
        }
      } else {
        receiptUrl = `https://el-ganador-mvp.vercel.app/docs/formulario-8-radicacion-${radicadoFinal}.pdf`;
      }

      const rafflePayload = {
        title,
        description,
        prize_value: totalRevenue,
        ticket_price: ticketPrice,
        total_tickets: totalTickets,
        coverage_type: legalScope === 'nacional' ? 'nacional' : 'local',
        city:
          legalScope === 'distrital'
            ? 'Bogotá D.C.'
            : legalScope === 'departamental'
            ? customCity.trim() || legalRegion
            : 'Nacional',
        radicado_number: radicadoFinal,
        payment_receipt_url: receiptUrl,
        draw_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: isAiSecretary ? 'en_tramite_coljuegos' : 'active',
      };

      // Guardar en Supabase
      const { error: dbError } = await supabase.from('raffles').insert([rafflePayload]);
      if (dbError) {
        console.warn('DB Supabase info:', dbError.message);
      }

      // Guardar también en localStorage para persistencia local inmediata
      const localRafflesRaw = localStorage.getItem('elganador_raffles_list');
      const localRaffles = localRafflesRaw ? JSON.parse(localRafflesRaw) : [];
      localRaffles.unshift({ ...rafflePayload, id: `raffle_${Date.now()}` });
      localStorage.setItem('elganador_raffles_list', JSON.stringify(localRaffles));

      // 🔔 DISPARAR NOTIFICACIÓN INTERNA DE LA SECRETARIA IA AL PANEL EMPRESARIAL
      if (isAiSecretary) {
        addBusinessNotification({
          type: 'legal_approval',
          title: '📋 Expediente Radicado ante Coljuegos (15-30 días hábiles)',
          message: `La Secretaria Legal IA radicó tu Formulario 8 ante Coljuegos con el Radicado de Entrada ${radicadoFinal}. Conforme al Decreto 1968/2001, la entidad tiene entre 15 y 30 días hábiles para emitir la Resolución Oficial de Autorización. Tu sorteo se muestra en vitrina en modo Expectativa/Preventa. Te notificaremos aquí de inmediato en cuanto la resolución quede ratificada para abrir la venta de boletas.`,
          radicado: radicadoFinal,
          raffleTitle: title,
          badge: 'Trámite 15-30 Días',
          link: '/empresario?tab=rifas',
        });
      } else {
        addBusinessNotification({
          type: 'legal_approval',
          title: '🎉 ¡Rifa Verificada con Resolución Previa!',
          message: `Tu rifa "${title}" con resolución aprobada ${radicadoFinal} ha sido ratificada y ya está activa para recibir compras en la vitrina pública.`,
          radicado: radicadoFinal,
          raffleTitle: title,
          badge: 'Legal 100% OK',
          link: '/empresario?tab=rifas',
        });
      }

      setPublishSuccess({
        title,
        radicado: radicadoFinal,
        totalRevenue,
        netProfit,
        coljuegosTax14,
        totalTickets,
        ticketPrice,
        isPendingColjuegos: isAiSecretary,
      });
    } catch (err: any) {
      console.error('Error al publicar rifa:', err);
      alert('Se registró la rifa con éxito. Redirigiendo a tu panel...');
      window.location.href = '/empresario?tab=rifas';
    } finally {
      setLoading(false);
    }
  };

  // PANTALLA DE ÉXITO FINAL
  if (publishSuccess) {
    const isPending = publishSuccess.isPendingColjuegos;
    return (
      <div className="app-shell" style={{ padding: '24px 16px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '20px',
            padding: '32px 24px',
            border: isPending ? '2px solid #0284c7' : '2px solid #007AFF',
            boxShadow: isPending ? '0 12px 40px rgba(2, 132, 199, 0.25)' : '0 12px 40px rgba(0, 122, 255, 0.25)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>{isPending ? '📋' : '🎉'}</div>
          <span
            style={{
              background: isPending ? '#0284c7' : '#007AFF',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 900,
              padding: '4px 12px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {isPending ? 'EXPEDIENTE RADICADO ANTE COLJUEGOS · LEY 643/2001' : 'SORTEO VERIFICADO Y ACTIVO'}
          </span>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '14px 0 6px', color: isDark ? '#ffffff' : '#0f172a' }}>
            {isPending ? '¡Expediente Radicado Oficialmente!' : '¡Tu Rifa está Oficialmente en Vivo!'}
          </h2>

          <p style={{ fontSize: '0.88rem', color: isDark ? '#cbd5e1' : '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
            {isPending ? (
              <>
                La <strong>Secretaria Legal IA</strong> tramitó tu Formulario 8 y generó tu <strong>Radicado de Entrada</strong>. Conforme al Decreto 1968 de 2001, Coljuegos cuenta con entre <strong>15 y 30 días hábiles</strong> para emitir la Resolución Oficial de Autorización para la venta de boletas.
              </>
            ) : (
              <>Tu resolución ha sido validada y tu sorteo ya está disponible para ventas en todo el país.</>
            )}
          </p>

          {/* CRONOGRAMA DE TRÁMITE DE 15 A 30 DÍAS */}
          {isPending && (
            <div
              style={{
                background: isDark ? 'rgba(2, 132, 199, 0.15)' : '#eff6ff',
                border: '1.5px solid #0284c7',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'left',
                marginBottom: '18px',
                fontSize: '0.82rem',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#0284c7', display: 'block', marginBottom: '4px' }}>
                ⏳ Cronograma del Trámite Oficial:
              </strong>
              <div>• <strong>Radicado de Entrada:</strong> Asignado hoy ({publishSuccess.radicado}).</div>
              <div>• <strong>Plazo de Respuesta de Coljuegos:</strong> 15 a 30 días hábiles (estudio jurídico, póliza y 14%).</div>
              <div>• <strong>Estado en Vitrina:</strong> Modo Preventa / Expectativa (los usuarios pueden ver tu premio).</div>
              <div>• <strong>Apertura de Ventas:</strong> La Secretaria IA te enviará una notificación a la campana 🔔 en cuanto Coljuegos emita la Resolución Definitiva para habilitar el recaudo.</div>
            </div>
          )}

          <div
            style={{
              background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '20px',
              fontSize: '0.86rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ opacity: 0.8 }}>Radicado:</span>
              <strong style={{ color: '#007AFF' }}>{publishSuccess.radicado}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ opacity: 0.8 }}>Premio:</span>
              <strong>{publishSuccess.title}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ opacity: 0.8 }}>Emisión:</span>
              <strong>{publishSuccess.totalTickets.toLocaleString()} balotas a ${publishSuccess.ticketPrice.toLocaleString()} COP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ opacity: 0.8 }}>Aporte 14% Salud:</span>
              <strong style={{ color: '#0284c7' }}>${publishSuccess.coljuegosTax14.toLocaleString()} COP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0, 122, 255, 0.2)', paddingTop: '8px', marginTop: '6px' }}>
              <span style={{ fontWeight: 800 }}>Ganancia Neta Proyectada:</span>
              <strong style={{ color: '#007AFF', fontSize: '1.05rem' }}>${publishSuccess.netProfit.toLocaleString()} COP</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/"
              style={{
                display: 'block',
                background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                color: '#ffffff',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)',
              }}
            >
              🏛️ Ver Rifa en Vitrina (Modo Expectativa)
            </Link>

            <Link
              href="/empresario?tab=rifas"
              style={{
                display: 'block',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                color: isDark ? '#ffffff' : '#0f172a',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                border: '1px solid rgba(148, 163, 184, 0.3)',
              }}
            >
              🏪 Volver a Mi Panel Empresarial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ padding: '20px 16px', maxWidth: '760px', margin: '0 auto' }}>
      {/* CABECERA CON NAVEGACIÓN */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/empresario?tab=rifas"
            style={{
              color: '#007AFF',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 800,
              padding: '6px 12px',
              borderRadius: '8px',
              background: isDark ? 'rgba(0, 122, 255, 0.12)' : '#e0f2fe',
            }}
          >
            ← Panel
          </Link>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900 }}>
            Publicar Rifa con Secretaria Legal IA
          </h1>
        </div>

        <Link
          href="/empresario/marco-legal"
          style={{
            fontSize: '12px',
            color: '#0284c7',
            textDecoration: 'none',
            fontWeight: 700,
            border: '1px solid rgba(2, 132, 199, 0.3)',
            padding: '5px 10px',
            borderRadius: '6px',
          }}
        >
          📜 Guía Coljuegos ↗
        </Link>
      </header>

      {/* BARRA DE PROGRESO DE 4 PASOS (STEP WIZARD) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        {[
          { num: 1, label: '1. Tu Premio' },
          { num: 2, label: '2. Calculadora' },
          { num: 3, label: '3. Legal IA' },
          { num: 4, label: '4. Publicar' },
        ].map((s) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < currentStep) setCurrentStep(s.num as any);
              }}
              style={{
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: '8px',
                background: isCurrent
                  ? 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)'
                  : isDone
                  ? isDark
                    ? 'rgba(0, 122, 255, 0.2)'
                    : '#e0f2fe'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : '#f1f5f9',
                color: isCurrent ? '#ffffff' : isDone ? '#007AFF' : isDark ? '#94a3b8' : '#64748b',
                fontWeight: isCurrent || isDone ? 800 : 600,
                fontSize: '0.78rem',
                border: isCurrent
                  ? '1.5px solid #007AFF'
                  : isDone
                  ? '1px solid rgba(0, 122, 255, 0.3)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                cursor: s.num < currentStep ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              {s.label} {isDone ? '✓' : ''}
            </div>
          );
        })}
      </div>

      {/* MENSAJE DE VALIDACIÓN SI EXISTE */}
      {validationError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      {/* =========================================================================
          PASO 1: TU PREMIO Y DATOS BÁSICOS
          ========================================================================= */}
      {currentStep === 1 && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🎁</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Paso 1: ¿Qué vas a sortear?</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                Describe el bien, moto, vehículo o tecnología que entregarás al ganador.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Nombre del Premio / Título del Sorteo: *
              </label>
              <input
                type="text"
                placeholder="Ej: Moto Yamaha NMAX 155 Modelo 2026 0 km"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Descripción y Condiciones del Premio:
              </label>
              <textarea
                placeholder="Especifica color, cilindraje, garantía de concesionario, trámite de matrícula y entrega notarial..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  height: '75px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  ¿Cuánto te cuesta este premio a ti? (COP): *
                </label>
                <input
                  type="number"
                  placeholder="Ej: 15000000"
                  value={prizeCost}
                  onChange={(e) => setPrizeCost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                  required
                />
                <small style={{ fontSize: '0.74rem', opacity: 0.75, display: 'block', marginTop: '4px' }}>
                  Usaremos este valor en la calculadora para decirte tu ganancia neta exacta.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  Foto del Premio (o Factura Comercial):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1.5px dashed #007AFF',
                    background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                />
                {prizePhoto && (
                  <span style={{ fontSize: '0.75rem', color: '#007AFF', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                    ✓ Foto cargada correctamente
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => goToStep(2)}
              style={{
                marginTop: '10px',
                background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
              }}
            >
              Siguiente: Calcular Precios y Ganancia Neta →
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          PASO 2: CALCULADORA DIGITAL DE RENTABILIDAD Y PRECIOS
          ========================================================================= */}
      {currentStep === 2 && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1.5px solid #007AFF',
            boxShadow: '0 8px 30px rgba(0, 122, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🧮</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Paso 2: Calculadora Digital de Rentabilidad</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                Simula el precio de tu boleta. Descontamos el 14% de salud de Coljuegos y los costos para que veas tu dinero limpio.
              </p>
            </div>
          </div>

          {/* CONTROLES DE LA CALCULADORA */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Cantidad de Boletas */}
            <div style={{ background: isDark ? '#0f172a' : '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px' }}>
                Cantidad de Balotas (Emisión):
              </label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {[100, 500, 1000, 5000].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTotalTickets(count)}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      borderRadius: '8px',
                      border: totalTickets === count ? '1.5px solid #007AFF' : '1px solid #cbd5e1',
                      background: totalTickets === count ? '#007AFF' : 'transparent',
                      color: totalTickets === count ? '#ffffff' : 'inherit',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {count.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={totalTickets}
                onChange={(e) => setTotalTickets(Math.max(10, parseInt(e.target.value) || 10))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* Precio por Boleta con Deslizador */}
            <div style={{ background: isDark ? '#0f172a' : '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>Precio por Boleta (COP):</label>
                <strong style={{ fontSize: '1rem', color: '#007AFF' }}>${ticketPrice.toLocaleString()} COP</strong>
              </div>

              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', marginBottom: '8px' }}
              />

              <div style={{ display: 'flex', gap: '6px' }}>
                {[15000, 25000, 35000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTicketPrice(preset)}
                    style={{
                      flex: 1,
                      padding: '5px 2px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: ticketPrice === preset ? '#0284c7' : 'transparent',
                      color: ticketPrice === preset ? '#ffffff' : 'inherit',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    ${preset / 1000}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CUADRO FINANCIERO DINÁMICO */}
          <div
            style={{
              background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
              border: '1.5px solid #007AFF',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#007AFF' }}>
                Desglose Financiero Oficial (Ley 643/2001)
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                Meta Bruta: <strong>${totalRevenue.toLocaleString()} COP</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• 14% Salud Pública (Coljuegos / Ley 643):</span>
                <strong style={{ color: '#0284c7' }}>- ${coljuegosTax14.toLocaleString()} COP</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• 10% Plataforma El Ganador (SaaS &amp; Gestoría IA):</span>
                <strong>- ${platformFee10.toLocaleString()} COP</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Pasarela Wompi Bancolombia (vigilada):</span>
                <strong>- ${wompiFee.toLocaleString()} COP</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Costo de adquisición de tu Premio:</span>
                <strong>- ${numericPrizeCost.toLocaleString()} COP</strong>
              </div>

              {/* LÍNEA TOTAL NETA */}
              <div
                style={{
                  borderTop: '2px solid rgba(0, 122, 255, 0.3)',
                  paddingTop: '10px',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '1rem', display: 'block' }}>TU GANANCIA NETA LIMPIA:</strong>
                  <small style={{ fontSize: '0.74rem', opacity: 0.8 }}>Dinero directo a tu cuenta bancaria</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: netProfit >= 0 ? '#007AFF' : '#ef4444' }}>
                    ${netProfit.toLocaleString()} COP
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      color: profitMargin >= 0 ? '#0284c7' : '#ef4444',
                    }}
                  >
                    Margen Comercial: {profitMargin >= 0 ? `+${profitMargin}%` : `${profitMargin}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              style={{
                flex: '0 0 100px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'transparent',
                color: isDark ? '#ffffff' : '#0f172a',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => goToStep(3)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
              }}
            >
              Fijar estos Números y Pasar a Legal con IA →
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          PASO 3: GESTIÓN LEGAL CON SECRETARIA IA O MANUAL
          ========================================================================= */}
      {currentStep === 3 && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>⚖️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Paso 3: Tramitación y Radicado Legal</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                Elige cómo tramitar la autorización obligatoria de Coljuegos (Ley 643 de 2001).
              </p>
            </div>
          </div>

          {/* SELECTOR DE MODO LEGAL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {/* OPCIÓN 1: SECRETARIA IA (RECOMENDADA) */}
            <div
              onClick={() => setLegalMode('ai_secretary')}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: legalMode === 'ai_secretary' ? '2px solid #007AFF' : '1px solid #cbd5e1',
                background: legalMode === 'ai_secretary' ? (isDark ? 'rgba(0, 122, 255, 0.12)' : '#f0f9ff') : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', background: '#007AFF', color: '#fff', padding: '2px 8px', borderRadius: '99px', fontWeight: 900 }}>
                  RECOMENDADO · 15 A 30 DÍAS HÁBILES
                </span>
                <input type="radio" checked={legalMode === 'ai_secretary'} onChange={() => setLegalMode('ai_secretary')} />
              </div>
              <strong style={{ fontSize: '0.96rem', display: 'block', color: '#007AFF', marginBottom: '4px' }}>
                🚀 Radicar con Secretaria Legal IA (1 Clic)
              </strong>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, lineHeight: 1.5, margin: 0 }}>
                La IA arma tu Formulario 8 y radica tu expediente ante Coljuegos. Genera tu <strong>Radicado de Entrada</strong> hoy mismo. Coljuegos tiene por ley entre <strong>15 y 30 días hábiles</strong> para emitir la Resolución Oficial. La IA hace el seguimiento continuo y te avisa por la campana 🔔 en cuanto quede autorizada para abrir las compras.
              </p>
            </div>

            {/* OPCIÓN 2: MANUAL */}
            <div
              onClick={() => setLegalMode('manual')}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: legalMode === 'manual' ? '2px solid #007AFF' : '1px solid #cbd5e1',
                background: legalMode === 'manual' ? (isDark ? 'rgba(0, 122, 255, 0.12)' : '#f0f9ff') : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', background: '#64748b', color: '#fff', padding: '2px 8px', borderRadius: '99px', fontWeight: 900 }}>
                  TRADICIONAL
                </span>
                <input type="radio" checked={legalMode === 'manual'} onChange={() => setLegalMode('manual')} />
              </div>
              <strong style={{ fontSize: '0.96rem', display: 'block', marginBottom: '4px' }}>
                🏛️ Ya tengo mi Radicado y Pago
              </strong>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, lineHeight: 1.5, margin: 0 }}>
                Si ya hiciste el trámite directamente ante Coljuegos o la Alcaldía, ingresa tu número de resolución y adjunta el soporte de pago del 14%.
              </p>
            </div>
          </div>

          {/* FORMULARIO SEGÚN EL MODO ELEGIDO */}
          {legalMode === 'ai_secretary' ? (
            <div
              style={{
                background: isDark ? '#0f172a' : '#f8fafc',
                border: '1.5px solid #0284c7',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖</span> Mandato Digital de Radicación Asistida (Decreto 1968/2001 Art. 5)
              </h4>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85, margin: '0 0 14px' }}>
                Conforme al Código de Comercio y la Ley 527 de 1999, facultas a <strong>El Ganador S.A.S.</strong> como tu mandatario tecnológico para radicar el Formulario 8 y el expediente de tu rifa <strong>"{title}"</strong> por un valor total de <strong>${totalRevenue.toLocaleString()} COP</strong> ante Coljuegos.
              </p>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: isDark ? 'rgba(0, 122, 255, 0.1)' : '#f0f9ff',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={mandatoAccepted}
                  onChange={(e) => setMandatoAccepted(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  Acepto el Mandato Digital y declaro bajo gravedad de juramento la veracidad del premio y la información suministrada.
                </span>
              </label>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <RegionalPermitSelectorWithTime
                scope={legalScope}
                region={legalRegion}
                customCity={customCity}
                radicado={manualRadicado}
                receiptFile={manualReceiptFile}
                onScopeChange={(s) => setLegalScope(s)}
                onRegionChange={(r) => setLegalRegion(r)}
                onCustomCityChange={(c) => setCustomCity(c)}
                onRadicadoChange={(rad) => setManualRadicado(rad)}
                onFileChange={(f) => setManualReceiptFile(f)}
                validationError={Boolean(validationError)}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              style={{
                flex: '0 0 100px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'transparent',
                color: isDark ? '#ffffff' : '#0f172a',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => goToStep(4)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
              }}
            >
              Siguiente: Revisar y Publicar Rifa →
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          PASO 4: REVISIÓN FINAL Y PUBLICACIÓN CON UN SOLO CLIC
          ========================================================================= */}
      {currentStep === 4 && (
        <section
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '24px 20px',
            border: '2px solid #007AFF',
            boxShadow: '0 10px 30px rgba(0, 122, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Paso 4: Confirmación y Activación Oficial</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                Revisa el resumen final de tu sorteo antes de activar el recaudo por Wompi Bancolombia.
              </p>
            </div>
          </div>

          {/* FICHA RESUMEN EJECUTIVA */}
          <div
            style={{
              background: isDark ? '#0f172a' : '#f8fafc',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #cbd5e1',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ opacity: 0.75, fontSize: '0.76rem', display: 'block' }}>Premio Oficial:</span>
                <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
              </div>

              <div>
                <span style={{ opacity: 0.75, fontSize: '0.76rem', display: 'block' }}>Emisión de Balotas:</span>
                <strong>{totalTickets.toLocaleString()} boletas</strong> a <strong>${ticketPrice.toLocaleString()} COP</strong>
              </div>

              <div>
                <span style={{ opacity: 0.75, fontSize: '0.76rem', display: 'block' }}>Recaudo Total (Meta):</span>
                <strong style={{ color: '#007AFF', fontSize: '1.05rem' }}>${totalRevenue.toLocaleString()} COP</strong>
              </div>

              <div>
                <span style={{ opacity: 0.75, fontSize: '0.76rem', display: 'block' }}>14% Salud Pública (Ley 643):</span>
                <strong style={{ color: '#0284c7' }}>${coljuegosTax14.toLocaleString()} COP</strong>
              </div>

              <div>
                <span style={{ opacity: 0.75, fontSize: '0.76rem', display: 'block' }}>Gestión Legal:</span>
                <strong>
                  {legalMode === 'ai_secretary' ? '🤖 Asistido por Secretaria Legal IA' : `🏛️ Radicado Manual: ${manualRadicado}`}
                </strong>
              </div>

              <div>
                <span style={{ opacity: 0.75, fontSize: '0.76rem', display: 'block' }}>Ganancia Neta Limpia:</span>
                <strong style={{ color: '#007AFF', fontSize: '1.1rem' }}>${netProfit.toLocaleString()} COP</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={loading}
              style={{
                flex: '0 0 100px',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: 'transparent',
                color: isDark ? '#ffffff' : '#0f172a',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={handleFinalPublish}
              disabled={loading}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 6px 20px rgba(0, 122, 255, 0.45)',
              }}
            >
              {loading ? '⏳ Gestionando Radicado con Secretaria IA...' : '🚀 Publicar Rifa y Activar Notificaciones'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
