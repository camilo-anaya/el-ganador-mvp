'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import BottomNav from '@/components/BottomNav';

interface Merchant {
  id: string;
  name: string;
  category: string;
  avatar: string;
  verified: boolean;
  baseFollowers: number;
  rating: number;
  description: string;
  activeRafflesCount: number;
}

interface LikedRaffle {
  id: string;
  title: string;
  merchant: string;
  priceCop: string;
  image: string;
  soldPercent: number;
  ballotGrid: number;
  timeLabel: string;
}

const DEFAULT_MERCHANTS: Merchant[] = [
  {
    id: 'tech-store',
    name: 'TechStore Colombia',
    category: '⚡ Tecnología & Celulares',
    avatar: '📱',
    verified: true,
    baseFollowers: 1420,
    rating: 4.9,
    description: 'Distribuidor autorizado de tecnología, smartphones de alta gama y accesorios premium.',
    activeRafflesCount: 3,
  },
  {
    id: 'motos-caribe',
    name: 'Motos Caribe Oficial',
    category: '🏍️ Motos & Vehículos',
    avatar: '🏍️',
    verified: true,
    baseFollowers: 2850,
    rating: 5.0,
    description: 'Concesionario oficial de motocicletas de alto cilindraje y vehículos todo terreno en Colombia.',
    activeRafflesCount: 2,
  },
  {
    id: 'autopremier-4x4',
    name: 'AutoPremier Colombia 4x4',
    category: '🚙 Autos & Camionetas',
    avatar: '🚙',
    verified: true,
    baseFollowers: 3120,
    rating: 4.9,
    description: 'Camionetas 4x4, pick-ups y vehículos de lujo matriculados y listos para entrega inmediata.',
    activeRafflesCount: 2,
  },
  {
    id: 'joyas-diamantes',
    name: 'Joyas & Diamantes ABC',
    category: '💎 Joyas & Relojería',
    avatar: '💎',
    verified: true,
    baseFollowers: 980,
    rating: 4.8,
    description: 'Alta joyería en oro de 18 kilates, diamantes certificados y cronógrafos de precisión suiza.',
    activeRafflesCount: 2,
  },
  {
    id: 'boutique-elegance',
    name: 'Boutique Elegance & Óptica VIP',
    category: '👠 Moda, Calzado & Gafas',
    avatar: '👠',
    verified: true,
    baseFollowers: 1140,
    rating: 4.9,
    description: 'Moda femenina y masculina de alta costura, calzado de diseñador y salud visual certificada.',
    activeRafflesCount: 2,
  },
  {
    id: 'viajes-suenos',
    name: 'Viajes & Sueños VIP',
    category: '✈️ Viajes & Turismo',
    avatar: '✈️',
    verified: true,
    baseFollowers: 1890,
    rating: 4.9,
    description: 'Planes turísticos todo incluido a los mejores destinos del Caribe y del mundo.',
    activeRafflesCount: 1,
  },
  {
    id: 'hogar-confort',
    name: 'Hogar & Confort VIP',
    category: '🏡 Hogar & Electrodomésticos',
    avatar: '🏡',
    verified: true,
    baseFollowers: 760,
    rating: 4.7,
    description: 'Smart TVs 4K, centros de entretenimiento y electrodomésticos de última generación.',
    activeRafflesCount: 2,
  },
];

const DEFAULT_LIKED_RAFFLES: LikedRaffle[] = [
  {
    id: 'rf-1',
    title: 'Smartphone 5G Pro Max + Smartwatch',
    merchant: 'TechStore Colombia',
    priceCop: '$ 25.000',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    soldPercent: 92,
    ballotGrid: 100,
    timeLabel: '⏳ En 2h 15m',
  },
  {
    id: 'rf-2',
    title: 'Yamaha MT-09 0 km + Matrícula',
    merchant: 'Motos Caribe Oficial',
    priceCop: '$ 35.000',
    image: '/galeria-premios-el-ganador-realista.jpg',
    soldPercent: 88,
    ballotGrid: 100,
    timeLabel: '⏳ En 4h 40m',
  },
  {
    id: 'rf-3',
    title: 'Cronógrafo Suizo & Cadena Oro 18K',
    merchant: 'Joyas & Diamantes ABC',
    priceCop: '$ 50.000',
    image: '/reloj-alta-gama.jpg',
    soldPercent: 64,
    ballotGrid: 100,
    timeLabel: '📅 Sáb 9:00 PM',
  },
  {
    id: 'rf-5',
    title: 'Toyota Hilux 4x4 Diésel 2026',
    merchant: 'AutoPremier Colombia 4x4',
    priceCop: '$ 50.000',
    image: '/galeria-premios-el-ganador-realista.jpg',
    soldPercent: 78,
    ballotGrid: 100,
    timeLabel: '⏳ En 6h 30m',
  },
];

export default function FavoritosPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'clientes' | 'empresarios'>('clientes');
  const [followedMerchants, setFollowedMerchants] = useState<string[]>([]);
  const [likedRaffles, setLikedRaffles] = useState<LikedRaffle[]>([]);
  const [selectedMerchantForBiz, setSelectedMerchantForBiz] = useState<string>('TechStore Colombia');
  const [notificationSent, setNotificationSent] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inicializar estado desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedFollowed = localStorage.getItem('el_ganador_followed_merchants');
        if (storedFollowed) {
          setFollowedMerchants(JSON.parse(storedFollowed));
        } else {
          // Por defecto seguir los 2 primeros para que la vista inicial sea rica
          const initial = ['TechStore Colombia', 'Motos Caribe Oficial'];
          setFollowedMerchants(initial);
          localStorage.setItem('el_ganador_followed_merchants', JSON.stringify(initial));
        }

        const storedLikes = localStorage.getItem('el_ganador_liked_raffles');
        if (storedLikes) {
          const ids: string[] = JSON.parse(storedLikes);
          const filtered = DEFAULT_LIKED_RAFFLES.filter((r) => ids.includes(r.id));
          setLikedRaffles(filtered.length > 0 ? filtered : DEFAULT_LIKED_RAFFLES.slice(0, 3));
        } else {
          setLikedRaffles(DEFAULT_LIKED_RAFFLES.slice(0, 3));
          localStorage.setItem(
            'el_ganador_liked_raffles',
            JSON.stringify(DEFAULT_LIKED_RAFFLES.slice(0, 3).map((r) => r.id))
          );
        }
      } catch (e) {
        console.error('Error cargando favoritos de localStorage', e);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleFollow = (merchantName: string) => {
    let next: string[];
    if (followedMerchants.includes(merchantName)) {
      next = followedMerchants.filter((m) => m !== merchantName);
      showToast(`Dejaste de seguir a ${merchantName}`);
    } else {
      next = [...followedMerchants, merchantName];
      showToast(`¡Ahora sigues a ${merchantName}! Sus nuevos sorteos te aparecerán en favoritos.`);
    }
    setFollowedMerchants(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('el_ganador_followed_merchants', JSON.stringify(next));
    }
  };

  const handleRemoveLikedRaffle = (id: string, title: string) => {
    const next = likedRaffles.filter((r) => r.id !== id);
    setLikedRaffles(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('el_ganador_liked_raffles', JSON.stringify(next.map((r) => r.id)));
    }
    showToast(`Eliminaste "${title}" de tus sorteos favoritos`);
  };

  const handleSendBroadcastNotification = (merchantName: string) => {
    // Vista previa: los seguidores no están registrados en servidor, por lo que NO se envía nada real.
    setNotificationSent(merchantName);
    showToast(`👁️ Vista previa del aviso a seguidores de ${merchantName}. El envío real se habilita desde el panel CRM de tu plan.`);
    setTimeout(() => setNotificationSent(null), 4000);
  };

  const currentBiz = DEFAULT_MERCHANTS.find((m) => m.name === selectedMerchantForBiz) || DEFAULT_MERCHANTS[0];
  const isCurrentlyFollowedByClient = followedMerchants.includes(currentBiz.name);
  const totalFollowersCount = currentBiz.baseFollowers + (isCurrentlyFollowedByClient ? 1 : 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#0b1320' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        paddingBottom: '100px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '99px',
            fontSize: '14px',
            fontWeight: 700,
            boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeInDown 0.3s ease-out',
          }}
        >
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header
        className="app-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 44px) 14px 10px 14px',
          boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              aria-label="Volver al Inicio"
              href="/"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                color: isDark ? '#ffffff' : '#0f172a',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 700,
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                flexShrink: 0,
                transition: 'transform 0.15s ease',
              }}
            >
              ←
            </Link>
            <div>
              <h1
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  margin: 0,
                  color: isDark ? '#ffffff' : '#0f172a',
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                }}
              >
                Mis Favoritos & Seguidos
              </h1>
              <small style={{ fontSize: '10px', color: '#007AFF', fontWeight: 700, display: 'block' }}>
                Tus comercios verificados y sorteos guardados
              </small>
            </div>
          </div>

          {/* Selector de Perfil: Cliente vs Empresario */}
          <div
            style={{
              display: 'flex',
              background: isDark ? '#1e293b' : '#e2e8f0',
              padding: '3px',
              borderRadius: '10px',
              gap: '3px',
            }}
          >
            <button
              onClick={() => setActiveTab('clientes')}
              style={{
                border: 'none',
                background: activeTab === 'clientes' ? '#007AFF' : 'transparent',
                color: activeTab === 'clientes' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b',
                padding: '5px 10px',
                borderRadius: '7px',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>👤</span> Clientes
            </button>
            <button
              onClick={() => setActiveTab('empresarios')}
              style={{
                border: 'none',
                background: activeTab === 'empresarios' ? '#007AFF' : 'transparent',
                color: activeTab === 'empresarios' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b',
                padding: '5px 10px',
                borderRadius: '7px',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>🏢</span> Empresarios
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="native-bottom-safe-space" style={{ maxWidth: '1200px', margin: '14px auto', padding: '0 12px' }}>
        {/* ========================================================================= */}
        {/* TAB 1: CLIENTES - EMPRESAS SEGUIDAS Y SORTEOS FAVORITOS                   */}
        {/* ========================================================================= */}
        {activeTab === 'clientes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Banner Informativo */}
            <div
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(30, 41, 59, 0.75))'
                  : 'linear-gradient(135deg, #e0f2fe, #f0fdf4)',
                border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #bae6fd',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: '0 0 3px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: isDark ? '#38bdf8' : '#0369a1',
                  }}
                >
                  🔔 Recibe contenido exclusivo de tus empresas favoritas
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: isDark ? '#cbd5e1' : '#334155',
                    maxWidth: '720px',
                    lineHeight: 1.35,
                  }}
                >
                  Al seguir a un negocio, cada vez que publique una rifa o active una promoción VIP, te aparecerá
                  priorizado en tu catálogo y recibirás acceso antes que el público general.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  style={{
                    background: isDark ? '#0f172a' : '#ffffff',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block', fontWeight: 700 }}>
                    SEGUIDAS
                  </span>
                  <strong style={{ fontSize: '15px', color: '#0284c7', fontWeight: 900 }}>
                    {followedMerchants.length}
                  </strong>
                </div>
                <div
                  style={{
                    background: isDark ? '#0f172a' : '#ffffff',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block', fontWeight: 700 }}>
                    GUARDADOS
                  </span>
                  <strong style={{ fontSize: '15px', color: '#e11d48', fontWeight: 900 }}>
                    {likedRaffles.length}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: EMPRESAS QUE SIGUES */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '14.5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  >
                    <span>🏢</span> Empresas que Sigues ({followedMerchants.length})
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Negocios verificados con sorteos legales y respaldo oficial
                  </p>
                </div>
              </div>

              {followedMerchants.length === 0 ? (
                <div
                  style={{
                    background: isDark ? '#1e293b' : '#ffffff',
                    padding: '24px 16px',
                    borderRadius: '14px',
                    textAlign: 'center',
                    border: isDark ? '1px dashed #334155' : '1px dashed #cbd5e1',
                  }}
                >
                  <p style={{ fontSize: '26px', margin: '0 0 6px' }}>🏬</p>
                  <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800 }}>
                    Aún no sigues a ninguna empresa
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '11.5px', color: '#64748b' }}>
                    Sigue a los comercios para no perderte sus próximos sorteos y premios.
                  </p>
                  <button
                    onClick={() => {
                      const all = DEFAULT_MERCHANTS.map((m) => m.name);
                      setFollowedMerchants(all);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('el_ganador_followed_merchants', JSON.stringify(all));
                      }
                      showToast('¡Has seguido a todas las empresas oficiales!');
                    }}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                    }}
                  >
                    + Seguir Comercios Recomendados
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
                    gap: '10px',
                  }}
                >
                  {DEFAULT_MERCHANTS.filter((m) => followedMerchants.includes(m.name)).map((merchant) => (
                    <div
                      key={merchant.id}
                      style={{
                        background: isDark ? '#1e293b' : '#ffffff',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isDark ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: isDark ? '#0f172a' : '#f0f9ff',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: '18px',
                                border: '1px solid #bae6fd',
                                flexShrink: 0,
                              }}
                            >
                              {merchant.avatar}
                            </div>
                            <div>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  color: isDark ? '#ffffff' : '#0f172a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                {merchant.name}
                                {merchant.verified && (
                                  <span title="Comercio Verificado" style={{ color: '#0284c7', fontSize: '12px' }}>
                                    ✓
                                  </span>
                                )}
                              </h3>
                              <span style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 600 }}>
                                {merchant.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p
                          style={{
                            margin: '8px 0',
                            fontSize: '11px',
                            color: isDark ? '#cbd5e1' : '#475569',
                            lineHeight: 1.35,
                          }}
                        >
                          {merchant.description}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px',
                            fontSize: '10px',
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            👥 <strong>{(merchant.baseFollowers + 1).toLocaleString('es-CO')}</strong> seg.
                          </span>
                          <span>•</span>
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>⭐ {merchant.rating}</span>
                          <span>•</span>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>
                            🎟️ {merchant.activeRafflesCount} sorteos
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link
                          href="/"
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            background: '#0284c7',
                            color: '#ffffff',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '11px',
                            textDecoration: 'none',
                          }}
                        >
                          Ver Sorteos →
                        </Link>
                        <button
                          onClick={() => handleToggleFollow(merchant.name)}
                          style={{
                            background: isDark ? '#334155' : '#f1f5f9',
                            color: isDark ? '#f8fafc' : '#475569',
                            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Siguiendo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SECCIÓN 2: SORTEOS CON ME GUSTA (FAVORITOS) */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '14.5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  >
                    <span>❤️</span> Sorteos con "Me Gusta" ({likedRaffles.length})
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Tus rifas guardadas listas para apartar y seguir en vivo
                  </p>
                </div>
              </div>

              {likedRaffles.length === 0 ? (
                <div
                  style={{
                    background: isDark ? '#1e293b' : '#ffffff',
                    padding: '24px 16px',
                    borderRadius: '14px',
                    textAlign: 'center',
                    border: isDark ? '1px dashed #334155' : '1px dashed #cbd5e1',
                  }}
                >
                  <p style={{ fontSize: '26px', margin: '0 0 6px' }}>🤍</p>
                  <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800 }}>
                    No tienes sorteos guardados en favoritos
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '11.5px', color: '#64748b' }}>
                    En el catálogo principal, haz clic en el corazón ❤️ de cualquier sorteo para guardarlo aquí.
                  </p>
                  <Link
                    href="/"
                    style={{
                      display: 'inline-block',
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      textDecoration: 'none',
                    }}
                  >
                    Explorar Catálogo →
                  </Link>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
                    gap: '10px',
                  }}
                >
                  {likedRaffles.map((raffle) => {
                    const soldCount = Math.round((raffle.ballotGrid * raffle.soldPercent) / 100);
                    const remaining = Math.max(0, raffle.ballotGrid - soldCount);
                    return (
                      <article
                        key={raffle.id}
                        style={{
                          background: isDark ? '#1e293b' : '#ffffff',
                          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          boxShadow: isDark ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
                          <img
                            src={raffle.image}
                            alt={raffle.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              background: 'rgba(15, 23, 42, 0.85)',
                              color: '#f8fafc',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '5px',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            {raffle.timeLabel}
                          </span>
                          <span
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: '#f59e0b',
                              color: '#000000',
                              fontSize: '11px',
                              fontWeight: 900,
                              padding: '2px 6px',
                              borderRadius: '5px',
                            }}
                          >
                            {raffle.priceCop}
                          </span>
                        </div>

                        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <small
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: isDark ? '#38bdf8' : '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            🏪 {raffle.merchant}
                          </small>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '12.5px',
                              fontWeight: 800,
                              color: isDark ? '#ffffff' : '#0f172a',
                              lineHeight: 1.25,
                            }}
                          >
                            {raffle.title}
                          </h3>

                          {/* Barra de Progreso */}
                          <div style={{ marginTop: '2px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: isDark ? '#cbd5e1' : '#64748b',
                                marginBottom: '2px',
                              }}
                            >
                              <span>
                                🎟️ {soldCount} / {raffle.ballotGrid} balotas
                              </span>
                              <strong style={{ color: raffle.soldPercent >= 80 ? '#10b981' : '#f59e0b' }}>
                                {raffle.soldPercent}% ({remaining} disp.)
                              </strong>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: '5px',
                                background: isDark ? '#334155' : '#e2e8f0',
                                borderRadius: '99px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${raffle.soldPercent}%`,
                                  height: '100%',
                                  background: raffle.soldPercent >= 80 ? '#10b981' : '#0284c7',
                                  borderRadius: '99px',
                                }}
                              />
                            </div>
                          </div>

                          {/* Acciones */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <Link
                              href="/"
                              style={{
                                flex: 1,
                                textAlign: 'center',
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '6px 10px',
                                borderRadius: '7px',
                                fontWeight: 700,
                                fontSize: '11px',
                                textDecoration: 'none',
                              }}
                            >
                              Apartar Boleta →
                            </Link>
                            <button
                              onClick={() => handleRemoveLikedRaffle(raffle.id, raffle.title)}
                              title="Quitar de favoritos"
                              style={{
                                background: isDark ? '#334155' : '#fee2e2',
                                color: '#e11d48',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '7px',
                                fontWeight: 800,
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              ❤️ Quitar
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EMPRESARIOS - PANEL DE POPULARIDAD, SEGUIDORES & DIFUSIÓN           */}
        {/* ========================================================================= */}
        {activeTab === 'empresarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header del Panel Empresarial */}
            <div
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                  : 'linear-gradient(135deg, #ffffff, #f8fafc)',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#0284c7',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '22px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  {currentBiz.avatar}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a' }}>
                      {currentBiz.name}
                    </h2>
                    <span
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '99px',
                      }}
                    >
                      ✓ Verificado
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#64748b' }}>
                    {currentBiz.category} · Licencia y Sorteos Autorizados
                  </p>
                </div>
              </div>

              {/* Selector de Empresa para Demostración */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Empresa:</span>
                <select
                  value={selectedMerchantForBiz}
                  onChange={(e) => setSelectedMerchantForBiz(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {DEFAULT_MERCHANTS.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* KPIs de Popularidad y Fidelización */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
              }}
            >
              <div
                style={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: isDark ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>👥 SEGUIDORES</span>
                  <span style={{ fontSize: '14px' }}>📈</span>
                </div>
                <strong
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    display: 'block',
                    margin: '4px 0 2px',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  {totalFollowersCount.toLocaleString('es-CO')}
                </strong>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                  +14% clientes nuevos
                </span>
              </div>

              <div
                style={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: isDark ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#e11d48' }}>❤️ ME GUSTA</span>
                  <span style={{ fontSize: '14px' }}>🔥</span>
                </div>
                <strong
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    display: 'block',
                    margin: '4px 0 2px',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  {(currentBiz.baseFollowers * 3.4).toFixed(0)}
                </strong>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                  98.2% aprobación
                </span>
              </div>

              <div
                style={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: isDark ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b' }}>⭐ POPULARIDAD</span>
                  <span style={{ fontSize: '14px' }}>🏆</span>
                </div>
                <strong
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    display: 'block',
                    margin: '4px 0 2px',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  {currentBiz.rating} / 5.0
                </strong>
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>
                  Comercio Diamante
                </span>
              </div>

              <div
                style={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: isDark ? '0 3px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981' }}>🎯 CONVERSIÓN</span>
                  <span style={{ fontSize: '14px' }}>⚡</span>
                </div>
                <strong
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    display: 'block',
                    margin: '4px 0 2px',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  89.4%
                </strong>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                  De seguidor a boleto
                </span>
              </div>
            </div>

            {/* Herramienta de Difusión para Empresarios */}
            <div
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                  : 'linear-gradient(135deg, #f0fdf4, #ffffff)',
                border: isDark ? '1px solid #334155' : '1px solid #86efac',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: '0 0 3px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: isDark ? '#34d399' : '#15803d',
                  }}
                >
                  📢 Difusión Inmediata a tus {totalFollowersCount.toLocaleString('es-CO')} Seguidores
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: isDark ? '#cbd5e1' : '#334155',
                    maxWidth: '700px',
                    lineHeight: 1.35,
                  }}
                >
                  Envía un aviso push instantáneo a todos los clientes que te han dado "Seguir". Perfecto cuando lances
                  una nueva rifa o inicie la transmisión en vivo.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleSendBroadcastNotification(currentBiz.name)}
                  disabled={notificationSent === currentBiz.name}
                  style={{
                    background: notificationSent === currentBiz.name ? '#10b981' : '#007AFF',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{notificationSent === currentBiz.name ? '✓' : '🚀'}</span>
                  <span>
                    {notificationSent === currentBiz.name ? 'Aviso enviado' : 'Probar Aviso a Seguidores'}
                  </span>
                </button>
                <Link
                  href="/publicidad"
                  style={{
                    background: isDark ? '#334155' : '#ffffff',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    border: isDark ? '1px solid #475569' : '1px solid #bae6fd',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>⭐</span> Planes Publicitarios
                </Link>
              </div>
            </div>

            {/* Listado de Publicaciones de la Empresa */}
            <section>
              <h3
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  margin: '0 0 8px',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              >
                📊 Rendimiento de Sorteos Activos de {currentBiz.name}
              </h3>

              <div
                style={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflowX: 'auto',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                  <thead>
                    <tr
                      style={{
                        background: isDark ? '#0f172a' : '#f8fafc',
                        borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                      }}
                    >
                      <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 800, color: '#64748b' }}>
                        PREMIO / SORTEO
                      </th>
                      <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 800, color: '#64748b' }}>
                        VENTA DE BALOTAS
                      </th>
                      <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 800, color: '#64748b' }}>
                        INTERACCIONES
                      </th>
                      <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 800, color: '#64748b' }}>
                        ESTADO
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>
                        Smartphone 5G Pro Max + Smartwatch
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px' }}>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>92%</span> (92 de 100)
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px' }}>❤️ 340 me gusta · 👁️ 1.450 vistas</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '99px',
                          }}
                        >
                          En Vivo Hoy
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>
                        Combo Gamer: PlayStation 5 Pro + 2 Mandos
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px' }}>
                        <span style={{ fontWeight: 800, color: '#0284c7' }}>86%</span> (86 de 100)
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px' }}>❤️ 280 me gusta · 👁️ 1.120 vistas</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '99px',
                          }}
                        >
                          Próximo Cierre
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Espaciador de seguridad para evitar solapamiento con la barra de navegación flotante */}
        <div style={{ height: 'calc(140px + env(safe-area-inset-bottom, 34px))', width: '100%' }} />
      </main>

      {/* Bottom Bar Flotante para Mobile */}
      <BottomNav currentTab="favoritos" />
    </div>
  );
}
