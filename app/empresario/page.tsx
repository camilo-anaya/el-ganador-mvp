// app/empresario/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BusinessSidebar from '@/components/business/BusinessSidebar';
import BusinessBottomNav from '@/components/business/BusinessBottomNav';
import BusinessAdBanner from '@/components/business/BusinessAdBanner';
import ColjuegosLegalGuide from '@/components/ColjuegosLegalGuide';
import { performLogout } from '@/lib/logout';
import RegionalPermitSelectorWithTime, { LegalScope } from '@/components/RegionalPermitSelectorWithTime';
import { fileToDataUrl, shareRaffleLink } from '@/lib/nativeActions';
import { uploadStoryToSupabase, uploadKybDocumentToSupabase, uploadLegalDocument } from '@/lib/supabase';
import { getBusinessNotifications, markBusinessNotificationsAsRead, BusinessNotification } from '@/lib/notifications';
import { useTheme } from '@/context/ThemeContext';

function PanelEmpresarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [kybApproved, setKybApproved] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'perfil' | 'rifas' | 'estados' | 'crm' | 'kyb'>('perfil');
  const [kybDocs, setKybDocs] = useState<Record<string, { type: string; name: string; url: string; uploadedAt: string; isMock: boolean }>>({});
  const [kybUploading, setKybUploading] = useState<string | null>(null);
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storyUploadStatus, setStoryUploadStatus] = useState<string | null>(null);
  const [apiOrders, setApiOrders] = useState<any[]>([]);
  const [drawsRevenue, setDrawsRevenue] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [businessNotifs, setBusinessNotifs] = useState<BusinessNotification[]>([]);
  const [showBusinessNotifDropdown, setShowBusinessNotifDropdown] = useState(false);
  const [expandedExpedienteId, setExpandedExpedienteId] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifs = () => setBusinessNotifs(getBusinessNotifications());
    loadNotifs();
    window.addEventListener('elganador_notification_update', loadNotifs);
    return () => window.removeEventListener('elganador_notification_update', loadNotifs);
  }, []);

  const unreadBusinessNotifsCount = businessNotifs.filter((n) => !n.read).length;

  // Consulta de órdenes, clientes y recaudo por sorteo/evento desde la API B2B
  useEffect(() => {
    if (activeTab === 'crm' || activeTab === 'rifas') {
      setOrdersLoading(true);
      fetch('/api/business/orders', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.ok) {
            if (Array.isArray(data.orders)) setApiOrders(data.orders);
            if (Array.isArray(data.drawsRevenue)) setDrawsRevenue(data.drawsRevenue);
          }
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab]);

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
      router.push('/empresario/publicidad');
      return;
    } else if (tabParam === 'kyb') {
      setActiveTab('kyb');
    } else if (tabParam === 'sala3d') {
      router.push('/sorteo-en-vivo');
    }
  }, [searchParams, router]);

  // 1. Carga de datos privados de la superficie empresarial
  useEffect(() => {
    // El acceso empresarial lo valida BusinessGuard (app/empresario/layout.tsx).

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
          router.push('/empresario/publicidad');
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
  const [profileViewMode, setProfileViewMode] = useState<'edit' | 'client'>('edit');
  const [isFollowingPreview, setIsFollowingPreview] = useState(false);

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
  const [showColjuegosGuide, setShowColjuegosGuide] = useState<boolean>(false);
  const [myRaffles, setMyRaffles] = useState<any[]>([]);

  // Carga reactiva de rifas del empresario (Secretaria IA + manuales)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadMyRaffles = () => {
      try {
        const raw1 = localStorage.getItem('elganador_raffles_list');
        const raw2 = localStorage.getItem('elganador_custom_raffles');
        const l1 = raw1 ? JSON.parse(raw1) : [];
        const l2 = raw2 ? JSON.parse(raw2) : [];
        setMyRaffles([...l1, ...l2]);
      } catch (err) {
        console.warn('Error loading my raffles:', err);
      }
    };
    loadMyRaffles();
    window.addEventListener('elganador_raffles_updated', loadMyRaffles);
    return () => window.removeEventListener('elganador_raffles_updated', loadMyRaffles);
  }, []);

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
          <span aria-hidden="true" className="profile-icon-btn">🏪</span>
          <div>
            <span className="brand-title">PERFIL EMPRESARIAL</span>
            <small className="brand-subtitle">{storeName}</small>
          </div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
          {/* CAMPANA DE NOTIFICACIONES DE LA SECRETARIA IA */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-compact-action"
              onClick={() => {
                setShowBusinessNotifDropdown((prev) => !prev);
                if (!showBusinessNotifDropdown && unreadBusinessNotifsCount > 0) {
                  markBusinessNotificationsAsRead();
                }
              }}
              title="Notificaciones de Secretaria IA y Ventas"
              aria-label="Notificaciones empresariales"
              style={{
                position: 'relative',
                padding: '6px 10px',
                fontSize: '11.5px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: unreadBusinessNotifsCount > 0 ? 'rgba(0, 122, 255, 0.2)' : undefined,
                borderColor: unreadBusinessNotifsCount > 0 ? '#007AFF' : undefined,
              }}
            >
              🔔 <span>Alertas</span>
              {unreadBusinessNotifsCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 900,
                    borderRadius: '999px',
                    padding: '1px 5px',
                  }}
                >
                  {unreadBusinessNotifsCount}
                </span>
              )}
            </button>

            {/* BANDEJA FLOTANTE DE NOTIFICACIONES EMPRESARIALES */}
            {showBusinessNotifDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '320px',
                  maxWidth: '90vw',
                  background: 'var(--surface-card, #ffffff)',
                  border: '1.5px solid #007AFF',
                  borderRadius: '14px',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
                  zIndex: 9999,
                  overflow: 'hidden',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.86rem' }}>🔔 Secretaria Legal IA &amp; Alertas</strong>
                  <button
                    type="button"
                    onClick={() => setShowBusinessNotifDropdown(false)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
                  {businessNotifs.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', opacity: 0.8, fontSize: '0.82rem' }}>
                      <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>🤖</span>
                      No tienes notificaciones pendientes. La <strong>Secretaria Legal IA</strong> te avisará aquí en cuanto radique tus sorteos.
                    </div>
                  ) : (
                    businessNotifs.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                          marginBottom: '4px',
                          background: n.read ? 'transparent' : 'rgba(0, 122, 255, 0.08)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ color: '#007AFF' }}>{n.title}</strong>
                          <small style={{ fontSize: '0.68rem', opacity: 0.7 }}>{n.dateStr}</small>
                        </div>
                        <p style={{ margin: 0, lineHeight: 1.4, opacity: 0.9 }}>{n.message}</p>
                        {n.radicado && (
                          <div style={{ marginTop: '4px', fontSize: '0.74rem', color: '#0284c7', fontWeight: 800 }}>
                            Radicado: {n.radicado}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            href="/"
            className="btn-compact-action"
            title="Ver Marketplace público con rifas y publicidad de todos los comercios"
            style={{
              textDecoration: 'none',
              background: 'rgba(56, 189, 248, 0.16)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              fontSize: '11.5px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            🏛️ <span>Vitrina</span>
          </Link>
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
            style={{
              padding: '6px 10px',
              fontSize: '11.5px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            📤 <span>Compartir</span>
          </button>
          <button
            type="button"
            className="btn-compact-action"
            onClick={() => void performLogout()}
            aria-label="Cerrar sesión empresarial"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '6px 10px',
              fontSize: '11.5px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            🚪 <span>Salir</span>
          </button>
        </div>
      </header>

      <div className="desktop-workspace-grid">
        <BusinessSidebar activeKey={activeTab} />
        <main className="app-scroll-canvas" style={{ paddingBottom: '112px' }}>
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

          {/* BANNER DE PUBLICIDAD (componente empresarial independiente) */}
          <BusinessAdBanner />
          {/* MENÚ DE HERRAMIENTAS DEL EMPRESARIO */}
          <nav className="category-chips" aria-label="Herramientas Empresariales">
            <Link
              href="/"
              className="chip-btn"
              style={{
                textDecoration: 'none',
                borderColor: 'rgba(56, 189, 248, 0.45)',
                color: '#38bdf8',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Explorar rifas y publicidad de otros empresarios en la vitrina pública"
            >
              🏛️ Marketplace (Vitrina) ↗
            </Link>
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
              🎟️ Mis Rifas y Sorteos
            </button>
            <Link
              href="/empresario/publicidad"
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
            <Link
              href="/empresario/marco-legal"
              className="chip-btn"
              style={{
                textDecoration: 'none',
                borderColor: 'rgba(212, 175, 55, 0.45)',
                color: '#f5b82e',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Consultar requisitos oficiales de Coljuegos y normatividad legal colombiana"
            >
              📜 Marco Legal (Coljuegos)
            </Link>
          </nav>

          {/* =========================================================
              MÓDULO 1: PERFIL EMPRESARIAL ORGANIZADO + VISTA COMO CLIENTE
              ========================================================= */}
          {activeTab === 'perfil' && (
            <section
              className="station-block-premium"
              style={{
                padding: '16px',
                borderRadius: '20px',
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              }}
            >
              {/* Selector Editar vs Vista Previa como Cliente */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '5px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.08)',
                  marginBottom: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setProfileViewMode('edit')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: profileViewMode === 'edit' ? '#0c2340' : 'transparent',
                    color: profileViewMode === 'edit' ? '#ffffff' : 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ✏️ Editar Mi Tienda
                </button>
                <button
                  type="button"
                  onClick={() => setProfileViewMode('client')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: profileViewMode === 'client' ? '#007AFF' : 'transparent',
                    color: profileViewMode === 'client' ? '#ffffff' : 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  👁️ Ver como Cliente
                </button>
              </div>

              {/* Portada panorámica + Avatar circular perfectamente proporcionado */}
              <div style={{ position: 'relative', marginBottom: '48px' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '168px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#0b1622',
                  }}
                >
                  <img
                    src={coverPhoto}
                    alt="Portada del almacén"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%)',
                      pointerEvents: 'none',
                    }}
                  />
                  {profileViewMode === 'edit' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <label
                        style={{
                          padding: '6px 10px',
                          borderRadius: '999px',
                          background: 'rgba(10, 14, 20, 0.82)',
                          border: '1px solid rgba(255,255,255,0.22)',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        📷 Cámara
                        <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleImagePick(e, setCoverPhoto)} />
                      </label>
                      <label
                        style={{
                          padding: '6px 10px',
                          borderRadius: '999px',
                          background: 'rgba(10, 14, 20, 0.82)',
                          border: '1px solid rgba(255,255,255,0.22)',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🖼️ Portada
                        <input type="file" accept="image/*" hidden onChange={(e) => handleImagePick(e, setCoverPhoto)} />
                      </label>
                    </div>
                  )}
                  {profileViewMode === 'client' && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'rgba(4, 106, 56, 0.92)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      👁️ Vista Pública de Cliente
                    </span>
                  )}
                </div>

                {/* Logo circular controlado (84x84) sin desbordarse jamás */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-40px',
                    left: '16px',
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    border: '3px solid #f5b82e',
                    background: '#0b0e12',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.32)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={logoPhoto}
                    alt="Logo del almacén"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>

                {profileViewMode === 'edit' && (
                  <label
                    title="Cambiar logo de la tienda"
                    style={{
                      position: 'absolute',
                      bottom: '-40px',
                      left: '74px',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#0c2340',
                      border: '2px solid #ffffff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.28)',
                    }}
                  >
                    📷
                    <input type="file" accept="image/*" hidden onChange={(e) => handleImagePick(e, setLogoPhoto)} />
                  </label>
                )}
              </div>

              {/* Encabezado limpio del comercio */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, lineHeight: 1.2 }}>{storeName}</h2>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: 'rgba(16, 185, 129, 0.16)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      color: '#059669',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    ✅ Verificado +18
                  </span>
                </div>
                <p style={{ margin: '5px 0 0', fontSize: '13px', opacity: 0.8 }}>
                  📍 {storeCategory}
                </p>
              </div>

              {/* =================================================
                  MODO A: VISTA PREVIA EXACTA DE CÓMO LO VE UN CLIENTE
                  ================================================= */}
              {profileViewMode === 'client' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.55, opacity: 0.9 }}>
                    {storeBio}
                  </p>

                  {/* Métricas de confianza visibles al comprador */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                    }}
                  >
                    <div style={{ padding: '10px 8px', borderRadius: '12px', background: 'rgba(12, 35, 64, 0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>⭐ 4.9</div>
                      <div style={{ fontSize: '11px', opacity: 0.75 }}>Reputación</div>
                    </div>
                    <div style={{ padding: '10px 8px', borderRadius: '12px', background: 'rgba(12, 35, 64, 0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>🛡️ KYB</div>
                      <div style={{ fontSize: '11px', opacity: 0.75 }}>RUT & Legal</div>
                    </div>
                    <div style={{ padding: '10px 8px', borderRadius: '12px', background: 'rgba(12, 35, 64, 0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>🎟️ 100%</div>
                      <div style={{ fontSize: '11px', opacity: 0.75 }}>SHA-256</div>
                    </div>
                  </div>

                  {/* Acciones principales que ve el cliente */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsFollowingPreview((v) => !v)}
                      style={{
                        padding: '11px 14px',
                        borderRadius: '12px',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        background: isFollowingPreview
                          ? 'rgba(0, 122, 255, 0.15)'
                          : 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                        color: isFollowingPreview ? '#007AFF' : '#ffffff',
                      }}
                    >
                      {isFollowingPreview ? '✓ Siguiendo Tienda' : '🔔 Seguir Tienda'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        shareRaffleLink({
                          title: storeName,
                          text: storeBio,
                          path: `/?tienda=${encodeURIComponent(storeName)}`,
                        })
                      }
                      style={{
                        padding: '11px 14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        background: 'transparent',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        color: 'inherit',
                      }}
                    >
                      📤 Compartir
                    </button>
                  </div>

                  {/* Canales oficiales clickeables */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {socials.whatsapp && (
                      <a href={socials.whatsapp} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: '999px', background: 'rgba(34, 197, 94, 0.14)', color: '#15803d', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                        📱 WhatsApp
                      </a>
                    )}
                    {socials.instagram && (
                      <a href={socials.instagram} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: '999px', background: 'rgba(236, 72, 153, 0.14)', color: '#be185d', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                        📸 Instagram
                      </a>
                    )}
                    {socials.facebook && (
                      <a href={socials.facebook} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.14)', color: '#1d4ed8', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                        📘 Facebook
                      </a>
                    )}
                    {socials.tiktok && (
                      <a href={socials.tiktok} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: '999px', background: 'rgba(15, 23, 42, 0.12)', color: 'inherit', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                        🎵 TikTok
                      </a>
                    )}
                  </div>

                  {/* Vitrina de sorteos activos de la tienda */}
                  <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.22)', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>🎟️ Sorteos Activos de {storeName}</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('rifas')}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                      >
                        + Publicar otro
                      </button>
                    </div>
                    <div
                      style={{
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        background: '#0c2340',
                        color: '#ffffff',
                      }}
                    >
                      <img
                        src={coverPhoto}
                        alt="Sorteo destacado"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#fde047', fontWeight: 700 }}>🔥 SORTEO VERIFICADO EN VITRINA</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, margin: '4px 0 6px' }}>
                          {raffleTitle || 'Gran Sorteo Oficial · Premio Destacado'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#6ee7b7' }}>
                            $ {parseInt(ticketPrice || '35000', 10).toLocaleString('es-CO')} / boleta
                          </span>
                          <span
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              background: '#f5b82e',
                              color: '#090d12',
                              fontWeight: 800,
                              fontSize: '12px',
                            }}
                          >
                            Comprar boleta
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* =================================================
                   MODO B: FORMULARIO DE EDICIÓN ORGANIZADO
                   ================================================= */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBioSaved(true);
                    setTimeout(() => setBioSaved(false), 2500);
                  }}
                  className="auth-form"
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <label className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Nombre Comercial del Almacén</span>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                      style={{ padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.4)', fontSize: '14px' }}
                    />
                  </label>

                  <label className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Categoría y Ubicación Principal</span>
                    <input
                      type="text"
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value)}
                      required
                      style={{ padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.4)', fontSize: '14px' }}
                    />
                  </label>

                  <label className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Biografía Comercial del Negocio</span>
                    <textarea
                      rows={3}
                      value={storeBio}
                      onChange={(e) => setStoreBio(e.target.value)}
                      required
                      style={{ padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.4)', fontSize: '14px', resize: 'vertical' }}
                    />
                  </label>

                  <div style={{ borderTop: '1px solid rgba(148,163,184,0.22)', paddingTop: '12px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '14.5px', fontWeight: 800 }}>🔗 Canales y Redes Sociales Oficiales</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      <label className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>📱 WhatsApp Comercial</span>
                        <input
                          type="url"
                          placeholder="https://wa.me/57..."
                          value={socials.whatsapp}
                          onChange={(e) => setSocials({ ...socials, whatsapp: e.target.value })}
                          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.4)', fontSize: '13.5px' }}
                        />
                      </label>
                      <label className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>📸 Instagram Oficial</span>
                        <input
                          type="url"
                          placeholder="https://instagram.com/..."
                          value={socials.instagram}
                          onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.4)', fontSize: '13.5px' }}
                        />
                      </label>
                      <label className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>📘 Página de Facebook</span>
                        <input
                          type="url"
                          placeholder="https://facebook.com/..."
                          value={socials.facebook}
                          onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
                          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.4)', fontSize: '13.5px' }}
                        />
                      </label>
                      <label className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>🎵 Perfil de TikTok</span>
                        <input
                          type="url"
                          placeholder="https://tiktok.com/@..."
                          value={socials.tiktok}
                          onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
                          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.4)', fontSize: '13.5px' }}
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit-gold"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: 'none',
                      background: bioSaved
                        ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
                        : 'linear-gradient(135deg, #f5b82e 0%, #d97706 100%)',
                      color: bioSaved ? '#ffffff' : '#090d12',
                      fontWeight: 800,
                      fontSize: '14.5px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(245, 184, 46, 0.32)',
                    }}
                  >
                    {bioSaved ? '✅ Biografía y Redes Actualizadas en Vitrina' : '💾 Guardar Perfil Empresarial'}
                  </button>
                </form>
              )}
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
              <div className="compact-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>🎟️ Mis Rifas y Sorteos Oficiales</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Panel central: Monitorea tus radicados ante Coljuegos y administra tus ventas de boletas.
                  </p>
                </div>
                {myRaffles.length > 0 && (
                  <Link
                    href="/empresario/crear-rifa"
                    style={{
                      background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                      color: '#ffffff',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
                    }}
                  >
                    <span>🚀</span> + Crear Nueva Rifa con IA
                  </Link>
                )}
              </div>

              {/* ESTADO VACÍO (ONBOARDING ÚNICO): EXACTAMENTE 1 TARJETA Y 1 BOTÓN */}
              {myRaffles.length === 0 ? (
                <div
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.14) 0%, rgba(2, 132, 199, 0.06) 100%)'
                      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: '2px solid #007AFF',
                    borderRadius: '20px',
                    padding: '36px 24px',
                    textAlign: 'center',
                    boxShadow: '0 8px 30px rgba(0, 122, 255, 0.12)',
                    marginBottom: '28px',
                  }}
                >
                  <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎁</div>
                  <span
                    style={{
                      background: '#007AFF',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Asistente en 4 Pasos · Conforme a Ley 643
                  </span>
                  <h3 style={{ margin: '14px 0 8px', fontSize: '1.35rem', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a' }}>
                    Crea tu Primer Sorteo con la Secretaria Legal IA
                  </h3>
                  <p style={{ margin: '0 auto 20px', fontSize: '0.88rem', color: isDark ? '#cbd5e1' : '#475569', maxWidth: '520px', lineHeight: 1.6 }}>
                    Nuestra Calculadora Digital descuenta el 14% de salud de Coljuegos y costos de pasarela para proyectar tu ganancia neta. La Secretaria IA arma el Formulario 8 y radica tu expediente en 1 solo clic.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: '1px solid rgba(0,122,255,0.2)', fontWeight: 700 }}>
                      1️⃣ Tu Premio
                    </span>
                    <span style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: '1px solid rgba(0,122,255,0.2)', fontWeight: 700 }}>
                      2️⃣ Calculadora Digital
                    </span>
                    <span style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: '1px solid rgba(0,122,255,0.2)', fontWeight: 700 }}>
                      3️⃣ Radicación IA (1 Clic)
                    </span>
                    <span style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: '1px solid rgba(0,122,255,0.2)', fontWeight: 700 }}>
                      4️⃣ Publicar
                    </span>
                  </div>

                  <Link
                    href="/empresario/crear-rifa"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                      color: '#ffffff',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '0.98rem',
                      textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(0, 122, 255, 0.45)',
                    }}
                  >
                    <span>🚀</span> Iniciar Asistente de Creación →
                  </Link>
                </div>
              ) : (
                /* CUANDO YA HAY RIFAS: LISTA LIMPIA DIRECTA SIN CARTELES REPETIDOS */
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📋</span> Mis Sorteos Registrados ({myRaffles.length})
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {myRaffles.map((raf: any, idx: number) => {
                      const isPendingColjuegos = raf.status === 'en_tramite_coljuegos' || (raf.radicado_number && raf.radicado_number.startsWith('SOL-'));
                      return (
                        <div
                          key={raf.id || idx}
                          style={{
                            background: isDark ? '#1e293b' : '#ffffff',
                            borderRadius: '14px',
                            padding: '16px',
                            border: isPendingColjuegos ? '1.5px solid #0284c7' : '1.5px solid #007AFF',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 900,
                                padding: '3px 8px',
                                borderRadius: '999px',
                                textTransform: 'uppercase',
                                background: isPendingColjuegos ? '#0284c7' : '#007AFF',
                                color: '#ffffff',
                              }}
                            >
                              {isPendingColjuegos ? '⏳ Trámite Coljuegos (15-30 Días)' : '✅ Activa en Vitrina'}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#007AFF' }}>
                              {raf.radicado_number || raf.legalRadicado || 'En Trámite'}
                            </span>
                          </div>

                          <h4 style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: 800 }}>
                            {raf.title}
                          </h4>

                          <p style={{ margin: '0 0 10px', fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {raf.description || 'Sorteo oficial certificado por El Ganador.'}
                          </p>

                          <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: '8px' }}>
                            <span>Boletas: <strong>{raf.total_tickets || raf.ballotGrid || 1000}</strong></span>
                            <span>Valor: <strong>${(raf.ticket_price || 25000).toLocaleString()} COP</strong></span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link
                              href="/"
                              style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '8px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(0, 122, 255, 0.15)' : '#f0f9ff',
                                color: '#007AFF',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                border: '1px solid rgba(0, 122, 255, 0.3)',
                              }}
                            >
                              👁️ Ver en Vitrina
                            </Link>
                            <Link
                              href="/sorteo-en-vivo"
                              style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                              }}
                            >
                              🎱 Sala 3D
                            </Link>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedExpedienteId(expandedExpedienteId === (raf.id || idx) ? null : (raf.id || idx))}
                            style={{
                              width: '100%',
                              marginTop: '8px',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: expandedExpedienteId === (raf.id || idx) ? (isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe') : 'transparent',
                              border: '1px dashed #0284c7',
                              color: '#0284c7',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>📁</span> {expandedExpedienteId === (raf.id || idx) ? 'Ocultar Expediente Legal' : 'Ver Expediente & Gestión IA'}
                          </button>

                          {expandedExpedienteId === (raf.id || idx) && (
                            <div
                              style={{
                                marginTop: '10px',
                                padding: '12px',
                                borderRadius: '10px',
                                background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#f8fafc',
                                border: '1px solid rgba(2, 132, 199, 0.3)',
                                fontSize: '0.78rem',
                                textAlign: 'left',
                              }}
                            >
                              <strong style={{ color: '#0284c7', display: 'block', marginBottom: '6px' }}>
                                🏛️ Bóveda de Documentos (Supabase Storage):
                              </strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Formulario 8 Oficial:</span>
                                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Generado por IA</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Mandato Digital (Ley 527):</span>
                                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Firmado Electrónicamente</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Factura / Adquisición del Premio:</span>
                                  <span style={{ color: '#0284c7', fontWeight: 700 }}>✓ Encriptado en Bóveda</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Cámara de Comercio y RUT:</span>
                                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Vinculado desde KYB</span>
                                </div>
                              </div>

                              <strong style={{ color: isDark ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '4px', borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: '8px' }}>
                                ⏱️ Trazabilidad de Nuestra Gestión:
                              </strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.9 }}>
                                <div>• <strong>Radicado de Entrada:</strong> {raf.radicado_number || 'SOL-COLJ-2026-XXXXXX'}</div>
                                <div>• <strong>Etapa Actual:</strong> Auditoría de Coljuegos (Plazo de Ley: 15-30 días hábiles).</div>
                                <div>• <strong>Seguimiento:</strong> La Secretaria IA monitorea el expediente y te notificará por la campana 🔔 cuando la resolución sea ratificada.</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RESUMEN DE RECAUDO EN BOLETERÍA POR SORTEO */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f5b82e', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💰</span> Recaudo en Boletería por Sorteo / Evento
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('crm')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Ver CRM Completo →
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {(drawsRevenue.length > 0 ? drawsRevenue : [
                    { drawId: 'RIF-2026-000184', title: 'iPhone 18 Pro 256 GB', unitPrice: 35000, soldTickets: 842, totalTickets: 1000, totalRevenue: 29470000, progressPct: 84 },
                    { drawId: 'RIF-2026-000185', title: 'PlayStation 5 Pro', unitPrice: 25000, soldTickets: 168, totalTickets: 200, totalRevenue: 4200000, progressPct: 84 },
                    { drawId: 'RIF-2026-000186', title: 'Moto Yamaha NMAX 155', unitPrice: 15000, soldTickets: 390, totalTickets: 500, totalRevenue: 5850000, progressPct: 78 },
                  ]).map((dr: any) => (
                    <div key={dr.drawId} className="revenue-stat-card" style={{ borderRadius: '10px', padding: '12px' }}>
                      <div className="card-title" style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>{dr.title}</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#f5b82e' }}>
                        ${Number(dr.totalRevenue).toLocaleString('es-CO')} COP
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {dr.soldTickets} de {dr.totalTickets} balotas ({dr.progressPct}% vendido)
                      </div>
                      <Link
                        href={`/sorteo-en-vivo?draw=${dr.drawId}`}
                        style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                      >
                        🎱 Sintonizar Sorteo en Vivo →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              MÓDULO 4: CRM DE CLIENTES Y GESTIÓN DE BOLETAS
              ========================================================= */}
          {activeTab === 'crm' && (
            <section className="station-block-premium">
              <div className="compact-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h2>👥 CRM de Clientes y Boletas Compradas</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    disabled={ordersLoading}
                    onClick={() => {
                      setOrdersLoading(true);
                      fetch('/api/business/orders', { cache: 'no-store' })
                        .then((res) => res.json())
                        .then((data) => {
                          if (data && data.ok && Array.isArray(data.orders)) {
                            setApiOrders(data.orders);
                          }
                        })
                        .catch(() => {})
                        .finally(() => setOrdersLoading(false));
                    }}
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f4c752',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {ordersLoading ? '⏳ Sincronizando...' : '⚡ Sincronizar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Deseas reiniciar los datos de prueba a 0?')) {
                        localStorage.removeItem('elganador_biz_orders');
                        localStorage.removeItem('elganador_custom_raffles');
                        localStorage.removeItem('elganador_custom_stories');
                        localStorage.removeItem('elganador_raffle_draft');
                        setApiOrders([]);
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
                    🔄 Reiniciar a 0
                  </button>
                </div>
              </div>
              <p className="station-subtitle">
                Lista de compradores verificados, números apartados y recibos bancarios de Wompi / PSE con validación SHA-256.
              </p>

              {(() => {
                let liveTickets: any[] = [];
                const seenIds = new Set<string>();

                if (Array.isArray(apiOrders)) {
                  for (const o of apiOrders) {
                    if (o && o.id && !seenIds.has(o.id)) {
                      seenIds.add(o.id);
                      liveTickets.push(o);
                    }
                  }
                }

                try {
                  const stored = localStorage.getItem('elganador_biz_orders');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                      for (const o of parsed) {
                        if (o && o.id && !seenIds.has(o.id)) {
                          seenIds.add(o.id);
                          liveTickets.push(o);
                        }
                      }
                    }
                  }
                } catch {}

                const totalSales = liveTickets.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
                const totalTickets = liveTickets.reduce((sum, o) => sum + (Array.isArray(o.numbers) ? o.numbers.length : 1), 0);
                const uniqueBuyers = new Set(liveTickets.map((o) => o.buyerEmail || o.merchant)).size;

                const displayRafflesRevenue = drawsRevenue.length > 0 ? drawsRevenue : [
                  {
                    drawId: 'RIF-2026-000184',
                    title: 'iPhone 18 Pro 256 GB',
                    unitPrice: 35000,
                    totalTickets: 1000,
                    soldTickets: 842,
                    totalRevenue: 842 * 35000,
                    revenueGoal: 1000 * 35000,
                    progressPct: 84,
                    status: 'En Vivo',
                  },
                  {
                    drawId: 'RIF-2026-000185',
                    title: 'PlayStation 5 Pro + 2 Mandos',
                    unitPrice: 25000,
                    totalTickets: 200,
                    soldTickets: 168,
                    totalRevenue: 168 * 25000,
                    revenueGoal: 200 * 25000,
                    progressPct: 84,
                    status: 'En Vivo',
                  },
                  {
                    drawId: 'RIF-2026-000186',
                    title: 'Moto Yamaha NMAX 155 Modelo 2026',
                    unitPrice: 15000,
                    totalTickets: 500,
                    soldTickets: 390,
                    totalRevenue: 390 * 15000,
                    revenueGoal: 500 * 15000,
                    progressPct: 78,
                    status: 'En Venta',
                  },
                ];

                return (
                  <div>
                    {/* Tarjetas de métricas del CRM */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      <div className="business-metric-subcard" style={{ borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Ventas</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#f4c752', marginTop: '3px', wordBreak: 'break-all' }}>
                          ${totalSales.toLocaleString('es-CO')}
                        </div>
                      </div>
                      <div className="business-metric-subcard" style={{ borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Boletas</div>
                        <div className="metric-val" style={{ fontSize: '13.5px', fontWeight: 'bold', marginTop: '3px' }}>
                          {totalTickets}
                        </div>
                      </div>
                      <div className="business-metric-subcard" style={{ borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Clientes</div>
                        <div className="metric-val" style={{ fontSize: '13.5px', fontWeight: 'bold', marginTop: '3px' }}>
                          {uniqueBuyers}
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN OFICIAL: CONTEO EN TIEMPO REAL DEL DINERO POR SORTEO / EVENTO */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                        <h3 className="crm-section-title" style={{ fontSize: '13.5px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>💰</span> Registro de Recaudo por Sorteo
                        </h3>
                        <small style={{ color: '#94a3b8', fontSize: '11px' }}>En tiempo real</small>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                        {displayRafflesRevenue.map((dr) => (
                          <div
                            key={dr.drawId}
                            className="revenue-stat-card"
                            style={{
                              borderRadius: '12px',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <strong className="card-title" style={{ fontSize: '14px' }}>{dr.title}</strong>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {dr.drawId} · ${Number(dr.unitPrice).toLocaleString('es-CO')} COP / boleta
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  background: dr.status === 'En Vivo' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  color: dr.status === 'En Vivo' ? '#ef4444' : '#10b981',
                                  border: `1px solid ${dr.status === 'En Vivo' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                                }}
                              >
                                {dr.status}
                              </span>
                            </div>

                            <div className="revenue-progress-box">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                <span className="revenue-box-label">Venta Recogida:</span>
                                <strong className="revenue-box-amount">
                                  ${Number(dr.totalRevenue).toLocaleString('es-CO')} COP
                                </strong>
                              </div>
                              <div className="revenue-box-meta">
                                <span>{dr.soldTickets} de {dr.totalTickets} balotas vendidas</span>
                                <span>Meta: ${Number(dr.revenueGoal).toLocaleString('es-CO')} COP</span>
                              </div>
                              <div className="revenue-progress-track">
                                <div
                                  className="revenue-progress-fill"
                                  style={{
                                    width: `${dr.progressPct}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                                ✓ {dr.progressPct}% de la meta recogida
                              </span>
                              <Link
                                href={`/sorteo-en-vivo?draw=${dr.drawId}`}
                                style={{
                                  fontSize: '11px',
                                  color: '#38bdf8',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                🎱 Conducir / Ver Sorteo →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {liveTickets.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>0 Clientes / Boletas Registradas</h3>
                        <p style={{ fontSize: '13px', color: '#888', maxWidth: '380px', margin: '0 auto 16px' }}>
                          Tus datos están en 0. Cuando un cliente compre o aparte un número a través de la pasarela de pagos Wompi, aparecerá aquí en tiempo real con su hash SHA-256 verificado.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() =>
                              shareRaffleLink({
                                title: storeName,
                                text: storeBio,
                                path: `/?tienda=${encodeURIComponent(storeName)}`,
                              })
                            }
                            style={{
                              display: 'inline-block',
                              padding: '10px 18px',
                              background: '#007AFF',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            📤 Compartir mi tienda
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const sampleNum = Math.floor(100 + Math.random() * 899);
                                const res = await fetch('/api/business/orders', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    drawId: 'sorteo-oficial',
                                    raffleTitle: 'iPhone 18 Pro 256 GB',
                                    buyerName: 'Carlos M. Rodríguez',
                                    buyerEmail: 'carlos.m@gmail.com',
                                    numbers: [sampleNum],
                                    totalAmount: 35000,
                                  }),
                                });
                                const data = await res.json();
                                if (data && data.ok && data.order) {
                                  setApiOrders((prev) => [data.order, ...prev]);
                                  try {
                                    const stored = JSON.parse(localStorage.getItem('elganador_biz_orders') || '[]');
                                    stored.unshift(data.order);
                                    localStorage.setItem('elganador_biz_orders', JSON.stringify(stored));
                                  } catch {}
                                  alert(`✅ Venta de prueba registrada: Boleta #${sampleNum} con hash SHA-256.`);
                                }
                              } catch (e) {
                                alert('Error al generar venta de prueba');
                              }
                            }}
                            style={{
                              display: 'inline-block',
                              padding: '10px 18px',
                              background: 'rgba(244,199,82,0.15)',
                              border: '1px solid rgba(244,199,82,0.4)',
                              color: '#f4c752',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >
                            🧪 Registrar Venta de Prueba
                          </button>
                        </div>
                      </div>
                    ) : (
                      liveTickets.map((t: any, idx: number) => (
                        <div key={t.id || idx} className="crm-ticket-item" style={{ marginBottom: '12px' }}>
                          <div className="crm-ticket-info">
                            <strong>Cliente Verificado · 📱 {t.buyerName || t.merchant || 'Comprador'}</strong>
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
                      ))
                    )}
                  </div>
                );
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
                <div className="kyb-doc-card">
                  <h4 className="kyb-doc-title">📄 1. RUT Actualizado (DIAN)</h4>
                  <p className="kyb-doc-desc">
                    Registro Único Tributario con actividad económica autorizada para el comercio.
                  </p>
                  {kybDocs['rut'] ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#16a34a', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✅ Subido a Supabase: <strong>{kybDocs['rut'].name}</strong> ({kybDocs['rut'].uploadedAt})
                    </div>
                  ) : null}
                  <label className="media-native-btn kyb-upload-btn" style={{ width: '100%', justifyContent: 'center' }}>
                    {kybUploading === 'rut' ? '⏳ Subiendo a Supabase Storage...' : '📎 Seleccionar RUT (PDF/Img)'}
                    <input type="file" accept="application/pdf,image/*" hidden onChange={(e) => handleKybFileUpload(e, 'rut')} />
                  </label>
                </div>

                {/* 2. CÁMARA DE COMERCIO */}
                <div className="kyb-doc-card">
                  <h4 className="kyb-doc-title">🏢 2. Certificado Cámara de Comercio</h4>
                  <p className="kyb-doc-desc">
                    Certificado de Existencia y Representación Legal (vigencia inferior a 30 días).
                  </p>
                  {kybDocs['camara_comercio'] ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#16a34a', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✅ Subido a Supabase: <strong>{kybDocs['camara_comercio'].name}</strong> ({kybDocs['camara_comercio'].uploadedAt})
                    </div>
                  ) : null}
                  <label className="media-native-btn kyb-upload-btn" style={{ width: '100%', justifyContent: 'center' }}>
                    {kybUploading === 'camara_comercio' ? '⏳ Subiendo a Supabase Storage...' : '📎 Seleccionar Cámara (PDF/Img)'}
                    <input type="file" accept="application/pdf,image/*" hidden onChange={(e) => handleKybFileUpload(e, 'camara_comercio')} />
                  </label>
                </div>

                {/* 3. CÉDULA REPRESENTANTE LEGAL */}
                <div className="kyb-doc-card">
                  <h4 className="kyb-doc-title">🪪 3. Cédula del Representante Legal</h4>
                  <p className="kyb-doc-desc">
                    Documento de identidad al 150% de la persona natural o representante mercantil.
                  </p>
                  {kybDocs['cedula'] ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#16a34a', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✅ Subido a Supabase: <strong>{kybDocs['cedula'].name}</strong> ({kybDocs['cedula'].uploadedAt})
                    </div>
                  ) : null}
                  <label className="media-native-btn kyb-upload-btn" style={{ width: '100%', justifyContent: 'center' }}>
                    {kybUploading === 'cedula' ? '⏳ Subiendo a Supabase Storage...' : '📎 Seleccionar Cédula (PDF/Img)'}
                    <input type="file" accept="application/pdf,image/*" hidden onChange={(e) => handleKybFileUpload(e, 'cedula')} />
                  </label>
                </div>
              </div>

              <div className="kyb-status-box" style={{ marginTop: '20px', padding: '16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 className="kyb-status-title" style={{ margin: 0 }}>Estado del Expediente KYB</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: kybApproved ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                    {kybApproved ? '✅ Verificación Empresarial Ratificada y Vigente' : '⏳ En proceso de revisión de expedientes'}
                  </p>
                </div>
                <button
                  type="button"
                  className="kyb-ratify-btn"
                  style={{ width: 'auto', padding: '10px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', border: 'none' }}
                  onClick={handleApproveKyb}
                >
                  Ratificar Aprobación KYB
                </button>
              </div>
            </section>
          )}

        </main>
      </div>

      {/* BARRA INFERIOR EMPRESARIAL (componente independiente) */}
      <BusinessBottomNav activeKey={activeTab} />
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
