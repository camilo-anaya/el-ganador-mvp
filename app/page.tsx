// src/app/page.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import DesktopScrollStrip from '@/components/DesktopScrollStrip';
import DesktopSidebar from '@/components/DesktopSidebar';
import BottomNav from '@/components/BottomNav';
import PublicityBanner from '@/components/PublicityBanner';
import RaffleCard from '@/components/RaffleCard';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { shareRaffleLink } from '@/lib/nativeActions';
import { useTheme } from '@/context/ThemeContext';
import StoryViewer from '@/components/StoryViewer';
import { performLogout } from '@/lib/logout';
import { readSurface } from '@/lib/auth-role';
import {
  getWonPrizes,
  markWonPrizesAsRead,
  dismissWonPrize,
  dismissAllWonPrizes,
  claimWonPrize,
  getNotificationPrefs,
} from '@/lib/notifications';
import { scheduleLiveDrawReminder } from '@/lib/nativeNotifications';

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
    id: 'test-piloto-wompi-1000',
    title: '🧪 Prueba Piloto Pasarela Wompi Bancolombia ($1.000 COP)',
    description: 'Sorteo oficial de prueba técnica para validar la recepción de fondos reales en Wompi Bancolombia y sellado criptográfico SHA-256.',
    ballotGrid: 100,
    merchant: 'El Ganador Oficial',
    city: 'Bogotá',
    priceCop: '$ 1.000',
    soldPercent: 10,
    timeLabel: '⚡ Validación en Vivo',
    category: 'tech',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'closing_soon',
  },
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
  // --- BLOQUE ADICIONAL 1: A POCAS HORAS DE JUGAR (ÚLTIMOS CUPOS) ---
  {
    id: 'kawasaki-z900-hoy',
    title: 'Kawasaki Z900 ABS 2026 + Casco Certificado',
    description: 'Kawasaki Z900 ABS 0 km con entrega en concesionario oficial, SOAT, matrícula y casco integral certificado ECE 22.06.',
    ballotGrid: 100,
    merchant: 'Motos Caribe Oficial',
    city: 'Barranquilla',
    priceCop: '$ 40.000',
    soldPercent: 94,
    timeLabel: '⏳ En 1h 20m',
    category: 'motos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    stage: 'closing_soon',
  },
  {
    id: 'iphone-16-pro-max-hoy',
    title: 'iPhone 16 Pro Max 512 GB + AirPods Pro',
    description: 'iPhone 16 Pro Max sellado de fábrica con garantía oficial + AirPods Pro de última generación con cancelación activa de ruido.',
    ballotGrid: 100,
    merchant: 'TechStore Colombia',
    city: 'Bogotá',
    priceCop: '$ 22.000',
    soldPercent: 91,
    timeLabel: '⏳ En 1h 50m',
    category: 'tech',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'closing_soon',
  },
  {
    id: 'reloj-suizo-oro-hoy',
    title: 'Reloj Automático Edición Dorada + Pulsera',
    description: 'Reloj automático con cristal de zafiro antirreflejo, caja de acero inoxidable y pulsera en oro laminado 18K con estuche de lujo.',
    ballotGrid: 100,
    merchant: 'Joyas & Diamantes ABC',
    city: 'Cartagena',
    priceCop: '$ 30.000',
    soldPercent: 89,
    timeLabel: '⏳ En 2h 05m',
    category: 'joyas',
    image: '/reloj-alta-gama.jpg',
    stage: 'closing_soon',
  },
  {
    id: 'coleccion-gala-dama-hoy',
    title: 'Bono Boutique Gala + Vestido de Diseñador',
    description: 'Vestido de alta costura a medida más bono de $ 2.000.000 COP en accesorios y calzado exclusivo de temporada.',
    ballotGrid: 100,
    merchant: 'Boutique Elegance & Óptica VIP',
    city: 'Medellín',
    priceCop: '$ 15.000',
    soldPercent: 87,
    timeLabel: '⏳ En 2h 45m',
    category: 'moda',
    image: '/vestidos-dama.jpg',
    stage: 'closing_soon',
  },
  // --- BLOQUE PRÓXIMOS SORTEOS #2 (FECHAS FUTURAS) ---
  {
    id: 'ford-ranger-raptor-noche',
    title: 'Ford Ranger 4x4 Turbo + Tanqueo 1 Año',
    description: 'Camioneta Ford Ranger 4x4 0 km con paquete todoterreno, papeles incluidos y bono de combustible por 12 meses.',
    ballotGrid: 200,
    merchant: 'AutoPremier Colombia 4x4',
    city: 'Cali',
    priceCop: '$ 45.000',
    soldPercent: 46,
    timeLabel: '🗓️ Sáb 28 Nov · 8:00 PM',
    category: 'vehiculos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    stage: 'upcoming',
  },
  {
    id: 'macbook-pro-m4-noche',
    title: 'MacBook Pro M4 16" + Monitor 4K',
    description: 'Estación de trabajo completa: MacBook Pro chip M4 de 16 pulgadas + monitor profesional 4K UHD para creadores y empresarios.',
    ballotGrid: 100,
    merchant: 'TechStore Colombia',
    city: 'Bogotá',
    priceCop: '$ 28.000',
    soldPercent: 51,
    timeLabel: '🗓️ Dom 29 Nov · 7:00 PM',
    category: 'tech',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'upcoming',
  },
  {
    id: 'combo-zapatos-optica-noche',
    title: 'Pack Calzado Premium + 2 Gafas Polarizadas',
    description: 'Dos pares de calzado de cuero artesanal y dos gafas de sol polarizadas con estuche rígido y envío gratis a todo el país.',
    ballotGrid: 100,
    merchant: 'Óptica Visión VIP',
    city: 'Bucaramanga',
    priceCop: '$ 14.000',
    soldPercent: 38,
    timeLabel: '🗓️ Mié 2 Dic · 8:00 PM',
    category: 'optica',
    image: '/zapatos-sandalias-dama.jpg',
    stage: 'upcoming',
  },
  {
    id: 'san-andres-vip-noche',
    title: 'Escapada San Andrés VIP (4 Días · 2 Pers.)',
    description: 'Tiquetes aéreos ida y vuelta, hotel frente al mar todo incluido y tour privado en yate por los cayos.',
    ballotGrid: 100,
    merchant: 'Viajes & Sueños VIP',
    city: 'Medellín',
    priceCop: '$ 18.000',
    soldPercent: 42,
    timeLabel: '🗓️ Sáb 5 Dic · 9:00 PM',
    category: 'viajes',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'upcoming',
  },
  // --- BLOQUE ADICIONAL: PRÓXIMOS SORTEOS (GRANDES PREMIOS) ---
  {
    id: 'bmw-s1000rr-prox',
    title: 'BMW S1000RR 0 km + Equipamiento Completo',
    description: 'Superbike BMW S1000RR modelo 2026 con matrícula, SOAT, chaqueta con protecciones y casco de fibra de carbono.',
    ballotGrid: 200,
    merchant: 'Motos Caribe Oficial',
    city: 'Barranquilla',
    priceCop: '$ 55.000',
    soldPercent: 54,
    timeLabel: '🗓️ Mar 8:00 PM',
    category: 'motos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    stage: 'upcoming',
  },
  {
    id: 'setup-gamer-rtx-prox',
    title: 'PC Gamer RTX 4090 + Silla Ergonómica + Monitor 240Hz',
    description: 'Computador gamer armado de alto rendimiento con tarjeta RTX 4090, refrigeración líquida, monitor curvo 240Hz y periféricos mecánicos.',
    ballotGrid: 100,
    merchant: 'TechStore Colombia',
    city: 'Bogotá',
    priceCop: '$ 30.000',
    soldPercent: 48,
    timeLabel: '🗓️ Mié 9:00 PM',
    category: 'gaming',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'upcoming',
  },
  {
    id: 'anillo-diamante-prox',
    title: 'Anillo Solitario Diamante + Reloj de Lujo',
    description: 'Joyería certificada en oro blanco 18K con diamante natural y reloj suizo de colección con certificado notarial.',
    ballotGrid: 100,
    merchant: 'Joyas & Diamantes ABC',
    city: 'Cartagena',
    priceCop: '$ 45.000',
    soldPercent: 41,
    timeLabel: '🗓️ Jue 8:30 PM',
    category: 'joyas',
    image: '/reloj-alta-gama.jpg',
    stage: 'upcoming',
  },
  {
    id: 'europa-madrid-paris-prox',
    title: 'Tour Europa: Madrid y París (8 Días · 2 Pers.)',
    description: 'Vuelos internacionales ida y vuelta, hoteles 4 estrellas con desayuno, traslados y seguro de viaje internacional para dos personas.',
    ballotGrid: 200,
    merchant: 'Viajes & Sueños VIP',
    city: 'Medellín',
    priceCop: '$ 35.000',
    soldPercent: 39,
    timeLabel: '🗓️ Vie 9:00 PM',
    category: 'viajes',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
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
  read?: boolean;
  dismissed?: boolean;
}

const VIBRANT_AD_THEMES = [
  {
    bg: 'linear-gradient(135deg, #0a2540 0%, #0052cc 38%, #007AFF 72%, #0284c7 100%)', // Azul Zafiro Real & Eléctrico Vibrante · El Ganador Oficial
    border: 'rgba(56, 189, 248, 0.85)',
    shadow: '0 16px 42px rgba(0, 122, 255, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.45)',
    tagBorder: 'rgba(56, 189, 248, 0.85)',
    btnBg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    btnText: '#0052cc',
    couponBg: 'rgba(0, 0, 0, 0.38)',
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
    bg: 'linear-gradient(135deg, #0a0a0c 0%, #007AFF 50%, #0056b3 100%)', // Azul Eléctrico Insignia
    border: 'rgba(0, 122, 255, 0.75)',
    shadow: '0 12px 36px rgba(0, 122, 255, 0.45)',
    tagBg: 'rgba(0, 0, 0, 0.45)',
    tagBorder: '#38bdf8',
    btnBg: '#ffffff',
    btnText: '#007AFF',
    couponBg: 'rgba(255, 255, 255, 0.22)',
    couponColor: '#ffffff',
  },
];

const SPONSOR_CAROUSEL_ADS = [
  {
    id: 'ad-el-ganador-oficial',
    tag: '👑 PUBLICIDAD OFICIAL · EL GANADOR',
    brand: 'El Ganador · Rifas Online',
    category: 'Plataforma Oficial de Sorteos Verificables · Colombia',
    title: 'EL GANADOR · Rifas Online 100% Verificables',
    description: 'Participa en sorteos reales con balotera auditable SHA-256 o pauta tu marca aquí con suscripción mensual y llega a miles de compradores.',
    coupon: 'Cupón: ELGANADOR',
    ctaText: 'Pautar o Participar Ahora →',
    ctaLink: '/publicidad',
    image: '/banner-el-ganador-oficial.png',
    badge: '👑 Oficial El Ganador',
  },
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
  const [isBusinessSession, setIsBusinessSession] = useState(false);

  useEffect(() => {
    setIsBusinessSession(readSurface() === 'business');
  }, []);

  // Publicidad autónoma de clientes con pago y suscripción mensual activa
  const [customBannerAds, setCustomBannerAds] = useState<(typeof SPONSOR_CAROUSEL_ADS)[0][]>([]);

  useEffect(() => {
    const syncAutonomousBannerAds = async () => {
      const now = Date.now();
      let localPaid: (typeof SPONSOR_CAROUSEL_ADS)[0][] = [];
      try {
        const raw = localStorage.getItem('elganador_banner_ads_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localPaid = parsed.filter(
              (ad: { paid?: boolean; active?: boolean; expiresAt?: string }) =>
                ad &&
                ad.paid === true &&
                ad.active !== false &&
                (!ad.expiresAt || new Date(ad.expiresAt).getTime() > now)
            );
            if (localPaid.length !== parsed.length) {
              localStorage.setItem('elganador_banner_ads_v1', JSON.stringify(localPaid));
            }
          }
        }
      } catch {
        localPaid = [];
      }

      // Sincroniza también desde el servidor (/api/banner-ads) para que todas las empresas activas roten globalmente
      let serverPaid: (typeof SPONSOR_CAROUSEL_ADS)[0][] = [];
      try {
        const res = await fetch('/api/banner-ads', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.ads)) {
            serverPaid = data.ads.filter(
              (ad: { paid?: boolean; active?: boolean; expiresAt?: string }) =>
                ad &&
                ad.paid === true &&
                ad.active !== false &&
                (!ad.expiresAt || new Date(ad.expiresAt).getTime() > now)
            );
          }
        }
      } catch {}

      const seen = new Set(serverPaid.map((a) => a.id));
      const merged = [...serverPaid, ...localPaid.filter((a) => !seen.has(a.id))];
      setCustomBannerAds(merged);
    };

    syncAutonomousBannerAds();
    window.addEventListener('storage', syncAutonomousBannerAds);
    window.addEventListener('elganador_banner_ads_updated', syncAutonomousBannerAds);
    const expiryCheck = setInterval(syncAutonomousBannerAds, 60000);
    return () => {
      window.removeEventListener('storage', syncAutonomousBannerAds);
      window.removeEventListener('elganador_banner_ads_updated', syncAutonomousBannerAds);
      clearInterval(expiryCheck);
    };
  }, []);

  // Lista unificada: Anuncio oficial de El Ganador + pautas pagadas autónomas + patrocinadores base
  const activeSponsorAds = [
    SPONSOR_CAROUSEL_ADS[0],
    ...customBannerAds,
    ...SPONSOR_CAROUSEL_ADS.slice(1),
  ];
  const safeAdIndex = currentAdIndex % activeSponsorAds.length;
  const currentAd = activeSponsorAds[safeAdIndex] || SPONSOR_CAROUSEL_ADS[0];

  useEffect(() => {
    if (isAdPaused) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % activeSponsorAds.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAdPaused, activeSponsorAds.length]);

  // Precarga inmediata de todas las imágenes del carrusel para eliminar destellos negros
  useEffect(() => {
    activeSponsorAds.forEach((ad) => {
      if (typeof window !== 'undefined' && ad?.image) {
        const img = new Image();
        img.src = ad.image;
      }
    });
  }, [activeSponsorAds]);

  const currentAdTheme = VIBRANT_AD_THEMES[safeAdIndex % VIBRANT_AD_THEMES.length];
  const { theme, setThemePreference } = useTheme();

  // Controladores táctiles y de avance / retroceso para el Carrusel de Patrocinadores
  const adTouchStartX = useRef<number | null>(null);
  const adTouchStartY = useRef<number | null>(null);
  const adIsSwiping = useRef<boolean>(false);

  const handlePrevAd = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCurrentAdIndex((prev) => (prev - 1 + activeSponsorAds.length) % activeSponsorAds.length);
  };

  const handleNextAd = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCurrentAdIndex((prev) => (prev + 1) % activeSponsorAds.length);
  };

  const handleAdTouchStart = (e: React.TouchEvent) => {
    setIsAdPaused(true);
    adTouchStartX.current = e.touches[0].clientX;
    adTouchStartY.current = e.touches[0].clientY;
    adIsSwiping.current = false;
  };

  const handleAdTouchEnd = (e: React.TouchEvent) => {
    setIsAdPaused(false);
    if (adTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - adTouchStartX.current;
    if (Math.abs(deltaX) > 35) {
      adIsSwiping.current = true;
      if (deltaX < 0) {
        setCurrentAdIndex((prev) => (prev + 1) % activeSponsorAds.length);
      } else {
        setCurrentAdIndex((prev) => (prev - 1 + activeSponsorAds.length) % activeSponsorAds.length);
      }
    }
    adTouchStartX.current = null;
    adTouchStartY.current = null;
  };

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  // Sincronización continua de Rifas creadas en localStorage (unificando ambas llaves)
  useEffect(() => {
    const syncRaffles = () => {
      try {
        const rawCustom = localStorage.getItem('elganador_custom_raffles');
        const rawList = localStorage.getItem('elganador_raffles_list');
        const parsedCustom = rawCustom ? JSON.parse(rawCustom) : [];
        const parsedList = rawList ? JSON.parse(rawList) : [];

        // Limpiar automáticamente cualquier rifa de prueba no deseada del almacenamiento local
        const filteredCustom = (Array.isArray(parsedCustom) ? parsedCustom : []).filter(
          (item: { title?: string }) =>
            !item.title?.toLowerCase().includes('dormil') && !item.title?.toLowerCase().includes('perro')
        );
        const filteredList = (Array.isArray(parsedList) ? parsedList : []).filter(
          (item: { title?: string }) =>
            !item.title?.toLowerCase().includes('dormil') && !item.title?.toLowerCase().includes('perro')
        );
        if (filteredCustom.length !== parsedCustom.length) {
          localStorage.setItem('elganador_custom_raffles', JSON.stringify(filteredCustom));
        }
        if (filteredList.length !== parsedList.length) {
          localStorage.setItem('elganador_raffles_list', JSON.stringify(filteredList));
        }

        const combined = [...filteredCustom, ...filteredList];

        const map = new Map<string, CompactRaffleItem>();
        for (const item of combined) {
          const key = item.id || item.radicado_number || item.title;
          if (key && !map.has(key)) {
            map.set(key, {
              ...item,
              id: item.id || key,
              stage: item.stage || 'upcoming',
              priceCop: item.priceCop || (item.ticket_price ? `$ ${Number(item.ticket_price).toLocaleString('es-CO')}` : '$ 25.000'),
              soldPercent: item.soldPercent || 0,
              category: item.category || 'vehiculos',
              image: item.image || (item.photos && item.photos[0]) || '/galeria-premios-el-ganador-realista.jpg',
            });
          }
        }
        setCustomRaffles(Array.from(map.values()));
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

  // Estado del Recuadro "Ver todo" (Catálogo completo por bloques en cuadros, escalable a +1000 sorteos)
  const [allRafflesModal, setAllRafflesModal] = useState<{
    title: string;
    filterStage: 'all' | 'closing_soon' | 'upcoming';
  } | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [modalVisibleCount, setModalVisibleCount] = useState<number>(24);

  const openAllRafflesModal = (title: string, filterStage: 'all' | 'closing_soon' | 'upcoming') => {
    setModalSearchQuery('');
    setModalVisibleCount(24);
    setAllRafflesModal({ title, filterStage });
  };

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

    // 1.5. Registrar orden en base de datos para sincronizar con Wompi, webhook y CRM Empresarial
    try {
      await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ref,
          drawId: ticketModalRaffle.id,
          raffleTitle: ticketModalRaffle.title,
          merchant: ticketModalRaffle.merchant,
          buyerName: buyerNam,
          buyerEmail: buyerMail,
          buyerPhone: buyerPh,
          numbers: assignedNumbers.map((n) => parseInt(n, 10)),
          totalAmount,
        }),
      });
    } catch (intentErr) {
      console.warn('Aviso registrando intención de pago:', intentErr);
    }

    // 1.6. Recordatorio nativo 15 min antes del sorteo (solo app nativa, si el usuario lo activó en Perfil y hay fecha válida)
    try {
      if (getNotificationPrefs().notifyLiveDraws) {
        const raffleMeta = ticketModalRaffle as unknown as Record<string, unknown>;
        const drawAt = (raffleMeta.draw_date || raffleMeta.scheduledAt || raffleMeta.scheduled_at) as string | undefined;
        void scheduleLiveDrawReminder(ticketModalRaffle.title, drawAt);
      }
    } catch {}

    // 2. Integración Oficial Wompi (Web Checkout directo en móvil para evitar bloqueo táctil de iframe iOS + Widget limpio en escritorio)
    const configuredKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_WOMPI_PUB_KEY || '';
    const publicKey = (configuredKey && configuredKey.startsWith('pub_prod_'))
      ? configuredKey
      : 'pub_prod_szkcn750ePT0UEoi8Hil02CtApMvVCLV';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co';
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const redirectUrl = isLocal ? undefined : `${origin}/mis-boletas?status=aprobado&ref=${ref}`;
    const cleanPhone = buyerPh.replace(/\D/g, '').slice(-10) || '3001234567';

    // Firma de integridad SHA-256 (si WOMPI_INTEGRITY_SECRET está configurado en servidor/Vercel)
    let integritySignature: string | null = null;
    try {
      const sigRes = await fetch('/api/payments/wompi-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref, amountInCents: totalAmountInCents, currency: 'COP' }),
      });
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        if (sigData?.signature) integritySignature = String(sigData.signature);
      }
    } catch {}

    const isMobileDevice =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    // En móvil: Web Checkout oficial de Wompi en página completa (100% táctil: PSE, Nequi, DaviPlata, Tarjeta, Bancolombia, QR)
    if (isMobileDevice || typeof window === 'undefined' || !(window as unknown as { WidgetCheckout?: unknown }).WidgetCheckout) {
      const params = new URLSearchParams({
        'public-key': publicKey,
        currency: 'COP',
        'amount-in-cents': String(totalAmountInCents),
        reference: ref,
        'customer-data:email': buyerMail,
        'customer-data:full-name': buyerNam,
        'customer-data:phone-number': cleanPhone,
        'customer-data:phone-number-prefix': '+57',
      });
      if (redirectUrl) params.set('redirect-url', redirectUrl);
      if (integritySignature) params.set('signature:integrity', integritySignature);
      window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;
      return;
    }

    // En escritorio: Widget oficial en camelCase limpio
    const WidgetCheckout = (window as unknown as { WidgetCheckout: new (opts: Record<string, unknown>) => { open: (cb: (res: { transaction?: { status: string } }) => void) => void } }).WidgetCheckout;
    const checkoutConfig: Record<string, unknown> = {
      currency: 'COP',
      amountInCents: totalAmountInCents,
      reference: ref,
      publicKey,
      customerData: {
        email: buyerMail,
        fullName: buyerNam,
        phoneNumber: cleanPhone,
        phoneNumberPrefix: '+57',
        legalId: '123456789',
        legalIdType: 'CC',
      },
    };
    if (redirectUrl) checkoutConfig.redirectUrl = redirectUrl;
    if (integritySignature) checkoutConfig.signature = { integrity: integritySignature };

    const checkout = new WidgetCheckout(checkoutConfig);
    // Evita que el botón quede bloqueado si el usuario cierra el popup con la X
    setTimeout(() => setIsProcessingWompi(false), 2500);

    checkout.open((result) => {
      setIsProcessingWompi(false);
      const transaction = result?.transaction;
      if (transaction?.status === 'APPROVED') {
        try {
          const rawStored = localStorage.getItem('elganador_my_tickets');
          const myTickets = rawStored ? JSON.parse(rawStored) : [];
          const updated = myTickets.map((t: any) =>
            t.id === ref ? { ...t, status: 'pagada' } : t
          );
          localStorage.setItem('elganador_my_tickets', JSON.stringify(updated));
        } catch {}
        alert('🎉 ¡Pago aprobado con éxito! Tu boleta ha sido sellada y registrada.');
        window.location.href = redirectUrl || `/mis-boletas?status=aprobado&ref=${ref}`;
      } else if (transaction?.status === 'DECLINED' || transaction?.status === 'ERROR') {
        alert('⚠️ El pago no se completó. Puedes volver a intentarlo cuando gustes.');
      }
    });
  };
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [shareModalItem, setShareModalItem] = useState<{ id: string; title: string; merchant: string; priceCop: string } | null>(null);
  const [selectedRaffleDetail, setSelectedRaffleDetail] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [wonPrizes, setWonPrizes] = useState<WonPrize[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const touchStartYRef = useRef<number | null>(null);
  const pullRafRef = useRef<number | null>(null);

  const { data: feed, isRefreshing, lastSync, refreshNow } = useRealtimeFeed(
    INITIAL_FEED_DATA,
    30000
  );

  const handleShareRaffle = (item: { id: string; title: string; merchant: string; priceCop: string }) => {
    setShareModalItem(item);
    setCopiedLink(false);
  };

  // Detección automática y apertura directa de rifa compartida (?sorteo=... o ?raffleId=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const checkAndOpenSharedRaffle = async () => {
      const search = window.location.search;
      if (!search) return;
      const params = new URLSearchParams(search);
      const targetId = params.get('sorteo') || params.get('raffleId') || params.get('rifa');
      if (!targetId) return;

      const norm = targetId.trim().toLowerCase();

      // 1. Buscar en memoria local (custom, feed, catálogo estático)
      const allAvailable = [
        ...customRaffles,
        ...(feed?.raffles ?? []),
        ...RAFFLES_CATALOG,
      ];

      const match = allAvailable.find((r: any) =>
        r.id?.toLowerCase() === norm ||
        r.radicado_number?.toLowerCase() === norm ||
        r.legalRadicado?.toLowerCase() === norm ||
        r.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === norm
      );

      if (match) {
        if (!isMounted) return;
        setCustomRaffles((prev) => {
          if (prev.some((r) => r.id === match.id)) return prev;
          return [match, ...prev];
        });
        setSelectedRaffleDetail(match);
        setTimeout(() => {
          const el = document.getElementById(`raffle-${match.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
        return;
      }

      // 2. Si no está en memoria, consultar endpoint /api/raffles?id=...
      try {
        const res = await fetch(`/api/raffles?id=${encodeURIComponent(targetId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && data.ok && data.raffle) {
            const fetchedRaffle = data.raffle;
            setCustomRaffles((prev) => [fetchedRaffle, ...prev.filter((r) => r.id !== fetchedRaffle.id)]);
            setSelectedRaffleDetail(fetchedRaffle);
            setTimeout(() => {
              const el = document.getElementById(`raffle-${fetchedRaffle.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 350);
          }
        }
      } catch (err) {
        console.warn('Error fetching shared raffle:', err);
      }
    };

    checkAndOpenSharedRaffle();

    return () => {
      isMounted = false;
    };
  }, [feed?.raffles, customRaffles.length]);

  useEffect(() => {
    const loadWonPrizes = () => {
      try {
        setWonPrizes(getWonPrizes());
      } catch {
        setWonPrizes([]);
      }
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
      if (pullRafRef.current) cancelAnimationFrame(pullRafRef.current);
      setPullDistance(0);
      return;
    }
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (deltaY > 0) {
      if (pullRafRef.current) cancelAnimationFrame(pullRafRef.current);
      pullRafRef.current = requestAnimationFrame(() => {
        setPullDistance(Math.min(92, deltaY * 0.45));
      });
    } else {
      setPullDistance(0);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (pullRafRef.current) cancelAnimationFrame(pullRafRef.current);
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
  const apiRaffles = feed?.raffles ?? [];
  const existingIds = new Set([...customRaffles.map((r) => r.id), ...apiRaffles.map((r) => r.id)]);
  const rafflesList = [
    ...customRaffles,
    ...apiRaffles,
    ...RAFFLES_CATALOG.filter((r) => !existingIds.has(r.id)),
  ];

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
    rafflesList.filter((r) => r.stage !== 'closing_soon')
  );

  // División en bloques para mostrar mayor contenido (2 bloques A pocas horas + 3 bloques Próximos con fechas futuras)
  const closingSoonBlock1 = closingSoonRaffles.slice(0, 4);
  const closingSoonBlock2 = closingSoonRaffles.slice(4);
  const upcomingBlock1 = upcomingRaffles.slice(0, 5);
  const upcomingBlock2 = upcomingRaffles.slice(5, 9);
  const upcomingBlock3 = upcomingRaffles.slice(9);

  const renderRaffleCard = (item: CompactRaffleItem, variant: 'urgent' | 'upcoming') => (
    <article
      key={item.id}
      id={`raffle-${item.id}`}
      className={
        variant === 'urgent'
          ? 'compact-raffle-card card-type-urgent'
          : `compact-raffle-card card-type-upcoming card-cat-${item.category}`
      }
    >
      <div
        className="compact-raffle-media"
        onClick={() => setSelectedRaffleDetail(item)}
        style={{ cursor: 'pointer' }}
        title="Ver detalle del sorteo"
      >
        <img src={item.image} alt={item.title} loading="lazy" />
        <span className={variant === 'urgent' ? 'urgent-time-badge' : 'compact-date-badge'}>
          {item.timeLabel}
        </span>
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
          onClick={() => setSelectedRaffleDetail(item)}
          style={{ cursor: 'pointer' }}
          title="Ver detalle del sorteo"
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

        <div className="compact-card-actions-row" style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn-compact-action"
            onClick={() => handleOpenTicketModal(item)}
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#007AFF',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              flex: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Comprar
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill={likedRaffles.includes(item.id) ? '#ef4444' : 'none'} stroke={likedRaffles.includes(item.id) ? '#ef4444' : '#94a3b8'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-share-card-compact"
            onClick={(e) => {
              e.stopPropagation();
              handleShareRaffle(item);
            }}
            title="Compartir sorteo"
            aria-label="Compartir este sorteo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div
      className="app-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* BARRA SUPERIOR NEGRA DE LUJO */}
      <header
        className="app-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px 16px',
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
          borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
          width: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          filter: 'none',
        }}
      >
        {/* Logo y Nombre Limpio en Alta Definición */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setShowMobileMenu((prev) => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '2px 4px',
              fontWeight: 900,
            }}
          >
            ≡
          </button>
          <div
            className="brand-cluster"
            onClick={manualRefresh}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') manualRefresh();
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Volver al inicio y actualizar"
          >
            <img
              src="/banner-el-ganador-oficial.png"
              alt="Logo El Ganador"
              style={{
                height: '32px',
                width: 'auto',
                maxWidth: '48px',
                objectFit: 'contain',
                display: 'block',
                filter: theme === 'dark'
                  ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.7))'
                  : 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
              }}
            />
            <div>
              <h1
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  margin: 0,
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  letterSpacing: '-0.2px',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility',
                  lineHeight: 1.1,
                  filter: 'none',
                  textShadow: 'none',
                }}
              >
                EL GANADOR
              </h1>
            </div>
          </div>
        </div>

        {/* Notificaciones (Selector de tema trasladado a Perfil) */}
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isBusinessSession && (
            <Link
              href="/empresario"
              className="btn-compact-action"
              title="Regresar a mi panel empresarial"
              style={{
                textDecoration: 'none',
                background: 'rgba(56, 189, 248, 0.16)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                fontWeight: 800,
                fontSize: '12px',
                padding: '5px 11px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🏪</span>
              <span>Mi Tienda</span>
            </Link>
          )}

          {/* CAMPANA DE NOTIFICACIONES RECTA Y SIMÉTRICA */}
          <div className="notif-bell-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className="notif-bell-btn"
              onClick={() => {
                // Al cerrar la bandeja, lo visto queda como leído y el contador baja
                if (showNotifDropdown) markWonPrizesAsRead();
                setShowNotifDropdown((prev) => !prev);
              }}
              aria-label="Premios ganados y notificaciones"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                position: 'relative',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme === 'dark' ? '#ffffff' : '#000000'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'block' }}
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {wonPrizes.some((p) => !p.read) && (
                <span className="notif-badge-count">{wonPrizes.filter((p) => !p.read).length}</span>
              )}
            </button>

            {/* BANDEJA FLOTANTE ESTILO FACEBOOK */}
            {showNotifDropdown && (
              <div className="notif-fb-dropdown" role="dialog" aria-label="Bandeja de premios ganados">
                <div className="notif-fb-header">
                  <h3 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔔</span>
                    <span>Premios ganados</span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {wonPrizes.length > 0 && (
                      <>
                        <button
                          type="button"
                          className="notif-fb-close-btn"
                          style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 6px', borderRadius: '6px', background: 'rgba(0, 122, 255, 0.12)', color: '#007AFF', whiteSpace: 'nowrap' }}
                          onClick={() => markWonPrizesAsRead()}
                          disabled={!wonPrizes.some((p) => !p.read)}
                          title="Marcar todas como leídas"
                        >
                          Leídas
                        </button>
                        <button
                          type="button"
                          className="notif-fb-close-btn"
                          style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', whiteSpace: 'nowrap' }}
                          onClick={() => dismissAllWonPrizes()}
                          title="Borrar todas las notificaciones"
                        >
                          Borrar
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="notif-fb-close-btn"
                      onClick={() => {
                        markWonPrizesAsRead();
                        setShowNotifDropdown(false);
                      }}
                      aria-label="Cerrar notificaciones"
                    >
                      ✕
                    </button>
                  </div>
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
                      <div
                        key={prize.id}
                        className="notif-fb-item"
                        style={prize.read ? { opacity: 0.72 } : { background: 'rgba(0, 122, 255, 0.08)' }}
                      >
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
                            onClick={() => {
                              claimWonPrize(prize.id);
                              setShowNotifDropdown(false);
                            }}
                          >
                            Ver Certificado y Reclamar →
                          </Link>
                        </div>
                        <button
                          type="button"
                          className="notif-fb-close-btn"
                          aria-label="Descartar notificación"
                          title="Descartar"
                          style={{ alignSelf: 'flex-start' }}
                          onClick={() => dismissWonPrize(prize.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* BANNER INFORMATIVO PARA EMPRESARIOS NAVEGANDO LA VITRINA */}
      {isBusinessSession && (
        <aside
          role="complementary"
          aria-label="Aviso modo vitrina empresarial"
          style={{
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.18), rgba(56, 189, 248, 0.12))',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            padding: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏛️</span>
            <span><strong>Modo Vitrina:</strong> Explora rifas, historias y publicidad de otros empresarios.</span>
          </div>
          <Link
            href="/empresario"
            style={{
              color: '#ffffff',
              background: '#0284c7',
              padding: '4px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            Volver a Mi Tienda →
          </Link>
        </aside>
      )}

      {/* MENÚ MÓVIL LATERAL DESLIZABLE (ACTIVADO POR ≡) */}
      {showMobileMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
          }}
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#0f172a',
              padding: 'max(env(safe-area-inset-top), 20px) 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
              borderRight: theme === 'dark' ? '1px solid #222' : '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: theme === 'dark' ? '1px solid #222' : '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>EL GANADOR</h2>
                <small style={{ color: '#888' }}>Marketplace de Sorteos</small>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'inherit', cursor: 'pointer' }}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/" onClick={() => setShowMobileMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                <span>🏠</span> Inicio / Vitrina
              </Link>
              <Link href="/favoritos" onClick={() => setShowMobileMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                <span>⭐</span> Mis Favoritos & Seguidos
              </Link>
              <Link href="/sorteo-en-vivo" onClick={() => setShowMobileMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                <span>🎱</span> Sorteo en Vivo (SHA-256)
              </Link>
              <Link href="/todos-los-sorteos" onClick={() => setShowMobileMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                <span>🎟️</span> Todos los Sorteos
              </Link>
              {isBusinessSession ? (
                <Link
                  href="/empresario"
                  onClick={() => setShowMobileMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: '#38bdf8',
                    fontWeight: 800,
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                  }}
                >
                  <span>🏪</span> Mi Tienda / Panel Empresarial
                </Link>
              ) : (
                <Link
                  href="/ingreso?mode=login&role=business"
                  onClick={() => setShowMobileMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: '#007AFF', fontWeight: 700 }}
                >
                  <span>💼</span> Soy empresa · Ingresar al portal
                </Link>
              )}
              <Link href="/perfil" onClick={() => setShowMobileMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                <span>👤</span> Mi Perfil
              </Link>
              <Link href="/empresario/marco-legal" onClick={() => setShowMobileMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: '#f5b82e', fontWeight: 700 }}>
                <span>📜</span> Marco Legal &amp; Coljuegos
              </Link>
            </nav>

            {/* Botón Cerrar Sesión en el menú móvil */}
            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: theme === 'dark' ? '1px solid #222' : '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="mobile-menu-logout-btn"
                onClick={() => {
                  setShowMobileMenu(false);
                  void performLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  background: theme === 'dark' ? 'rgba(239, 68, 68, 0.14)' : '#fef2f2',
                  color: '#ef4444',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

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
        {/* =========================================================================
            📢 BANNER PUBLICITARIO DE PATROCINADORES VIP (UBICACIÓN SUPERIOR DESTACADA)
            - Impacto visual y comercial máximo para acelerar conversiones y ventas
            - Foto destacada del producto/vehículo de vitrina
            - Controles de carrusel perfectamente centrados abajo (sin solapamiento)
            - Flechas compactas + swipe táctil + paginación por píldora activa
            ========================================================================= */}
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
            margin: '8px 0 14px 0',
            width: '100%',
          } as React.CSSProperties}
          onClick={() => {
            if (adIsSwiping.current) {
              adIsSwiping.current = false;
              return;
            }
            setSelectedVitrinaAd(currentAd);
          }}
          onMouseEnter={() => setIsAdPaused(true)}
          onMouseLeave={() => setIsAdPaused(false)}
          onTouchStart={handleAdTouchStart}
          onTouchEnd={handleAdTouchEnd}
        >
          <div className="carousel-ad-wrapper" style={{ padding: '0 0 14px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
            {/* CONTENIDO CENTRADO Y UNIFORME */}
            <div className="official-ad-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', width: '100%' }}>
              
              {/* FOTO GRANDE Y DESTACADA CON TRANSICIÓN CROSSFADE (CERO DESTELLO NEGRO) */}
              <div
                className="official-ad-media"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '255px',
                  borderRadius: '0px',
                  overflow: 'hidden',
                  background: '#000000',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  margin: '0',
                }}
              >
                {activeSponsorAds.map((ad, idx) => {
                  const isActive = idx === safeAdIndex;
                  const isOfficial = ad.id === 'ad-el-ganador-oficial';
                  return (
                    <div
                      key={ad.id || idx}
                      className={`official-ad-slide ${isOfficial ? 'is-official-brand' : ''}`}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: isActive ? 1 : 0,
                        zIndex: isActive ? 2 : 1,
                        transition: 'opacity 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: isActive ? 'auto' : 'none',
                        background: isOfficial
                          ? 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 35%, #000000 78%)'
                          : '#0a0a0c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={ad.image}
                        alt={ad.brand}
                        loading="eager"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: isOfficial ? 'contain' : 'cover',
                          borderRadius: '0px',
                          background: 'transparent',
                          padding: isOfficial ? '8px 14px' : '0',
                          filter: isOfficial
                            ? 'drop-shadow(0 0 28px rgba(255, 255, 255, 0.38)) drop-shadow(0 10px 22px rgba(0,0,0,0.85))'
                            : 'none',
                        }}
                      />
                    </div>
                  );
                })}

                {/* BADGE FLOTANTE DE PATROCINADOR VIP (SIEMPRE VISIBLE POR ENCIMA DE LAS FOTOS) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 25,
                    background: 'rgba(5, 7, 10, 0.88)',
                    border: '1px solid rgba(255, 215, 0, 0.65)',
                    color: '#ffd700',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    letterSpacing: '0.35px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    pointerEvents: 'none',
                  }}
                >
                  🔥 PATROCINADOR VIP
                </div>
              </div>

              {/* INFORMACIÓN COMPACTA Y COMERCIAL DE ALTO IMPACTO */}
              <div className="official-ad-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px', width: '100%', padding: '14px 14px 2px 14px', boxSizing: 'border-box' }}>
                <div className="ad-pill-and-counter" style={{ marginBottom: '1px' }}>
                  <span
                    className="official-ad-pill"
                    style={{
                      background: currentAdTheme.tagBg,
                      border: `1px solid ${currentAdTheme.tagBorder}`,
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      padding: '2px 10px',
                      borderRadius: '999px',
                      fontWeight: 800,
                    }}
                  >
                    {currentAd.tag}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 900,
                    margin: '1px 0',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    color: '#ffffff',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {currentAd.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.74rem',
                    lineHeight: 1.35,
                    margin: 0,
                    textAlign: 'center',
                    height: '2.6em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    opacity: 0.95,
                    color: '#ffffff',
                    maxWidth: '92%',
                  }}
                >
                  {currentAd.description}
                </p>

                {/* MÉTRICA EN VIVO Y BOTÓN SEGUIR CENTRADOS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '3px 0' }}>
                  <span suppressHydrationWarning style={{ fontSize: '0.7rem', color: '#ffffff', background: 'rgba(0,0,0,0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    👥 {(brandFollowerCounts[currentAd.brand] || 1580).toLocaleString()} pendientes
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFollow(currentAd.brand);
                    }}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #ffffff',
                      background: followedBrands[currentAd.brand] ? '#10b981' : 'rgba(255,255,255,0.22)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="Seguir empresa para recibir alertas de sus rifas y descuentos"
                  >
                    {followedBrands[currentAd.brand] ? '✓ Siguiendo' : '🔔 Seguir'}
                  </button>
                </div>

                {/* ACCIONES DEL PATROCINADOR CENTRADAS */}
                <div className="official-ad-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '3px' }}>
                  <button
                    type="button"
                    className="btn-ad-emerald"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVitrinaAd(currentAd);
                    }}
                    style={{
                      background: currentAdTheme.btnBg,
                      color: currentAdTheme.btnText,
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: 'none',
                      fontSize: '0.78rem',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                    }}
                  >
                    ⚡ Ver Vitrina & Sorteo →
                  </button>
                  <span
                    className="ad-coupon-tag"
                    style={{
                      background: currentAdTheme.couponBg,
                      color: currentAdTheme.couponColor,
                      border: '1px dashed rgba(255, 255, 255, 0.7)',
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                    }}
                  >
                    {currentAd.coupon}
                  </span>
                </div>
              </div>
            </div>

            {/* PAGINADOR DE CARRUSEL 100% CENTRADO */}
            <div
              className="ad-carousel-controls ad-carousel-paginator"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                width: '100%',
                margin: '12px auto 4px auto',
                padding: '4px 0',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <button
                type="button"
                onClick={handlePrevAd}
                className="ad-nav-arrow-compact"
                aria-label="Patrocinador anterior"
                title="Patrocinador anterior"
                style={{
                  width: '30px',
                  height: '30px',
                  minWidth: '30px',
                  minHeight: '30px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1.5px solid rgba(255, 255, 255, 0.5)',
                  color: '#ffffff',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  margin: 0,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ‹
              </button>

              <div
                className="ad-dots-row"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0',
                  padding: '5px 12px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  flexShrink: 0,
                }}
              >
                {activeSponsorAds.map((ad, idx) => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAdIndex(idx);
                    }}
                    className="ad-dot-btn"
                    style={{
                      width: safeAdIndex === idx ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '999px',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      background: safeAdIndex === idx ? '#ffd700' : 'rgba(255, 255, 255, 0.4)',
                      boxShadow: safeAdIndex === idx ? '0 0 8px rgba(255, 215, 0, 0.6)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    aria-label={`Ver patrocinador ${idx + 1}: ${ad.brand}`}
                    title={ad.brand}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextAd}
                className="ad-nav-arrow-compact"
                aria-label="Siguiente patrocinador"
                title="Siguiente patrocinador"
                style={{
                  width: '30px',
                  height: '30px',
                  minWidth: '30px',
                  minHeight: '30px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1.5px solid rgba(255, 255, 255, 0.5)',
                  color: '#ffffff',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  margin: 0,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
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

        {/* SECCIÓN 2A: ⏳ SORTEOS A POCAS HORAS DE JUGAR (BLOQUE 1) */}
        <section id="estacion-urgentes" className="station-block-premium station-urgent" aria-label="Sorteos a pocas horas de jugar">
          <div className="compact-section-title">
            <h2>⏳ A pocas horas de jugar</h2>
            <button
              type="button"
              className="see-all-grid-btn"
              onClick={() => openAllRafflesModal('⏳ Todos los sorteos a pocas horas', 'closing_soon')}
            >
              Ver todo ({closingSoonRaffles.length}) →
            </button>
          </div>

          <DesktopScrollStrip ariaLabel="Cierre próximo">
            {closingSoonBlock1.map((item) => renderRaffleCard(item, 'urgent'))}
          </DesktopScrollStrip>
        </section>

        {/* SECCIÓN 2B: 🔥 ÚLTIMOS CUPOS · CIERRAN HOY (BLOQUE 2 A POCAS HORAS) */}
        {closingSoonBlock2.length > 0 && (
          <section id="estacion-urgentes-2" className="station-block-premium station-urgent" aria-label="Últimos cupos cierran hoy">
            <div className="compact-section-title">
              <h2>🔥 Últimos cupos · Cierran hoy</h2>
              <button
                type="button"
                className="see-all-grid-btn"
                onClick={() => openAllRafflesModal('🔥 Últimos cupos · Cierran hoy', 'closing_soon')}
              >
                Ver todo →
              </button>
            </div>

            <DesktopScrollStrip ariaLabel="Últimos cupos hoy">
              {closingSoonBlock2.map((item) => renderRaffleCard(item, 'urgent'))}
            </DesktopScrollStrip>
          </section>
        )}

        {/* SECCIÓN 3A: 🎟️ PRÓXIMOS SORTEOS (BLOQUE 1) */}
        <section id="estacion-proximos" className="station-block-premium station-upcoming" aria-label="Próximos sorteos">
          <div className="compact-section-title">
            <h2>🎟️ Próximos Sorteos</h2>
            <button
              type="button"
              className="see-all-grid-btn"
              onClick={() => openAllRafflesModal('🎟️ Todos los próximos sorteos', 'upcoming')}
            >
              Ver todo ({upcomingRaffles.length}) →
            </button>
          </div>

          <DesktopScrollStrip ariaLabel="Próximos sorteos">
            {upcomingBlock1.map((item) => renderRaffleCard(item, 'upcoming'))}
          </DesktopScrollStrip>
        </section>

        {/* SECCIÓN 3B: 🎟️ PRÓXIMOS SORTEOS #2 (FECHAS FUTURAS) */}
        {upcomingBlock2.length > 0 && (
          <section id="estacion-urgentes-3" className="station-block-premium station-upcoming" aria-label="Próximos sorteos #2">
            <div className="compact-section-title">
              <h2>🎟️ Próximos Sorteos #2</h2>
              <button
                type="button"
                className="see-all-grid-btn"
                onClick={() => openAllRafflesModal('🎟️ Próximos Sorteos #2', 'upcoming')}
              >
                Ver todo →
              </button>
            </div>

            <DesktopScrollStrip ariaLabel="Próximos sorteos 2">
              {upcomingBlock2.map((item) => renderRaffleCard(item, 'upcoming'))}
            </DesktopScrollStrip>
          </section>
        )}

        {/* SECCIÓN 3C: 🚀 GRANDES PREMIOS · PRÓXIMAMENTE (FECHAS FUTURAS) */}
        {upcomingBlock3.length > 0 && (
          <section id="estacion-proximos-2" className="station-block-premium station-upcoming" aria-label="Grandes premios próximamente">
            <div className="compact-section-title">
              <h2>🚀 Grandes Premios · Próximamente</h2>
              <button
                type="button"
                className="see-all-grid-btn"
                onClick={() => openAllRafflesModal('🚀 Catálogo completo de sorteos', 'all')}
              >
                Ver todo ({rafflesList.length}) →
              </button>
            </div>

            <DesktopScrollStrip ariaLabel="Grandes premios próximamente">
              {upcomingBlock3.map((item) => renderRaffleCard(item, 'upcoming'))}
            </DesktopScrollStrip>
          </section>
        )}

        {/* ESTACIÓN: 📢 VITRINA COMERCIAL, PAUTA PUBLICITARIA Y MARCAS ALIADAS */}
        <section
          id="estacion-comercial"
          className="station-block-premium station-showcase-commercial"
          aria-label="Vitrina Comercial y Marcas Aliadas"
          style={{
            backgroundColor: theme === 'dark' ? '#141a24' : '#f1f5f9',
            borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
            borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
          }}
        >
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

            <Link className="btn-pautar-header" href="/empresario/publicidad">
              📢 Publicidad y Marketing →
            </Link>
          </div>

          <DesktopScrollStrip ariaLabel="Vitrina Comercial y Marcas">
            {/* 1. PRIMERA TARJETA: MARCA PAUTANTE DESTACADA */}
            <article className="promo-brand-card tier-sponsor">
              <div className="promo-brand-media">
                <img src="/galeria-premios-hogar-moda-viajes-portrait.jpg" alt="TechStore Colombia" loading="lazy" />
                <div className="promo-media-gradient" />
                <span className="promo-top-badge gold">⚡ PATROCINADOR VIP</span>
                <span className="promo-offer-ribbon">🎁 15% OFF Cupón: ELGANADOR</span>
              </div>

              <div className="promo-brand-body">
                <div className="promo-brand-identity">
                  <span className="promo-avatar-icon">⚡</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>TechStore Colombia</strong>
                    <small style={{ color: '#38bdf8' }}>Tecnología & Gadgets · Bogotá</small>
                  </div>
                </div>

                <p className="promo-brand-copy" style={{ color: '#e2e8f0' }}>
                  Distribuidor tecnológico verificado. Beneficios y descuentos exclusivos en tienda para toda la comunidad de El Ganador.
                </p>

                <div className="promo-brand-footer">
                  <span className="promo-metric" style={{ color: '#cbd5e1' }}>⭐ 4.9 · Marca Verificada</span>
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
                <h3 style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
                  ¿Quieres que miles de clientes vean tu empresa aquí?
                </h3>
                <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#334155' }}>
                  <strong style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>No necesitas organizar rifas para pautar.</strong> Promociona tu tienda, concesionario, restaurante o marca en toda Colombia.
                </p>
              </div>

              <div className="promo-brand-body">
                <ul className="promo-benefits-list">
                  <li style={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a', fontWeight: 700 }}>
                    <span className="promo-check-icon" style={{ color: theme === 'dark' ? '#38bdf8' : '#007AFF', fontWeight: 900, marginRight: '6px' }}>✓</span>
                    <span>Vitrina destacada con enlace directo a tus ofertas</span>
                  </li>
                  <li style={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a', fontWeight: 700 }}>
                    <span className="promo-check-icon" style={{ color: theme === 'dark' ? '#38bdf8' : '#007AFF', fontWeight: 900, marginRight: '6px' }}>✓</span>
                    <span>Alcance segmentado +50.000 usuarios activos</span>
                  </li>
                  <li style={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a', fontWeight: 700 }}>
                    <span className="promo-check-icon" style={{ color: theme === 'dark' ? '#38bdf8' : '#007AFF', fontWeight: 900, marginRight: '6px' }}>✓</span>
                    <span>Disponible para cualquier empresa o emprendimiento</span>
                  </li>
                </ul>

                <Link className="btn-cta-advertise-full" href="/empresario/publicidad">
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
                      <strong style={{ color: '#ffffff' }}>{brand.name}</strong>
                      <small style={{ color: '#38bdf8' }}>{brand.type}</small>
                    </div>
                  </div>

                  <p className="promo-brand-copy" style={{ color: '#e2e8f0' }}>{brand.description}</p>

                  <div className="promo-brand-footer">
                    <span className="promo-metric" style={{ color: '#cbd5e1' }}>{brand.metric}</span>
                    <Link className="promo-visit-btn" href="/novedades">
                      Explorar ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </DesktopScrollStrip>
        </section>

        {/* PIE DE PÁGINA LEGAL CON SELLO DE MARCA OFICIAL COMO RELLENO */}
        <footer className="marketplace-legal-footer">
          <strong>EL GANADOR · Colombia (+18)</strong>
          <p>
            Sorteos promocionales operados conforme a la Ley 643 de 2001 y Decreto 1486 de 2024.
            Apple Inc. y Google LLC no son patrocinadores ni tienen relación alguna con los sorteos o premios publicados en esta aplicación.
          </p>

          {/* SELLO DE MARCA CON LOGO EL GANADOR EN PEQUEÑO */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
            }}
          >
            <img
              src="/el-ganador-logo.png"
              alt="Logo El Ganador"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                filter: theme === 'dark'
                  ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.45))'
                  : 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.15))',
                userSelect: 'none',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '1px',
                color: theme === 'dark' ? '#cbd5e1' : '#475569',
                textTransform: 'uppercase',
              }}
            >
              EL GANADOR · APP OFICIAL COLOMBIA
            </span>
            <small
              style={{
                fontSize: '10px',
                color: theme === 'dark' ? '#64748b' : '#94a3b8',
                fontWeight: 600,
              }}
            >
              Tecnología & Transparencia Notarial · Sorteos 100% Verificables
            </small>
          </div>
        </footer>
      </main>
      </div>

      {/* BARRA INFERIOR FLOTANTE ESTILO GLASSMORPHISM */}
      <BottomNav currentTab="explorar" onExploreClick={manualRefresh} />

      {/* NOTIFICACIÓN FLOTANTE DE ENLACE COPIADO / COMPARTIDO */}
      {sharedToast && (
        <div className="shared-toast-notice" role="status" aria-live="polite">
          <span>✅ {sharedToast}</span>
        </div>
      )}


      {/* MODAL DE COMPRA DE BOLETAS Y PASARELA WOMPI COLOMBIA */}
            {/* MODAL DE COMPRA DE BOLETAS Y PASARELA WOMPI COLOMBIA (PANTALLA COMPLETA TOTAL) */}
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
            className="checkout-modal-backdrop-fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Comprar Boleta Oficial"
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              maxHeight: '100vh',
              zIndex: 100000,
              background: theme === 'dark' ? '#0a0d14' : '#ffffff',
              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              margin: 0,
              padding: 0,
              border: 'none',
              borderRadius: 0,
            }}
          >
            {/* Cabecera Fija Superior Pantalla Completa */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 48px) 16px 12px 16px',
                borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                background: theme === 'dark' ? '#000000' : '#ffffff',
                flexShrink: 0,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <button
                type="button"
                onClick={() => setTicketModalRaffle(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#007AFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px 4px 0',
                }}
              >
                ← Volver
              </button>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
                  Comprar Boleta Oficial
                </h2>
                <small style={{ fontSize: '11px', color: '#007AFF', fontWeight: 600 }}>
                  ⚖️ Notariado Ley 643 · 100% Legal
                </small>
              </div>
              <button
                type="button"
                onClick={() => setTicketModalRaffle(null)}
                aria-label="Cerrar modal"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                  color: theme === 'dark' ? '#ffffff' : '#0f172a',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {purchaseSuccessData ? (
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🎉</div>
                <h3 style={{ color: '#007AFF', margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800 }}>¡Pago Exitoso con Wompi!</h3>
                <p style={{ fontSize: '0.95rem', color: theme === 'dark' ? '#cbd5e1' : '#475569', margin: '0 0 18px' }}>
                  Tus boletas han sido emitidas y selladas con certificado notarial SHA-256.
                </p>

                <div style={{ background: theme === 'dark' ? 'rgba(0, 122, 255, 0.08)' : '#eff6ff', padding: '16px', borderRadius: '14px', border: '1px solid rgba(0, 122, 255, 0.25)', marginBottom: '18px', width: '100%', maxWidth: '420px', boxSizing: 'border-box' }}>
                  <div style={{ color: '#007AFF', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>
                    Boleta {purchaseSuccessData.ticketId}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', margin: '10px 0' }}>
                    {purchaseSuccessData.numbers.map((n) => (
                      <span key={n} style={{ fontSize: '1rem', padding: '6px 14px', borderRadius: '8px', background: '#007AFF', color: '#ffffff', fontWeight: 800 }}>
                        #{n}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: theme === 'dark' ? '#94a3b8' : '#64748b', wordBreak: 'break-all', marginTop: '8px' }}>
                    Sello Notarial SHA-256: <code>{purchaseSuccessData.hash.slice(0, 32)}...</code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href={`/sorteo-en-vivo?viewer=true&ticket=${purchaseSuccessData.numbers[0] || ''}`}
                    style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '12px 22px', borderRadius: '12px', background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)', color: '#ffffff', fontWeight: 800 }}
                    onClick={() => setTicketModalRaffle(null)}
                  >
                    🔴 Entrar a la Sala 3D en Vivo
                  </Link>
                  <Link
                    href="/mis-boletas"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '12px 18px', borderRadius: '12px', background: theme === 'dark' ? '#1e293b' : '#f1f5f9', color: theme === 'dark' ? '#ffffff' : '#0f172a', fontWeight: 800, border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1' }}
                    onClick={() => setTicketModalRaffle(null)}
                  >
                    🎟️ Ver en Mis Boletas
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handlePayWithWompi}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  margin: 0,
                  padding: 0,
                }}
              >
                {/* Cuerpo desplazable con información sintetizada y limpia */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    padding: '16px 16px 120px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxWidth: '680px',
                    width: '100%',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* 1. Tarjeta Resumen Ultra Compacta del Sorteo */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '14px',
                      background: theme === 'dark' ? '#111827' : '#f8fafc',
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                      alignItems: 'center',
                    }}
                  >
                    {ticketModalRaffle.image && (
                      <img
                        src={ticketModalRaffle.image}
                        alt={ticketModalRaffle.title}
                        style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#007AFF', fontWeight: 700, marginBottom: '2px' }}>
                        🏪 {ticketModalRaffle.merchant} · 📍 {ticketModalRaffle.city}
                      </div>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          margin: '0 0 4px',
                          color: theme === 'dark' ? '#ffffff' : '#0f172a',
                          lineHeight: 1.25,
                        }}
                      >
                        {ticketModalRaffle.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#007AFF' }}>
                          {ticketModalRaffle.priceCop} COP / boleta
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: 'rgba(34, 197, 94, 0.12)',
                            color: '#16a34a',
                          }}
                        >
                          🟢 {availableCount} disp.
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                          }}
                        >
                          🔴 {soldCount} vendidas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Selector Rápido de Cantidad de Boletas */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: theme === 'dark' ? '#111827' : '#f8fafc',
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#cbd5e1' : '#334155' }}>
                        Cantidad de boletas:
                      </span>
                      <strong style={{ fontSize: '14px', fontWeight: 900, color: '#007AFF' }}>
                        $ {totalAmount.toLocaleString('es-CO')} COP
                      </strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {[1, 2, 5, 10].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => handleTicketCountChange(qty)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            border: assignedNumbers.length === qty
                              ? '2px solid #007AFF'
                              : theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                            background: assignedNumbers.length === qty
                              ? '#007AFF'
                              : theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#ffffff',
                            color: assignedNumbers.length === qty
                              ? '#ffffff'
                              : theme === 'dark' ? '#e2e8f0' : '#1e293b',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {qty} {qty === 1 ? 'boleta' : 'boletas'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Números Asignados y Botón Aleatorio */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: theme === 'dark' ? '#111827' : '#f8fafc',
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#cbd5e1' : '#334155' }}>
                        Tus números seleccionados ({assignedNumbers.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTicketCountChange(assignedNumbers.length)}
                        style={{
                          background: 'rgba(0, 122, 255, 0.1)',
                          border: '1px solid rgba(0, 122, 255, 0.3)',
                          color: '#007AFF',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🎲 Cambiar al azar
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {assignedNumbers.map((num) => (
                        <span
                          key={num}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#007AFF',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '13px',
                            border: '1px solid #0056b3',
                          }}
                        >
                          #{num}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 4. Cartón Digital de Balotas con Contraste 100% Garantizado */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: theme === 'dark' ? '#111827' : '#f8fafc',
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#cbd5e1' : '#334155' }}>
                        Cartón Digital ({formatNum(1)} al {formatNum(grid)}):
                      </span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '10.5px' }}>
                        <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>⚪ Disp.</span>
                        <span style={{ color: '#007AFF', fontWeight: 700 }}>🔵 Elegido</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>🔴 Vendido</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                        gap: '4px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        padding: '6px',
                        borderRadius: '8px',
                        background: theme === 'dark' ? '#0b0f17' : '#ffffff',
                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                      }}
                    >
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
                            style={{
                              height: '34px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: isSold ? 'not-allowed' : 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                              border: isSelected
                                ? '2px solid #007AFF'
                                : isSold
                                ? '1px solid rgba(239, 68, 68, 0.3)'
                                : theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                              background: isSelected
                                ? '#007AFF'
                                : isSold
                                ? 'rgba(239, 68, 68, 0.1)'
                                : theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff',
                              color: isSelected
                                ? '#ffffff'
                                : isSold
                                ? '#ef4444'
                                : theme === 'dark' ? '#ffffff' : '#0f172a',
                              textDecoration: isSold ? 'line-through' : 'none',
                            }}
                            title={isSold ? `Balota #${numStr} ya vendida` : `Elegir balota #${numStr}`}
                          >
                            {numStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Cuenta del Comprador y Garantía */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: theme === 'dark' ? '#0f172a' : '#f1f5f9',
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div style={{ fontSize: '18px' }}>👤</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
                        {buyerName || 'Carlos Martínez'}
                      </div>
                      <div style={{ fontSize: '11px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                        {buyerEmail || 'carlos@elganador.co'} · Vinculado a tu cuenta
                      </div>
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      ✓ Verificado
                    </span>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <Link
                      href={`/comprar?raffleId=${ticketModalRaffle.id}`}
                      style={{
                        color: '#007AFF',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onClick={() => setTicketModalRaffle(null)}
                    >
                      ↗ Ver cartón completo en pantalla grande
                    </Link>
                  </div>
                </div>

                {/* Barra Inferior Fija de Pago PSE / Wompi */}
                <div
                  style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: theme === 'dark' ? '#000000' : '#ffffff',
                    borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                    padding: '10px 16px max(calc(env(safe-area-inset-bottom, 0px) + 10px), 16px) 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    zIndex: 10,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <small style={{ fontSize: '10.5px', color: theme === 'dark' ? '#94a3b8' : '#64748b', display: 'block' }}>
                      Total ({assignedNumbers.length} {assignedNumbers.length === 1 ? 'boleta' : 'boletas'}):
                    </small>
                    <strong style={{ fontSize: '17px', fontWeight: 900, color: '#007AFF' }}>
                      $ {totalAmount.toLocaleString('es-CO')} COP
                    </strong>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingWompi || assignedNumbers.length === 0}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: isProcessingWompi ? 'wait' : 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: (isProcessingWompi || assignedNumbers.length === 0) ? 0.6 : 1,
                    }}
                  >
                    {isProcessingWompi ? 'Procesando PSE...' : '⚡ Pagar con PSE / Wompi →'}
                  </button>
                </div>
              </form>
            )}
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

      {/* RECUADRO MODAL "VER TODO" — TODAS LAS RIFAS POR BLOQUES EN CUADROS (ESCALABLE A +1000) */}
      {allRafflesModal && (() => {
        const isDark = theme === 'dark';
        const q = modalSearchQuery.trim().toLowerCase();
        const baseList =
          allRafflesModal.filterStage === 'all'
            ? rafflesList
            : rafflesList.filter((r) => r.stage === allRafflesModal.filterStage);
        const filteredModalList = q
          ? baseList.filter(
              (r) =>
                r.title.toLowerCase().includes(q) ||
                r.merchant.toLowerCase().includes(q) ||
                r.city.toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q)
            )
          : baseList;
        const visibleItems = filteredModalList.slice(0, modalVisibleCount);
        const hasMore = filteredModalList.length > modalVisibleCount;

        return (
          <div
            className="all-raffles-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={allRafflesModal.title}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: isDark ? '#09090b' : '#f8fafc',
              color: isDark ? '#f8fafc' : '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              width: '100vw',
              height: '100dvh',
              overflow: 'hidden',
            }}
          >
            {/* Cabecera fija con buscador y filtros por bloque */}
            <div
              style={{
                padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 12px 10px 12px',
                backgroundColor: isDark ? '#111113' : '#ffffff',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a' }}>
                    {allRafflesModal.title}
                  </h2>
                  <small style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {filteredModalList.length.toLocaleString()} sorteos activos · Vista por bloques
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => setAllRafflesModal(null)}
                  aria-label="Cerrar catálogo completo"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
                    background: isDark ? '#1f1f23' : '#f1f5f9',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '16px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Buscador + pestañas de bloque */}
              <input
                type="search"
                value={modalSearchQuery}
                onChange={(e) => {
                  setModalSearchQuery(e.target.value);
                  setModalVisibleCount(24);
                }}
                placeholder="🔍 Buscar premio, comercio o ciudad..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid #cbd5e1',
                  background: isDark ? '#18181b' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {[
                  { id: 'all' as const, label: `✨ Todos (${rafflesList.length})` },
                  { id: 'closing_soon' as const, label: `⏳ A pocas horas (${rafflesList.filter((r) => r.stage === 'closing_soon').length})` },
                  { id: 'upcoming' as const, label: `🎟️ Próximos (${rafflesList.filter((r) => r.stage === 'upcoming').length})` },
                ].map((tab) => {
                  const active = allRafflesModal.filterStage === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setAllRafflesModal({ title: tab.label.replace(/\s*\(\d+\)$/, ''), filterStage: tab.id });
                        setModalVisibleCount(24);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: active ? '1px solid #007AFF' : isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid #cbd5e1',
                        background: active ? '#007AFF' : isDark ? '#18181b' : '#f1f5f9',
                        color: active ? '#ffffff' : isDark ? '#e2e8f0' : '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grilla desplazable de cuadros por bloques */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 8px calc(env(safe-area-inset-bottom, 0px) + 24px) 8px',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {visibleItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px' }}>No encontramos sorteos con esa búsqueda</p>
                  <small>Prueba con otra palabra o cambia de bloque arriba.</small>
                </div>
              ) : (
                <>
                  <div className="all-raffles-grid">
                    {visibleItems.map((item) => (
                      <article
                        key={`grid-${item.id}`}
                        className="all-raffles-grid-card"
                        style={{
                          background: isDark ? '#141417' : '#ffffff',
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.4)' : '0 2px 10px rgba(15,23,42,0.06)',
                        }}
                      >
                        <div
                          onClick={() => {
                            setAllRafflesModal(null);
                            setSelectedRaffleDetail(item);
                          }}
                          style={{ position: 'relative', width: '100%', height: '124px', cursor: 'pointer', overflow: 'hidden', background: '#000' }}
                        >
                          <img src={item.image} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              background: item.stage === 'closing_soon' ? 'rgba(220, 38, 38, 0.92)' : 'rgba(15, 23, 42, 0.85)',
                              color: '#ffffff',
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                            }}
                          >
                            {item.timeLabel}
                          </span>
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              right: '6px',
                              background: 'rgba(0, 0, 0, 0.82)',
                              color: '#fbbf24',
                              fontSize: '0.72rem',
                              fontWeight: 900,
                              padding: '2px 7px',
                              borderRadius: '6px',
                            }}
                          >
                            {item.priceCop}
                          </span>
                        </div>

                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                          <small style={{ fontSize: '0.66rem', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            🏪 {item.merchant}
                          </small>
                          <h3
                            onClick={() => {
                              setAllRafflesModal(null);
                              setSelectedRaffleDetail(item);
                            }}
                            style={{
                              margin: 0,
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              lineHeight: 1.25,
                              color: isDark ? '#ffffff' : '#0f172a',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '2.5em',
                              cursor: 'pointer',
                            }}
                          >
                            {item.title}
                          </h3>

                          <div style={{ width: '100%', height: '5px', borderRadius: '999px', background: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0', overflow: 'hidden' }}>
                            <div style={{ width: `${item.soldPercent}%`, height: '100%', background: item.soldPercent >= 85 ? '#ef4444' : '#007AFF' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: isDark ? '#cbd5e1' : '#475569', fontWeight: 700 }}>
                            <span>{item.soldPercent}% vendido</span>
                            <span>{item.city}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAllRafflesModal(null);
                              handleOpenTicketModal(item);
                            }}
                            style={{
                              marginTop: 'auto',
                              width: '100%',
                              padding: '7px 8px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#007AFF',
                              color: '#ffffff',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Comprar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setModalVisibleCount((c) => c + 24)}
                        style={{
                          padding: '10px 22px',
                          borderRadius: '999px',
                          border: '1px solid #007AFF',
                          background: 'rgba(0, 122, 255, 0.12)',
                          color: '#007AFF',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Cargar más sorteos ({filteredModalList.length - modalVisibleCount} restantes)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

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
                    background: copiedLink ? '#0284c7' : '#007AFF',
                    color: '#ffffff',
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
            <div style={{
              position: 'relative',
              height: '180px',
              width: '100%',
              background: selectedVitrinaAd.id === 'ad-el-ganador-oficial'
                ? 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 35%, #000000 78%)'
                : '#000'
            }}>
              <img
                src={selectedVitrinaAd.image}
                alt={selectedVitrinaAd.brand}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: selectedVitrinaAd.id === 'ad-el-ganador-oficial' ? 'contain' : 'cover',
                  padding: selectedVitrinaAd.id === 'ad-el-ganador-oficial' ? '10px 14px' : '0',
                  filter: selectedVitrinaAd.id === 'ad-el-ganador-oficial'
                    ? 'drop-shadow(0 0 28px rgba(255, 255, 255, 0.38)) drop-shadow(0 8px 18px rgba(0,0,0,0.85))'
                    : 'none',
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: selectedVitrinaAd.id === 'ad-el-ganador-oficial' ? 'none' : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
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
                <span style={{ fontSize: '10px', background: '#007AFF', color: '#ffffff', fontWeight: 900, padding: '3px 8px', borderRadius: '6px' }}>
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
                  <div suppressHydrationWarning style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>
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
                    background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)'
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

      {/* MODAL DE DETALLE COMPLETO DEL SORTEO EN PANTALLA TOTAL */}
      {selectedRaffleDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detalle oficial del sorteo"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            backgroundColor: theme === 'dark' ? '#090d16' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#0f172a',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* CABECERA STICKY EN PANTALLA COMPLETA */}
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              backgroundColor: theme === 'dark' ? 'rgba(9, 13, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              padding: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 16px) 16px 12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedRaffleDetail(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
              aria-label="Volver al feed principal"
            >
              <span>←</span> Volver
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🛡️ Sorteo Legal Verificado
              </span>
              <button
                type="button"
                onClick={() => handleShareRaffle(selectedRaffleDetail)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                }}
                title="Compartir este sorteo"
                aria-label="Compartir este sorteo"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </header>

          {/* CUERPO DEL DETALLE DEL SORTEO EN PANTALLA COMPLETA */}
          <div style={{ flex: 1, paddingBottom: '30px' }}>
            {/* IMAGEN PRINCIPAL EN ALTA DEFINICIÓN */}
            <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#000000' }}>
              <img
                src={selectedRaffleDetail.image}
                alt={selectedRaffleDetail.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 45%)' }} />

              {/* BADGES SOBRE LA IMAGEN */}
              <div style={{ position: 'absolute', top: '12px', left: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(0,0,0,0.7)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {selectedRaffleDetail.category === 'autos' ? '🚗 Vehículos 4x4' : selectedRaffleDetail.category === 'motos' ? '🏍️ Motocicletas' : selectedRaffleDetail.category === 'joyas' ? '⌚ Relojes & Joyería' : selectedRaffleDetail.category === 'tech' ? '⚡ Tecnología' : selectedRaffleDetail.category === 'hogar' ? '🏠 Hogar & Viajes' : '🎁 Sorteo VIP'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '6px' }}>
                  🔥 Juega {selectedRaffleDetail.timeLabel}
                </span>
              </div>

              <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                  <span>🏢</span> {selectedRaffleDetail.merchant}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  {selectedRaffleDetail.title}
                </h2>
              </div>
            </div>

            {/* INFORMACIÓN DEL SORTEO Y COMERCIO */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
              {/* PRECIO POR BOLETA Y DISPONIBILIDAD */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: theme === 'dark' ? '#141a24' : '#f8fafc',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: theme === 'dark' ? '#94a3b8' : '#64748b', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Precio por boleta
                  </span>
                  <strong style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284c7' }}>
                    {selectedRaffleDetail.priceCop}
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: theme === 'dark' ? '#94a3b8' : '#64748b', display: 'block', fontWeight: 700 }}>
                    Cuadrícula / Cifras
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
                    {selectedRaffleDetail.ballotGrid || 100} números ({selectedRaffleDetail.ballotGrid <= 100 ? '2 cifras' : selectedRaffleDetail.ballotGrid <= 1000 ? '3 cifras' : '4 cifras'})
                  </span>
                </div>
              </div>

              {/* BARRA DE PROGRESO DE VENTAS */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: theme === 'dark' ? '#141a24' : '#f8fafc',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  <span>Boletas Vendidas: {selectedRaffleDetail.soldPercent || 82}%</span>
                  <span style={{ color: '#0284c7' }}>Quedan {Math.round((selectedRaffleDetail.ballotGrid || 100) * (1 - (selectedRaffleDetail.soldPercent || 82) / 100))} disponibles</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: theme === 'dark' ? '#1e293b' : '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${selectedRaffleDetail.soldPercent || 82}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '999px' }} />
                </div>
              </div>

              {/* DESCRIPCIÓN DETALLADA DEL PREMIO */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 8px', color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
                  Descripción y Especificaciones Oficiales
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.6, color: theme === 'dark' ? '#cbd5e1' : '#475569', margin: 0 }}>
                  {selectedRaffleDetail.description || 'Participa por este premio 100% garantizado. Se entrega completamente nuevo de vitrina, con factura legal a nombre del ganador, póliza de garantía vigente y cobertura nacional de transporte.'}
                </p>
              </div>

              {/* GARANTÍAS Y RESPALDO LEGAL */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: theme === 'dark' ? '#0f172a' : '#f0fdf4',
                  border: theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #bbf7d0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 800, fontSize: '13px' }}>
                  <span>✅</span>
                  <span>Garantía de Transparencia y Entrega Notarial</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#166534', lineHeight: 1.5 }}>
                  <li>Transmisión en directo del sorteo por Sala 3D en tiempo real.</li>
                  <li>Sorteo certificado bajo la Ley 643 de 2001 y Decreto 1486 de 2024.</li>
                  <li>Entrega de premio asegurada con acta formal ante Notaría Pública.</li>
                  <li>Pagos 100% protegidos por pasarela Wompi Bancolombia.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* BARRA INFERIOR STICKY CON EL BOTÓN COMPRAR */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 50,
              backgroundColor: theme === 'dark' ? 'rgba(9, 13, 22, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              padding: '12px 16px max(16px, env(safe-area-inset-bottom)) 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <small style={{ fontSize: '10px', color: theme === 'dark' ? '#94a3b8' : '#64748b', display: 'block' }}>Total por Boleta</small>
              <strong style={{ fontSize: '16px', fontWeight: 900, color: '#0284c7' }}>{selectedRaffleDetail.priceCop}</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                const raffle = selectedRaffleDetail;
                setSelectedRaffleDetail(null);
                handleOpenTicketModal(raffle);
              }}
              style={{
                flex: 1,
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>🎟️</span> Comprar Boleta Ahora →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
