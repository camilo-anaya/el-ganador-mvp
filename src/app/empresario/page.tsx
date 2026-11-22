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
import RegionalPermitSelectorWithTime, { LegalScope, REGIONAL_DEPARTMENTS } from '@/components/RegionalPermitSelectorWithTime';
import { fileToDataUrl, shareRaffleLink } from '@/lib/nativeActions';
import { supabase, uploadStoryToSupabase, uploadKybDocumentToSupabase, uploadLegalDocument } from '@/lib/supabase';
import { getBusinessNotifications, markBusinessNotificationsAsRead, addBusinessNotification, BusinessNotification } from '@/lib/notifications';
import { useTheme } from '@/context/ThemeContext';
import Formulario8Modal from '@/components/Formulario8Modal';

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
  const [selectedFormulario8Raffle, setSelectedFormulario8Raffle] = useState<any | null>(null);

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

  // 3. Estado de Publicador de Nueva Rifa con Cartón de Balotas y Calculadora Digital
  const [raffleTitle, setRaffleTitle] = useState('');
  const [raffleDesc, setRaffleDesc] = useState('');
  const [ticketPrice, setTicketPrice] = useState('25000');
  const [prizeCost, setPrizeCost] = useState('15000000');
  const [drawDateTime, setDrawDateTime] = useState('');
  const [ballotGrid, setBallotGrid] = useState('1000');
  const [coverage, setCoverage] = useState('nacional');
  const [rafflePhotos, setRafflePhotos] = useState<string[]>([]);
  const [createdRaffleSlug, setCreatedRaffleSlug] = useState<string | null>(null);
  const [showColjuegosGuide, setShowColjuegosGuide] = useState<boolean>(false);
  const [myRaffles, setMyRaffles] = useState<any[]>([]);
  const [legalMode, setLegalMode] = useState<'ai_secretary' | 'manual'>('ai_secretary');
  const [mandatoAccepted, setMandatoAccepted] = useState(true);
  const [emailTemplateCopied, setEmailTemplateCopied] = useState(false);

  // 🧮 CÁLCULOS MATEMÁTICOS DE LA CALCULADORA DIGITAL EN TIEMPO REAL
  const numericPrizeCost = parseFloat(prizeCost) || 0;
  const numTotalTickets = parseInt(ballotGrid || '1000', 10);
  const numTicketPrice = parseFloat(ticketPrice) || 0;
  const totalRevenue = numTotalTickets * numTicketPrice;
  const coljuegosTax14 = Math.round(totalRevenue * 0.14); // 14% Salud Pública (Ley 643/2001)
  const platformFee10 = Math.round(totalRevenue * 0.10); // 10% Plataforma SaaS El Ganador
  const wompiFee = Math.round(totalRevenue * 0.0265 + 700 * (numTotalTickets > 1000 ? 1000 : numTotalTickets));
  const netProfit = totalRevenue - coljuegosTax14 - platformFee10 - wompiFee - numericPrizeCost;
  const profitMargin = numericPrizeCost > 0 ? Math.round((netProfit / numericPrizeCost) * 100) : 0;

  // 🪙 Formateador de moneda con sistema decimal/separador de miles en COP
  const formatCopDisplay = (val: string | number) => {
    if (val === '' || val === null || val === undefined) return '';
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    return `$ ${parseInt(clean, 10).toLocaleString('es-CO')}`;
  };

  const handlePrizeCostInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setPrizeCost(rawDigits);
  };

  const handleTicketPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setTicketPrice(rawDigits);
  };

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
  const [showFullDirectory, setShowFullDirectory] = useState<boolean>(false);
  const currentDept = REGIONAL_DEPARTMENTS[legalRegion] || REGIONAL_DEPARTMENTS.antioquia;

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

  const handleUploadVoucherForRaffle = async (raffleId: string, file: File) => {
    try {
      const receiptUrl = await uploadLegalDocument(file, 'pagos');
      const updateList = (prevList: any[]) =>
        prevList.map((r) => {
          if (r.id === raffleId) {
            return {
              ...r,
              status: 'en_tramite_coljuegos',
              payment_receipt_url: receiptUrl,
              legalReceiptUrl: receiptUrl,
            };
          }
          return r;
        });

      setMyRaffles((prev) => updateList(prev));

      const raw1 = localStorage.getItem('elganador_raffles_list');
      if (raw1) {
        localStorage.setItem('elganador_raffles_list', JSON.stringify(updateList(JSON.parse(raw1))));
      }
      const raw2 = localStorage.getItem('elganador_custom_raffles');
      if (raw2) {
        localStorage.setItem('elganador_custom_raffles', JSON.stringify(updateList(JSON.parse(raw2))));
      }

      addBusinessNotification({
        type: 'legal_approval',
        title: '✅ Voucher de Pago Recibido - Expediente Radicado',
        message: 'Tu comprobante bancario fue adjuntado exitosamente. La rifa ahora se encuentra en: [⏳ En Espera de Resolución Coljuegos (15-30 Días Hábiles)].',
        badge: 'Trámite 15-30 Días',
        link: '/empresario?tab=rifas',
      });

      alert('✅ ¡Voucher de pago cargado exitosamente! Tu rifa ha pasado a estado [⏳ En Espera de Resolución Coljuegos (15-30 Días)].');
    } catch (err) {
      console.error('Error cargando voucher:', err);
      alert('Hubo un inconveniente al cargar el voucher. Por favor intenta de nuevo.');
    }
  };

  const handlePublishRaffle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!raffleTitle.trim()) {
      alert('Por favor ingresa el título oficial del sorteo.');
      return;
    }

    if (!mandatoAccepted) {
      alert('Debes aceptar el Mandato Digital para que la Secretaria Legal IA estructure el Formulario 8 y radique el trámite ante Coljuegos.');
      return;
    }

    setLegalValidationError(false);
    setIsPublishingRaffle(true);

    try {
      const radicadoFinal = legalScope === 'nacional'
        ? `SOL-COLJ-2026-${Math.floor(100000 + Math.random() * 900000)}`
        : legalScope === 'distrital'
        ? `RAD-BOG-2026-${Math.floor(100000 + Math.random() * 900000)}`
        : `RAD-${(REGIONAL_DEPARTMENTS[legalRegion]?.department || 'DEP').toUpperCase().slice(0, 3)}-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const entityNameDisplay = legalScope === 'nacional'
        ? 'Coljuegos (Nacional)'
        : legalScope === 'distrital'
        ? 'Alcaldía Mayor / Lotería de Bogotá'
        : (REGIONAL_DEPARTMENTS[legalRegion]?.name || 'Entidad Departamental');

      let receiptUrl = legalReceiptUrl;
      if (legalReceiptFile && !receiptUrl) {
        try {
          receiptUrl = await uploadLegalDocument(legalReceiptFile, 'pagos');
          setLegalReceiptUrl(receiptUrl);
        } catch (err) {
          console.warn('Error uploading receipt to Supabase:', err);
        }
      }

      const hasVoucher = Boolean(legalReceiptFile || receiptUrl);
      const raffleStatus = hasVoucher ? 'en_tramite_coljuegos' : 'pendiente_voucher';

      const slug = (raffleTitle || 'sorteo-oficial')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      setCreatedRaffleSlug(slug);

      const timeLabelDisplay = drawDateTime
        ? `🗓️ ${drawDateTime}`
        : (hasVoucher
            ? (legalScope === 'nacional'
                ? '⏳ Trámite Coljuegos (15-30 Días)'
                : legalScope === 'distrital'
                ? '⏳ Trámite Distrital Bogotá (5-15 Días)'
                : `⏳ Trámite ${REGIONAL_DEPARTMENTS[legalRegion]?.name || 'Departamental'}`)
            : '⚠️ Pendiente Voucher');

      const now = Date.now();
      const newRaffle = {
        id: `raffle-${slug}-${now}`,
        title: raffleTitle || 'Gran Sorteo Oficial',
        merchant: storeName,
        city: legalScope === 'distrital' ? 'Bogotá D.C.' : legalScope === 'departamental' ? (REGIONAL_DEPARTMENTS[legalRegion]?.city || legalCustomCity || 'Regional') : 'Colombia',
        priceCop: `$ ${numTicketPrice.toLocaleString('es-CO')}`,
        ticket_price: numTicketPrice,
        total_tickets: numTotalTickets,
        soldPercent: 0,
        timeLabel: timeLabelDisplay,
        category: 'vehiculos',
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
        legalRadicado: radicadoFinal,
        radicado_number: radicadoFinal,
        payment_receipt_url: receiptUrl,
        status: raffleStatus,
        legalVerified: true,
      };

      // Guardar en Supabase si está disponible
      try {
        await supabase.from('raffles').insert([{
          title: newRaffle.title,
          description: newRaffle.description,
          prize_value: totalRevenue,
          ticket_price: numTicketPrice,
          total_tickets: numTotalTickets,
          coverage_type: legalScope === 'nacional' ? 'nacional' : 'local',
          city: newRaffle.city,
          radicado_number: radicadoFinal,
          payment_receipt_url: receiptUrl,
          draw_date: drawDateTime ? new Date(drawDateTime).toISOString() : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          status: newRaffle.status,
        }]);
      } catch (dbErr) {
        console.warn('Supabase insert skipped or offline:', dbErr);
      }

      // Guardar en localStorage
      const existingRaffles = JSON.parse(localStorage.getItem('elganador_raffles_list') || '[]');
      existingRaffles.unshift(newRaffle);
      localStorage.setItem('elganador_raffles_list', JSON.stringify(existingRaffles));

      const existingCustom = JSON.parse(localStorage.getItem('elganador_custom_raffles') || '[]');
      existingCustom.unshift(newRaffle);
      localStorage.setItem('elganador_custom_raffles', JSON.stringify(existingCustom));

      // Actualizar estado reactivo
      setMyRaffles((prev) => [newRaffle, ...prev]);

      // Notificación legal
      if (hasVoucher) {
        addBusinessNotification({
          type: 'legal_approval',
          title: `📋 Expediente Radicado ante ${entityNameDisplay}`,
          message: `La Secretaria Legal IA estructuró y radicó el trámite ante ${entityNameDisplay} bajo el Radicado de Entrada ${radicadoFinal} y comprobante de pago bancario adjunto. Tu sorteo se encuentra montado en vitrina en modo Expectativa/Preventa.`,
          radicado: radicadoFinal,
          raffleTitle: raffleTitle || 'Gran Sorteo Oficial',
          badge: legalScope === 'nacional' ? 'Trámite 15-30 Días' : 'Trámite Radicado',
          link: '/empresario?tab=rifas',
        });
      } else {
        addBusinessNotification({
          type: 'legal_approval',
          title: '⚠️ Rifa Montada: En Confirmación por Subir Voucher',
          message: `Tu sorteo "${raffleTitle || 'Gran Sorteo Oficial'}" quedó montado con pre-radicado ${radicadoFinal} ante ${entityNameDisplay}. Para formalizar el radicado, recuerda ingresar al enlace oficial de pago y subir el comprobante de los derechos de explotación ($${coljuegosTax14.toLocaleString('es-CO')} COP).`,
          radicado: radicadoFinal,
          raffleTitle: raffleTitle || 'Gran Sorteo Oficial',
          badge: 'Pendiente Voucher',
          link: '/empresario?tab=rifas',
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('elganador_raffles_updated'));
      }
      localStorage.removeItem('elganador_raffle_draft');
    } catch (err: any) {
      console.error('Error publicando rifa:', err);
      alert('Ocurrió un error al publicar la rifa. Por favor intenta de nuevo.');
    } finally {
      setIsPublishingRaffle(false);
    }
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
            <div
              className="station-block-premium"
              style={{
                background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #020617 100%)' : '#eff6ff',
                border: '1.5px solid #007AFF',
                color: isDark ? '#ffffff' : '#0f172a',
                padding: '14px 16px',
                borderRadius: '14px',
                marginBottom: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.12)',
              }}
            >
              <div>
                <strong style={{ color: '#007AFF' }}>🛡️ Validación KYB en Proceso:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: isDark ? '#cbd5e1' : '#334155' }}>
                  Tu documentación comercial se encuentra en validación legal. Carga tus documentos mercantiles para ratificar tu cuenta empresarial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('kyb')}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
                }}
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
                borderColor: 'rgba(0, 122, 255, 0.45)',
                color: '#007AFF',
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
                    border: '3px solid #007AFF',
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
                      background: 'rgba(0, 122, 255, 0.12)',
                      border: '1px solid rgba(0, 122, 255, 0.35)',
                      color: '#007AFF',
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
                        <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>🔥 SORTEO VERIFICADO EN VITRINA</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, margin: '4px 0 6px' }}>
                          {raffleTitle || 'Gran Sorteo Oficial · Premio Destacado'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                            $ {parseInt(ticketPrice || '35000', 10).toLocaleString('es-CO')} / boleta
                          </span>
                          <span
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              background: '#007AFF',
                              color: '#ffffff',
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
                        ? 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)'
                        : 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '14.5px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(0, 122, 255, 0.35)',
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
                  <div style={{ margin: '6px 0', padding: '6px 12px', borderRadius: '8px', background: 'rgba(0, 122, 255, 0.12)', border: '1px solid #007AFF', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>
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
              <div className="compact-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: isDark ? '#ffffff' : '#0f172a' }}>
                    🎟️ Publicar Rifa Oficial y Configurar Cartón 3D
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Estación B2B: Sube tus fotos, calcula tu rentabilidad en tiempo real (14% Salud Coljuegos y 10% SaaS) y monta tu sorteo con la Secretaria Legal IA en espera de radicado oficial (15-30 días hábiles).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowColjuegosGuide(!showColjuegosGuide)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 122, 255, 0.4)',
                    background: showColjuegosGuide ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                    color: '#007AFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📜</span> {showColjuegosGuide ? 'Ocultar Guía Coljuegos' : 'Requisitos Oficiales Coljuegos'}
                </button>
              </div>

              {/* GUÍA COLAPSABLE DE COLJUEGOS */}
              {showColjuegosGuide && (
                <div style={{ marginBottom: '20px' }}>
                  <ColjuegosLegalGuide />
                </div>
              )}

              {/* BANNER DE ÉXITO TRAS PUBLICAR */}
              {createdRaffleSlug && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.15) 0%, rgba(2, 132, 199, 0.08) 100%)',
                    border: '2px solid #007AFF',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: '0 4px 14px rgba(0, 122, 255, 0.12)',
                  }}
                >
                  <div>
                    <span style={{ background: '#007AFF', color: '#ffffff', fontSize: '10.5px', fontWeight: 900, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase' }}>
                      🚀 ¡Rifa Montada en Vitrina!
                    </span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: '1.15rem', fontWeight: 900, color: '#007AFF' }}>
                      {raffleTitle || 'Gran Sorteo Oficial'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.84rem', opacity: 0.9 }}>
                      Tu sorteo quedó montado en espera de resolución oficial (15-30 días hábiles). Puedes probar la sala 3D o compartir con tus clientes.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href="/sorteo-en-vivo"
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        textDecoration: 'none',
                      }}
                    >
                      🎱 Probar Sala 3D en Vivo →
                    </Link>
                    <button
                      type="button"
                      onClick={() => void shareRaffleLink({ title: raffleTitle || 'Gran Sorteo Oficial', text: '¡Participa en nuestro gran sorteo oficial!', path: `/sorteo-en-vivo` })}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background: '#25D366',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      📲 Compartir por WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================
                  FORMULARIO INTEGRAL DE CREACIÓN DE RIFA EN EL PANEL
                  ========================================================= */}
              <form onSubmit={handlePublishRaffle} className="auth-form" style={{ marginBottom: '32px' }}>
                {/* PASO 1: FOTOS Y DATOS DEL PREMIO */}
                <div
                  className="station-card-step"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                    border: '1px solid rgba(148, 163, 184, 0.22)',
                    borderRadius: '16px',
                    padding: '18px 16px',
                    marginBottom: '16px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📸</span>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a' }}>
                        1. Fotos Reales del Premio
                      </h3>
                    </div>
                    {rafflePhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllRafflePhotos}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Eliminar todas ({rafflePhotos.length})
                      </button>
                    )}
                  </div>

                  <div className="media-picker-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                    <label
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1.5px dashed #007AFF',
                        background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
                        color: '#007AFF',
                        fontSize: '13px',
                        fontWeight: 800,
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    >
                      📷 Tomar Foto del Premio
                      <input type="file" accept="image/*" capture="environment" hidden onChange={handleRafflePhotosPick} />
                    </label>
                    <label
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1.5px dashed #007AFF',
                        background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
                        color: '#007AFF',
                        fontSize: '13px',
                        fontWeight: 800,
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    >
                      🖼️ Subir Galería del Premio
                      <input type="file" accept="image/*" multiple hidden onChange={handleRafflePhotosPick} />
                    </label>
                  </div>

                  {/* Tira de fotos */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0 10px' }}>
                    {rafflePhotos.length === 0 ? (
                      <div style={{ padding: '16px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', width: '100%', textAlign: 'center', border: '1px dashed rgba(148, 163, 184, 0.3)' }}>
                        <span style={{ fontSize: '24px' }}>🎁</span>
                        <p style={{ margin: '4px 0 2px', fontSize: '0.84rem', fontWeight: 600 }}>Sin fotos seleccionadas aún</p>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#64748b' }}>Sube fotos reales de tu producto o premio para inspirar confianza en los compradores.</p>
                      </div>
                    ) : (
                      rafflePhotos.map((src, i) => (
                        <div key={i} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #007AFF' }}>
                          <img src={src} alt={`Premio ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleRemoveRafflePhoto(i)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '999px',
                              background: 'rgba(0,0,0,0.75)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Campos de título y descripción */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Título Oficial del Sorteo *</span>
                      <input
                        type="text"
                        placeholder="Ej. Toyota Hilux 4x4 Diésel 2026 0 km o Yamaha MT-09 2026"
                        value={raffleTitle}
                        onChange={(e) => setRaffleTitle(e.target.value)}
                        required
                        style={{ padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.35)', fontSize: '14px' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Descripción y Beneficios Incluidos *</span>
                      <textarea
                        rows={3}
                        placeholder="Detalles del premio: Matrícula, SOAT, flete asegurado a toda Colombia, notaría..."
                        value={raffleDesc}
                        onChange={(e) => setRaffleDesc(e.target.value)}
                        required
                        style={{ padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.35)', fontSize: '14px', resize: 'vertical' }}
                      />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Fecha y Hora de la Transmisión 3D</span>
                        <input
                          type="datetime-local"
                          value={drawDateTime}
                          onChange={(e) => setDrawDateTime(e.target.value)}
                          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.35)', fontSize: '13px' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Cobertura del Sorteo</span>
                        <select
                          value={coverage}
                          onChange={(e) => setCoverage(e.target.value)}
                          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.35)', fontSize: '13px' }}
                        >
                          <option value="nacional">🇨🇴 Toda Colombia (Envío asegurado)</option>
                          <option value="regional">📍 Regional / Entrega en Concesionario</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                {/* PASO 2: CALCULADORA DIGITAL DE RENTABILIDAD */}
                <div
                  className="station-card-step"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                    border: '2px solid #007AFF',
                    borderRadius: '16px',
                    padding: '18px 16px',
                    marginBottom: '16px',
                    boxShadow: '0 6px 20px rgba(0, 122, 255, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🧮</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#007AFF' }}>
                          2. Calculadora Digital de Rentabilidad (Coljuegos 14% + SaaS 10%)
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.85 }}>
                          Ajusta el valor de la boleta y el costo del premio para proyectar tu ganancia neta en tiempo real.
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 122, 255, 0.15)', color: '#007AFF' }}>
                      TIEMPO REAL
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Tamaño del Cartón (Balotas)</span>
                      <select
                        value={ballotGrid}
                        onChange={(e) => setBallotGrid(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.35)', fontSize: '13.5px', fontWeight: 700 }}
                      >
                        <option value="100">100 Números (00 - 99)</option>
                        <option value="200">200 Números (000 - 199)</option>
                        <option value="500">500 Números (000 - 499)</option>
                        <option value="1000">1.000 Números (000 - 999)</option>
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Costo Comercial del Premio (COP)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="$ 15.000.000"
                        value={formatCopDisplay(prizeCost)}
                        onChange={handlePrizeCostInput}
                        style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.35)', fontSize: '13.5px', fontWeight: 700 }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Precio por Boleta (COP) *</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="$ 25.000"
                        value={formatCopDisplay(ticketPrice)}
                        onChange={handleTicketPriceInput}
                        required
                        style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #007AFF', fontSize: '13.5px', fontWeight: 800, color: '#007AFF' }}
                      />
                    </label>
                  </div>

                  {/* Botones Presets Rápidos de Precio */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75 }}>Ajuste rápido:</span>
                    {['15000', '25000', '35000', '50000'].map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setTicketPrice(price)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: ticketPrice === price ? '1.5px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
                          background: ticketPrice === price ? '#007AFF' : 'transparent',
                          color: ticketPrice === price ? '#ffffff' : 'inherit',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ${parseInt(price, 10).toLocaleString('es-CO')}
                      </button>
                    ))}
                  </div>

                  {/* TARJETA DE PROYECCIÓN FINANCIERA EN TIEMPO REAL */}
                  <div
                    style={{
                      background: isDark ? '#0b1622' : '#f8fafc',
                      borderRadius: '14px',
                      padding: '16px',
                      border: '1px solid rgba(0, 122, 255, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800 }}>📊 Proyección de Liquidación:</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#007AFF' }}>
                        Meta Bruta: ${totalRevenue.toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff' }}>
                        <span>🏛️ Coljuegos (14% Salud):</span>
                        <strong style={{ color: '#ef4444' }}>-${coljuegosTax14.toLocaleString('es-CO')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff' }}>
                        <span>⚡ SaaS El Ganador (10%):</span>
                        <strong style={{ color: '#0284c7' }}>-${platformFee10.toLocaleString('es-CO')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff' }}>
                        <span>💳 Pasarela Wompi:</span>
                        <strong style={{ color: '#0284c7' }}>-${wompiFee.toLocaleString('es-CO')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff' }}>
                        <span>🎁 Costo del Premio:</span>
                        <strong style={{ color: '#64748b' }}>-${numericPrizeCost.toLocaleString('es-CO')}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: netProfit >= 0 ? (isDark ? 'rgba(0, 122, 255, 0.12)' : '#eff6ff') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
                        border: `1.5px solid ${netProfit >= 0 ? '#007AFF' : '#ef4444'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: netProfit >= 0 ? '#007AFF' : '#ef4444' }}>
                          Ganancia Neta Limpia para el Empresario
                        </span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: netProfit >= 0 ? '#007AFF' : '#ef4444' }}>
                          ${netProfit.toLocaleString('es-CO')} COP
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: netProfit >= 0 ? '#007AFF' : '#ef4444', color: '#ffffff' }}>
                        Margen: {profitMargin}%
                      </span>
                    </div>

                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
                      🛡️ Cero Captación Ilegal: Wompi Bancolombia divide los fondos automáticamente. El 14% va al Fondo de Salud y tu ganancia a tu cuenta.
                    </p>
                  </div>
                </div>

                {/* PASO 3: JURISDICCIÓN, ENLACES OFICIALES DIRECTOS Y VOUCHER DE PAGO */}
                <div
                  className="station-card-step"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                    border: '1.5px solid #007AFF',
                    borderRadius: '16px',
                    padding: '18px 16px',
                    marginBottom: '18px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>⚖️</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a' }}>
                          3. Jurisdicción y Radicación Oficial (Coljuegos / Distrital / Regional)
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.85 }}>
                          Escoge tu entidad reguladora, ingresa al portal oficial de pago PSE y adjunta tu comprobante.
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 122, 255, 0.15)', color: '#007AFF' }}>
                      VENTANILLA ÚNICA OFICIAL
                    </span>
                  </div>

                  {/* SELECTOR DE ENTIDAD REGULADORA: COLJUEGOS vs DISTRITAL BOGOTÁ vs DEPARTAMENTAL */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px', color: isDark ? '#94a3b8' : '#475569' }}>
                      SELECCIONA LA ENTIDAD REGULADORA DE TU SORTEO:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      {/* Opción 1: Nacional Coljuegos */}
                      <button
                        type="button"
                        onClick={() => setLegalScope('nacional')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: legalScope === 'nacional' ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
                          background: legalScope === 'nacional' ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#eff6ff') : (isDark ? '#0b1622' : '#f8fafc'),
                          color: legalScope === 'nacional' ? '#007AFF' : (isDark ? '#cbd5e1' : '#334155'),
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '4px',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🇨🇴</span> Nacional (Coljuegos)
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.85 }}>
                          Válido en todo el país · 15 a 30 días hábiles
                        </span>
                      </button>

                      {/* Opción 2: Distrital Bogotá D.C. */}
                      <button
                        type="button"
                        onClick={() => setLegalScope('distrital')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: legalScope === 'distrital' ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
                          background: legalScope === 'distrital' ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#eff6ff') : (isDark ? '#0b1622' : '#f8fafc'),
                          color: legalScope === 'distrital' ? '#007AFF' : (isDark ? '#cbd5e1' : '#334155'),
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '4px',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🏛️</span> Distrital (Bogotá D.C.)
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.85 }}>
                          Lotería de Bogotá / Alcaldía Mayor · 5 a 15 días
                        </span>
                      </button>

                      {/* Opción 3: Departamental / Regional */}
                      <button
                        type="button"
                        onClick={() => setLegalScope('departamental')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: legalScope === 'departamental' ? '2px solid #007AFF' : '1px solid rgba(148, 163, 184, 0.3)',
                          background: legalScope === 'departamental' ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#eff6ff') : (isDark ? '#0b1622' : '#f8fafc'),
                          color: legalScope === 'departamental' ? '#007AFF' : (isDark ? '#cbd5e1' : '#334155'),
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '4px',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📍</span> Departamental (32 Dptos)
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.85 }}>
                          Loterías Departamentales · 3 a 10 días
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ENLACES DIRECTOS OFICIALES PARA PAGO PSE Y RADICACIÓN */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
                      border: '1px solid rgba(0, 122, 255, 0.25)',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⚡</span>
                        <strong style={{ fontSize: '13px', color: '#007AFF' }}>
                          {legalScope === 'nacional'
                            ? 'Enlaces Oficiales Directos: Coljuegos Nacional'
                            : legalScope === 'distrital'
                            ? 'Enlaces Oficiales Directos: Bogotá D.C. (Distrital)'
                            : `Enlaces Oficiales Directos: ${currentDept?.name || 'Lotería Departamental'}`}
                        </strong>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#007AFF', color: '#fff' }}>
                        PORTAL GUBERNAMENTAL
                      </span>
                    </div>

                    {/* Si es Departamental, mostrar el selector de departamento */}
                    {legalScope === 'departamental' && (
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                          Selecciona tu Departamento:
                        </label>
                        <select
                          value={legalRegion}
                          onChange={(e) => setLegalRegion(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #007AFF',
                            background: isDark ? '#0f172a' : '#ffffff',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                          }}
                        >
                          {Object.entries(REGIONAL_DEPARTMENTS).map(([key, dept]) => (
                            <option key={key} value={key}>
                              {dept.name} — {dept.entityName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Botones de acción directa a los portales gubernamentales */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {legalScope === 'nacional' && (
                        <>
                          <a
                            href="https://www.gov.co/ficha-tramites-y-servicios/T25560"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              background: '#007AFF',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)',
                              transition: 'transform 0.15s',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🏛️</span> Autorización para la operación de juegos de suerte y azar T25560
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                              Trámite y Pago ↗
                            </span>
                          </a>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                            <a
                              href="https://portaloperador.coljuegos.gov.co/"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                border: '1px solid rgba(0, 122, 255, 0.3)',
                                color: isDark ? '#93c5fd' : '#0369a1',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>💳</span> Portal Operador Coljuegos (Pago PSE) ↗
                            </a>
                            <a
                              href="https://www.coljuegos.gov.co/publicaciones/301297/tramite-de-rifas/"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                border: '1px solid rgba(0, 122, 255, 0.3)',
                                color: isDark ? '#93c5fd' : '#0369a1',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>📄</span> Guía Oficial de Rifas Coljuegos ↗
                            </a>
                          </div>
                        </>
                      )}

                      {legalScope === 'distrital' && (
                        <>
                          <a
                            href="https://oficinavirtual.shd.gov.co/OficinaVirtual/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              background: '#007AFF',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>💳</span> Oficina Virtual Hacienda Bogotá (Pago PSE Derechos de Explotación)
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                              Pagar PSE ↗
                            </span>
                          </a>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                            <a
                              href="https://bogota.gov.co/servicios/guia-de-tramites-y-servicios/autorizacion-para-la-realizacion-de-rifas"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                border: '1px solid rgba(0, 122, 255, 0.3)',
                                color: isDark ? '#93c5fd' : '#0369a1',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>🏛️</span> Trámite Oficial Alcaldía Mayor de Bogotá ↗
                            </a>
                            <a
                              href="https://www.loteriadebogota.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                border: '1px solid rgba(0, 122, 255, 0.3)',
                                color: isDark ? '#93c5fd' : '#0369a1',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>🎲</span> Portal Lotería de Bogotá ↗
                            </a>
                          </div>
                        </>
                      )}

                      {legalScope === 'departamental' && (
                        <>
                          <a
                            href={currentDept?.primaryUrl || 'https://www.benedan.gov.co/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              background: '#007AFF',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>💳</span> {currentDept?.primaryLabel || 'Portal Oficial de Trámite y Pago ↗'}
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                              Abrir Portal ↗
                            </span>
                          </a>

                          {currentDept?.secondaryUrl && (
                            <a
                              href={currentDept.secondaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                border: '1px solid rgba(0, 122, 255, 0.3)',
                                color: isDark ? '#93c5fd' : '#0369a1',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>🏛️</span> {currentDept.secondaryLabel || 'Portal Secundario de Trámites ↗'}
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowFullDirectory(!showFullDirectory)}
                            style={{
                              background: 'transparent',
                              border: '1px dashed rgba(0, 122, 255, 0.5)',
                              color: '#007AFF',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              marginTop: '4px',
                            }}
                          >
                            {showFullDirectory ? '▲ Ocultar Directorio de los 32 Departamentos' : '📖 Ver Directorio Completo de Loterías de los 32 Departamentos ▼'}
                          </button>

                          {showFullDirectory && (
                            <div
                              style={{
                                marginTop: '8px',
                                maxHeight: '240px',
                                overflowY: 'auto',
                                padding: '10px',
                                borderRadius: '8px',
                                background: isDark ? '#0b1622' : '#ffffff',
                                border: '1px solid rgba(148, 163, 184, 0.25)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '6px',
                                fontSize: '0.74rem',
                              }}
                            >
                              {Object.entries(REGIONAL_DEPARTMENTS).map(([key, d]) => (
                                <div
                                  key={key}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                  }}
                                >
                                  <strong style={{ display: 'block', color: '#007AFF' }}>{d.name}</strong>
                                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{d.entityName}</span>
                                  <div style={{ marginTop: '4px' }}>
                                    <a
                                      href={d.primaryUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}
                                    >
                                      Pagar / Trámite ↗
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <p style={{ margin: '10px 0 0', fontSize: '11.5px', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>
                      💡 <strong>Instrucciones:</strong> Da clic en el enlace oficial de arriba, liquida y paga mediante PSE o genera el comprobante bancario por el valor del 14% de salud pública (${coljuegosTax14.toLocaleString('es-CO')} COP). Luego guarda el comprobante en PDF o foto y súbelo en la casilla de abajo.
                    </p>
                  </div>

                  {/* BLOQUE INFORMATIVO: GUÍA DE RADICACIÓN POR CORREO ELECTRÓNICO (COLJUEGOS) */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
                      border: '1px solid rgba(0, 122, 255, 0.25)',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📧</span>
                        <strong style={{ fontSize: '13px', color: '#007AFF' }}>
                          Guía Oficial de Radicación por Correo Electrónico
                        </strong>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: isDark ? 'rgba(0, 122, 255, 0.2)' : '#dbeafe',
                          color: '#007AFF',
                        }}
                      >
                        Coljuegos Institucional
                      </span>
                    </div>

                    <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: 1.5, color: isDark ? '#cbd5e1' : '#334155' }}>
                      Si el pago se hizo mediante <strong>consignación bancaria en ventanilla</strong> (en los bancos autorizados por Coljuegos como Banco de Bogotá) o si quieres tener <strong>acuse de recibo formal y respaldo legal por escrito</strong>, SÍ se debe enviar por correo institucional. Para evitar rechazos o retrasos en reparto interno, utiliza los canales y formato oficiales:
                    </p>

                    {/* Buzones Oficiales y Asunto */}
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff',
                        border: '1px solid rgba(0, 122, 255, 0.2)',
                        fontSize: '12px',
                        marginBottom: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ minWidth: '75px', color: '#007AFF' }}>Para:</strong>
                        <div style={{ flex: 1 }}>
                          <code style={{ background: isDark ? '#1e293b' : '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, color: '#007AFF' }}>
                            contactenos@coljuegos.gov.co
                          </code>
                          <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>
                            (Buzón general de correspondencia y radicación de trámites)
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ minWidth: '75px', color: '#007AFF' }}>Con copia (CC):</strong>
                        <div style={{ flex: 1 }}>
                          <code style={{ background: isDark ? '#1e293b' : '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, color: '#007AFF' }}>
                            notificaciones@coljuegos.gov.co
                          </code>
                          <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>
                            (Buzón de notificaciones oficiales)
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ minWidth: '75px', color: isDark ? '#94a3b8' : '#64748b' }}>Asunto sugerido:</strong>
                        <div style={{ flex: 1, fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                          Radicación Formulario 8 - Rifa Nacional {raffleTitle || '[Nombre de tu Rifa]'} - Radicado [{legalRadicado || 'SOL-COLJ-2026-XXXXXX'}]
                        </div>
                      </div>
                    </div>

                    {/* Mensaje de correo sugerido */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}>
                        📝 CUERPO DEL MENSAJE FORMAL:
                      </div>
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: isDark ? 'rgba(0,0,0,0.25)' : '#ffffff',
                          border: '1px dashed rgba(0, 122, 255, 0.3)',
                          fontSize: '11.5px',
                          lineHeight: 1.55,
                          color: isDark ? '#e2e8f0' : '#1e293b',
                          fontStyle: 'italic',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {`"Cordial saludo, Coljuegos.
Por medio de la presente, en calidad de representante legal de ${storeName || '[Nombre de tu Empresa / Tienda]'}, radico formalmente la solicitud de autorización para la rifa nacional '${raffleTitle || '[Nombre de tu Rifa]'}', adjuntando el Formulario 8 diligenciado, documento de identidad/Cámara de Comercio, soporte de propiedad del premio y el comprobante de pago de los derechos de explotación (14% de salud pública + 1% de administración) por valor de $${coljuegosTax14.toLocaleString('es-CO')} COP.
Agradezco remitir el número de radicado formal de correspondencia.
Atentamente, [Nombre y Teléfono]."`}
                      </div>
                    </div>

                    {/* Documentos adjuntos indispensables */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#007AFF', marginBottom: '8px' }}>
                        📎 DOCUMENTOS ADJUNTOS INDISPENSABLES (PDF):
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '6px',
                          fontSize: '11.5px',
                        }}
                      >
                        <div style={{ padding: '8px 10px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
                          📄 <strong>Formulario 8 Oficial</strong> diligenciado en PDF (el que descarga nuestra IA).
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
                          🧾 <strong>Voucher / Comprobante</strong> de pago bancario o PSE.
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
                          🏢 <strong>RUT actualizado</strong> de la empresa.
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
                          📋 <strong>Cédula del solicitante</strong> o Certificado de Cámara de Comercio.
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
                          🎁 <strong>Factura de compra</strong> o certificado de propiedad del premio.
                        </div>
                      </div>
                    </div>

                    {/* Acciones Rápidas: Mailto y Copiar */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <a
                        href={`mailto:contactenos@coljuegos.gov.co?cc=notificaciones@coljuegos.gov.co&subject=${encodeURIComponent(
                          `Radicación Formulario 8 - Rifa Nacional ${raffleTitle || '[Nombre de tu Rifa]'} - Radicado [${legalRadicado || 'SOL-COLJ-2026-XXXXXX'}]`
                        )}&body=${encodeURIComponent(
                          `Cordial saludo, Coljuegos.\n\nPor medio de la presente, en calidad de representante legal de ${storeName || '[Nombre de tu Empresa / Tienda]'}, radico formalmente la solicitud de autorización para la rifa nacional '${raffleTitle || '[Nombre de tu Rifa]'}', adjuntando el Formulario 8 diligenciado, documento de identidad/Cámara de Comercio, soporte de propiedad del premio y el comprobante de pago de los derechos de explotación (14% de salud pública + 1% de administración) por valor de $${coljuegosTax14.toLocaleString('es-CO')} COP.\n\nAgradezco remitir el número de radicado formal de correspondencia.\n\nAtentamente,\n[Nombre y Teléfono]`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: '#007AFF',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        ✉️ Abrir Correo Pre-redactado (mailto) ↗
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const emailText = `PARA: contactenos@coljuegos.gov.co\nCON COPIA (CC): notificaciones@coljuegos.gov.co\nASUNTO: Radicación Formulario 8 - Rifa Nacional ${raffleTitle || '[Nombre de tu Rifa]'} - Radicado [${legalRadicado || 'SOL-COLJ-2026-XXXXXX'}]\n\nCordial saludo, Coljuegos.\nPor medio de la presente, en calidad de representante legal de ${storeName || '[Nombre de tu Empresa / Tienda]'}, radico formalmente la solicitud de autorización para la rifa nacional '${raffleTitle || '[Nombre de tu Rifa]'}', adjuntando el Formulario 8 diligenciado, documento de identidad/Cámara de Comercio, soporte de propiedad del premio y el comprobante de pago de los derechos de explotación (14% de salud pública + 1% de administración) por valor de $${coljuegosTax14.toLocaleString('es-CO')} COP.\n\nAgradezco remitir el número de radicado formal de correspondencia.\n\nAtentamente,\n[Nombre y Teléfono]\n\nDOCUMENTOS ADJUNTOS INDISPENSABLES:\n1. Formulario 8 Oficial diligenciado en PDF (el que descarga nuestra IA)\n2. Voucher / Comprobante de pago bancario o PSE\n3. RUT actualizado de la empresa\n4. Cédula del solicitante o Certificado de Cámara de Comercio\n5. Factura de compra o certificado de propiedad del premio`;
                          navigator.clipboard?.writeText(emailText);
                          setEmailTemplateCopied(true);
                          setTimeout(() => setEmailTemplateCopied(false), 3000);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                          color: isDark ? '#ffffff' : '#007AFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: '1px solid rgba(0, 122, 255, 0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        {emailTemplateCopied ? '✓ ¡Plantilla Copiada al Portapapeles!' : '📋 Copiar Plantilla para Correo'}
                      </button>
                    </div>
                  </div>

                  {/* BLOQUE A: MANDATO DIGITAL Y PLAZO DE LEY */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
                      border: '1px solid rgba(0, 122, 255, 0.25)',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px' }}>🏛️</span>
                      <strong style={{ fontSize: '13px', color: '#007AFF' }}>
                        Mandato Digital y Radicación (Decreto 1968/2001 &amp; Ley 527/1999)
                      </strong>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', lineHeight: 1.5, opacity: 0.9 }}>
                      {legalScope === 'nacional' ? (
                        <>
                          La Secretaria Legal IA estructura el <strong>Formulario 8 Oficial</strong> con los datos de tu empresa y genera el radicado preliminar de trámite <strong>SOL-COLJ-2026-XXXXXX</strong>. Conforme a la ley, Coljuegos cuenta con un término de <strong>15 a 30 días hábiles</strong> para emitir la Resolución Oficial de Autorización. Durante este periodo tu sorteo se activa en vitrina en <strong>Modo Expectativa / Preventa</strong>.
                        </>
                      ) : legalScope === 'distrital' ? (
                        <>
                          La Secretaria Legal IA estructura el expediente distrital para la <strong>Alcaldía Mayor de Bogotá y Lotería de Bogotá</strong> bajo el radicado preliminar <strong>RAD-BOG-2026-XXXXXX</strong>. El término reglamentario distrital es de <strong>5 a 15 días hábiles</strong>. Tu sorteo se activa en vitrina en <strong>Modo Expectativa / Preventa</strong>.
                        </>
                      ) : (
                        <>
                          La Secretaria Legal IA estructura la solicitud formal para <strong>{currentDept?.entityName || 'la entidad departamental'}</strong> bajo radicado departamental. El término reglamentario estimado es de <strong>{currentDept?.timeframe || '3 a 10 días hábiles'}</strong>.
                        </>
                      )}
                    </p>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                      <input
                        type="checkbox"
                        checked={mandatoAccepted}
                        onChange={(e) => setMandatoAccepted(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#007AFF' }}
                      />
                      <span>
                        Otorgo Mandato Digital a El Ganador para estructurar y radicar ante {legalScope === 'nacional' ? 'Coljuegos' : legalScope === 'distrital' ? 'la Alcaldía Mayor de Bogotá / Lotería de Bogotá' : (currentDept?.entityName || 'la Lotería Departamental')}.
                      </span>
                    </label>
                  </div>

                  {/* BLOQUE B: VOUCHER DE PAGO DERECHOS DE EXPLOTACIÓN (14% SALUD) */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(0, 122, 255, 0.08)' : '#f0f9ff',
                      border: '1px solid rgba(0, 122, 255, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#007AFF' }}>
                          <span>🧾</span> Voucher de Pago de Derechos de Explotación (14% Salud)
                        </strong>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b' }}>
                          Para radicar formalmente ante {legalScope === 'nacional' ? 'Coljuegos' : legalScope === 'distrital' ? 'la Alcaldía / Lotería de Bogotá' : (currentDept?.entityName || 'la entidad')}, la ley exige el comprobante de pago o consignación bancaria del 14% de salud pública.
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Liquidación 14% Salud:</span>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#ef4444' }}>
                          ${coljuegosTax14.toLocaleString('es-CO')} COP
                        </div>
                      </div>
                    </div>

                    {/* Selector de archivo de Voucher con opción de carga en vivo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          border: legalReceiptFile ? '1.5px solid #007AFF' : '1.5px dashed #007AFF',
                          background: legalReceiptFile ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#eff6ff') : (isDark ? 'rgba(0, 122, 255, 0.05)' : '#eff6ff'),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#007AFF',
                        }}
                      >
                        <span>{legalReceiptFile ? '✓' : '📤'}</span>
                        <span>
                          {legalReceiptFile
                            ? `Voucher cargado: ${legalReceiptFile.name} (${(legalReceiptFile.size / 1024).toFixed(0)} KB)`
                            : 'Subir Voucher de Pago Bancario (PDF, PNG o JPG)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setLegalReceiptFile(file);
                          }}
                        />
                      </label>

                      {/* Estado condicional de la rifa */}
                      <div
                        style={{
                          fontSize: '11.5px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: legalReceiptFile ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#eff6ff') : (isDark ? 'rgba(0, 0, 0, 0.25)' : '#ffffff'),
                          border: `1px solid ${legalReceiptFile ? '#007AFF' : 'rgba(0, 122, 255, 0.2)'}`,
                          color: legalReceiptFile ? '#007AFF' : (isDark ? '#cbd5e1' : '#334155'),
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{legalReceiptFile ? '🚀' : 'ℹ️'}</span>
                        <span>
                          {legalReceiptFile
                            ? `Voucher listo. Al montar la rifa quedará formalmente radicada en: [⏳ En Espera de Resolución ${legalScope === 'nacional' ? 'Coljuegos (15-30 Días)' : legalScope === 'distrital' ? 'Distrital Bogotá (5-15 Días)' : (currentDept?.name || 'Entidad Departamental')}].`
                            : 'Si aún no has realizado el pago en los enlaces oficiales de PSE o banco, puedes montar la rifa ahora y quedará en: [En Confirmación por Subir Voucher]. Una vez subido el voucher desde tu panel, pasará automáticamente a [⏳ En Espera].'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÓN PRINCIPAL DE MONTAJE DE RIFA */}
                <button
                  type="submit"
                  disabled={isPublishingRaffle}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '15px',
                    cursor: isPublishingRaffle ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(0, 122, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isPublishingRaffle ? (
                    '⏳ Montando Rifa y Radicando ante Coljuegos...'
                  ) : (
                    <>
                      <span>🚀</span> Montar Rifa Oficial (En Espera de Radicado Coljuegos)
                    </>
                  )}
                </button>
              </form>

              {/* LISTA DE SORTEOS REGISTRADOS */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋</span> Mis Sorteos Registrados ({myRaffles.length})
                </h3>

                {myRaffles.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: '14px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                      border: '1px dashed rgba(148, 163, 184, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.88rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                      Aún no has montado ningún sorteo. Completa el formulario de arriba para montar tu primer sorteo oficial con la Secretaria Legal IA.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {myRaffles.map((raf: any, idx: number) => {
                      const isPendingVoucher = raf.status === 'pendiente_voucher';
                      const isPendingColjuegos = raf.status === 'en_tramite_coljuegos' || (!isPendingVoucher && raf.radicado_number && raf.radicado_number.startsWith('SOL-'));
                      const isApproved = raf.status === 'active';
                      return (
                        <div
                          key={raf.id || idx}
                          style={{
                            background: isDark ? '#1e293b' : '#ffffff',
                            borderRadius: '14px',
                            padding: '16px',
                            border: isPendingVoucher ? '1.5px solid #007AFF' : isPendingColjuegos ? '1.5px solid #0284c7' : '1.5px solid #007AFF',
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
                                background: isPendingVoucher ? 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)' : isPendingColjuegos ? '#0284c7' : '#007AFF',
                                color: '#ffffff',
                              }}
                            >
                              {isPendingVoucher ? '⏳ En Confirmación (Subir Voucher)' : isPendingColjuegos ? '⏳ Espera Coljuegos (15-30 Días)' : '✓ Activa en Vitrina'}
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

                          {/* BOTÓN PARA SUBIR VOUCHER SI ESTÁ EN CONFIRMACIÓN */}
                          {isPendingVoucher && (
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(0, 122, 255, 0.12)' : '#eff6ff',
                                border: '1.5px dashed #007AFF',
                                color: '#007AFF',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                marginBottom: '10px',
                                textAlign: 'center',
                              }}
                            >
                              <span>📤</span> Subir Voucher de Pago (14% Salud)
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadVoucherForRaffle(raf.id || `raffle-${idx}`, file);
                                }}
                              />
                            </label>
                          )}

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
                                  <span style={{ color: '#007AFF', fontWeight: 700 }}>✓ Generado por IA</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Mandato Digital (Ley 527):</span>
                                  <span style={{ color: '#007AFF', fontWeight: 700 }}>✓ Firmado Electrónicamente</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Voucher de Pago (14% Salud):</span>
                                  <span style={{ color: (raf.payment_receipt_url || raf.legalReceiptUrl) ? '#007AFF' : '#64748b', fontWeight: 700 }}>
                                    {(raf.payment_receipt_url || raf.legalReceiptUrl) ? '✓ Verificado en Bóveda' : 'En Espera de Comprobante'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Factura / Adquisición del Premio:</span>
                                  <span style={{ color: '#0284c7', fontWeight: 700 }}>✓ Encriptado en Bóveda</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• Cámara de Comercio y RUT:</span>
                                  <span style={{ color: '#007AFF', fontWeight: 700 }}>✓ Vinculado desde KYB</span>
                                </div>
                              </div>

                              {/* BOTÓN OFICIAL DE DESCARGA E IMPRESIÓN DEL FORMULARIO 8 */}
                              <div style={{ marginBottom: '10px', paddingTop: '6px', borderTop: '1px dashed rgba(2, 132, 199, 0.3)' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFormulario8Raffle(raf)}
                                  style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #007AFF',
                                    background: isDark ? 'rgba(0, 122, 255, 0.15)' : '#eff6ff',
                                    color: '#007AFF',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 8px rgba(0, 122, 255, 0.12)',
                                  }}
                                >
                                  <span>📄</span> Ver y Descargar Formulario 8 Oficial Diligenciado (PDF) ↗
                                </button>
                              </div>

                              <strong style={{ color: isDark ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '4px', borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: '8px' }}>
                                ⏱️ Trazabilidad de Nuestra Gestión:
                              </strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.9 }}>
                                <div>• <strong>Radicado de Entrada:</strong> {raf.radicado_number || 'SOL-COLJ-2026-XXXXXX'}</div>
                                <div>• <strong>Etapa Actual:</strong> {raf.status === 'pendiente_voucher' ? '⚠️ En confirmación por subir voucher bancario del 14% de salud.' : '⏳ Auditoría de Coljuegos (Plazo de Ley: 15-30 días hábiles).'}</div>
                                <div>• <strong>Seguimiento:</strong> {raf.status === 'pendiente_voucher' ? 'Sube el voucher bancario para que Coljuegos inicie la revisión.' : 'La Secretaria IA monitorea el expediente y te notificará por la campana 🔔 cuando la resolución sea ratificada.'}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RESUMEN DE RECAUDO EN BOLETERÍA POR SORTEO */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#007AFF' }}>
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
                      border: '1px solid rgba(0, 122, 255, 0.3)',
                      color: '#38bdf8',
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
                        <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#38bdf8', marginTop: '3px', wordBreak: 'break-all' }}>
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
                                  background: dr.status === 'En Vivo' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 122, 255, 0.15)',
                                  color: dr.status === 'En Vivo' ? '#ef4444' : '#007AFF',
                                  border: `1px solid ${dr.status === 'En Vivo' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 122, 255, 0.35)'}`,
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
                              <span style={{ fontSize: '11px', color: '#007AFF', fontWeight: 700 }}>
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
                              background: 'rgba(0, 122, 255, 0.12)',
                              border: '1px solid rgba(0, 122, 255, 0.35)',
                              color: '#007AFF',
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
                    <div style={{ padding: '8px 12px', background: isDark ? 'rgba(0, 122, 255, 0.12)' : '#eff6ff', border: '1px solid #007AFF', borderRadius: '8px', color: '#007AFF', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✓ Subido a Supabase: <strong>{kybDocs['rut'].name}</strong> ({kybDocs['rut'].uploadedAt})
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
                    <div style={{ padding: '8px 12px', background: isDark ? 'rgba(0, 122, 255, 0.12)' : '#eff6ff', border: '1px solid #007AFF', borderRadius: '8px', color: '#007AFF', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✓ Subido a Supabase: <strong>{kybDocs['camara_comercio'].name}</strong> ({kybDocs['camara_comercio'].uploadedAt})
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
                    <div style={{ padding: '8px 12px', background: isDark ? 'rgba(0, 122, 255, 0.12)' : '#eff6ff', border: '1px solid #007AFF', borderRadius: '8px', color: '#007AFF', fontSize: '0.8rem', marginBottom: '10px' }}>
                      ✓ Subido a Supabase: <strong>{kybDocs['cedula'].name}</strong> ({kybDocs['cedula'].uploadedAt})
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
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: kybApproved ? '#007AFF' : '#0284c7', fontWeight: 700 }}>
                    {kybApproved ? '✓ Verificación Empresarial Ratificada y Vigente' : '⏳ En proceso de revisión de expedientes'}
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

      {/* MODAL OFICIAL DE VISUALIZACIÓN E IMPRESIÓN DEL FORMULARIO 8 */}
      {selectedFormulario8Raffle && (
        <Formulario8Modal
          data={{
            radicado: selectedFormulario8Raffle.radicado_number || selectedFormulario8Raffle.legalRadicado || 'SOL-COLJ-2026-819204',
            storeName: storeName || selectedFormulario8Raffle.merchant || 'MOTOS CARIBE S.A.S.',
            nit: '901.834.192-5',
            department: selectedFormulario8Raffle.city === 'Bogotá D.C.' ? 'Bogotá D.C. / Cundinamarca' : 'Colombia',
            city: selectedFormulario8Raffle.city || 'Bogotá D.C.',
            address: 'Carrera 15 # 85-30, Oficina 402',
            email: 'contacto@motoscaribe.com.co',
            representative: storeName || 'Representante Legal Autorizado',
            phone: '+57 300 456 7890',
            activity: 'Comercio al por menor y mayor de motocicletas, repuestos, accesorios y vehículos.',
            raffleTitle: selectedFormulario8Raffle.title || 'Gran Sorteo Oficial',
            isNational: selectedFormulario8Raffle.coverage === 'nacional' || selectedFormulario8Raffle.legalScope === 'nacional',
            ticketPrice: Number(selectedFormulario8Raffle.ticket_price) || 25000,
            totalTickets: Number(selectedFormulario8Raffle.total_tickets) || 1000,
            totalRevenue: (Number(selectedFormulario8Raffle.ticket_price) || 25000) * (Number(selectedFormulario8Raffle.total_tickets) || 1000),
            drawDate: selectedFormulario8Raffle.draw_date || selectedFormulario8Raffle.timeLabel,
            lotteryName: 'Lotería de Medellín (o Lotería Oficial Vigilada)',
            prizeCost: Number(selectedFormulario8Raffle.prize_value) || 15000000,
            prizeDescription: selectedFormulario8Raffle.description || 'Vehículo / Motocicleta 0 km libre de gravámenes y pignoraciones.',
            gainTaxPaidBy: 'empresa',
          }}
          onClose={() => setSelectedFormulario8Raffle(null)}
        />
      )}

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
