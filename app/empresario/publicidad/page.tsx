// app/empresario/empresario/publicidad/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BusinessSidebar from '@/components/business/BusinessSidebar';
import BusinessBottomNav from '@/components/business/BusinessBottomNav';
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
  const [adBrand, setAdBrand] = useState('Mi Empresa Oficial');
  const [adHeadline, setAdHeadline] = useState('20% OFF en accesorios + Matrícula Gratis');
  const [adDescription, setAdDescription] = useState('Promoción exclusiva para la comunidad de El Ganador. Envíos a toda Colombia.');
  const [adCoupon, setAdCoupon] = useState('ELGANADOR20');
  const [adCtaLink, setAdCtaLink] = useState('https://wa.me/573001234567');
  const [adImage, setAdImage] = useState('/banner-el-ganador-oficial.jpg');
  const [adActive, setAdActive] = useState(true);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [activeSubInfo, setActiveSubInfo] = useState<{ planName: string; cycle: string; expiresAt: string; reference: string; clicks?: number } | null>(null);
  const [autonomousPublishedNotice, setAutonomousPublishedNotice] = useState<string | null>(null);

  const publishAutonomousBannerAd = async (
    plan: PlanInfo,
    cycle: 'mensual' | 'trimestral' | 'anual',
    reference: string,
    draftOverride?: { brand?: string; headline?: string; description?: string; coupon?: string; ctaLink?: string; image?: string; active?: boolean }
  ) => {
    try {
      const days = cycle === 'anual' ? 365 : cycle === 'trimestral' ? 90 : 30;
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const brandVal = (draftOverride?.brand ?? adBrand).trim() || 'Marca Patrocinadora';
      const titleVal = (draftOverride?.headline ?? adHeadline).trim() || 'Promoción Oficial El Ganador';
      const descVal = (draftOverride?.description ?? adDescription).trim() || 'Patrocinador verificado con suscripción mensual activa en El Ganador.';
      const couponRaw = (draftOverride?.coupon ?? adCoupon).trim();
      const ctaLinkVal = (draftOverride?.ctaLink ?? adCtaLink).trim() || '/empresario/publicidad';
      const imageVal = draftOverride?.image || adImage || '/banner-el-ganador-oficial.jpg';

      const publishedAd = {
        id: `ad-sub-${reference}`,
        tag: plan.id === 'enterprise' ? '👑 PATROCINADOR ENTERPRISE VIP' : `⚡ PATROCINADOR ${plan.name.toUpperCase()}`,
        brand: brandVal,
        category: `${plan.territory} · Suscripción ${cycle}`,
        title: titleVal,
        description: descVal,
        coupon: couponRaw ? (couponRaw.toLowerCase().startsWith('cupón') ? couponRaw : `Cupón: ${couponRaw}`) : 'Cupón: ELGANADOR',
        ctaText: ctaLinkVal.startsWith('http') ? 'Ir a la Oferta Directa ↗' : 'Ver Vitrina & Promoción →',
        ctaLink: ctaLinkVal,
        image: imageVal,
        badge: `✓ Suscripción ${cycle} activa`,
        paid: true,
        active: draftOverride?.active ?? adActive,
        planId: plan.id,
        billingCycle: cycle,
        reference,
        activatedAt: nowIso,
        expiresAt,
      };

      // 1. Persistir globalmente en el servidor (/api/banner-ads) para que todos los usuarios lo vean
      try {
        await fetch('/api/banner-ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'activate_subscription',
            businessEmail,
            planId: plan.id,
            billingCycle: cycle,
            reference,
            brand: brandVal,
            title: titleVal,
            description: descVal,
            coupon: couponRaw || 'ELGANADOR',
            ctaLink: ctaLinkVal,
            image: imageVal,
          }),
        });
      } catch {}

      // 2. Respaldo local instantáneo
      const existingRaw = localStorage.getItem('elganador_banner_ads_v1');
      const existing: Array<{ id: string; reference?: string }> = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = Array.isArray(existing) ? existing.filter((item) => item.id !== publishedAd.id && item.reference !== reference) : [];
      const updated = [publishedAd, ...filtered];
      localStorage.setItem('elganador_banner_ads_v1', JSON.stringify(updated));

      const activePlanRecord = {
        planId: plan.id,
        planName: plan.name,
        cycle,
        reference,
        status: 'activo',
        activatedAt: nowIso,
        expiresAt,
      };
      localStorage.setItem('elganador_active_plan', JSON.stringify(activePlanRecord));
      localStorage.removeItem('elganador_pending_banner_ad');
      window.dispatchEvent(new Event('elganador_banner_ads_updated'));

      setActiveSubInfo({ planName: plan.name, cycle, expiresAt, reference });
      setAutonomousPublishedNotice(`¡Suscripción ${cycle} activada! Tu anuncio "${titleVal}" ya se montó automáticamente en el banner principal.`);
    } catch (err) {
      console.error('Error publicando banner autónomo:', err);
    }
  };

  // Apagado inmediato del anuncio cuando se cancela/desactiva la suscripción
  const handleTurnOffSubscription = async () => {
    try {
      await fetch('/api/banner-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_subscription', businessEmail }),
      });
    } catch {}
    try {
      localStorage.removeItem('elganador_active_plan');
      localStorage.setItem('elganador_banner_ads_v1', JSON.stringify([]));
      window.dispatchEvent(new Event('elganador_banner_ads_updated'));
    } catch {}
    setActiveSubInfo(null);
    setAutonomousPublishedNotice(null);
    alert('🔴 Suscripción apagada. Tu publicidad se retiró automáticamente del banner principal.');
  };

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
        if (a.brand) setAdBrand(a.brand);
        if (a.headline) setAdHeadline(a.headline);
        if (a.description) setAdDescription(a.description);
        if (a.coupon) setAdCoupon(a.coupon);
        if (a.image) setAdImage(a.image);
        if (typeof a.active === 'boolean') setAdActive(a.active);
      }

      // Cargar suscripción activa existente
      const activePlanRaw = localStorage.getItem('elganador_active_plan');
      if (activePlanRaw) {
        const ap = JSON.parse(activePlanRaw);
        if (ap?.status === 'activo' && ap?.expiresAt && new Date(ap.expiresAt).getTime() > Date.now()) {
          setActiveSubInfo({ planName: ap.planName, cycle: ap.cycle || 'mensual', expiresAt: ap.expiresAt, reference: ap.reference });
        }
      }

      // Activación autónoma al regresar desde Wompi tras pago aprobado (?status=plan_activado&ref=...)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const statusParam = params.get('status');
        const refParam = params.get('ref');
        const planParam = params.get('plan');
        if (statusParam === 'plan_activado' && refParam) {
          const pendingRaw = localStorage.getItem('elganador_pending_banner_ad');
          const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
          const matchedPlan =
            PUBLICITY_PLANS.find((p) => p.id === (planParam || pending?.planId)) || PUBLICITY_PLANS[1];
          const cycle: 'mensual' | 'trimestral' | 'anual' = pending?.cycle || 'mensual';
          publishAutonomousBannerAd(matchedPlan, cycle, refParam, pending?.draft);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert('⚠️ La imagen debe pesar menos de 2.5 MB para cargar rápido en el banner.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAdImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBannerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adData = {
        brand: adBrand,
        headline: adHeadline,
        description: adDescription,
        coupon: adCoupon,
        ctaLink: adCtaLink,
        image: adImage,
        active: adActive,
      };
      localStorage.setItem('elganador_business_ad', JSON.stringify(adData));

      // Sincroniza borrador / actualización en el servidor (/api/banner-ads)
      try {
        await fetch('/api/banner-ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_draft',
            businessEmail,
            brand: adBrand,
            title: adHeadline,
            description: adDescription,
            coupon: adCoupon,
            ctaLink: adCtaLink,
            image: adImage,
            active: adActive,
          }),
        });
      } catch {}

      // Si ya tiene suscripción mensual pagada y activa, actualiza su banner en vivo de inmediato
      if (activeSubInfo) {
        const matchedPlan = PUBLICITY_PLANS.find((p) => p.name === activeSubInfo.planName) || PUBLICITY_PLANS[1];
        await publishAutonomousBannerAd(
          matchedPlan,
          (activeSubInfo.cycle as 'mensual' | 'trimestral' | 'anual') || 'mensual',
          activeSubInfo.reference,
          adData
        );
        setBannerSaved(true);
        setTimeout(() => setBannerSaved(false), 3000);
        alert('✅ ¡Banner actualizado en vivo! Tu pauta activa ya refleja los cambios en el carrusel principal.');
      } else {
        setBannerSaved(true);
        setTimeout(() => setBannerSaved(false), 3000);
        alert('💾 Borrador guardado (Estado: APAGADO). Realiza el pago de tu suscripción mensual arriba para habilitarlo automáticamente en el banner principal.');
      }
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

  const handlePayPlanWithWompi = async (plan: PlanInfo) => {
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
    const redirectUrl = isLocal ? undefined : `${origin}/empresario/publicidad?status=plan_activado&ref=${reference}&plan=${plan.id}`;

    // Guardar borrador del banner + registro local de suscripción iniciada para publicación autónoma tras pago
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
      localStorage.setItem(
        'elganador_pending_banner_ad',
        JSON.stringify({
          planId: plan.id,
          cycle: billingCycle,
          reference,
          draft: {
            brand: adBrand,
            headline: adHeadline,
            description: adDescription,
            coupon: adCoupon,
            ctaLink: adCtaLink,
            image: adImage,
            active: adActive,
          },
        })
      );
    } catch {}

    // Firma de integridad SHA-256 (si WOMPI_INTEGRITY_SECRET está configurado)
    let integritySignature: string | null = null;
    try {
      const sigRes = await fetch('/api/payments/wompi-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amountInCents, currency: 'COP' }),
      });
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        if (sigData?.signature) integritySignature = String(sigData.signature);
      }
    } catch {}

    const isMobileDevice =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    // En móvil: Web Checkout oficial directo (evita bloqueo táctil del iframe en iOS/Android)
    if (isMobileDevice || typeof window === 'undefined' || !(window as unknown as { WidgetCheckout?: unknown }).WidgetCheckout) {
      const params = new URLSearchParams({
        'public-key': publicKey,
        currency: 'COP',
        'amount-in-cents': String(amountInCents),
        reference,
        'customer-data:email': businessEmail,
        'customer-data:full-name': adBrand || 'Empresa Aliada',
        'customer-data:phone-number': '3001234567',
        'customer-data:phone-number-prefix': '+57',
      });
      if (redirectUrl) params.set('redirect-url', redirectUrl);
      if (integritySignature) params.set('signature:integrity', integritySignature);
      window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;
      return;
    }

    // En escritorio: Widget oficial en camelCase limpio
    const WidgetCheckout = (window as unknown as { WidgetCheckout: new (opts: Record<string, unknown>) => { open: (cb: (res: { transaction?: { status: string } }) => void) => void } }).WidgetCheckout;
    const config: Record<string, unknown> = {
      currency: 'COP',
      amountInCents,
      reference,
      publicKey,
      customerData: {
        email: businessEmail,
        fullName: adBrand || 'Empresa Aliada',
        phoneNumber: '3001234567',
        phoneNumberPrefix: '+57',
        legalId: '900123456',
        legalIdType: 'NIT',
      },
    };
    if (redirectUrl) config.redirectUrl = redirectUrl;
    if (integritySignature) config.signature = { integrity: integritySignature };

    const checkout = new WidgetCheckout(config);
    setTimeout(() => setIsProcessing(false), 2500);

    checkout.open((result) => {
      setIsProcessing(false);
      const transaction = result?.transaction;
      if (transaction?.status === 'APPROVED') {
        publishAutonomousBannerAd(plan, billingCycle, reference);
        alert(`🎉 ¡Pago aprobado con éxito! Tu ${plan.name} está activo y tu publicidad ya fue montada automáticamente en el banner principal.`);
      } else if (transaction?.status === 'DECLINED' || transaction?.status === 'ERROR') {
        alert('⚠️ La transacción de pauta publicitaria no fue aprobada.');
      }
    });
  };

  return (
    <div className="desktop-workspace-grid" style={{ minHeight: '100vh', background: isDark ? '#000000' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a' }}>
      <BusinessSidebar activeKey="publicidad" />

      <main className="app-scroll-canvas" style={{ padding: '16px 14px 100px', maxWidth: '1150px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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

            {/* PANEL DE ESTADO EN VIVO DEL BANNER (ENCENDIDO / APAGADO SEGÚN SUSCRIPCIÓN) */}
            <div
              style={{
                marginBottom: '14px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: activeSubInfo
                  ? isDark ? 'rgba(16, 185, 129, 0.14)' : '#ecfdf5'
                  : isDark ? 'rgba(239, 68, 68, 0.14)' : '#fef2f2',
                border: activeSubInfo ? '1px solid #10b981' : '1px solid rgba(239, 68, 68, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 900, color: activeSubInfo ? (isDark ? '#6ee7b7' : '#007AFF') : (isDark ? '#fca5a5' : '#991b1b') }}>
                  {activeSubInfo
                    ? `🟢 BANNER ENCENDIDO EN VIVO · ${activeSubInfo.planName} (${activeSubInfo.cycle})`
                    : '🔴 BANNER APAGADO · Sin suscripción mensual activa'}
                </div>
                <small style={{ fontSize: '0.76rem', color: isDark ? '#cbd5e1' : '#475569' }}>
                  {activeSubInfo
                    ? `Vigente hasta ${new Date(activeSubInfo.expiresAt).toLocaleDateString('es-CO')} · Se apaga automáticamente si no se renueva.`
                    : 'Sube tu diseño y guarda el borrador. En cuanto realices el pago de tu suscripción mensual, se habilita automáticamente en el banner principal.'}
                </small>
              </div>
              {activeSubInfo && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link href="/" style={{ padding: '7px 12px', borderRadius: '8px', background: '#10b981', color: '#ffffff', textDecoration: 'none', fontWeight: 800, fontSize: '0.78rem' }}>
                    Ver en Vivo →
                  </Link>
                  <button
                    type="button"
                    onClick={handleTurnOffSubscription}
                    style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: isDark ? '#fca5a5' : '#b91c1c', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    ⏹️ Apagar / Cancelar
                  </button>
                </div>
              )}
            </div>

            {autonomousPublishedNotice && (
              <div style={{ marginBottom: '14px', padding: '12px 16px', borderRadius: '12px', background: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5', border: '1px solid #10b981', color: isDark ? '#6ee7b7' : '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.86rem', fontWeight: 700 }}>
                <span>🎉 {autonomousPublishedNotice}</span>
                <Link href="/" style={{ padding: '6px 14px', borderRadius: '8px', background: '#10b981', color: '#ffffff', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem' }}>
                  Ver en el Banner Principal →
                </Link>
              </div>
            )}

            <form onSubmit={handleSaveBannerConfig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '6px' }}>
                  Nombre de tu Marca o Empresa:
                </label>
                <input
                  type="text"
                  value={adBrand}
                  onChange={(e) => setAdBrand(e.target.value)}
                  placeholder="Ej: Motos Caribe Oficial"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#ffffff', fontSize: '0.9rem', color: isDark ? '#ffffff' : '#0f172a' }}
                  required
                />
              </div>

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
                  Descripción breve del anuncio:
                </label>
                <input
                  type="text"
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  placeholder="Ej: Envíos a toda Colombia y garantía oficial"
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '6px' }}>
                  Enlace de Destino o WhatsApp de Ventas:
                </label>
                <input
                  type="url"
                  value={adCtaLink}
                  onChange={(e) => setAdCtaLink(e.target.value)}
                  placeholder="https://wa.me/573001234567"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#ffffff', fontSize: '0.9rem', color: isDark ? '#ffffff' : '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '6px' }}>
                  Foto del Banner Publicitario (JPG/PNG · máx 2.5 MB):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageUpload}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#ffffff', fontSize: '0.82rem', color: isDark ? '#ffffff' : '#0f172a' }}
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
                  {activeSubInfo ? '🚀 Actualizar en Vivo' : '💾 Guardar Borrador'}
                </button>
              </div>
            </form>

            {/* VISTA PREVIA DEL BANNER EN VIVO */}
            <div style={{ marginTop: '16px', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1', paddingTop: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                👁️ Vista Previa en Carrusel de Vitrina {activeSubInfo ? `· Suscripción ${activeSubInfo.cycle} activa` : '· Se publica automáticamente al pagar tu plan mensual'}:
              </span>
              <div style={{ background: isDark ? '#0f172a' : '#ffffff', borderRadius: '12px', overflow: 'hidden', border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0' }}>
                <img src={adImage || '/banner-el-ganador-oficial.jpg'} alt="Vista previa del banner" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#f59e0b', background: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '4px' }}>
                      ⚡ {adBrand || 'Patrocinador Oficial'}
                    </span>
                    <p style={{ margin: '2px 0', fontSize: '0.95rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {adHeadline || 'Tu Anuncio Aquí'}
                    </p>
                    <p style={{ margin: '2px 0 4px', fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {adDescription}
                    </p>
                    <span style={{ fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#64748b' }}>
                      Cupón Exclusivo: <strong style={{ color: '#007AFF' }}>{adCoupon || 'ELGANADOR'}</strong>
                    </span>
                  </div>
                  <span style={{ padding: '6px 14px', background: '#007AFF', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    Ver Vitrina & Promoción →
                  </span>
                </div>
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

      <BusinessBottomNav activeKey="publicidad" />
    </div>
  );
}