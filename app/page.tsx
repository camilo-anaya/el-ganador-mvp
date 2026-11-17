// src/app/page.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import DesktopScrollStrip from '@/components/DesktopScrollStrip';
import DesktopSidebar from '@/components/DesktopSidebar';
import NativeBottomTabBar from '@/components/NativeBottomTabBar';
import PublicityBanner from '@/components/PublicityBanner';
import RaffleCard from '@/components/RaffleCard';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { shareRaffleLink } from '@/lib/nativeActions';
import { useTheme } from '@/context/ThemeContext';
import StoryViewer from '@/components/StoryViewer';

interface MerchantStory {
  id: string;
  merchant: string;
  shortName: string;
  icon: string;
  avatar: string;
  storyImage: string;
  mediaType?: 'image' | 'video';
  headline: string;
  caption: string;
  timeAgo: string;
  ctaText: string;
  createdAt?: number;
  expiresAt?: number;
}

interface CompactRaffleItem {
  id: string;
  title: string;
  merchant: string;
  city: string;
  priceCop: string;
  soldPercent: number;
  timeLabel: string;
  category: string;
  image: string;
  stage: string;
  description?: string;
  ballotGrid?: number;
  photos?: string[];
}

const MERCHANT_STORIES: MerchantStory[] = [
  {
    id: 'story-motos',
    merchant: 'Motos Caribe Oficial',
    shortName: 'Motos Caribe',
    icon: '🏍️',
    avatar: '/galeria-premios-el-ganador-realista.jpg',
    storyImage: '/galeria-premios-el-ganador-realista.jpg',
    headline: '¡Llegó la Yamaha MT-09 0 km a vitrina!',
    caption: 'Ya estamos entregando boletas con matrícula incluida en Barranquilla y envíos a toda Colombia.',
    timeAgo: 'Hace 18 min',
    ctaText: 'Apartar boleta de esta moto →',
  },
  {
    id: 'story-joyas',
    merchant: 'Joyas & Diamantes ABC',
    shortName: 'Joyas ABC',
    icon: '💎',
    avatar: '/reloj-alta-gama.jpg',
    storyImage: '/reloj-alta-gama.jpg',
    headline: 'Certificado notarial listo para el sábado',
    caption: 'Cronógrafo suizo y cadena de oro 18K verificados. ¡Quedan pocos números disponibles!',
    timeAgo: 'Hace 1 h',
    ctaText: 'Ver números disponibles →',
  },
  {
    id: 'story-tech',
    merchant: 'TechStore Colombia',
    shortName: 'TechStore',
    icon: '⚡',
    avatar: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    storyImage: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    headline: '¡92% vendido! Hoy juega en Sala 3D',
    caption: 'No te quedes por fuera del combo Smartphone 5G Pro Max + Smartwatch Ultra.',
    timeAgo: 'Hace 2 h',
    ctaText: 'Últimas boletas aquí →',
  },
  {
    id: 'story-autos',
    merchant: 'AutoPremier Colombia 4x4',
    shortName: 'AutoPremier',
    icon: '🚙',
    avatar: '/galeria-premios-el-ganador-realista.jpg',
    storyImage: '/galeria-premios-el-ganador-realista.jpg',
    headline: 'Próximo gran lanzamiento 4x4 en Cali',
    caption: 'Prepárate para nuestro próximo sorteo certificado con transmisión en vivo.',
    timeAgo: 'Hace 3 h',
    ctaText: 'Explorar vitrina →',
  },
  {
    id: 'story-moda',
    merchant: 'Boutique & Calzado Elegance',
    shortName: 'Elegance',
    icon: '👠',
    avatar: '/zapatos-sandalias-dama.jpg',
    storyImage: '/zapatos-sandalias-dama.jpg',
    headline: 'Nueva colección VIP con envío nacional',
    caption: 'Participa por este bono exclusivo de diseñador desde $ 15.000 COP.',
    timeAgo: 'Hace 4 h',
    ctaText: 'Participar ahora →',
  },
  {
    id: 'story-optica',
    merchant: 'Óptica Visión VIP',
    shortName: 'Visión VIP',
    icon: '🕶️',
    avatar: '/gafas-dama-hombre.jpg',
    storyImage: '/gafas-dama-hombre.jpg',
    headline: 'Gafas polarizadas de alta gama',
    caption: 'Envíos asegurados a todo el país para nuestros ganadores.',
    timeAgo: 'Hace 5 h',
    ctaText: 'Ver sorteos activos →',
  },
];

const LIVE_MINI_ROOMS = [
  {
    id: 'live-motos',
    title: 'Yamaha MT-09 0 km',
    merchant: 'Motos Caribe Oficial',
    viewers: '1.240 viendo',
    mode: 'Balotera 3D',
    image: '/galeria-premios-el-ganador-realista.jpg',
  },
  {
    id: 'live-joyas',
    title: 'Cronógrafo & Oro 18K',
    merchant: 'Joyas & Diamantes ABC',
    viewers: '890 viendo',
    mode: 'Ruleta 50',
    image: '/reloj-alta-gama.jpg',
  },
  {
    id: 'live-tech',
    title: 'Combo Smartphone 5G',
    merchant: 'TechStore Colombia',
    viewers: '645 viendo',
    mode: 'Balotera 3D',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
  },
  {
    id: 'live-hilux',
    title: 'Toyota Hilux 4x4 Diésel',
    merchant: 'AutoPremier Colombia 4x4',
    viewers: '2.180 viendo',
    mode: 'Balotera 3D',
    image: '/galeria-premios-el-ganador-realista.jpg',
  },
];

const RAFFLES_CATALOG: CompactRaffleItem[] = [
  {
    id: 'combo-flagship-5g',
    title: 'Smartphone 5G Pro Max + Smartwatch',
    description: 'Smartphone 5G Pro Max de 256 GB liberado con pantalla OLED 120Hz, triple cámara 48 MP y Smartwatch AMOLED con monitor cardíaco. Garantía 1 año.',
    ballotGrid: 100,
    merchant: 'TechStore Colombia',
    city: 'Bogotá',
    priceCop: '$ 25.000',
    soldPercent: 92,
    timeLabel: '⏳ En 2h 15m',
    category: 'tech',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'closing_soon',
  },
  {
    id: 'yamaha-mt09-caribe',
    title: 'Yamaha MT-09 0 km + Matrícula',
    description: 'Motocicleta Yamaha MT-09 modelo 2026 0 km de concesionario oficial, incluye SOAT, matrícula a nombre del ganador e impuestos 2026 pagos.',
    ballotGrid: 100,
    merchant: 'Motos Caribe Oficial',
    city: 'Barranquilla',
    priceCop: '$ 35.000',
    soldPercent: 88,
    timeLabel: '⏳ En 4h 40m',
    category: 'motos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    stage: 'closing_soon',
  },
  {
    id: 'rolex-oro-18k',
    title: 'Cronógrafo & Cadena Oro 18K',
    description: 'Cronógrafo suizo en acero y bisel de oro, acompañado de cadena eslabonada en oro italiano 18K con certificado notarial de autenticidad.',
    ballotGrid: 100,
    merchant: 'Joyas & Diamantes ABC',
    city: 'Cartagena',
    priceCop: '$ 50.000',
    soldPercent: 64,
    timeLabel: '🗓️ Sáb 9:00 PM',
    category: 'joyas',
    image: '/reloj-alta-gama.jpg',
    stage: 'upcoming',
  },
  {
    id: 'bono-vip-moda',
    title: 'Calzado Diseñador + Gafas VIP',
    description: 'Colección de calzado artesanal de alta costura más gafas de sol polarizadas de diseñador con estuche rígido y garantía.',
    ballotGrid: 100,
    merchant: 'Boutique Elegance & Óptica VIP',
    city: 'Medellín',
    priceCop: '$ 15.000',
    soldPercent: 52,
    timeLabel: '🗓️ Dom 7:00 PM',
    category: 'moda',
    image: '/zapatos-sandalias-dama.jpg',
    stage: 'upcoming',
  },
  {
    id: 'toyota-hilux-caribe',
    title: 'Toyota Hilux 4x4 Diésel 2026',
    description: 'Camioneta Toyota Hilux 4x4 Diésel 2.8 Turbo 0 km, transmisión automática, cojinería en cuero, platón con duraliner y flete asegurado a toda Colombia.',
    ballotGrid: 200,
    merchant: 'AutoPremier Colombia 4x4',
    city: 'Cali',
    priceCop: '$ 50.000',
    soldPercent: 78,
    timeLabel: '⏳ En 6h 30m',
    category: 'vehiculos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    stage: 'closing_soon',
  },
  {
    id: 'ps5-pro-bundle',
    title: 'PlayStation 5 Pro + 2 Mandos DualSense',
    description: 'Consola PlayStation 5 Pro con disco de 2TB SSD, resolución 4K a 120 FPS, audio 3D Tempest y 2 mandos inalámbricos DualSense.',
    ballotGrid: 100,
    merchant: 'TechStore Colombia',
    city: 'Bogotá',
    priceCop: '$ 20.000',
    soldPercent: 86,
    timeLabel: '⏳ En 3h 15m',
    category: 'gaming',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'closing_soon',
  },
  {
    id: 'viaje-cancun-vip',
    title: 'Viaje a Cancún All-Inclusive (2 Personas)',
    description: 'Paquete vacacional 6 días y 5 noches en hotel 5 estrellas All-Inclusive en Riviera Maya, tiquetes aéreos ida y vuelta para dos personas.',
    ballotGrid: 100,
    merchant: 'Viajes & Sueños VIP',
    city: 'Medellín',
    priceCop: '$ 25.000',
    soldPercent: 58,
    timeLabel: '🗓️ Sáb 8:00 PM',
    category: 'viajes',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'upcoming',
  },
  {
    id: 'combo-smart-hogar',
    title: 'Smart TV 65" 4K + Barra de Sonido',
    description: 'Televisor inteligente 65 pulgadas Crystal UHD 4K con tecnología HDR10+ y barra de sonido envolvente inalámbrica Dolby Atmos.',
    ballotGrid: 100,
    merchant: 'Hogar & Confort VIP',
    city: 'Barranquilla',
    priceCop: '$ 18.000',
    soldPercent: 62,
    timeLabel: '🗓️ Dom 6:00 PM',
    category: 'hogar',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'upcoming',
  },
  {
    id: 'gafas-polarizadas-vip',
    title: 'Gafas de Sol Polarizadas + Montura VIP',
    description: 'Gafas de sol polarizadas con filtro UV400 categoría 3 y montura ergonómica en titanio liviano de alta resistencia.',
    ballotGrid: 100,
    merchant: 'Óptica Visión VIP',
    city: 'Bucaramanga',
    priceCop: '$ 12.000',
    soldPercent: 44,
    timeLabel: '🗓️ Lun 7:00 PM',
    category: 'optica',
    image: '/gafas-dama-hombre.jpg',
    stage: 'upcoming',
  },
];

const ALLIED_MERCHANTS = [
  {
    name: 'Motos Caribe Oficial',
    badge: '🏪 LOCAL OFICIAL EL GANADOR',
    badgeType: 'official',
    type: 'Concesionario Motos',
    description: 'Concesionario oficial Yamaha con entrega inmediata. Sorteos activos de motos 0 km y matrícula gratis.',
    city: 'Barranquilla, Colombia',
    meta: '⭐ 4.9 · 8.920 seguidores',
    icon: '🏍️',
    image: '/galeria-premios-el-ganador-realista.jpg',
  },
  {
    name: 'Joyas & Diamantes ABC',
    badge: '🏪 LOCAL OFICIAL EL GANADOR',
    badgeType: 'official',
    type: 'Alta Joyería & Relojes',
    description: 'Joyas de oro 18K y cronógrafos de alta gama garantizados ante notario. Participa en sus rifas exclusivas.',
    city: 'Cartagena, Colombia',
    meta: '⭐ 5.0 · 5.310 seguidores',
    icon: '💎',
    image: '/reloj-alta-gama.jpg',
  },
  {
    name: 'AutoPremier Colombia 4x4',
    badge: '🏢 MARCA ALIADA VERIFICADA',
    badgeType: 'verified',
    type: 'Concesionario Automotriz',
    description: 'Líderes en importación y venta de camionetas Toyota Hilux 2026. Financiación inmediata y peritaje certificado.',
    city: 'Cali, Colombia · Envíos Nacionales',
    meta: '⚡ Concesionario Aliado',
    icon: '🚙',
    image: '/galeria-premios-el-ganador-realista.jpg',
  },
  {
    name: 'TechStore Colombia',
    badge: '🏢 MARCA ALIADA VERIFICADA',
    badgeType: 'verified',
    type: 'Tecnología & Gadgets',
    description: 'Distribuidor tecnológico verificado. Patrocinador de la Sala 3D en vivo: 15% OFF en tienda con el cupón ELGANADOR.',
    city: 'Bogotá, Colombia',
    meta: '⚡ Patrocinador Oficial Sala 3D',
    icon: '⚡',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
  },
  {
    name: 'Boutique & Calzado Elegance',
    badge: '✨ COMERCIO ALIADO',
    badgeType: 'partner',
    type: 'Moda & Calzado Fino',
    description: 'Colección exclusiva en calzado de diseñador y vestidos de gala. Pauta comercial dirigida a clientes VIP.',
    city: 'Medellín, Colombia',
    meta: '✨ Marca Invitada',
    icon: '👠',
    image: '/zapatos-sandalias-dama.jpg',
  },
  {
    name: 'Óptica Visión VIP',
    badge: '✨ COMERCIO ALIADO',
    badgeType: 'partner',
    type: 'Salud Visual & Moda',
    description: 'Gafas de sol polarizadas y monturas de alta gama. Envíos gratis a toda Colombia para la comunidad.',
    city: 'Bucaramanga, Colombia',
    meta: '✨ Comercio Aliado',
    icon: '🕶️',
    image: '/gafas-dama-hombre.jpg',
  },
];

interface WonPrize {
  id: string;
  drawId: string;
  title: string;
  winnerNumber: string;
  merchant: string;
  date: string;
  sha256Hash: string;
  status: 'Pendiente de entrega' | 'Reclamado';
  createdAt: number;
}

const VIBRANT_AD_THEMES = [
  {
    bg: 'linear-gradient(135deg, #581c87 0%, #7e22ce 40%, #c026d3 100%)', // Púrpura y Magenta Eléctrico
    border: 'rgba(217, 70, 239, 0.7)',
    shadow: '0 12px 36px rgba(126, 34, 206, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.35)',
    tagBorder: '#f0abfc',
    btnBg: '#ffffff',
    btnText: '#701a75',
    couponBg: 'rgba(255, 255, 255, 0.22)',
    couponColor: '#ffffff',
  },
  {
    bg: 'linear-gradient(135deg, #9a3412 0%, #ea580c 40%, #f59e0b 100%)', // Fuego Solar y Ámbar Alegre
    border: 'rgba(245, 158, 11, 0.75)',
    shadow: '0 12px 36px rgba(234, 88, 12, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.35)',
    tagBorder: '#fde68a',
    btnBg: '#ffffff',
    btnText: '#9a3412',
    couponBg: 'rgba(255, 255, 255, 0.22)',
    couponColor: '#ffffff',
  },
  {
    bg: 'linear-gradient(135deg, #0369a1 0%, #0284c7 40%, #06b6d4 100%)', // Azul Caribeño y Cian Eléctrico
    border: 'rgba(56, 189, 248, 0.75)',
    shadow: '0 12px 36px rgba(2, 132, 199, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.35)',
    tagBorder: '#a5f3fc',
    btnBg: '#ffffff',
    btnText: '#075985',
    couponBg: 'rgba(255, 255, 255, 0.22)',
    couponColor: '#ffffff',
  },
  {
    bg: 'linear-gradient(135deg, #9f1239 0%, #e11d48 40%, #fb7185 100%)', // Rubí Frambuesa y Coral Radiante
    border: 'rgba(251, 113, 133, 0.75)',
    shadow: '0 12px 36px rgba(225, 29, 72, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.35)',
    tagBorder: '#fecdd3',
    btnBg: '#ffffff',
    btnText: '#881337',
    couponBg: 'rgba(255, 255, 255, 0.22)',
    couponColor: '#ffffff',
  },
  {
    bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 40%, #8b5cf6 100%)', // Azul Índigo y Violeta Neón
    border: 'rgba(139, 92, 246, 0.75)',
    shadow: '0 12px 36px rgba(59, 130, 246, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.35)',
    tagBorder: '#c4b5fd',
    btnBg: '#ffffff',
    btnText: '#1e3a8a',
    couponBg: 'rgba(255, 255, 255, 0.22)',
    couponColor: '#ffffff',
  },
  {
    bg: 'linear-gradient(135deg, #065f46 0%, #059669 40%, #10b981 100%)', // Esmeralda Radiante
    border: 'rgba(52, 211, 153, 0.75)',
    shadow: '0 12px 36px rgba(5, 150, 105, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.35)',
    tagBorder: '#a7f3d0',
    btnBg: '#ffffff',
    btnText: '#064e3b',
    couponBg: 'rgba(255, 255, 255, 0.22)',
    couponColor: '#ffffff',
  },
];

const SPONSOR_CAROUSEL_ADS = [
  {
    id: 'ad-tech',
    tag: '⚡ PATROCINADOR OFICIAL DESTACADO',
    brand: 'TechStore Colombia',
    category: 'Tecnología Flagship & Gadgets 5G · Bogotá',
    title: 'Smartphones 5G Flagship & Tecnología Premium',
    description: 'Distribuidor tecnológico verificado. Patrocinador oficial de la sala de sorteos en vivo con 20% de descuento en accesorios para compradores de boletas.',
    coupon: 'Cupón: ELGANADOR',
    ctaText: 'Ver Sorteos del Patrocinador →',
    ctaLink: '/sorteo-en-vivo',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    badge: '🎁 20% OFF en Tienda',
  },
  {
    id: 'ad-motos',
    tag: '🏍️ MARCA PATROCINADORA DESTACADA',
    brand: 'Motos Caribe & 4x4',
    category: 'Motos Deportivas & Cuatrimotos · Barranquilla / Medellín',
    title: 'Yamaha MT-09 & Cuatrimotos 4x4 0 km',
    description: 'Concesionario oficial avalado. Matrícula y SOAT gratis incluidos para todos los ganadores de boletas en El Ganador.',
    coupon: 'Bono Matrícula Gratis',
    ctaText: 'Ver Sorteos de Motos →',
    ctaLink: '/#estacion-proximos',
    image: '/premios/yamaha-xtz.jpg',
    badge: '⚡ Entrega Inmediata',
  },
  {
    id: 'ad-autos',
    tag: '🚗 PATROCINADOR PLATINO VIP',
    brand: 'AutoNorte Camionetas',
    category: 'Vehículos 4x4 & Camionetas Diésel · Cali / Bogotá',
    title: 'Toyota Hilux 4x4 Diésel & SUVs Blindadas',
    description: 'Líderes en importación automotriz. Póliza todo riesgo gratuita el primer año para el número ganador verificado.',
    coupon: 'Póliza 1er Año Gratis',
    ctaText: 'Ver Rifas de Camionetas →',
    ctaLink: '/#estacion-proximos',
    image: '/premios/toyota-hilux.jpg',
    badge: '🏆 Concesionario Oficial',
  },
  {
    id: 'ad-joyas',
    tag: '💎 PATROCINADOR EXCLUSIVO',
    brand: 'Joyería & Diamantes Imperial',
    category: 'Joyas de Oro 18K & Relojes Suizos · Cartagena',
    title: 'Relojes Suizos de Lujo & Cadenas Oro 18K',
    description: 'Autenticidad notarial y certificado gemológico. Estuche de lujo y grabado personalizado gratis con tu boleta.',
    coupon: 'Grabado Notarial Gratis',
    ctaText: 'Ver Joyería Exclusiva →',
    ctaLink: '/#estacion-proximos',
    image: '/premios/joyeria-set.jpg',
    badge: '✨ Garantía de por Vida',
  },
  {
    id: 'ad-b2b',
    tag: '🚀 ESPACIO PUBLICITARIO DISPONIBLE',
    brand: 'Tu Empresa Aquí',
    category: 'Pauta Comercial para Empresas · Colombia',
    title: '¿Quieres que +50.000 clientes vean tu empresa aquí?',
    description: 'No necesitas organizar rifas para pautar. Posiciona tu negocio, tienda o marca con suscripción mensual en El Ganador.',
    coupon: 'Suscripción desde $49.000/mes',
    ctaText: 'Pautar mi Empresa Ahora →',
    ctaLink: '/publicidad',
    image: '/galeria-premios-el-ganador-realista.jpg',
    badge: '📢 +50.000 Compradores/mes',
  },
];

const INITIAL_FEED_DATA = {
  liveRooms: LIVE_MINI_ROOMS,
  raffles: RAFFLES_CATALOG,
};

const getProgressStatusClass = (pct: number) => {
  if (pct < 50) return 'status-red';
  if (pct < 85) return 'status-yellow';
  return 'status-green';
};

export default function CompactWhiteMarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAdPaused, setIsAdPaused] = useState(false);

  useEffect(() => {
    if (isAdPaused) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % SPONSOR_CAROUSEL_ADS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAdPaused]);

      const currentAdTheme = VIBRANT_AD_THEMES[currentAdIndex % VIBRANT_AD_THEMES.length];
  const { theme, setThemePreference } = useTheme();

  // Estados para Vitrina Comercial B2B y Seguir Negocios Patrocinadores
  const [selectedVitrinaAd, setSelectedVitrinaAd] = useState<(typeof SPONSOR_CAROUSEL_ADS)[0] | null>(null);
  const [followedBrands, setFollowedBrands] = useState<Record<string, boolean>>({});
  const [brandFollowerCounts, setBrandFollowerCounts] = useState<Record<string, number>>({
    'TechStore Colombia': 1580,
    'Motos Caribe & 4x4': 2340,
    'AutoNorte Camionetas': 3120,
    'Joyería & Diamantes Imperial': 1890,
    'Tu Empresa Aquí': 4850,
  });
  const [vitrinaToast, setVitrinaToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('elganador_followed_brands');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFollowedBrands(parsed);
        setBrandFollowerCounts((prev) => {
          const nextCounts = { ...prev };
          Object.keys(parsed).forEach((brand) => {
            if (parsed[brand]) {
              nextCounts[brand] = (nextCounts[brand] || 1500) + 1;
            }
          });
          return nextCounts;
        });
      }
    } catch {}
  }, []);

  const handleToggleFollow = (brandName: string) => {
    const isNowFollowing = !followedBrands[brandName];
    const nextFollowed = { ...followedBrands, [brandName]: isNowFollowing };
    setFollowedBrands(nextFollowed);
    setBrandFollowerCounts((prev) => ({
      ...prev,
      [brandName]: isNowFollowing ? (prev[brandName] || 1500) + 1 : Math.max((prev[brandName] || 1500) - 1, 0),
    }));
    try {
      localStorage.setItem('elganador_followed_brands', JSON.stringify(nextFollowed));
    } catch {}
    setVitrinaToast(
      isNowFollowing
        ? `¡Ahora sigues a ${brandName}! Recibirás notificaciones de sus próximos sorteos y ofertas.`
        : `Has dejado de seguir a ${brandName}.`
    );
    setTimeout(() => setVitrinaToast(null), 3500);
  };

  // Estados para Me Gusta en Sorteos y Publicaciones
  const [likedRaffles, setLikedRaffles] = useState<string[]>([]);
  const [raffleLikes, setRaffleLikes] = useState<Record<string, number>>({
    'rf-1': 342,
    'rf-2': 518,
    'rf-3': 189,
    'rf-4': 240,
    'rf-5': 612,
    'rf-6': 420,
    'rf-7': 195,
    'rf-8': 288,
  });

  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem('el_ganador_liked_raffles');
      if (storedLikes) {
        setLikedRaffles(JSON.parse(storedLikes));
      } else {
        const initial = ['rf-1', 'rf-2', 'rf-3'];
        setLikedRaffles(initial);
        localStorage.setItem('el_ganador_liked_raffles', JSON.stringify(initial));
      }
    } catch {}
  }, []);

  const handleToggleLikeRaffle = (raffleId: string, raffleTitle: string) => {
    const isLiked = likedRaffles.includes(raffleId);
    const next = isLiked ? likedRaffles.filter((id) => id !== raffleId) : [...likedRaffles, raffleId];
    setLikedRaffles(next);
    setRaffleLikes((prev) => ({
      ...prev,
      [raffleId]: (prev[raffleId] || 75) + (isLiked ? -1 : 1),
    }));
    try {
      localStorage.setItem('el_ganador_liked_raffles', JSON.stringify(next));
    } catch {}
    setVitrinaToast(
      isLiked
        ? `Quitaste "${raffleTitle}" de tus favoritos`
        : `¡Te gusta "${raffleTitle}"! Guardado en ⭐ Mis Favoritos.`
    );
    setTimeout(() => setVitrinaToast(null), 3500);
  };

  const [activeStoriesList, setActiveStoriesList] = useState<MerchantStory[]>(MERCHANT_STORIES);
  const [customRaffles, setCustomRaffles] = useState<CompactRaffleItem[]>([]);

  // Sincronización continua de Rifas creadas en localStorage
  useEffect(() => {
    const syncRaffles = () => {
      try {
        const raw = localStorage.getItem('elganador_custom_raffles');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCustomRaffles(parsed);
        }
      } catch {}
    };
    syncRaffles();
    window.addEventListener('storage', syncRaffles);
    window.addEventListener('elganador_raffles_updated', syncRaffles);
    return () => {
      window.removeEventListener('storage', syncRaffles);
      window.removeEventListener('elganador_raffles_updated', syncRaffles);
    };
  }, []);

  // Expiración Automática de 24 Horas en Historias de Empresas
  useEffect(() => {
    const filterAndSyncStories = () => {
      try {
        const raw = localStorage.getItem('elganador_custom_stories');
        const customStories: MerchantStory[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();

        // Filtrar únicamente historias vigentes (menor a 24 horas = 86.400.000 ms)
        const validCustomStories = customStories.filter((s) => {
          const expiresAt = s.expiresAt || ((s.createdAt || 0) + 86400000);
          return now < expiresAt;
        });

        // Purgar de forma automática las que superen las 24 horas
        if (validCustomStories.length !== customStories.length) {
          localStorage.setItem('elganador_custom_stories', JSON.stringify(validCustomStories));
        }

        setActiveStoriesList([...validCustomStories, ...MERCHANT_STORIES]);
      } catch {
        setActiveStoriesList(MERCHANT_STORIES);
      }
    };

    filterAndSyncStories();
    window.addEventListener('storage', filterAndSyncStories);
    window.addEventListener('elganador_stories_updated', filterAndSyncStories);
    const purgeInterval = setInterval(filterAndSyncStories, 60000);
    return () => {
      window.removeEventListener('storage', filterAndSyncStories);
      window.removeEventListener('elganador_stories_updated', filterAndSyncStories);
      clearInterval(purgeInterval);
    };
  }, []);

  const [activeStory, setActiveStory] = useState<MerchantStory | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Estados de Compra de Boletas y Pasarela Wompi Colombia
  const [ticketModalRaffle, setTicketModalRaffle] = useState<CompactRaffleItem | null>(null);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [buyerName, setBuyerName] = useState<string>('Carlos Martínez');
  const [buyerEmail, setBuyerEmail] = useState<string>('carlos@elganador.co');
  const [buyerPhone, setBuyerPhone] = useState<string>('+57 300 123 4567');
  const [isProcessingWompi, setIsProcessingWompi] = useState<boolean>(false);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState<{ ticketId: string; totalCop: string; numbers: string[]; hash: string } | null>(null);
  const [assignedNumbers, setAssignedNumbers] = useState<string[]>([]);
  const [modalSoldNumbers, setModalSoldNumbers] = useState<number[]>([3, 7, 14, 28, 45, 62, 88, 91]);

  const handleOpenTicketModal = (raffle: CompactRaffleItem) => {
    setTicketModalRaffle(raffle);
    const grid = raffle.ballotGrid || 100;
    const pad = grid <= 100 ? 2 : grid <= 999 ? 3 : 4;
    setTicketCount(1);
    setAssignedNumbers([String(1).padStart(pad, '0')]);
    setPurchaseSuccessData(null);

    // Cargar datos de la sesión del usuario si existen
    try {
      const stored = localStorage.getItem('elganador_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name && !buyerName) setBuyerName(parsed.name);
        if (parsed?.email && !buyerEmail) setBuyerEmail(parsed.email);
        if (parsed?.phone && !buyerPhone) setBuyerPhone(parsed.phone);
      }
    } catch {}
  };

  const handleToggleBallotNumber = (numStr: string) => {
    const numInt = parseInt(numStr, 10);
    if (modalSoldNumbers.includes(numInt)) return;

    if (assignedNumbers.includes(numStr)) {
      if (assignedNumbers.length === 1) return; // Mantener al menos 1
      const updated = assignedNumbers.filter((n) => n !== numStr);
      setAssignedNumbers(updated);
      setTicketCount(updated.length);
    } else {
      if (assignedNumbers.length >= 20) {
        alert('Puedes seleccionar hasta un máximo de 20 números por compra.');
        return;
      }
      const updated = [...assignedNumbers, numStr].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      setAssignedNumbers(updated);
      setTicketCount(updated.length);
    }
  };

  const handleTicketCountChange = (count: number) => {
    const safeCount = Math.max(1, Math.min(20, count));
    setTicketCount(safeCount);
    const grid = ticketModalRaffle?.ballotGrid || 100;
    const pad = grid <= 100 ? 2 : grid <= 999 ? 3 : 4;

    const chosen = new Set<string>();
    while (chosen.size < safeCount) {
      const randInt = Math.floor(1 + Math.random() * grid);
      if (!modalSoldNumbers.includes(randInt)) {
        chosen.add(String(randInt).padStart(pad, '0'));
      }
    }
    setAssignedNumbers(Array.from(chosen).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)));
  };

  const handlePayWithWompi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketModalRaffle) return;
    setIsProcessingWompi(true);

    const numericPrice = parseInt(ticketModalRaffle.priceCop.replace(/[^0-9]/g, ''), 10) || 35000;
    const totalAmount = numericPrice * assignedNumbers.length;
    const totalAmountInCents = totalAmount * 100;
    const ref = `TKT-${ticketModalRaffle.id}-${assignedNumbers.join('-')}-${Date.now()}`;
    const buyerMail = buyerEmail.trim() || 'carlos@elganador.co';
    const buyerNam = buyerName.trim() || 'Carlos Martínez';
    const buyerPh = buyerPhone.trim() || '+573001234567';

    // 1. Guardar ticket en billetera local
    try {
      const rawStored = localStorage.getItem('elganador_my_tickets');
      const myTickets = rawStored ? JSON.parse(rawStored) : [];
      const newTicket = {
        id: ref,
        raffleTitle: ticketModalRaffle.title,
        merchant: ticketModalRaffle.merchant,
        numbers: assignedNumbers,
        drawDate: ticketModalRaffle.timeLabel,
        status: 'pendiente_pago',
        hashSha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        priceCop: `$ ${totalAmount.toLocaleString('es-CO')}`,
      };
      myTickets.unshift(newTicket);
      localStorage.setItem('elganador_my_tickets', JSON.stringify(myTickets));
    } catch {}

    // 2. Integración Oficial Wompi (Modal Widget o Redirección Automática)
    const configuredKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_WOMPI_PUB_KEY || '';
    const publicKey = configuredKey && !configuredKey.includes('tu_llave') && !configuredKey.includes('xxxxxx')
      ? configuredKey
      : 'pub_test_Q5yDA9xoKdePiumALrhQV9RLG2ECZldD';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co';
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const redirectUrl = isLocal ? undefined : `${origin}/mis-boletas?status=aprobado&ref=${ref}`;
    const cleanPhone = buyerPh.replace(/\D/g, '').slice(-10) || '3001234567';

    // Si window.WidgetCheckout está disponible
    if (typeof window !== 'undefined' && (window as unknown as { WidgetCheckout?: new (opts: Record<string, unknown>) => { open: (cb: (res: { transaction?: { status: string } }) => void) => void } }).WidgetCheckout) {
      const WidgetCheckout = (window as unknown as { WidgetCheckout: new (opts: Record<string, unknown>) => { open: (cb: (res: { transaction?: { status: string } }) => void) => void } }).WidgetCheckout;
      const checkoutConfig: Record<string, unknown> = {
        currency: 'COP',
        amountInCents: totalAmountInCents,
        amount_in_cents: totalAmountInCents,
        reference: ref,
        publicKey,
        public_key: publicKey,
        customerData: {
          email: buyerMail,
          fullName: buyerNam,
          phoneNumber: cleanPhone,
          phoneNumberPrefix: '+57',
          legalId: '123456789',
          legalIdType: 'CC'
        },
        customer_data: {
          email: buyerMail,
          fullName: buyerNam,
          phoneNumber: cleanPhone,
          phoneNumberPrefix: '+57',
          legalId: '123456789',
          legalIdType: 'CC'
        }
      };

      if (redirectUrl) {
        checkoutConfig.redirectUrl = redirectUrl;
      }

      const checkout = new WidgetCheckout(checkoutConfig);

      checkout.open((result) => {
        setIsProcessingWompi(false);
        const transaction = result?.transaction;
        if (transaction?.status === 'APPROVED') {
          alert('🎉 ¡Pago aprobado con éxito! Tu boleta ha sido sellada y registrada.');
          window.location.href = redirectUrl || '/mis-boletas';
        } else if (transaction?.status === 'DECLINED' || transaction?.status === 'ERROR') {
          alert('⚠️ El pago no se completó. Puedes volver a intentarlo cuando gustes.');
        }
      });
      return;
    }

    // Fallback: Redirección inmediata al Checkout oficial de Wompi
    const wompiCheckoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${totalAmountInCents}&reference=${ref}&redirect-url=${encodeURIComponent(redirectUrl || '')}&customer-data:email=${encodeURIComponent(buyerMail)}&customer-data:full-name=${encodeURIComponent(buyerNam)}&customer-data:phone-number=${encodeURIComponent(buyerPh)}`;

    window.location.href = wompiCheckoutUrl;
  };
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [shareModalItem, setShareModalItem] = useState<{ id: string; title: string; merchant: string; priceCop: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [wonPrizes, setWonPrizes] = useState<WonPrize[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const touchStartYRef = useRef<number | null>(null);

  const { data: feed, isRefreshing, lastSync, refreshNow } = useRealtimeFeed(
    INITIAL_FEED_DATA,
    30000
  );

  const handleShareRaffle = (item: { id: string; title: string; merchant: string; priceCop: string }) => {
    setShareModalItem(item);
    setCopiedLink(false);
  };

  useEffect(() => {
    const loadWonPrizes = () => {
      try {
        const raw = localStorage.getItem('elganador_won_prizes');
        if (raw) {
          setWonPrizes(JSON.parse(raw));
        } else {
          setWonPrizes([]);
        }
      } catch {}
    };
    loadWonPrizes();
    window.addEventListener('storage', loadWonPrizes);
    window.addEventListener('elganador_prizes_updated', loadWonPrizes);
    return () => {
      window.removeEventListener('storage', loadWonPrizes);
      window.removeEventListener('elganador_prizes_updated', loadWonPrizes);
    };
  }, []);

  const manualRefresh = useCallback(() => {
    setSelectedCategory('all');
    setActiveStory(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    refreshNow(true);
  }, [refreshNow]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.scrollY === 0) {
      touchStartYRef.current = e.touches[0].clientY;
    } else {
      touchStartYRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    if (typeof window !== 'undefined' && window.scrollY > 0) {
      touchStartYRef.current = null;
      setPullDistance(0);
      return;
    }
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (deltaY > 0) {
      setPullDistance(Math.min(92, deltaY * 0.45));
    } else {
      setPullDistance(0);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartYRef.current !== null && typeof window !== 'undefined' && window.scrollY === 0) {
        const endY = e.changedTouches?.[0]?.clientY ?? touchStartYRef.current;
        if (endY - touchStartYRef.current > 65 || pullDistance >= 50) {
          manualRefresh();
        }
      }
      touchStartYRef.current = null;
      setPullDistance(0);
    },
    [pullDistance, manualRefresh]
  );

  const liveRoomsList = feed?.liveRooms ?? LIVE_MINI_ROOMS;
  const rafflesList = [...customRaffles, ...(feed?.raffles ?? RAFFLES_CATALOG)];

  const filterByCat = (list: typeof RAFFLES_CATALOG) => {
    if (selectedCategory === 'all') return list;
    if (selectedCategory === 'favoritos') {
      const filtered = list.filter(
        (r) => likedRaffles.includes(r.id) || !!followedBrands[r.merchant]
      );
      return filtered.length > 0 ? filtered : list.slice(0, 3);
    }
    return list.filter((r) => r.category === selectedCategory);
  };

  const closingSoonRaffles = filterByCat(
    rafflesList.filter((r) => r.stage === 'closing_soon')
  );
  const upcomingRaffles = filterByCat(
    rafflesList.filter((r) => r.stage === 'upcoming')
  );

  return (
    <div
      className="app-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* BARRA SUPERIOR NEGRA DE LUJO */}
      <header className="app-topbar">
        <div
          className="brand-cluster"
          onClick={manualRefresh}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') manualRefresh();
          }}
          style={{ cursor: 'pointer' }}
          title="Volver al inicio y actualizar"
        >
          <div>
            <span className="brand-title">EL GANADOR</span>
            <small className="brand-subtitle">Marketplace de Sorteos</small>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="sync-status-pill desktop-only-sync"
            onClick={manualRefresh}
            title="Actualizar sorteos y volver al inicio"
          >
            <span className="sync-dot-live" />
            <span className={isRefreshing ? 'sync-spinner' : ''}>🔄</span>
            <span>Actualizado {lastSync || 'ahora'}</span>
          </button>
          <Link className="live-pill-light" href="/sorteo-en-vivo">
            <span className="pulse-dot" /> En Vivo
          </Link>

          {/* SELECTOR SEGMENTADO DE TEMA (CLARO / OSCURO) SIN AMBIGÜEDAD */}
          <div
            className="theme-segmented-switch"
            role="group"
            aria-label="Selector de tema Claro y Oscuro"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              borderRadius: '999px',
              padding: '3px',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(0, 0, 0, 0.12)',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setThemePreference('light')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: theme === 'light' ? '#ffffff' : 'transparent',
                color: theme === 'light' ? '#0f172a' : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                boxShadow: theme === 'light' ? '0 2px 6px rgba(0, 0, 0, 0.15)' : 'none',
                transition: 'all 0.2s ease',
              }}
              title="Activar Modo Claro"
            >
              ☀️ Claro
            </button>
            <button
              type="button"
              onClick={() => setThemePreference('dark')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: theme === 'dark' ? '#0f172a' : 'transparent',
                color: theme === 'dark' ? '#f8fafc' : '#64748b',
                boxShadow: theme === 'dark' ? '0 2px 6px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.15)' : 'none',
                transition: 'all 0.2s ease',
              }}
              title="Activar Modo Oscuro"
            >
              🌙 Oscuro
            </button>
          </div>

          {/* CAMPANA DE NOTIFICACIONES ESTILO FACEBOOK CON BADGE ROJO 🔔 */}
          <div className="notif-bell-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className="notif-bell-btn"
              onClick={() => setShowNotifDropdown((prev) => !prev)}
              title="Premios Ganados y Notificaciones"
              aria-label="Campana de notificaciones"
            >
              <span>🔔</span>
              {wonPrizes.length > 0 && (
                <span className="notif-badge-count">{wonPrizes.length}</span>
              )}
            </button>

            {/* BANDEJA FLOTANTE ESTILO FACEBOOK */}
            {showNotifDropdown && (
              <div className="notif-fb-dropdown" role="dialog" aria-label="Bandeja de Premios Ganados">
                <div className="notif-fb-header">
                  <h3>🔔 Premios Ganados</h3>
                  <button
                    type="button"
                    className="notif-fb-close-btn"
                    onClick={() => setShowNotifDropdown(false)}
                    aria-label="Cerrar notificaciones"
                  >
                    ✕
                  </button>
                </div>

                {wonPrizes.length === 0 ? (
                  <div className="notif-empty-state">
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>🎟️</span>
                    <p style={{ margin: '0 0 4px', fontWeight: 700 }}>No tienes notificaciones pendientes</p>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      ¡Tus boletas premiadas aparecerán aquí automáticamente en tiempo real!
                    </small>
                  </div>
                ) : (
                  <div className="notif-fb-list">
                    {wonPrizes.map((prize) => (
                      <div key={prize.id} className="notif-fb-item">
                        <div className="notif-fb-icon">🏆</div>
                        <div className="notif-fb-body">
                          <strong className="notif-fb-title">{prize.title}</strong>
                          <span className="notif-fb-meta">
                            Boleta premiada: <strong>#{prize.winnerNumber}</strong> · {prize.merchant}
                          </span>
                          <span className="notif-fb-meta" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {prize.date}
                          </span>
                          <span
                            className={`notif-fb-status-pill ${
                              prize.status === 'Reclamado' ? 'claimed' : ''
                            }`}
                          >
                            {prize.status}
                          </span>
                          <Link
                            href="/mis-boletas"
                            className="notif-claim-btn"
                            onClick={() => setShowNotifDropdown(false)}
                          >
                            Ver Certificado y Reclamar →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* INDICADOR TÁCTIL PULL-TO-REFRESH DORADO / ESMERALDA */}
      <div
        className={`ptr-indicator-bar ${isRefreshing || pullDistance > 8 ? 'is-visible' : ''}`}
        style={{
          height: isRefreshing ? '46px' : `${Math.round(pullDistance)}px`,
        }}
        aria-live="polite"
      >
        <div className="ptr-pill-badge">
          <span className={`ptr-spinner-icon ${isRefreshing || pullDistance >= 50 ? 'is-spinning' : ''}`}>
            ↻
          </span>
          <span>
            {isRefreshing
              ? 'Actualizando sorteos en tiempo real...'
              : pullDistance >= 50
              ? 'Suelta para actualizar el feed'
              : 'Desliza hacia abajo para actualizar'}
          </span>
        </div>
      </div>

      <div className="desktop-workspace-grid">
        <DesktopSidebar />
        <main className="app-scroll-canvas">
          {/* HISTORIAS INTERACTIVAS DE COMERCIOS ALIADOS */}
          <section id="estacion-historias" className="stories-section-white" aria-label="Historias de comercios">
          <DesktopScrollStrip ariaLabel="Historias de tiendas">
            {activeStoriesList.map((story, idx) => (
              <button
                key={story.id}
                type="button"
                onClick={() => {
                  setActiveStory(story);
                  setActiveStoryIndex(idx);
                }}
                className="story-bubble-btn"
              >
                <div className="story-gradient-ring">
                  <img src={story.avatar} alt={story.merchant} />
                  <span className="story-badge-icon">{story.icon}</span>
                </div>
                <span className="story-name-dark">{story.shortName}</span>
              </button>
            ))}
          </DesktopScrollStrip>
        </section>

        {/* ESTACIÓN 2 (NUEVA UBICACIÓN): 📢 CARRUSEL PUBLICITARIO CONSTANTE DE PATROCINADORES (ROTATIVO CADA 4S) */}
        <section
          id="estacion-patrocinadores"
          className="official-ad-showcase vibrant-sponsor-banner"
          aria-label="Carrusel Publicitario de Patrocinadores"
          style={{
            ['--ad-vibrant-bg' as string]: currentAdTheme.bg,
            ['--ad-vibrant-border' as string]: currentAdTheme.border,
            ['--ad-vibrant-shadow' as string]: currentAdTheme.shadow,
            background: currentAdTheme.bg,
            borderColor: currentAdTheme.border,
            boxShadow: currentAdTheme.shadow,
            cursor: 'pointer',
            transition: 'background 0.8s ease, border-color 0.8s ease, box-shadow 0.8s ease',
          } as React.CSSProperties}
          onClick={() => setSelectedVitrinaAd(SPONSOR_CAROUSEL_ADS[currentAdIndex])}
          onMouseEnter={() => setIsAdPaused(true)}
          onMouseLeave={() => setIsAdPaused(false)}
          onTouchStart={() => setIsAdPaused(true)}
          onTouchEnd={() => setIsAdPaused(false)}
        >
          <div className="carousel-ad-wrapper">
            <div className="official-ad-content">
              <div className="official-ad-text">
                <div className="ad-pill-and-counter">
                  <span
                    className="official-ad-pill"
                    style={{
                      background: currentAdTheme.tagBg,
                      border: `1px solid ${currentAdTheme.tagBorder}`,
                      color: '#ffffff',
                    }}
                  >
                    {SPONSOR_CAROUSEL_ADS[currentAdIndex].tag}
                  </span>
                </div>
                <h3>{SPONSOR_CAROUSEL_ADS[currentAdIndex].title}</h3>
                <p>{SPONSOR_CAROUSEL_ADS[currentAdIndex].description}</p>

                {/* MÉTRICA EN VIVO DE CLIENTES PENDIENTES Y BOTÓN SEGUIR NEGOCIO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '6px 0 10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    👥 {(brandFollowerCounts[SPONSOR_CAROUSEL_ADS[currentAdIndex].brand] || 1580).toLocaleString()} pendientes a sus sorteos
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFollow(SPONSOR_CAROUSEL_ADS[currentAdIndex].brand);
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #ffffff',
                      background: followedBrands[SPONSOR_CAROUSEL_ADS[currentAdIndex].brand] ? '#10b981' : 'rgba(255,255,255,0.22)',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="Seguir empresa para recibir alertas de sus rifas y descuentos"
                  >
                    {followedBrands[SPONSOR_CAROUSEL_ADS[currentAdIndex].brand] ? '✓ Siguiendo (+1 pendiente)' : '🔔 Seguir Negocio'}
                  </button>
                </div>

                <div className="official-ad-actions">
                  <button
                    type="button"
                    className="btn-ad-emerald"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVitrinaAd(SPONSOR_CAROUSEL_ADS[currentAdIndex]);
                    }}
                    style={{
                      background: currentAdTheme.btnBg,
                      color: currentAdTheme.btnText,
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    🏪 Ver Vitrina & Sorteo →
                  </button>
                  <span
                    className="ad-coupon-tag"
                    style={{
                      background: currentAdTheme.couponBg,
                      color: currentAdTheme.couponColor,
                      border: '1px dashed rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {SPONSOR_CAROUSEL_ADS[currentAdIndex].coupon}
                  </span>
                  <span className="ad-badge-highlight" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f5b82e' }}>
                    {SPONSOR_CAROUSEL_ADS[currentAdIndex].badge}
                  </span>
                </div>
              </div>
              <div className="official-ad-media">
                <img
                  key={SPONSOR_CAROUSEL_ADS[currentAdIndex].id}
                  src={SPONSOR_CAROUSEL_ADS[currentAdIndex].image}
                  alt={SPONSOR_CAROUSEL_ADS[currentAdIndex].brand}
                />
              </div>
            </div>

            {/* BARRA DE CONTROLES E INDICADORES DE PAGINACIÓN */}
            <div className="ad-carousel-controls">
              <button
                type="button"
                onClick={() => setCurrentAdIndex((prev) => (prev - 1 + SPONSOR_CAROUSEL_ADS.length) % SPONSOR_CAROUSEL_ADS.length)}
                className="ad-nav-arrow"
                aria-label="Patrocinador anterior"
                title="Patrocinador anterior"
              >
                ‹
              </button>

              <div className="ad-dots-row">
                {SPONSOR_CAROUSEL_ADS.map((ad, idx) => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => setCurrentAdIndex(idx)}
                    className="ad-dot-btn"
                    style={{
                      width: currentAdIndex === idx ? '24px' : '8px',
                      background: currentAdIndex === idx ? '#f5b82e' : 'rgba(255, 255, 255, 0.28)',
                    }}
                    aria-label={`Ver patrocinador ${idx + 1}: ${ad.brand}`}
                    title={ad.brand}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentAdIndex((prev) => (prev + 1) % SPONSOR_CAROUSEL_ADS.length)}
                className="ad-nav-arrow"
                aria-label="Siguiente patrocinador"
                title="Siguiente patrocinador"
              >
                ›
              </button>
            </div>
          </div>
        </section>



        {/* FILTRO COMPACTO DE CATEGORÍAS */}
        <div className="categories-bar-surface">
          <DesktopScrollStrip ariaLabel="Categorías">
            {[
              { id: 'all', label: '✨ Todos' },
              { id: 'favoritos', label: '⭐ Mis Favoritos' },
              { id: 'motos', label: '🏍️ Motos & 4x4' },
              { id: 'vehiculos', label: '🚙 Vehículos & Camionetas' },
              { id: 'joyas', label: '💎 Joyas & Relojería' },
              { id: 'tech', label: '⚡ Tecnología & Celulares' },
              { id: 'gaming', label: '🎮 Gaming & Consolas' },
              { id: 'moda', label: '👠 Moda & Calzado VIP' },
              { id: 'viajes', label: '✈️ Viajes & Turismo' },
              { id: 'hogar', label: '🏠 Hogar & Electrodomésticos' },
              { id: 'optica', label: '🕶️ Salud Visual & Moda' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`chip-btn ${selectedCategory === cat.id ? 'chip-active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </DesktopScrollStrip>
        </div>

        {/* SECCIÓN 1: MINI RECUADROS COMPACTOS DE 🔴 SORTEOS EN VIVO */}
        <section id="estacion-en-vivo" className="station-block-premium station-live" aria-label="Sorteos en vivo">
          <div className="compact-section-title">
            <h2>🔴 Sorteos en Vivo</h2>
            <Link className="see-all-link" href="/sorteo-en-vivo">Ver todos →</Link>
          </div>

                    <DesktopScrollStrip ariaLabel="Salas en vivo">
            {liveRoomsList.map((room) => (
              <Link className="mini-live-card live-dark-luxury" href="/sorteo-en-vivo" key={room.id}>
                <div className="mini-live-visual">
                  <img src={room.image || '/galeria-premios-el-ganador-realista.jpg'} alt={room.title} loading="lazy" />
                  <div className="mini-live-overlay-badges">
                    <span className="mini-live-dot">● EN VIVO</span>
                    <span className="mini-live-viewers-tag">{room.viewers}</span>
                  </div>
                </div>
                <div className="mini-live-body">
                  <strong className="mini-live-title">{room.title}</strong>
                  <span className="mini-live-merchant">🏪 {room.merchant}</span>
                  <span className="mini-live-mode">🎱 {room.mode} · <span className="enter-live-link">Entrar →</span></span>
                </div>
              </Link>
            ))}
          </DesktopScrollStrip>
        </section>

        {/* SECCIÓN 2: RECUADROS COMPACTOS ⏳ A POCAS HORAS DE JUGAR */}
        <section id="estacion-urgentes" className="station-block-premium station-urgent" aria-label="Sorteos a pocas horas de jugar">
          <div className="compact-section-title">
            <h2>⏳ Sorteos a pocas horas de jugar</h2>
          </div>

          <DesktopScrollStrip ariaLabel="Cierre próximo">
            {closingSoonRaffles.map((item) => (
              <article key={item.id} className="compact-raffle-card card-type-urgent">
                <div
                  className="compact-raffle-media"
                  onClick={() => handleOpenTicketModal(item)}
                  style={{ cursor: 'pointer' }}
                  title="Apartar boleta y elegir número"
                >
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <span className="urgent-time-badge">{item.timeLabel}</span>
                  <span className="compact-price-tag">{item.priceCop}</span>
                </div>

                <div className="compact-raffle-body">
                  <div className="compact-merchant-row">
                    <small className="compact-merchant">🏪 {item.merchant}</small>
                    <button
                      type="button"
                      className={`btn-follow-merchant ${followedBrands[item.merchant] ? 'is-following' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(item.merchant);
                      }}
                      title={followedBrands[item.merchant] ? 'Siguiendo a esta empresa' : 'Seguir a esta empresa'}
                    >
                      {followedBrands[item.merchant] ? '✓ Siguiendo' : '+ Seguir'}
                    </button>
                  </div>
                  <h3
                    onClick={() => handleOpenTicketModal(item)}
                    style={{ cursor: 'pointer' }}
                    title="Apartar boleta y elegir número"
                  >
                    {item.title}
                  </h3>

                  {(() => {
                    const grid = item.ballotGrid || 100;
                    const soldCount = Math.round((grid * item.soldPercent) / 100);
                    const remainingCount = Math.max(0, grid - soldCount);
                    return (
                      <div className="progress-container">
                        <div className="progress-labels">
                          <span>🎟️ <strong>{soldCount}</strong> de {grid} balotas</span>
                          <strong>{item.soldPercent}% ({remainingCount} disp.)</strong>
                        </div>
                        <div className="progress-track">
                          <div className={`progress-fill ${getProgressStatusClass(item.soldPercent)}`} style={{ width: `${item.soldPercent}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="compact-card-actions-row" style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', padding: 0 }}>
                    <button
                      type="button"
                      className="btn-compact-action"
                      onClick={() => handleOpenTicketModal(item)}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '-0.25px',
                        padding: '0 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Apartar Boleta →
                    </button>
                    <button
                      type="button"
                      className={`btn-like-card-compact ${likedRaffles.includes(item.id) ? 'is-liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLikeRaffle(item.id, item.title);
                      }}
                      title={likedRaffles.includes(item.id) ? `Te gusta este sorteo (${(raffleLikes[item.id] || 45) + 1} me gusta)` : `Dar me gusta (${raffleLikes[item.id] || 45} me gusta)`}
                      aria-label="Me gusta este sorteo"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={likedRaffles.includes(item.id) ? "#ef4444" : "none"} stroke={likedRaffles.includes(item.id) ? "#ef4444" : "#94a3b8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn-share-card-compact"
                      onClick={() => handleShareRaffle(item)}
                      title="Compartir enlace de este sorteo"
                      style={{ color: '#000000', fontWeight: 800 }}
                    >
                      📤 Compartir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </DesktopScrollStrip>
        </section>

        {/* SECCIÓN 3: RECUADROS COMPACTOS 🎟️ PRÓXIMOS SORTEOS */}
        <section id="estacion-proximos" className="station-block-premium station-upcoming" aria-label="Próximos sorteos">
          <div className="compact-section-title">
            <h2>🎟️ Próximos Sorteos</h2>
          </div>

          <DesktopScrollStrip ariaLabel="Próximos sorteos">
            {upcomingRaffles.map((item) => (
              <article key={item.id} className={`compact-raffle-card card-type-upcoming card-cat-${item.category}`}>
                <div
                  className="compact-raffle-media"
                  onClick={() => handleOpenTicketModal(item)}
                  style={{ cursor: 'pointer' }}
                  title="Elegir número y comprar boleta"
                >
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <span className="compact-date-badge">{item.timeLabel}</span>
                  <span className="compact-price-tag">{item.priceCop}</span>
                </div>

                <div className="compact-raffle-body">
                  <div className="compact-merchant-row">
                    <small className="compact-merchant">🏪 {item.merchant}</small>
                    <button
                      type="button"
                      className={`btn-follow-merchant ${followedBrands[item.merchant] ? 'is-following' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(item.merchant);
                      }}
                      title={followedBrands[item.merchant] ? 'Siguiendo a esta empresa' : 'Seguir a esta empresa'}
                    >
                      {followedBrands[item.merchant] ? '✓ Siguiendo' : '+ Seguir'}
                    </button>
                  </div>
                  <h3
                    onClick={() => handleOpenTicketModal(item)}
                    style={{ cursor: 'pointer' }}
                    title="Elegir número y comprar boleta"
                  >
                    {item.title}
                  </h3>

                  {(() => {
                    const grid = item.ballotGrid || 100;
                    const soldCount = Math.round((grid * item.soldPercent) / 100);
                    const remainingCount = Math.max(0, grid - soldCount);
                    return (
                      <div className="progress-container">
                        <div className="progress-labels">
                          <span>🎟️ <strong>{soldCount}</strong> de {grid} balotas</span>
                          <strong>{item.soldPercent}% ({remainingCount} disp.)</strong>
                        </div>
                        <div className="progress-track">
                          <div className={`progress-fill ${getProgressStatusClass(item.soldPercent)}`} style={{ width: `${item.soldPercent}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="compact-card-actions-row" style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', padding: 0 }}>
                    <button
                      type="button"
                      className="btn-compact-action"
                      onClick={() => handleOpenTicketModal(item)}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '-0.25px',
                        padding: '0 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Elegir Número →
                    </button>
                    <button
                      type="button"
                      className={`btn-like-card-compact ${likedRaffles.includes(item.id) ? 'is-liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLikeRaffle(item.id, item.title);
                      }}
                      title={likedRaffles.includes(item.id) ? `Te gusta este sorteo (${(raffleLikes[item.id] || 45) + 1} me gusta)` : `Dar me gusta (${raffleLikes[item.id] || 45} me gusta)`}
                      aria-label="Me gusta este sorteo"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={likedRaffles.includes(item.id) ? "#ef4444" : "none"} stroke={likedRaffles.includes(item.id) ? "#ef4444" : "#94a3b8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn-share-card-compact"
                      onClick={() => handleShareRaffle(item)}
                      title="Compartir enlace de este sorteo"
                      style={{ color: '#000000', fontWeight: 800 }}
                    >
                      📤 Compartir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </DesktopScrollStrip>
        </section>

        

        {/* ESTACIÓN: 📢 VITRINA COMERCIAL, PAUTA PUBLICITARIA Y MARCAS ALIADAS */}
        <section id="estacion-comercial" className="station-block-premium station-showcase-commercial" aria-label="Vitrina Comercial y Marcas Aliadas">
          {/* Cabecera Vendedora con CTA visible sin hacer scroll */}
          <div className="commercial-showcase-header">
            <div>
              <div className="commercial-eyebrow-row">
                <span className="commercial-live-pill">📢 VITRINA COMERCIAL ABIERTA</span>
                <span className="commercial-audience-stat">👁️ +50.000 compradores/mes</span>
              </div>
              <h2>Marcas Aliadas & Pauta Comercial</h2>
              <p className="station-subtitle">
                Empresas, concesionarios y marcas que pautan sus productos y beneficios exclusivos en El Ganador
              </p>
            </div>

            <Link className="btn-pautar-header" href="/publicidad">
              📢 Publicidad y Marketing →
            </Link>
          </div>

          <DesktopScrollStrip ariaLabel="Vitrina Comercial y Marcas">
            {/* 1. PRIMERA TARJETA: MARCA PAUTANTE DESTACADA */}
            <article className="promo-brand-card tier-sponsor">
              <div className="promo-brand-media">
                <img src="/galeria-premios-hogar-moda-viajes-portrait.jpg" alt="TechStore Colombia" loading="lazy" />
                <div className="promo-media-gradient" />
                <span className="promo-top-badge gold">⚡ PATROCINADOR SALA 3D</span>
                <span className="promo-offer-ribbon">🎁 15% OFF Cupón: ELGANADOR</span>
              </div>

              <div className="promo-brand-body">
                <div className="promo-brand-identity">
                  <span className="promo-avatar-icon">⚡</span>
                  <div>
                    <strong>TechStore Colombia</strong>
                    <small>Tecnología & Gadgets · Bogotá</small>
                  </div>
                </div>

                <p className="promo-brand-copy">
                  Distribuidor tecnológico verificado. Beneficios y descuentos exclusivos en tienda para toda la comunidad de El Ganador.
                </p>

                <div className="promo-brand-footer">
                  <span className="promo-metric">⭐ 4.9 · Marca Verificada</span>
                  <Link className="promo-visit-btn" href="/novedades">
                    Ver Vitrina ↗
                  </Link>
                </div>
              </div>
            </article>

            {/* 2. SEGUNDA TARJETA (VISIBLE DE INMEDIATO): INVITACIÓN A PAUTAR */}
            <article className="promo-brand-card tier-advertise-cta">
              <div className="promo-cta-visual-top">
                <span className="promo-top-badge dark-gold">🚀 ESPACIO PUBLICITARIO DISPONIBLE</span>
                <h3>¿Quieres que miles de clientes vean tu empresa aquí?</h3>
                <p>
                  <strong>No necesitas organizar rifas para pautar.</strong> Promociona tu tienda, concesionario, restaurante o marca en toda Colombia.
                </p>
              </div>

              <div className="promo-brand-body">
                <ul className="promo-benefits-list">
                  <li>✓ Vitrina destacada con enlace directo a tus ofertas</li>
                  <li>✓ Alcance segmentado +50.000 usuarios activos</li>
                  <li>✓ Disponible para cualquier empresa o emprendimiento</li>
                </ul>

                <Link className="btn-cta-advertise-full" href="/publicidad">
                  ✨ Publicitar mi Empresa Ahora →
                </Link>
              </div>
            </article>

            {/* 3. RESTO DE EMPRESAS PAUTANTES Y COMERCIOS ALIADOS */}
            {[
              {
                name: 'AutoPremier Colombia 4x4',
                badge: '🏢 PAUTA AUTOMOTRIZ',
                badgeClass: 'emerald',
                offer: '🚙 Financiación Inmediata & Peritaje',
                type: 'Concesionario Automotriz · Cali',
                description: 'Líderes en importación y venta de camionetas 4x4 2026 con envíos asegurados a nivel nacional.',
                metric: '⚡ Pauta Oficial · Envíos Nacionales',
                icon: '🚙',
                image: '/galeria-premios-el-ganador-realista.jpg',
              },
              {
                name: 'Motos Caribe Oficial',
                badge: '🏆 LOCAL OFICIAL',
                badgeClass: 'emerald',
                offer: '🏍️ Motos 0 km + Matrícula Gratis',
                type: 'Concesionario Motos · Barranquilla',
                description: 'Concesionario oficial con entrega inmediata. Sorteos activos y vitrina comercial de modelos 2026.',
                metric: '⭐ 4.9 · 8.920 seguidores',
                icon: '🏍️',
                image: '/galeria-premios-el-ganador-realista.jpg',
              },
              {
                name: 'Joyas & Diamantes ABC',
                badge: '🏆 LOCAL OFICIAL',
                badgeClass: 'gold',
                offer: '💎 Oro 18K Certificado ante Notario',
                type: 'Alta Joyería & Relojes · Cartagena',
                description: 'Joyas de oro 18K y cronógrafos suizos garantizados. Vitrina exclusiva y sorteos certificados.',
                metric: '⭐ 5.0 · 5.310 seguidores',
                icon: '💎',
                image: '/reloj-alta-gama.jpg',
              },
              {
                name: 'Boutique & Calzado Elegance',
                badge: '✨ PAUTA MODA VIP',
                badgeClass: 'purple',
                offer: '👠 Colección Gala & Diseñador',
                type: 'Moda & Calzado Fino · Medellín',
                description: 'Pauta comercial dirigida a clientes VIP. Calzado de diseñador y vestidos exclusivos con envío nacional.',
                metric: '✨ Marca Invitada en Vitrina',
                icon: '👠',
                image: '/zapatos-sandalias-dama.jpg',
              },
              {
                name: 'Óptica Visión VIP',
                badge: '✨ PAUTA SALUD VISUAL',
                badgeClass: 'emerald',
                offer: '🕶️ Envío Gratis a toda Colombia',
                type: 'Salud Visual & Moda · Bucaramanga',
                description: 'Gafas de sol polarizadas y monturas de alta gama con despacho directo para la comunidad.',
                metric: '✨ Comercio Pautante',
                icon: '🕶️',
                image: '/gafas-dama-hombre.jpg',
              },
            ].map((brand) => (
              <article key={brand.name} className="promo-brand-card">
                <div className="promo-brand-media">
                  <img src={brand.image} alt={brand.name} loading="lazy" />
                  <div className="promo-media-gradient" />
                  <span className={`promo-top-badge ${brand.badgeClass}`}>{brand.badge}</span>
                  <span className="promo-offer-ribbon">{brand.offer}</span>
                </div>

                <div className="promo-brand-body">
                  <div className="promo-brand-identity">
                    <span className="promo-avatar-icon">{brand.icon}</span>
                    <div>
                      <strong>{brand.name}</strong>
                      <small>{brand.type}</small>
                    </div>
                  </div>

                  <p className="promo-brand-copy">{brand.description}</p>

                  <div className="promo-brand-footer">
                    <span className="promo-metric">{brand.metric}</span>
                    <Link className="promo-visit-btn" href="/novedades">
                      Explorar ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </DesktopScrollStrip>
        </section>

        {/* PIE DE PÁGINA LEGAL BLANCO IMPECABLE */}
        <footer className="marketplace-legal-footer">
          <strong>EL GANADOR · Colombia (+18)</strong>
          <p>
            Sorteos promocionales operados conforme a la Ley 643 de 2001 y Decreto 1486 de 2024.
            Apple Inc. y Google LLC no son patrocinadores ni tienen relación alguna con los sorteos o premios publicados en esta aplicación.
          </p>
        </footer>
      </main>
      </div>

      {/* TAB BAR INFERIOR NATIVA ESTILO IPHONE CON ICONOS VECTORIALES APPLE */}
      <NativeBottomTabBar currentTab="explorar" onExploreClick={manualRefresh} />

      {/* NOTIFICACIÓN FLOTANTE DE ENLACE COPIADO / COMPARTIDO */}
      {sharedToast && (
        <div className="shared-toast-notice" role="status" aria-live="polite">
          <span>✅ {sharedToast}</span>
        </div>
      )}


      {/* MODAL DE COMPRA DE BOLETAS Y PASARELA WOMPI COLOMBIA */}
      {ticketModalRaffle && (() => {
        const grid = ticketModalRaffle.ballotGrid || 100;
        const pad = grid <= 100 ? 2 : grid <= 999 ? 3 : 4;
        const formatNum = (n: number) => String(n).padStart(pad, '0');
        const unitPrice = parseInt(ticketModalRaffle.priceCop.replace(/[^0-9]/g, ''), 10) || 35000;
        const totalAmount = unitPrice * assignedNumbers.length;
        const soldList = modalSoldNumbers.filter((n) => n <= grid);
        const soldCount = soldList.length;
        const availableCount = Math.max(0, grid - soldCount);

        return (
          <div
            className="checkout-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Comprar Boletas con Wompi Colombia"
            onClick={() => {
              if (!isProcessingWompi) setTicketModalRaffle(null);
            }}
          >
            <div
              className="checkout-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado */}
              <div className="checkout-modal-header">
                <div>
                  <span className="checkout-legal-pill">
                    🎟️ COMPRA OFICIAL NOTARIADA · LEY 643 DE 2001
                  </span>
                  <h2 className="checkout-raffle-title">{ticketModalRaffle.title}</h2>
                  <div className="checkout-merchant-row">
                    <span>🏪 {ticketModalRaffle.merchant}</span>
                    <span>📍 {ticketModalRaffle.city}</span>
                    <span className="checkout-live-pill">🔴 Sorteo en Vivo 3D</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="checkout-close-btn"
                  onClick={() => setTicketModalRaffle(null)}
                  title="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {purchaseSuccessData ? (
                <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🎉</div>
                  <h3 style={{ color: '#007AFF', margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800 }}>¡Pago Exitoso con Wompi!</h3>
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: '0 0 18px' }}>
                    Tus boletas han sido emitidas y selladas con certificado notarial SHA-256.
                  </p>

                  <div style={{ background: 'rgba(0, 122, 255, 0.08)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(0, 122, 255, 0.25)', marginBottom: '18px' }}>
                    <div style={{ color: '#007AFF', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>
                      Boleta {purchaseSuccessData.ticketId}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', margin: '10px 0' }}>
                      {purchaseSuccessData.numbers.map((n) => (
                        <span key={n} className="checkout-number-badge blue" style={{ fontSize: '1rem', padding: '6px 14px' }}>
                          #{n}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', wordBreak: 'break-all', marginTop: '8px' }}>
                      Sello Notarial SHA-256: <code>{purchaseSuccessData.hash.slice(0, 32)}...</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link
                      href={`/sorteo-en-vivo?viewer=true&ticket=${purchaseSuccessData.numbers[0] || ''}`}
                      className="checkout-pay-btn"
                      style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '12px 22px' }}
                      onClick={() => setTicketModalRaffle(null)}
                    >
                      🔴 Entrar a la Sala 3D en Vivo
                    </Link>
                    <Link
                      href="/mis-boletas"
                      className="media-native-btn"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '12px 18px' }}
                      onClick={() => setTicketModalRaffle(null)}
                    >
                      🎫 Ver en Mis Boletas
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePayWithWompi}>
                  {/* Resumen del Artículo / Premio */}
                  <div className="checkout-prize-summary">
                    {ticketModalRaffle.image && (
                      <img
                        src={ticketModalRaffle.image}
                        alt={ticketModalRaffle.title}
                        className="checkout-prize-img"
                      />
                    )}
                    <div className="checkout-prize-info">
                      <p className="checkout-prize-desc">
                        {ticketModalRaffle.description ||
                          'Sorteo oficial respaldado ante notario público con entrega inmediata y transmisión 3D en vivo con balotera física.'}
                      </p>
                      <div className="checkout-metrics-grid">
                        <div className="checkout-metric-box">
                          <small>Precio por boleta</small>
                          <strong style={{ color: '#38bdf8' }}>{ticketModalRaffle.priceCop} COP</strong>
                        </div>
                        <div className="checkout-metric-box">
                          <small>Total de Balotas</small>
                          <strong>{grid} Balotas ({formatNum(1)} al {formatNum(grid)})</strong>
                        </div>
                        <div className="checkout-metric-box" style={{ borderLeft: '3px solid #22c55e' }}>
                          <small style={{ color: '#4ade80' }}>Balotas Disponibles</small>
                          <strong style={{ color: '#4ade80' }}>🟢 {availableCount} Disponibles</strong>
                        </div>
                        <div className="checkout-metric-box" style={{ borderLeft: '3px solid #ef4444' }}>
                          <small style={{ color: '#f87171' }}>Balotas ya Vendidas</small>
                          <strong style={{ color: '#f87171' }}>🔴 {soldCount} Vendidas</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selector Rápido y Cartón de Balotas */}
                  <div className="checkout-carton-section">
                    <div className="checkout-carton-topbar">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>
                          Cantidad de Boletas:
                        </span>
                        <strong style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
                          $ {totalAmount.toLocaleString('es-CO')} COP
                        </strong>
                      </div>
                      <div className="checkout-qty-pills">
                        {[1, 2, 5, 10].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            className={`checkout-qty-pill ${assignedNumbers.length === qty ? 'active' : ''}`}
                            onClick={() => handleTicketCountChange(qty)}
                          >
                            {qty} {qty === 1 ? 'boleta' : 'boletas'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ margin: '8px 0 10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>
                        Números asignados ({assignedNumbers.length}):
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {assignedNumbers.map((num) => (
                          <span key={num} className="checkout-number-badge" style={{ borderColor: '#d4af37', color: '#ffd700', background: 'rgba(212, 175, 55, 0.12)' }}>
                            #{num}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Desglose visual de balotas ya vendidas y disponibles */}
                    <div className="checkout-sold-breakdown">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#f87171', fontWeight: 800 }}>
                          🔴 Balotas ya vendidas ({soldCount}):
                        </span>
                        <span style={{ color: '#4ade80', fontWeight: 800 }}>
                          🟢 {availableCount} Disponibles
                        </span>
                      </div>
                      <div className="checkout-sold-chips">
                        {soldList.map((num) => (
                          <span key={num} className="checkout-sold-chip" title="Balota ya vendida e inhabilitada">
                            #{formatNum(num)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Leyenda y Cartón de Balotas Disponibles (01 al Total) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>
                        Cartón Digital ({formatNum(1)} al {formatNum(grid)}):
                      </span>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: '#94a3b8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></span> Disp.
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', background: '#007AFF', borderRadius: '2px' }}></span> Elegido
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '2px' }}></span> Vendido
                        </span>
                      </div>
                    </div>

                    {/* Cuadrícula interactiva del Cartón Digital */}
                    <div className="checkout-carton-grid">
                      {Array.from({ length: grid }, (_, i) => {
                        const numInt = i + 1;
                        const numStr = formatNum(numInt);
                        const isSold = modalSoldNumbers.includes(numInt);
                        const isSelected = assignedNumbers.includes(numStr);

                        return (
                          <button
                            key={numStr}
                            type="button"
                            disabled={isSold}
                            onClick={() => handleToggleBallotNumber(numStr)}
                            className={`checkout-carton-cell ${isSelected ? 'selected' : ''}`}
                            style={isSold ? {
                              background: 'rgba(255, 61, 0, 0.12)',
                              borderColor: 'rgba(255, 61, 0, 0.35)',
                              color: '#ff6e40',
                              textDecoration: 'line-through',
                              cursor: 'not-allowed'
                            } : undefined}
                            title={isSold ? `Número #${numStr} ya vendido` : `Seleccionar número #${numStr}`}
                          >
                            {numStr}
                          </button>
                        );
                      })}
                    </div>

                    {/* Vista previa de números seleccionados */}
                    <div className="checkout-ballots-preview">
                      <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                        Tus números seleccionados ({assignedNumbers.length}):
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {assignedNumbers.map((num) => (
                          <span key={num} className="checkout-number-badge blue">
                            #{num}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cuenta Activa de Cliente (Sin repetir datos del comprador) */}
                  <div className="checkout-active-client-box">
                    <div className="checkout-active-client-header">
                      <div className="checkout-client-badge">
                        <span className="checkout-status-dot"></span>
                        <span>Cuenta de Cliente Activa</span>
                      </div>
                      <span className="checkout-badge-verified">✓ Sesión Iniciada</span>
                    </div>

                    <div className="checkout-active-client-row">
                      <div className="checkout-client-avatar">
                        👤
                      </div>
                      <div className="checkout-client-meta">
                        <strong>{buyerName || 'Carlos Martínez'}</strong>
                        <p>{buyerEmail || 'carlos@elganador.co'} · {buyerPhone || '+57 300 123 4567'}</p>
                        <span className="checkout-auto-attach-text">
                          🔒 Compra vinculada a tu cuenta · La boleta y el certificado notarial SHA-256 se guardarán automáticamente en tu sección <strong>Mis Boletas</strong>.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pasarela PSE Activa (Pagos Seguros en Línea) */}
                  <div className="checkout-pse-container">
                    <div className="checkout-pse-header">
                      <div className="checkout-pse-badge">
                        <span className="checkout-pse-icon">⚡</span>
                        <div>
                          <strong>Pasarela PSE Activa (Pagos Seguros en Línea)</strong>
                          <p>Bancolombia, Nequi, Daviplata, BBVA, Banco de Bogotá y todos los bancos</p>
                        </div>
                      </div>
                      <span className="checkout-pse-instant">Débito Inmediato</span>
                    </div>
                  </div>

                  {/* Botón de Pago Principal con PSE */}
                  <button
                    type="submit"
                    disabled={isProcessingWompi || assignedNumbers.length === 0}
                    className="checkout-pay-btn pse"
                  >
                    {isProcessingWompi
                      ? '⏳ Conectando con PSE Colombia...'
                      : `⚡ Pagar $ ${totalAmount.toLocaleString('es-CO')} COP con PSE`}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <Link
                      href={`/comprar?raffleId=${ticketModalRaffle.id}`}
                      style={{
                        color: '#007AFF',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => setTicketModalRaffle(null)}
                    >
                      ↗ Ver cartón completo en pantalla grande
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* VISOR MODAL DE HISTORIAS MULTI-SEGMENTO ESTILO INSTAGRAM */}
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={activeStoriesList}
          initialIndex={activeStoryIndex}
          onClose={() => {
            setActiveStoryIndex(null);
            setActiveStory(null);
          }}
        />
      )}

      {/* =========================================================
          MODAL DE COMPARTIR EN REDES SOCIALES Y ENLACE DIRECTO
          ========================================================= */}
      {shareModalItem && (
        <div className="ticket-modal-backdrop" onClick={() => setShareModalItem(null)}>
          <div
            className="checkout-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="checkout-modal-header">
              <div>
                <span className="checkout-legal-pill">📢 COMPARTIR EN REDES SOCIALES</span>
                <h2 style={{ fontSize: '1.25rem', marginTop: '6px' }}>{shareModalItem.title}</h2>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  🏪 {shareModalItem.merchant} · {shareModalItem.priceCop}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalItem(null)}
                className="checkout-modal-close-btn"
                title="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '12px', lineHeight: '1.5' }}>
                Comparte este sorteo directamente en tus redes o copia el enlace oficial:
              </p>

              {/* Botones de Redes Sociales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `¡Participa en este sorteo oficial de El Ganador! 🎟️ ${shareModalItem.title} (${shareModalItem.priceCop}) de ${shareModalItem.merchant}: ${typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co'}/?sorteo=${shareModalItem.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#25D366',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none'
                  }}
                >
                  <span>💬</span> WhatsApp
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `${typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co'}/?sorteo=${shareModalItem.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#1877F2',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none'
                  }}
                >
                  <span>📘</span> Facebook
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `¡Sorteo activo en El Ganador! 🎟️ ${shareModalItem.title} (${shareModalItem.priceCop}): ${typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co'}/?sorteo=${shareModalItem.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#000000',
                    border: '1px solid #333',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none'
                  }}
                >
                  <span>𝕏</span> X (Twitter)
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    `${typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co'}/?sorteo=${shareModalItem.id}`
                  )}&text=${encodeURIComponent(shareModalItem.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#0088cc',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none'
                  }}
                >
                  <span>✈️</span> Telegram
                </a>
              </div>

              {/* Input con enlace directo y botón de copiar */}
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Enlace directo para publicar:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co'}/?sorteo=${shareModalItem.id}`}
                  style={{
                    flex: 1,
                    background: '#18181b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: '#fff'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co'}/?sorteo=${shareModalItem.id}`;
                    navigator.clipboard?.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  style={{
                    background: copiedLink ? '#007AFF' : 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)',
                    color: copiedLink ? '#fff' : '#000',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 18px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedLink ? '¡Copiado! ✓' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* NOTIFICACIÓN TOAST AL SEGUIR UN NEGOCIO */}
      {vitrinaToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          border: '1.5px solid #10b981',
          borderRadius: '14px',
          padding: '12px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          fontWeight: 700,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>🎉</span>
          <span>{vitrinaToast}</span>
        </div>
      )}

      {/* MODAL OFICIAL: VITRINA COMERCIAL DEL NEGOCIO / PATROCINADOR CON SEGUIMIENTO */}
      {selectedVitrinaAd && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedVitrinaAd(null)}
        >
          <div
            style={{
              background: theme === 'dark' ? '#18181b' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#0f172a',
              borderRadius: '24px',
              maxWidth: '540px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera con imagen del negocio */}
            <div style={{ position: 'relative', height: '180px', width: '100%', background: '#000' }}>
              <img
                src={selectedVitrinaAd.image}
                alt={selectedVitrinaAd.brand}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
              <button
                type="button"
                onClick={() => setSelectedVitrinaAd(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
              <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                <span style={{ fontSize: '10px', background: '#d4af37', color: '#000', fontWeight: 900, padding: '3px 8px', borderRadius: '6px' }}>
                  MARCA PATROCINADORA VERIFICADA
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '6px 0 2px' }}>
                  {selectedVitrinaAd.brand}
                </h2>
                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                  {selectedVitrinaAd.category}
                </p>
              </div>
            </div>

            {/* Contenido de la Vitrina */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Barra de métrica de audiencia y botón Seguir Negocio */}
              <div style={{
                background: theme === 'dark' ? '#27272a' : '#f8fafc',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: theme === 'dark' ? '#a1a1aa' : '#64748b', fontWeight: 700 }}>
                    AUDIENCIA EN TIEMPO REAL
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>
                    👥 {(brandFollowerCounts[selectedVitrinaAd.brand] || 1580).toLocaleString()} pendientes
                  </div>
                  <small style={{ fontSize: '11px', color: theme === 'dark' ? '#71717a' : '#94a3b8' }}>
                    Compradores activos atentos a sus próximos sorteos
                  </small>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFollow(selectedVitrinaAd.brand)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: followedBrands[selectedVitrinaAd.brand] ? '#10b981' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {followedBrands[selectedVitrinaAd.brand] ? '✓ Siguiendo (+1 pendiente)' : '🔔 Seguir Negocio'}
                </button>
              </div>

              {/* Descripción de la empresa y oferta comercial */}
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800 }}>
                  {selectedVitrinaAd.title}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: theme === 'dark' ? '#d4d4d8' : '#475569' }}>
                  {selectedVitrinaAd.description}
                </p>
              </div>

              {/* Cupón oficial exclusivo */}
              <div style={{
                background: 'rgba(245, 184, 46, 0.1)',
                border: '1.5px dashed #f5b82e',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                    Beneficio Oficial
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: theme === 'dark' ? '#fff' : '#0f172a' }}>
                    {selectedVitrinaAd.coupon}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('ELGANADOR');
                    alert('¡Cupón ELGANADOR copiado con éxito al portapapeles!');
                  }}
                  style={{
                    padding: '8px 14px',
                    background: '#f5b82e',
                    color: '#000',
                    fontWeight: 900,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Copiar Cupón 📋
                </button>
              </div>

              {/* Botones de acción directa para llevar al sorteo o catálogo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <Link
                  href={selectedVitrinaAd.ctaLink}
                  onClick={() => setSelectedVitrinaAd(null)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: '14px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)'
                  }}
                >
                  🎯 Ver Sorteo Vinculado de esta Empresa →
                </Link>

                <Link
                  href="/publicidad"
                  onClick={() => setSelectedVitrinaAd(null)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '11px',
                    background: 'transparent',
                    color: theme === 'dark' ? '#93c5fd' : '#0284c7',
                    fontWeight: 700,
                    fontSize: '12px',
                    textDecoration: 'underline'
                  }}
                >
                  📢 ¿Quieres pautar tu propia empresa o marca aquí? Conoce los planes B2B ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
