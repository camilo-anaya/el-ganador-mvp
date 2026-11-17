// app/publicidad/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DesktopSidebar from '@/components/DesktopSidebar';
import { useTheme } from '@/context/ThemeContext';

interface PlanInfo {
  id: 'emprendedor' | 'pro' | 'enterprise';
  name: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  priceMonthly: number;
  highlight?: boolean;
  description: string;
  spacesAndFormats: string[];
  raffleCapacity: string;
  territory: string;
}

const PUBLICITY_PLANS: PlanInfo[] = [
  {
    id: 'emprendedor',
    name: 'Plan Emprendedor',
    badge: '📍 Cobertura Local',
    badgeColor: '#475569',
    badgeBg: '#f1f5f9',
    priceMonthly: 39900,
    description: 'Para tiendas, comercios y marcas de barrio con impacto en su municipio.',
    spacesAndFormats: [
      'Espacio en Vitrina Comercial Local (1 municipio)',
      'Historias Comerciales rotativas (24 horas con foto)',
      'Balotera básica oficial de 100 números (00 al 99)',
      'Hasta 2 sorteos o campañas simultáneas activas',
    ],
    raffleCapacity: 'Hasta 2 campañas activas',
    territory: '1 Municipio / Distrito local',
  },
  {
    id: 'pro',
    name: 'Plan Pro Comercial',
    badge: '⭐ Más Elegido · Regional',
    badgeColor: '#007AFF',
    badgeBg: 'rgba(0, 122, 255, 0.12)',
    priceMonthly: 119900,
    highlight: true,
    description: 'Para marcas en expansión, concesionarios y distribuidoras departamentales.',
    spacesAndFormats: [
      'Espacio en Carrusel Superior Rotativo de Vitrina',
      'Banner HD con botón directo y cupón promocional de tienda',
      'Presencia destacada en Sala 3D (Ruleta 50 o Balotera 300)',
      'Hasta 5 sorteos o campañas simultáneas activas',
    ],
    raffleCapacity: 'Hasta 5 campañas activas',
    territory: 'Departamental / Regional',
  },
  {
    id: 'enterprise',
    name: 'Plan Enterprise Nacional',
    badge: '👑 Cobertura Nacional',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    priceMonthly: 299900,
    description: 'Para grandes marcas, cadenas de retail y operadores a nivel Colombia.',
    spacesAndFormats: [
      'Patrocinador Oficial Exclusivo en Sala 3D en Vivo',
      'Video spots de hasta 120 segundos + Mención en transmisiones',
      'Posición preferente Top 1 en Carrusel y Vitrina',
      'Sorteos y pautas ilimitadas con Coljuegos (32 departamentos)',
      'Comisión fija del 10% y soporte corporativo 24/7',
    ],
    raffleCapacity: 'Ilimitadas simultáneas',
    territory: 'Nacional (32 departamentos)',
  },
];

export default function PlanesPublicitariosPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedPlanId, setSelectedPlanId] = useState<'emprendedor' | 'pro' | 'enterprise'>('pro');
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [businessEmail, setBusinessEmail] = useState<string>('empresa@elganador.co');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedContact, setCopiedContact] = useState<boolean>(false);

  // Estados unificados de Beneficios y Configuración de Banner de Patrocinador
  const [adHeadline, setAdHeadline] = useState('20% OFF en accesorios + Matrícula Gratis');
  const [adCoupon, setAdCoupon] = useState('ELGANADOR20');
  const [adActive, setAdActive] = useState(true);
  const [bannerSaved, setBannerSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('elganador_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) setBusinessEmail(parsed.email);
      }
      const savedAd = localStorage.getItem('elganador_business_ad');
      if (savedAd) {
        const a = JSON.parse(savedAd);
        if (a.headline) setAdHeadline(a.headline);
        if (a.coupon) setAdCoupon(a.coupon);
        if (typeof a.active === 'boolean') setAdActive(a.active);
      }
    } catch {}
  }, []);

  const handleSaveBannerConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adData = { headline: adHeadline, coupon: adCoupon, active: adActive };
      localStorage.setItem('elganador_business_ad', JSON.stringify(adData));
      setBannerSaved(true);
      setTimeout(() => setBannerSaved(false), 3000);
      alert('✅ ¡Configuración de Banner de Patrocinador guardada con éxito!');
    } catch (err) {
      console.error(err);
    }
  };

  const calculatePrice = (basePrice: number) => {
    if (billingCycle === 'trimestral') {
      return Math.round(basePrice * 3 * 0.85); // 15% descuento
    }
    if (billingCycle === 'anual') {
      return Math.round(basePrice * 12 * 0.70); // 30% descuento
    }
    return basePrice;
  };

  const handlePayPlanWithWompi = (plan: PlanInfo) => {
    setIsProcessing(true);
    const finalPrice = calculatePrice(plan.priceMonthly);
    const amountInCents = finalPrice * 100;
    const reference = `PLAN-${plan.id.toUpperCase()}-${billingCycle.toUpperCase()}-${Date.now()}`;

    const configuredKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_WOMPI_PUB_KEY || '';
    const publicKey = configuredKey && !configuredKey.includes('tu_llave') && !configuredKey.includes('tus_credenciales')
      ? configuredKey
      : 'pub_test_Q5yDA9xoKdePiumALrhQV9RLG2ECZldD';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co';
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const redirectUrl = isLocal ? undefined : `${origin}/empresario?tab=pauta&status=plan_activado&ref=${reference}&plan=${plan.id}`;

    // Guardar registro local de suscripción iniciada
    try {
      const pendingSub = {
        planId: plan.id,
        planName: plan.name,
        cycle: billingCycle,
        amountCop: finalPrice,
        reference,
        status: 'procesando_wompi',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('elganador_active_plan', JSON.stringify(pendingSub));
    } catch {}

    // Si window.WidgetCheckout está disponible
    if (typeof window !== 'undefined' && (window as unknown as { WidgetCheckout?: new (opts: Record<string, unknown>) => { open: (cb: (res: { transaction?: { status: string } }) => void) => void } }).WidgetCheckout) {
      const WidgetCheckout = (window as unknown as { WidgetCheckout: new (opts: Record<string, unknown>) => { open: (cb: (res: { transaction?: { status: string } }) => void) => void } }).WidgetCheckout;
      const config: Record<string, unknown> = {
        currency: 'COP',
        amountInCents,
        amount_in_cents: amountInCents,
        reference,
        publicKey,
        public_key: publicKey,
        customerData: {
          email: businessEmail,
          fullName: 'Empresa Aliada',
          phoneNumber: '3001234567',
          phoneNumberPrefix: '+57',
          legalId: '900123456',
          legalIdType: 'NIT'
        },
        customer_data: {
          email: businessEmail,
          fullName: 'Empresa Aliada',
          phoneNumber: '3001234567',
          phoneNumberPrefix: '+57',
          legalId: '900123456',
          legalIdType: 'NIT'
        }
      };

      if (redirectUrl) {
        config.redirectUrl = redirectUrl;
      }

      const checkout = new WidgetCheckout(config);

      checkout.open((result) => {
        setIsProcessing(false);
        const transaction = result?.transaction;
        if (transaction?.status === 'APPROVED') {
          alert(`🎉 ¡Pago aprobado con éxito! Tu ${plan.name} ha sido activado.`);
          window.location.href = redirectUrl || '/publicidad';
        } else if (transaction?.status === 'DECLINED' || transaction?.status === 'ERROR') {
          alert('⚠️ La transacción de pauta publicitaria no fue aprobada.');
        }
      });
      return;
    }

    // Fallback: Redirección inmediata a Wompi
    const wompiCheckoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&redirect-url=${encodeURIComponent(redirectUrl || '')}&customer-data:email=${encodeURIComponent(businessEmail)}`;

    window.location.href = wompiCheckoutUrl;
  };

  return (
    <div className="desktop-workspace-grid" style={{ minHeight: '100vh', background: isDark ? '#000000' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a' }}>
      <DesktopSidebar />

      <main className="app-scroll-canvas" style={{ padding: '24px 32px 70px', maxWidth: '1150px', margin: '0 auto', width: '100%' }}>
        {/* ENCABEZADO OFICIAL UNIFICADO */}
        <header style={{ marginBottom: '24px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0', paddingBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe', border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #bae6fd', borderRadius: '20px', padding: '6px 14px', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px' }}>📢</span>
            <span style={{ color: isDark ? '#38bdf8' : '#0284c7', fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Planes Publicitarios Oficiales
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '6px 0 10px', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.5px' }}>
            Planes Publicitarios en El Ganador
          </h1>
          <p style={{ fontSize: '0.98rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: '1.6', maxWidth: '850px', margin: 0 }}>
            Elige el plan publicitario ideal para tu marca o comercio. Todos los planes unifican tus <strong style={{ color: '#007AFF' }}>espacios de pauta</strong> (carrusel superior, historias 24h y sala 3D en vivo) y se pagan directamente a nuestra pasarela oficial Wompi (PSE, Bancolombia, Nequi y Tarjetas).
          </p>
        </header>

        {/* SELECTOR DE CICLO DE PAGO (MENSUAL / TRIMESTRAL / ANUAL) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ background: isDark ? '#1e293b' : '#f1f5f9', padding: '6px', borderRadius: '14px', display: 'inline-flex', gap: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1', boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
            <button
              type="button"
              onClick={() => setBillingCycle('mensual')}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: 'none',
                background: billingCycle === 'mensual' ? '#007AFF' : 'transparent',
                color: billingCycle === 'mensual' ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: billingCycle === 'mensual' ? '0 4px 12px rgba(0, 122, 255, 0.28)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Pago Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('trimestral')}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: 'none',
                background: billingCycle === 'trimestral' ? '#007AFF' : 'transparent',
                color: billingCycle === 'trimestral' ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: billingCycle === 'trimestral' ? '0 4px 12px rgba(0, 122, 255, 0.28)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Trimestral</span>
              <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '10.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px' }}>-15%</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('anual')}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: 'none',
                background: billingCycle === 'anual' ? '#007AFF' : 'transparent',
                color: billingCycle === 'anual' ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: billingCycle === 'anual' ? '0 4px 12px rgba(0, 122, 255, 0.28)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Anual</span>
              <span style={{ background: '#ea580c', color: '#ffffff', fontSize: '10.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px' }}>-30%</span>
            </button>
          </div>
        </div>

        {/* CONTENEDOR DE PLANES PUBLICITARIOS CON PAGO DIRECTO WOMPI */}
        <section style={{ background: isDark ? '#111827' : '#ffffff', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0', borderRadius: '22px', padding: '30px 24px', color: isDark ? '#f8fafc' : '#0f172a', boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.08)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#007AFF', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Catálogo Oficial B2B
              </span>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', margin: 0 }}>
                Elige tu Plan Publicitario
              </h2>
            </div>
            <div style={{ background: isDark ? '#1e293b' : '#f8fafc', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
              Pago seguro directo con Wompi Bancolombia (PSE / Nequi / Tarjetas)
            </div>
          </div>

          {/* TARJETAS DE PLANES CON PAGO INTEGRADO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {PUBLICITY_PLANS.map((plan) => {
              const price = calculatePrice(plan.priceMonthly);
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  style={{
                    background: isDark ? '#1e293b' : '#ffffff',
                    border: plan.highlight ? '2px solid #007AFF' : isSelected ? '2px solid #38bdf8' : (isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1'),
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    cursor: 'pointer',
                    boxShadow: plan.highlight ? (isDark ? '0 10px 30px rgba(0, 122, 255, 0.3)' : '0 10px 30px rgba(0, 122, 255, 0.14)') : (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.04)'),
                    transition: 'all 0.18s ease'
                  }}
                >
                  {plan.highlight && (
                    <span style={{ position: 'absolute', top: '-12px', right: '16px', background: '#007AFF', color: '#ffffff', fontSize: '10.5px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    {!plan.highlight && (
                      <span style={{ display: 'inline-block', background: isDark ? 'rgba(255, 255, 255, 0.1)' : plan.badgeBg, color: isDark ? '#f8fafc' : plan.badgeColor, fontSize: '11px', fontWeight: 800, padding: '4px 9px', borderRadius: '6px', textTransform: 'uppercase', marginBottom: '10px' }}>
                        {plan.badge}
                      </span>
                    )}

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', margin: '0 0 6px' }}>
                      {plan.name}
                    </h3>
                    
                    <div style={{ margin: '12px 0 14px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: plan.highlight ? '#38bdf8' : (isDark ? '#ffffff' : '#0f172a') }}>
                        $ {price.toLocaleString('es-CO')}
                      </span>
                      <small style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginLeft: '6px' }}>
                        COP / {billingCycle === 'mensual' ? 'mes' : billingCycle === 'trimestral' ? 'trimestre' : 'año'}
                      </small>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#64748b', lineHeight: '1.45', margin: '0 0 16px' }}>
                      {plan.description}
                    </p>

                    <div style={{ borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                        Espacios y Formatos Incluidos:
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.84rem', color: isDark ? '#cbd5e1' : '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {plan.spacesAndFormats.map((feature, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: '#007AFF', fontWeight: 900, fontSize: '0.95rem' }}>✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* BOTÓN OFICIAL DE PAGO DIRECTO WOMPI */}
                  <div>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePayPlanWithWompi(plan);
                      }}
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        background: plan.highlight
                          ? 'linear-gradient(135deg, #007AFF 0%, #0051B3 100%)'
                          : (isDark ? '#0284c7' : '#0f172a'),
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: plan.highlight
                          ? '0 4px 16px rgba(0, 122, 255, 0.4)'
                          : '0 4px 12px rgba(15, 23, 42, 0.25)',
                        transition: 'transform 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isProcessing && selectedPlanId === plan.id
                        ? '⏳ Conectando con Wompi...'
                        : `🔒 Pagar ${plan.name} con Wompi`}
                    </button>
                    <span style={{ display: 'block', textAlign: 'center', fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '6px' }}>
                      Acepta PSE, Nequi, Botón Bancolombia y Tarjetas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLA COMPARATIVA UNIFICADA (SIN DUPLICAR INFORMACIÓN) */}
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', marginBottom: '12px' }}>
              Resumen Comparativo de Planes Publicitarios
            </h3>
            <div style={{ overflowX: 'auto', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: isDark ? '#1e293b' : '#f8fafc', borderBottom: isDark ? '2px solid rgba(255, 255, 255, 0.12)' : '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155' }}>Característica</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>Emprendedor ($ 39.900)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#38bdf8' }}>Pro ($ 119.900)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#f59e0b' }}>Enterprise ($ 299.900)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: isDark ? '#ffffff' : '#1e293b' }}>Ubicación en Vitrina</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#475569' }}>Filtro local municipal</td>
                    <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 700 }}>Carrusel Superior Rotativo</td>
                    <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 700 }}>Carrusel Top 1 + Sala 3D</td>
                  </tr>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: isDark ? '#ffffff' : '#1e293b' }}>Formatos Publicitarios</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#475569' }}>Historias 24h (Fotos)</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#334155' }}>Banner HD + Cupón de tienda</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#334155' }}>Video spot 120s + Mención en vivo</td>
                  </tr>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: isDark ? '#ffffff' : '#1e293b' }}>Alcance Territorial</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#475569' }}>1 Municipio</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#334155' }}>Departamental (Región)</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#334155' }}>Nacional (Coljuegos / 32 Deptos)</td>
                  </tr>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: isDark ? '#ffffff' : '#1e293b' }}>Capacidad de Campañas</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#475569' }}>Hasta 2 simultáneas</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#334155' }}>Hasta 5 simultáneas</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#334155' }}>Ilimitadas</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: isDark ? '#ffffff' : '#1e293b' }}>Medio de Pago Seguro</td>
                    <td style={{ padding: '12px 16px', color: isDark ? '#cbd5e1' : '#475569' }}>Wompi (PSE / Nequi / Card)</td>
                    <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 700 }}>Wompi (PSE / Nequi / Card)</td>
                    <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 700 }}>Wompi (PSE / Nequi / Card)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* =========================================================
            BENEFICIOS DE PAUTA Y ESPACIOS PUBLICITARIOS EN VITRINA
            ========================================================= */}
        <section style={{ background: isDark ? '#111827' : '#ffffff', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0', borderRadius: '22px', padding: '30px 24px', color: isDark ? '#f8fafc' : '#0f172a', boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.08)', marginBottom: '32px' }}>
          <div style={{ marginBottom: '22px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0', paddingBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#007AFF', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Impacto & Visibilidad Comercial
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', margin: '0 0 6px' }}>
              Beneficios de Pauta y Espacios en Vitrina
            </h2>
            <p style={{ fontSize: '0.9rem', color: isDark ? '#cbd5e1' : '#64748b', margin: 0 }}>
              No necesitas organizar rifas para pautar. Posiciona tu negocio ante más de 50.000 compradores activos en toda Colombia.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: isDark ? '#1e293b' : '#f8fafc', padding: '20px', borderRadius: '14px', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏎️</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', color: isDark ? '#ffffff' : '#0f172a' }}>Carrusel de Vitrina Superior</h4>
              <p style={{ fontSize: '0.84rem', color: isDark ? '#cbd5e1' : '#475569', margin: 0, lineHeight: '1.5' }}>
                Tu marca rota cada 4 segundos en la cabecera del Marketplace, visible sin hacer scroll para todo usuario que ingresa.
              </p>
            </div>

            <div style={{ background: isDark ? '#1e293b' : '#f8fafc', padding: '20px', borderRadius: '14px', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏷️</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', color: isDark ? '#ffffff' : '#0f172a' }}>Banner HD + Cupón Exclusivo</h4>
              <p style={{ fontSize: '0.84rem', color: isDark ? '#cbd5e1' : '#475569', margin: 0, lineHeight: '1.5' }}>
                Enlace directo hacia tu WhatsApp, catálogo o tienda virtual con código promocional exclusivo para incentivar compras directas.
              </p>
            </div>

            <div style={{ background: isDark ? '#1e293b' : '#f8fafc', padding: '20px', borderRadius: '14px', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', color: isDark ? '#ffffff' : '#0f172a' }}>Historias Comerciales (24h)</h4>
              <p style={{ fontSize: '0.84rem', color: isDark ? '#cbd5e1' : '#475569', margin: 0, lineHeight: '1.5' }}>
                Publica videos de hasta 120 segundos o fotos de alta definición para lanzar ofertas del día, liquidaciones o nuevos productos.
              </p>
            </div>

            <div style={{ background: isDark ? '#1e293b' : '#f8fafc', padding: '20px', borderRadius: '14px', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎱</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', color: isDark ? '#ffffff' : '#0f172a' }}>Patrocinador Sala 3D en Vivo</h4>
              <p style={{ fontSize: '0.84rem', color: isDark ? '#cbd5e1' : '#475569', margin: 0, lineHeight: '1.5' }}>
                Mención de marca y logotipo proyectado en la balotera y ruleta 3D durante las transmisiones en directo de sorteos oficiales.
              </p>
            </div>
          </div>

          {/* CONFIGURADOR Y PREVISUALIZADOR DE BANNER DE PATROCINADOR */}
          <div style={{ background: isDark ? '#1e293b' : '#f1f5f9', borderRadius: '16px', padding: '22px', border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', margin: '0 0 4px' }}>
                  📢 Configura tu Anuncio para la Vitrina Comercial
                </h3>
                <p style={{ fontSize: '0.84rem', color: isDark ? '#cbd5e1' : '#64748b', margin: 0 }}>
                  Personaliza la frase publicitaria y el cupón de descuento que verán los compradores en el carrusel:
                </p>
              </div>
              {bannerSaved && (
                <span style={{ background: '#22c55e', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px' }}>
                  ✓ ¡Guardado en Vitrina!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveBannerConfig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '6px' }}>
                  Frase o Beneficio Promocional:
                </label>
                <input
                  type="text"
                  value={adHeadline}
                  onChange={(e) => setAdHeadline(e.target.value)}
                  placeholder="Ej: 20% OFF en accesorios + Matrícula Gratis"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#ffffff', fontSize: '0.9rem', color: isDark ? '#ffffff' : '#0f172a' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '6px' }}>
                  Código de Cupón o Descuento para Compradores:
                </label>
                <input
                  type="text"
                  value={adCoupon}
                  onChange={(e) => setAdCoupon(e.target.value)}
                  placeholder="Ej: ELGANADOR20"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#ffffff', fontSize: '0.9rem', color: isDark ? '#ffffff' : '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={adActive}
                    onChange={(e) => setAdActive(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Mantener pauta activa</span>
                </label>

                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '11px 18px',
                    background: '#007AFF',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  💾 Actualizar Anuncio
                </button>
              </div>
            </form>

            {/* VISTA PREVIA DEL BANNER EN VIVO */}
            <div style={{ marginTop: '16px', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1', paddingTop: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                👁️ Vista Previa en Carrusel de Vitrina:
              </span>
              <div style={{ background: isDark ? '#0f172a' : '#ffffff', padding: '14px 18px', borderRadius: '10px', border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#f59e0b', background: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '4px' }}>
                    ⚡ Patrocinador Oficial
                  </span>
                  <p style={{ margin: '2px 0', fontSize: '0.95rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                    {adHeadline || 'Tu Anuncio Aquí'}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#64748b' }}>
                    Cupón Exclusivo: <strong style={{ color: '#007AFF' }}>{adCoupon || 'ELGANADOR'}</strong>
                  </span>
                </div>
                <span style={{ padding: '6px 14px', background: '#007AFF', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Aprovechar Descuento →
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SOPORTE DIRECTO Y COTIZACIONES A LA MEDIDA */}
        <section style={{ background: isDark ? '#111827' : '#ffffff', border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', color: isDark ? '#f8fafc' : '#0f172a', boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', margin: '0 0 6px' }}>
                ¿Necesitas un paquete publicitario corporativo a la medida?
              </h3>
              <p style={{ fontSize: '0.88rem', color: isDark ? '#cbd5e1' : '#64748b', margin: 0, maxWidth: '680px' }}>
                Diseñamos planes a medida para agencias, marcas automotrices, retail y franquicias sin necesidad de organizar sorteos.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="https://api.whatsapp.com/send?phone=573129876543&text=Hola%20El%20Ganador,%20deseo%20activar%20un%20plan%20publicitario%20corporativo%20para%20mi%20marca"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  background: '#25D366',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                }}
              >
                <span>💬</span> WhatsApp B2B ↗
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('publicidad@elganador.co');
                  setCopiedContact(true);
                  setTimeout(() => setCopiedContact(false), 2000);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 18px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                <span>✉️</span> {copiedContact ? '¡Correo copiado! ✓' : 'publicidad@elganador.co'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
