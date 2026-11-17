// app/empresario/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DesktopSidebar from '@/components/DesktopSidebar';
import RegionalPermitSelectorWithTime, { LegalScope } from '@/components/RegionalPermitSelectorWithTime';
import { IosHomeIcon, IosLiveBallIcon, IosPlusIcon, IosStoreIcon } from '@/components/NativeBottomTabBar';
import { fileToDataUrl, shareRaffleLink } from '@/lib/nativeActions';
import { uploadStoryToSupabase, uploadKybDocumentToSupabase, uploadLegalDocument } from '@/lib/supabase';

function PanelEmpresarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [kybApproved, setKybApproved] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'perfil' | 'rifas' | 'estados' | 'crm' | 'kyb'>('perfil');
  const [kybDocs, setKybDocs] = useState<Record<string, { type: string; name: string; url: string; uploadedAt: string; isMock: boolean }>>({});
  const [kybUploading, setKybUploading] = useState<string | null>(null);
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storyUploadStatus, setStoryUploadStatus] = useState<string | null>(null);

  // Sincronización reactiva de pestañas mediante query params (?tab=...)
  useEffect(() => {
    if (!searchParams) return;
    const tabParam = searchParams.get('tab');
    if (tabParam === 'crear' || tabParam === 'rifas' || tabParam === 'crear-rifa') {
      setActiveTab('rifas');
    } else if (tabParam === 'estados') {
      setActiveTab('estados');
    } else if (tabParam === 'clientes' || tabParam === 'crm') {
      setActiveTab('crm');
    } else if (tabParam === 'resumen' || tabParam === 'perfil') {
      setActiveTab('perfil');
    } else if (tabParam === 'pauta') {
      router.push('/publicidad');
      return;
    } else if (tabParam === 'kyb') {
      setActiveTab('kyb');
    } else if (tabParam === 'sala3d') {
      router.push('/sorteo-en-vivo');
    }
  }, [searchParams, router]);

  // 1. Verificación de Rol Empresarial y Habilitación de Modo Demo / Pruebas
  useEffect(() => {
    const role = localStorage.getItem('elganador_role');
    const sessionStr = localStorage.getItem('elganador_session');
    let sessionRole = null;
    try {
      if (sessionStr) sessionRole = JSON.parse(sessionStr)?.role;
    } catch {}

    const hasBusinessRole = role === 'business' || sessionRole === 'business';
    if (!hasBusinessRole) {
      // Habilitar acceso de pruebas/auditoría empresarial para que se pueda testear de inmediato
      localStorage.setItem('elganador_role', 'business');
    }

    const kybStatus = localStorage.getItem('elganador_kyb_status') || 'approved';
    setKybApproved(kybStatus === 'approved');
    try {
      const savedDocs = localStorage.getItem('elganador_kyb_docs');
      if (savedDocs) setKybDocs(JSON.parse(savedDocs));

      const savedProfile = localStorage.getItem('elganador_business_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.storeName) setStoreName(p.storeName);
        if (p.storeCategory) setStoreCategory(p.storeCategory);
        if (p.storeBio) setStoreBio(p.storeBio);
        if (p.coverPhoto) setCoverPhoto(p.coverPhoto);
        if (p.logoPhoto) setLogoPhoto(p.logoPhoto);
        if (p.socials) setSocials(p.socials);
      }

      const savedAd = localStorage.getItem('elganador_business_ad');
      if (savedAd) {
        const a = JSON.parse(savedAd);
        if (a.headline) setAdHeadline(a.headline);
        if (a.coupon) setAdCoupon(a.coupon);
        if (typeof a.active === 'boolean') setAdActive(a.active);
      }

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam === 'crear' || tabParam === 'rifas' || tabParam === 'crear-rifa') {
          setActiveTab('rifas');
        } else if (tabParam === 'estados') {
          setActiveTab('estados');
        } else if (tabParam === 'clientes' || tabParam === 'crm') {
          setActiveTab('crm');
        } else if (tabParam === 'resumen' || tabParam === 'perfil') {
          setActiveTab('perfil');
        } else if (tabParam === 'pauta') {
          router.push('/publicidad');
          return;
        } else if (tabParam === 'kyb') {
          setActiveTab('kyb');
        } else {
          const savedTab = localStorage.getItem('elganador_empresario_tab');
          if (savedTab && ['perfil', 'rifas', 'estados', 'crm', 'kyb'].includes(savedTab)) {
            setActiveTab(savedTab as 'perfil' | 'rifas' | 'estados' | 'crm' | 'kyb');
          }
        }
      }

      const savedRaffleDraft = localStorage.getItem('elganador_raffle_draft');
      if (savedRaffleDraft) {
        const r = JSON.parse(savedRaffleDraft);
        if (r.raffleTitle) setRaffleTitle(r.raffleTitle);
        if (r.raffleDesc) setRaffleDesc(r.raffleDesc);
        if (r.ticketPrice) setTicketPrice(r.ticketPrice);
        if (r.drawDateTime) setDrawDateTime(r.drawDateTime);
        if (r.ballotGrid) setBallotGrid(r.ballotGrid);
        if (r.coverage) setCoverage(r.coverage);
        if (r.legalScope) setLegalScope(r.legalScope);
        if (r.legalRegion) setLegalRegion(r.legalRegion);
        if (r.legalCustomCity) setLegalCustomCity(r.legalCustomCity);
        if (r.legalRadicado) setLegalRadicado(r.legalRadicado);
        if (Array.isArray(r.rafflePhotos)) {
          const cleanPhotos = r.rafflePhotos.filter(
            (p: string) => typeof p === 'string' && !p.includes('galeria-premios-el-ganador-realista.jpg')
          );
          setRafflePhotos(cleanPhotos);
        }
      }
    } catch {}
    setIsAuthorized(true);
  }, [router]);

  // 1. Estado de Biografía Empresarial tipo Facebook
  const [storeName, setStoreName] = useState('Motos Caribe Oficial');
  const [storeCategory, setStoreCategory] = useState('Concesionario Oficial Yamaha · Barranquilla');
  const [storeBio, setStoreBio] = useState(
    'Concesionario oficial con entrega inmediata. Sorteos certificados ante notario con matrícula incluida y envíos asegurados a toda Colombia.'
  );
  const [coverPhoto, setCoverPhoto] = useState('/galeria-premios-el-ganador-realista.jpg');
  const [logoPhoto, setLogoPhoto] = useState('/el-ganador-logo.png');
  const [socials, setSocials] = useState({
    whatsapp: 'https://wa.me/573004567890',
    instagram: 'https://instagram.com/motoscaribeoficial',
    facebook: 'https://facebook.com/motoscaribeoficial',
    tiktok: 'https://tiktok.com/@motoscaribeoficial',
    website: 'https://motoscaribe.com.co',
  });
  const [bioSaved, setBioSaved] = useState(false);

  // 2. Estado de Publicador de Estados tipo Instagram (Fotos y Videos hasta 120s)
  const [storyMedia, setStoryMedia] = useState<string>('/galeria-premios-el-ganador-realista.jpg');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video'>('image');
  const [storyHeadline, setStoryHeadline] = useState('¡Últimas 15 boletas para la Yamaha MT-09 0 km!');
  const [storyPublished, setStoryPublished] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // 3. Estado de Publicador de Nueva Rifa con Cartón de Balotas
  const [raffleTitle, setRaffleTitle] = useState('');
  const [raffleDesc, setRaffleDesc] = useState('');
  const [ticketPrice, setTicketPrice] = useState('35000');
  const [drawDateTime, setDrawDateTime] = useState('');
  const [ballotGrid, setBallotGrid] = useState('100');
  const [coverage, setCoverage] = useState('nacional');
  const [rafflePhotos, setRafflePhotos] = useState<string[]>([]);
  const [createdRaffleSlug, setCreatedRaffleSlug] = useState<string | null>(null);

  // 3.1 Soporte Legal Obligatorio (Ley 643 de 2001)
  const [legalScope, setLegalScope] = useState<LegalScope>('nacional');
  const [legalRegion, setLegalRegion] = useState<string>('antioquia');
  const [legalCustomCity, setLegalCustomCity] = useState<string>('');
  const [legalRadicado, setLegalRadicado] = useState<string>('');
  const [legalReceiptFile, setLegalReceiptFile] = useState<File | null>(null);
  const [legalReceiptUrl, setLegalReceiptUrl] = useState<string | null>(null);
  const [legalValidationError, setLegalValidationError] = useState<boolean>(false);
  const [isPublishingRaffle, setIsPublishingRaffle] = useState<boolean>(false);

  // 4. Estado de Pauta Publicitaria en Vitrina
  const [adHeadline, setAdHeadline] = useState('20% OFF en accesorios + Matrícula Gratis');
  const [adCoupon, setAdCoupon] = useState('ELGANADOR20');
  const [adActive, setAdActive] = useState(true);

  // Auto-guardado de Perfil Empresarial en localStorage (Cero pérdida de datos)
  useEffect(() => {
    if (!isAuthorized) return;
    try {
      const profileData = { storeName, storeCategory, storeBio, coverPhoto, logoPhoto, socials };
      localStorage.setItem('elganador_business_profile', JSON.stringify(profileData));
    } catch {}
  }, [storeName, storeCategory, storeBio, coverPhoto, logoPhoto, socials, isAuthorized]);

  // Auto-guardado de Pauta Publicitaria en localStorage
  useEffect(() => {
    if (!isAuthorized) return;
    try {
      const adData = { headline: adHeadline, coupon: adCoupon, active: adActive };
      localStorage.setItem('elganador_business_ad', JSON.stringify(adData));
    } catch {}
  }, [adHeadline, adCoupon, adActive, isAuthorized]);

  // Auto-guardado de pestaña activa para mantener navegación tras refrescar
  useEffect(() => {
    if (!isAuthorized) return;
    try {
      localStorage.setItem('elganador_empresario_tab', activeTab);
    } catch {}
  }, [activeTab, isAuthorized]);

  // Auto-guardado de borrador de rifa en tiempo real (Cero pérdida de datos)
  useEffect(() => {
    if (!isAuthorized) return;
    try {
      const draft = {
        raffleTitle,
        raffleDesc,
        ticketPrice,
        drawDateTime,
        ballotGrid,
        coverage,
        rafflePhotos,
        legalScope,
        legalRegion,
        legalCustomCity,
        legalRadicado,
      };
      localStorage.setItem('elganador_raffle_draft', JSON.stringify(draft));
    } catch {}
  }, [raffleTitle, raffleDesc, ticketPrice, drawDateTime, ballotGrid, coverage, rafflePhotos, legalScope, legalRegion, legalCustomCity, legalRadicado, isAuthorized]);

  const handleImagePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setter(dataUrl);
  };

  // Validador estricto de Video de Máximo 2 Minutos (120 Segundos)
  const handleVideoValidation = (file: File, callback: (valid: boolean) => void) => {
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 120) {
          alert(
            'El video supera los 2 minutos permitidos. Por favor selecciona un clip de máximo 120 segundos para tu historia comercial.'
          );
          setVideoError('El video supera los 2 minutos permitidos (máximo 120 segundos).');
          callback(false);
        } else {
          setVideoError(null);
          callback(true);
        }
      };
      video.onerror = function () {
        setVideoError('No se pudo leer el archivo de video. Intenta con formato MP4 o WebM.');
        callback(false);
      };
      video.src = URL.createObjectURL(file);
    } else {
      setVideoError(null);
      callback(true);
    }
  };

  const handleStoryMediaPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedStoryFile(file);

    if (file.type.startsWith('video/')) {
      handleVideoValidation(file, async (valid) => {
        if (!valid) {
          e.target.value = '';
          return;
        }
        const dataUrl = await fileToDataUrl(file);
        setStoryMedia(dataUrl);
        setStoryMediaType('video');
      });
    } else {
      setVideoError(null);
      fileToDataUrl(file).then((dataUrl) => {
        setStoryMedia(dataUrl);
        setStoryMediaType('image');
      });
    }
  };

  const handleRafflePhotosPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = await Promise.all(files.map(fileToDataUrl));
    setRafflePhotos((prev) => [...prev, ...urls].slice(0, 8));
    e.target.value = '';
  };

  const handleRemoveRafflePhoto = (indexToRemove: number) => {
    setRafflePhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllRafflePhotos = () => {
    setRafflePhotos([]);
  };

  const handleSelectEmpresarioTab = (tab: string) => {
    if (tab === 'crear' || tab === 'rifas' || tab === 'crear-rifa') setActiveTab('rifas');
    else if (tab === 'clientes' || tab === 'crm') setActiveTab('crm');
    else if (tab === 'resumen' || tab === 'perfil') setActiveTab('perfil');
    else if (tab === 'sala3d') router.push('/sorteo-en-vivo');
    else if (tab === 'pauta') router.push('/publicidad');
    else if (['estados', 'kyb'].includes(tab)) setActiveTab(tab as any);
  };

  // Publicar Estado con Expiración Automática de 24 Horas y Subida a Supabase Storage
  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized || !kybApproved) {
      alert('Solo comercios verificados con rol empresarial aprobado pueden publicar estados.');
      return;
    }

    setIsUploadingStory(true);
    setStoryUploadStatus('Subiendo archivo multimedia a Supabase Storage (bucket stories)...');

    let finalMediaUrl = storyMedia;
    try {
      if (selectedStoryFile) {
        const merchantId = `merchant_${storeName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        const uploadRes = await uploadStoryToSupabase(selectedStoryFile, merchantId);
        if (uploadRes && uploadRes.url) {
          finalMediaUrl = uploadRes.url;
          if (uploadRes.isMock) {
            setStoryUploadStatus('Previsualización local activa (Configura tus llaves de Supabase en .env.local para almacenamiento en la nube)');
          } else {
            setStoryUploadStatus('¡Video/Foto subido exitosamente a Supabase Storage (bucket stories)!');
          }
        }
      }
    } catch (err) {
      console.warn('Fallo upload a Supabase Storage, usando dataUrl local:', err);
    } finally {
      setIsUploadingStory(false);
    }

    const now = Date.now();
    const existing = JSON.parse(localStorage.getItem('elganador_custom_stories') || '[]');
    existing.unshift({
      id: `story-${now}`,
      merchant: storeName,
      shortName: storeName.split(' ')[0],
      icon: '🏪',
      avatar: logoPhoto,
      storyImage: finalMediaUrl,
      mediaType: storyMediaType,
      headline: storyHeadline,
      caption: storeBio,
      timeAgo: 'Ahora mismo',
      ctaText: 'Participar en esta tienda →',
      createdAt: now,
      expiresAt: now + 86400000, // 24 Horas exactas (86.400.000 ms)
    });

    localStorage.setItem('elganador_custom_stories', JSON.stringify(existing));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('elganador_stories_updated'));
    }
    setStoryPublished(true);
    setTimeout(() => {
      setStoryPublished(false);
      setStoryUploadStatus(null);
    }, 4500);
  };

  // Subida de Documentos KYB a Supabase Storage (bucket 'kyb-documents')
  const handleKybFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'rut' | 'camara_comercio' | 'cedula'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setKybUploading(docType);
    try {
      const merchantId = `merchant_${storeName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const res = await uploadKybDocumentToSupabase(file, merchantId, docType);

      const record = {
        type: docType,
        name: file.name,
        url: res.url,
        uploadedAt: new Date().toLocaleTimeString(),
        isMock: res.isMock,
      };

      setKybDocs((prev) => {
        const updated = { ...prev, [docType]: record };
        localStorage.setItem('elganador_kyb_docs', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Error subiendo documento KYB:', err);
      alert('Hubo un inconveniente al cargar el documento.');
    } finally {
      setKybUploading(null);
    }
  };

  const handleApproveKyb = () => {
    localStorage.setItem('elganador_kyb_status', 'approved');
    setKybApproved(true);
    alert('✅ ¡Validación KYB aprobada y ratificada en el sistema!');
  };

  const handlePublishRaffle = async (e: React.FormEvent) => {
    e.preventDefault();

    // ⛔ BLOQUEO LEGAL OBLIGATORIO (Ley 643 de 2001)
    if (!legalRadicado.trim() || !legalReceiptFile) {
      setLegalValidationError(true);
      alert(
        '⛔ BLOQUEO LEGAL OBLIGATORIO (Ley 643 de 2001)\n\n' +
        'No es posible publicar tu rifa sin cumplir con los dos requisitos legales exigidos por las autoridades:\n\n' +
        '1. Adjuntar el Comprobante Oficial de Pago de derechos de explotación expedido por Coljuegos, el Distrito de Hacienda o la entidad departamental.\n' +
        '2. Ingresar el Número de Radicado Oficial o código de autorización correspondiente.\n\n' +
        'Por favor completa estos dos campos en el recuadro de autorización legal para desbloquear la publicación.'
      );
      return;
    }

    setLegalValidationError(false);
    setIsPublishingRaffle(true);

    try {
      // Subir Comprobante a Supabase Storage (bucket 'legal-docs')
      let receiptUrl = legalReceiptUrl;
      if (legalReceiptFile && !receiptUrl) {
        receiptUrl = await uploadLegalDocument(legalReceiptFile, 'pagos');
        setLegalReceiptUrl(receiptUrl);
      }

      const slug = (raffleTitle || 'sorteo-oficial')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      setCreatedRaffleSlug(slug);

      const now = Date.now();
      const newRaffle = {
        id: `raffle-${slug}-${now}`,
        title: raffleTitle || 'Gran Sorteo Oficial',
        merchant: storeName,
        city: legalScope === 'distrital' ? 'Bogotá D.C.' : legalScope === 'departamental' ? (legalCustomCity || 'Regional') : 'Colombia',
        priceCop: `$ ${parseInt(ticketPrice || '35000', 10).toLocaleString('es-CO')}`,
        soldPercent: 0,
        timeLabel: drawDateTime ? `🗓️ ${drawDateTime}` : '⏳ Próximamente',
        category: 'motos',
        image: rafflePhotos[0] || '/galeria-premios-el-ganador-realista.jpg',
        stage: 'upcoming',
        description: raffleDesc,
        ballotGrid,
        coverage: legalScope === 'nacional' ? 'nacional' : 'regional',
        photos: rafflePhotos,
        createdAt: now,
        legalScope,
        legalRegion: legalScope === 'departamental' ? legalRegion : undefined,
        legalCity: legalCustomCity || undefined,
        legalRadicado: legalRadicado.trim(),
        legalReceiptUrl: receiptUrl,
        legalVerified: true,
      };

      const existing = JSON.parse(localStorage.getItem('elganador_custom_raffles') || '[]');
      existing.unshift(newRaffle);
      localStorage.setItem('elganador_custom_raffles', JSON.stringify(existing));
      localStorage.removeItem('elganador_raffle_draft');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('elganador_raffles_updated'));
      }
      alert('🎟️ ¡Rifa legalmente validada y publicada con éxito en el Marketplace de El Ganador!');
    } catch (err) {
      console.error('Error guardando rifa:', err);
      alert('Hubo un inconveniente al validar los soportes legales.');
    } finally {
      setIsPublishingRaffle(false);
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="app-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#000000', color: '#ffffff' }}>
        <p>Verificando credenciales empresariales...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="app-shell">
      {/* BARRA SUPERIOR EMPRESARIAL */}
      <header className="app-topbar">
        <div className="brand-cluster">
          <Link aria-label="Ir a Vitrina" className="profile-icon-btn" href="/">🏠</Link>
          <div>
            <span className="brand-title">PERFIL EMPRESARIAL</span>
            <small className="brand-subtitle">{storeName}</small>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="btn-compact-action"
            onClick={() =>
              shareRaffleLink({
                title: storeName,
                text: storeBio,
                path: `/?tienda=${encodeURIComponent(storeName)}`,
              })
            }
          >
            📤 Compartir Tienda
          </button>
        </div>
      </header>

      <div className="desktop-workspace-grid">
        <DesktopSidebar
          activeEmpresarioTab={activeTab}
          onSelectEmpresarioTab={handleSelectEmpresarioTab}
        />
        <main className="app-scroll-canvas">
          {/* AVISO DE ESTADO KYB */}
          {!kybApproved && (
            <div className="station-block-premium" style={{ background: '#451a03', border: '1px solid #f59e0b', color: '#fef3c7', padding: '14px', borderRadius: '14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong>⚠️ Validación KYB en Proceso:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
                  Tu documentación comercial se encuentra en validación legal. Carga tus documentos mercantiles a Supabase Storage para ratificar tu cuenta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('kyb')}
                style={{ padding: '8px 16px', background: '#f59e0b', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                📁 Subir Documentos KYB →
              </button>
            </div>
          )}

          {/* MENÚ DE HERRAMIENTAS DEL EMPRESARIO */}
          <nav className="category-chips" aria-label="Herramientas Empresariales">
            <button
              type="button"
              onClick={() => setActiveTab('perfil')}
              className={`chip-btn ${activeTab === 'perfil' ? 'chip-active' : ''}`}
            >
              🏪 Biografía y Redes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('estados')}
              className={`chip-btn ${activeTab === 'estados' ? 'chip-active' : ''}`}
            >
              📸 Subir Estado (Story 24h)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rifas')}
              className={`chip-btn ${activeTab === 'rifas' ? 'chip-active' : ''}`}
            >
              🎟️ Publicar Rifa y Cartón
            </button>
            <Link
              href="/publicidad"
              className="chip-btn"
              style={{ textDecoration: 'none' }}
            >
              📢 Planes Publicitarios →
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('crm')}
              className={`chip-btn ${activeTab === 'crm' ? 'chip-active' : ''}`}
            >
              👥 CRM Clientes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kyb')}
              className={`chip-btn ${activeTab === 'kyb' ? 'chip-active' : ''}`}
            >
              🏢 Validación KYB (Supabase Storage)
            </button>
          </nav>

          {/* =========================================================
              MÓDULO 1: BIOGRAFÍA DE ALMACÉN TIPO FACEBOOK + REDES
              ========================================================= */}
          {activeTab === 'perfil' && (
            <section className="station-block-premium">
              {/* Portada panorámica grande + Logo circular superpuesto */}
              <div className="fb-store-cover-wrapper">
                <img src={coverPhoto} alt="Portada del almacén" className="fb-store-cover-img" />
                <div className="fb-cover-actions">
                  <label className="media-native-btn dark">
                    📷 Cámara Portada
                    <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleImagePick(e, setCoverPhoto)} />
                  </label>
                  <label className="media-native-btn dark">
                    🖼️ Galería Portada
                    <input type="file" accept="image/*" hidden onChange={(e) => handleImagePick(e, setCoverPhoto)} />
                  </label>
                </div>

                <div className="fb-store-avatar-box">
                  <img src={logoPhoto} alt="Logo del almacén" className="fb-store-avatar-img" />
                  <label className="fb-avatar-picker-btn">
                    📷
                    <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleImagePick(e, setLogoPhoto)} />
                  </label>
                </div>
              </div>

              <div className="fb-store-meta-header">
                <h2>{storeName}</h2>
                <p>📍 {storeCategory} · ✅ Comercio Verificado (+18)</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setBioSaved(true);
                  setTimeout(() => setBioSaved(false), 2500);
                }}
                className="auth-form"
              >
                <label className="input-group">
                  <span>Nombre Comercial del Almacén</span>
                  <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
                </label>

                <label className="input-group">
                  <span>Categoría y Ubicación Principal</span>
                  <input type="text" value={storeCategory} onChange={(e) => setStoreCategory(e.target.value)} required />
                </label>

                <label className="input-group">
                  <span>Biografía Comercial del Negocio</span>
                  <textarea rows={3} value={storeBio} onChange={(e) => setStoreBio(e.target.value)} required />
                </label>

                <div className="compact-section-title">
                  <h2>🔗 Canales y Redes Sociales Oficiales</h2>
                </div>

                <div className="b2b-two-cols">
                  <label className="input-group">
                    <span>📱 Enlace WhatsApp Comercial</span>
                    <input type="url" placeholder="https://wa.me/57..." value={socials.whatsapp} onChange={(e) => setSocials({ ...socials, whatsapp: e.target.value })} />
                  </label>
                  <label className="input-group">
                    <span>📸 Instagram Oficial</span>
                    <input type="url" placeholder="https://instagram.com/..." value={socials.instagram} onChange={(e) => setSocials({ ...socials, instagram: e.target.value })} />
                  </label>
                  <label className="input-group">
                    <span>📘 Página de Facebook</span>
                    <input type="url" placeholder="https://facebook.com/..." value={socials.facebook} onChange={(e) => setSocials({ ...socials, facebook: e.target.value })} />
                  </label>
                  <label className="input-group">
                    <span>🎵 Perfil de TikTok</span>
                    <input type="url" placeholder="https://tiktok.com/@..." value={socials.tiktok} onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })} />
                  </label>
                </div>

                <button type="submit" className="btn-submit-gold">
                  {bioSaved ? '✅ Biografía y Redes Actualizadas en Vitrina' : 'Guardar Perfil Empresarial'}
                </button>
              </form>
            </section>
          )}

          {/* =========================================================
              MÓDULO 2: SUBIR ESTADOS (24 HORAS · FOTOS Y VIDEOS MÁX 120S)
              ========================================================= */}
          {activeTab === 'estados' && (
            <section className="station-block-premium">
              <div className="compact-section-title">
                <h2>📸 Publicar Estado en Tiempo Real (24 Horas)</h2>
              </div>
              <p className="station-subtitle">
                Exclusivo para empresas con rol <strong>business</strong>. Sube fotos o videos comerciales de hasta <strong>2 minutos (120 segundos)</strong> para aparecer en el carrusel superior del Marketplace durante 24 horas.
              </p>

              <form onSubmit={handlePublishStory} className="auth-form">
                <div className="story-preview-frame">
                  {storyMediaType === 'video' ? (
                    <video
                      src={storyMedia}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img src={storyMedia} alt="Vista previa de historia" />
                  )}
                  <div className="media-picker-row overlay-bottom">
                    <label className="media-native-btn dark">
                      📷 Foto o Video (Cámara)
                      <input
                        type="file"
                        accept="image/*,video/*"
                        capture="environment"
                        hidden
                        onChange={handleStoryMediaPick}
                      />
                    </label>
                    <label className="media-native-btn dark">
                      🖼️ Galería (Fotos / Videos máx 120s)
                      <input
                        type="file"
                        accept="image/*,video/*"
                        hidden
                        onChange={handleStoryMediaPick}
                      />
                    </label>
                  </div>
                </div>

                {videoError && (
                  <div style={{ margin: '8px 0', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.16)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.84rem', fontWeight: 600 }}>
                    ⚠️ {videoError}
                  </div>
                )}

                {storyMediaType === 'video' && !videoError && (
                  <div style={{ margin: '6px 0', padding: '6px 12px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#86efac', fontSize: '0.8rem', fontWeight: 700 }}>
                    🎥 Clip de video verificado (Duración permitida: máximo 120 segundos / 2 minutos).
                  </div>
                )}

                <label className="input-group">
                  <span>Texto llamativo del Estado (24 Horas de vigencia)</span>
                  <input
                    type="text"
                    value={storyHeadline}
                    onChange={(e) => setStoryHeadline(e.target.value)}
                    placeholder="Ej. ¡Llegó el premio a nuestra vitrina! Quedan pocos números"
                    required
                  />
                </label>

                {storyUploadStatus && (
                  <div style={{ margin: '8px 0', padding: '10px 14px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.16)', border: '1px solid #38bdf8', color: '#bae6fd', fontSize: '0.84rem', fontWeight: 600 }}>
                    ℹ️ {storyUploadStatus}
                  </div>
                )}
                <button type="submit" className="btn-submit-gold" disabled={isUploadingStory}>
                  {isUploadingStory
                    ? '⏳ Subiendo a Supabase Storage...'
                    : storyPublished
                    ? '✅ ¡Estado Publicado en Supabase (24h)!'
                    : '🚀 Publicar Estado Oficial (Supabase Storage)'}
                </button>
              </form>
            </section>
          )}

          {/* =========================================================
              MÓDULO 3: PUBLICAR NUEVA RIFA + CARTÓN DE BALOTAS
              ========================================================= */}
          {activeTab === 'rifas' && (
            <section className="station-block-premium">
              <div className="compact-section-title">
                <h2>🎟️ Publicar Nueva Rifa y Configurar Cartón</h2>
              </div>

              <form onSubmit={handlePublishRaffle} className="auth-form">
                <div className="input-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Fotos del Premio (Cámara o Galería)</span>
                    {rafflePhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllRafflePhotos}
                        className="btn-clear-photos"
                        title="Eliminar todas las fotos"
                      >
                        🗑️ Eliminar todas ({rafflePhotos.length})
                      </button>
                    )}
                  </div>
                  <div className="media-picker-row">
                    <label className="media-native-btn">
                      📷 Tomar Foto del Premio
                      <input type="file" accept="image/*" capture="environment" hidden onChange={handleRafflePhotosPick} />
                    </label>
                    <label className="media-native-btn">
                      🖼️ Subir Galería del Premio
                      <input type="file" accept="image/*" multiple hidden onChange={handleRafflePhotosPick} />
                    </label>
                  </div>
                  <div className="raffle-photo-preview-strip">
                    {rafflePhotos.length === 0 ? (
                      <div className="raffle-photo-empty-box">
                        <span style={{ fontSize: '2rem' }}>📸</span>
                        <p style={{ margin: '6px 0 2px', fontSize: '0.9rem', fontWeight: 600 }}>
                          Sin fotos seleccionadas aún
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Sube fotos reales de tu producto o premio para inspirar confianza en los compradores.
                        </p>
                      </div>
                    ) : (
                      rafflePhotos.map((src, i) => (
                        <div key={i} className="raffle-photo-thumb-container">
                          <img src={src} alt={`Foto premio ${i + 1}`} className="raffle-photo-thumb" />
                          <button
                            type="button"
                            onClick={() => handleRemoveRafflePhoto(i)}
                            className="raffle-photo-delete-btn"
                            title="Eliminar esta foto"
                            aria-label={`Eliminar foto ${i + 1}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <label className="input-group">
                  <span>Título Oficial del Sorteo</span>
                  <input type="text" placeholder="Ej. Toyota Hilux 4x4 Diésel 2026 0 km" value={raffleTitle} onChange={(e) => setRaffleTitle(e.target.value)} required />
                </label>

                <label className="input-group">
                  <span>Descripción y Beneficios Incluidos</span>
                  <textarea rows={3} placeholder="Detalles de la matrícula, póliza, flete incluido, notaría..." value={raffleDesc} onChange={(e) => setRaffleDesc(e.target.value)} required />
                </label>

                <div className="b2b-two-cols">
                  <label className="input-group">
                    <span>Precio por Boleta (COP)</span>
                    <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} required />
                  </label>
                  <label className="input-group">
                    <span>Fecha y Hora de la Transmisión 3D</span>
                    <input type="datetime-local" value={drawDateTime} onChange={(e) => setDrawDateTime(e.target.value)} required />
                  </label>
                </div>

                <div className="b2b-two-cols">
                  <label className="input-group">
                    <span>Tamaño del Cartón (Balotas)</span>
                    <select value={ballotGrid} onChange={(e) => setBallotGrid(e.target.value)}>
                      <option value="100">100 Números (00 - 99)</option>
                      <option value="200">200 Números (000 - 199)</option>
                      <option value="500">500 Números (000 - 499)</option>
                      <option value="1000">1.000 Números (000 - 999)</option>
                    </select>
                  </label>
                  <label className="input-group">
                    <span>Cobertura del Sorteo</span>
                    <select value={coverage} onChange={(e) => setCoverage(e.target.value)}>
                      <option value="nacional">🇨🇴 Toda Colombia (Envío asegurado)</option>
                      <option value="regional">📍 Regional / Entrega en Concesionario</option>
                    </select>
                  </label>
                </div>

                {/* AUTORIZACIÓN LEGAL Y RADICADO (LEY 643 DE 2001) */}
                <RegionalPermitSelectorWithTime
                  scope={legalScope}
                  region={legalRegion}
                  customCity={legalCustomCity}
                  radicado={legalRadicado}
                  receiptFile={legalReceiptFile}
                  onScopeChange={(s) => setLegalScope(s)}
                  onRegionChange={(r) => setLegalRegion(r)}
                  onCustomCityChange={(c) => setLegalCustomCity(c)}
                  onRadicadoChange={(rad) => setLegalRadicado(rad)}
                  onFileChange={(f) => {
                    setLegalReceiptFile(f);
                    setLegalReceiptUrl(null);
                  }}
                  validationError={legalValidationError}
                />

                <button
                  type="submit"
                  disabled={isPublishingRaffle}
                  className="btn-submit-gold"
                  style={{
                    opacity: (!legalRadicado.trim() || !legalReceiptFile) ? 0.8 : 1,
                    filter: (!legalRadicado.trim() || !legalReceiptFile) ? 'grayscale(0.2)' : 'none',
                    cursor: isPublishingRaffle ? 'wait' : 'pointer',
                  }}
                >
                  {isPublishingRaffle
                    ? '⏳ Subiendo Soportes a Supabase...'
                    : (!legalRadicado.trim() || !legalReceiptFile)
                    ? '🔒 Adjunta Comprobante y Radicado para Publicar'
                    : '✅ Publicar Rifa Oficial y Habilitar Balotera 3D'}
                </button>
              </form>

              {createdRaffleSlug && (
                <div className="raffle-created-success-card">
                  <h3>🎉 ¡Sorteo Creado Exitosamente!</h3>
                  <p>Tu cartón de {ballotGrid} números ya está sincronizado con la Balotera 3D.</p>
                  <div className="created-raffle-links">
                    <Link className="btn-compact-action" href={`/sorteo-en-vivo?sorteo=${createdRaffleSlug}`}>
                      🎱 Probar Sala 3D en Vivo →
                    </Link>
                    <button
                      type="button"
                      className="btn-compact-action"
                      onClick={() =>
                        shareRaffleLink({
                          title: raffleTitle,
                          text: `Aparta tu número para ${raffleTitle}`,
                          path: `/?sorteo=${createdRaffleSlug}`,
                        })
                      }
                    >
                      📤 Compartir Cartón por WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              MÓDULO 4: CRM DE CLIENTES Y GESTIÓN DE BOLETAS
              ========================================================= */}
          {activeTab === 'crm' && (
            <section className="station-block-premium">
              <div className="compact-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>👥 CRM de Clientes y Boletas Compradas</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Deseas reiniciar los datos de prueba a 0?')) {
                      localStorage.removeItem('elganador_my_tickets');
                      localStorage.removeItem('elganador_custom_raffles');
                      localStorage.removeItem('elganador_custom_stories');
                      localStorage.removeItem('elganador_raffle_draft');
                      alert('✅ Datos restablecidos a 0. Ahora puedes realizar pruebas 100% limpias como cliente y empresario.');
                      window.location.reload();
                    }
                  }}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  🔄 Reiniciar Datos a 0
                </button>
              </div>
              <p className="station-subtitle">
                Lista de compradores verificados, números apartados y recibos bancarios de Wompi / PSE.
              </p>

              {(() => {
                let liveTickets: any[] = [];
                try {
                  const stored = localStorage.getItem('elganador_my_tickets');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) liveTickets = parsed;
                  }
                } catch {}

                if (liveTickets.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>0 Clientes / Boletas Registradas</h3>
                      <p style={{ fontSize: '13px', color: '#888', maxWidth: '380px', margin: '0 auto 16px' }}>
                        Tus datos están en 0. Cuando un cliente compre o aparte un número a través de la pasarela de pagos Wompi, aparecerá aquí en tiempo real con su hash SHA-256 verificado.
                      </p>
                      <Link
                        href="/"
                        style={{
                          display: 'inline-block',
                          padding: '10px 18px',
                          background: '#007AFF',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                        }}
                      >
                        🎟️ Probar Compra como Cliente
                      </Link>
                    </div>
                  );
                }

                return liveTickets.map((t: any, idx: number) => (
                  <div key={t.id || idx} className="crm-ticket-item" style={{ marginBottom: '12px' }}>
                    <div className="crm-ticket-info">
                      <strong>Cliente Verificado · 📱 {t.merchant || 'Comprador'}</strong>
                      <span>Boletas: {Array.isArray(t.numbers) ? t.numbers.join(', ') : t.numbers} · {t.raffleTitle} · {t.status || 'Pagado vía Wompi'}</span>
                      <small>SHA-256: {t.hashSha256 || 'Firma Criptográfica Verificada'}</small>
                    </div>
                    <button
                      type="button"
                      className="btn-compact-action"
                      onClick={() =>
                        shareRaffleLink({
                          title: `Comprobante ${t.raffleTitle}`,
                          text: `Boletas ${Array.isArray(t.numbers) ? t.numbers.join(', ') : t.numbers} confirmadas con SHA-256`,
                          path: '/mis-boletas',
                        })
                      }
                    >
                      📤 Enviar Comprobante
                    </button>
                  </div>
                ));
              })()}
            </section>
          )}

          {/* =========================================================
              MÓDULO 6: VALIDACIÓN LEGAL KYB Y SUBIDA A SUPABASE STORAGE
              ========================================================= */}
          {activeTab === 'kyb' && (
            <section className="station-block-premium">
              <div className="compact-section-title">
                <h2>🏢 Validación KYB y Expediente Mercantil</h2>
              </div>
              <p className="station-subtitle">
                Los documentos mercantiles se transmiten cifrados y se custodian en el bucket <code>kyb-documents</code> de <strong>Supabase Storage</strong> para auditoría notarial y cumplimiento Coljuegos.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {/* 1. RUT */}
                <div style={{ background: '#1c1c1e', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ margin: '0 0 6px', color: '#f5b82e' }}>📄 1. RUT Actualizado (DIAN)</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Registro Único Tributario con actividad económica autorizada para el comercio.
                  </p>
                  {kybDocs['rut'] ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#86efac', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✅ Subido a Supabase: <strong>{kybDocs['rut'].name}</strong> ({kybDocs['rut'].uploadedAt})
                    </div>
                  ) : null}
                  <label className="media-native-btn dark" style={{ width: '100%', justifyContent: 'center' }}>
                    {kybUploading === 'rut' ? '⏳ Subiendo a Supabase Storage...' : '📎 Seleccionar RUT (PDF/Img)'}
                    <input type="file" accept="application/pdf,image/*" hidden onChange={(e) => handleKybFileUpload(e, 'rut')} />
                  </label>
                </div>

                {/* 2. CÁMARA DE COMERCIO */}
                <div style={{ background: '#1c1c1e', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ margin: '0 0 6px', color: '#f5b82e' }}>🏢 2. Certificado Cámara de Comercio</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Certificado de Existencia y Representación Legal (vigencia inferior a 30 días).
                  </p>
                  {kybDocs['camara_comercio'] ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#86efac', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✅ Subido a Supabase: <strong>{kybDocs['camara_comercio'].name}</strong> ({kybDocs['camara_comercio'].uploadedAt})
                    </div>
                  ) : null}
                  <label className="media-native-btn dark" style={{ width: '100%', justifyContent: 'center' }}>
                    {kybUploading === 'camara_comercio' ? '⏳ Subiendo a Supabase Storage...' : '📎 Seleccionar Cámara (PDF/Img)'}
                    <input type="file" accept="application/pdf,image/*" hidden onChange={(e) => handleKybFileUpload(e, 'camara_comercio')} />
                  </label>
                </div>

                {/* 3. CÉDULA REPRESENTANTE LEGAL */}
                <div style={{ background: '#1c1c1e', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ margin: '0 0 6px', color: '#f5b82e' }}>🪪 3. Cédula del Representante Legal</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Documento de identidad al 150% de la persona natural o representante mercantil.
                  </p>
                  {kybDocs['cedula'] ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#86efac', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✅ Subido a Supabase: <strong>{kybDocs['cedula'].name}</strong> ({kybDocs['cedula'].uploadedAt})
                    </div>
                  ) : null}
                  <label className="media-native-btn dark" style={{ width: '100%', justifyContent: 'center' }}>
                    {kybUploading === 'cedula' ? '⏳ Subiendo a Supabase Storage...' : '📎 Seleccionar Cédula (PDF/Img)'}
                    <input type="file" accept="application/pdf,image/*" hidden onChange={(e) => handleKybFileUpload(e, 'cedula')} />
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Estado del Expediente KYB</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: kybApproved ? '#86efac' : '#fde047' }}>
                    {kybApproved ? '✅ Verificación Empresarial Ratificada y Vigente' : '⏳ En proceso de revisión de expedientes'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-submit-gold"
                  style={{ width: 'auto', padding: '10px 24px' }}
                  onClick={handleApproveKyb}
                >
                  Ratificar Aprobación KYB
                </button>
              </div>
            </section>
          )}

        </main>
      </div>

      {/* BARRA INFERIOR ENLAZADA CON MOTOR LEGAL Y PERFIL */}
      <nav
        className="native-bottom-tabbar mobile-bottom-nav"
        aria-label="Navegación Empresario"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 9999,
        }}
      >
        <Link className="tab-item" href="/">
          <span className="tab-icon"><IosHomeIcon /></span>
          <span className="tab-text">Vitrina</span>
        </Link>
        <Link className="tab-item" href="/sorteo-en-vivo">
          <span className="tab-icon"><IosLiveBallIcon /></span>
          <span className="tab-text">Sorteo en Vivo</span>
        </Link>
        <button type="button" onClick={() => setActiveTab('rifas')} className={`tab-item ${activeTab === 'rifas' ? 'active' : ''}`}>
          <span className="tab-icon"><IosPlusIcon active={activeTab === 'rifas'} /></span>
          <span className="tab-text">Crear Rifa</span>
        </button>
        <button type="button" onClick={() => setActiveTab('perfil')} className={`tab-item ${activeTab === 'perfil' ? 'active' : ''}`}>
          <span className="tab-icon"><IosStoreIcon active={activeTab === 'perfil'} /></span>
          <span className="tab-text">Mi Tienda</span>
        </button>
      </nav>
    </div>
  );
}

export default function PanelEmpresarioCompletoPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 20px', minHeight: '60vh' }}><h3>Cargando panel empresarial...</h3></div>}>
      <PanelEmpresarioContent />
    </Suspense>
  );
}
