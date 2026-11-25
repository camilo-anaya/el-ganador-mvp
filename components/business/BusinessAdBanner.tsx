// components/business/BusinessAdBanner.tsx
// Banner de publicidad de la superficie EMPRESARIAL (lee /api/banner-ads).
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BusinessAdBanner() {
  const [liveBannerAds, setLiveBannerAds] = useState<Array<{
    id: string;
    businessName: string;
    headline: string;
    description: string;
    imageUrl: string;
    ctaText: string;
    ctaLink: string;
    badge?: string;
    planTier?: string;
  }>>([
    {
      id: 'official-el-ganador-b2b',
      businessName: 'El Ganador Oficial',
      headline: 'Impulsa tu Marca y Tus Sorteos en El Ganador',
      description: 'Anuncia tu negocio en el banner principal de toda la app con planes desde $49.900/mes y llega a miles de participantes.',
      imageUrl: '/banner-el-ganador-oficial.png',
      ctaText: '📢 Publicar Mi Anuncio',
      ctaLink: '/empresario/publicidad',
      badge: 'OFICIAL · PAUTA ACTIVA',
    },
  ]);
  const [bannerSlideIdx, setBannerSlideIdx] = useState(0);

  // Cargar anuncios activos reales del banner (/api/banner-ads) para mostrarlos igual que en web
  useEffect(() => {
    let mounted = true;
    fetch('/api/banner-ads?activeOnly=true')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data?.ads || !Array.isArray(data.ads)) return;
        const activeFromApi = data.ads.map((ad: any) => ({
          id: ad.id,
          businessName: ad.businessName || 'Aliado Comercial',
          headline: ad.headline || 'Promoción Activa',
          description: ad.description || 'Campaña verificada en la vitrina oficial de El Ganador.',
          imageUrl: ad.imageUrl || '/banner-el-ganador-oficial.png',
          ctaText: ad.ctaText || 'Ver Promoción',
          ctaLink: ad.ctaLink || '/empresario/publicidad',
          badge: ad.planTier ? `PAUTA ${String(ad.planTier).toUpperCase()}` : 'ANUNCIO ACTIVO',
        }));
        if (activeFromApi.length > 0) {
          setLiveBannerAds((prev) => {
            const official = prev[0];
            const filtered = activeFromApi.filter((a: any) => a.id !== official.id);
            return [official, ...filtered];
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (liveBannerAds.length <= 1) return;
    const timer = setInterval(() => {
      setBannerSlideIdx((prev) => (prev + 1) % liveBannerAds.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [liveBannerAds.length]);

  return (
    <>
          {(() => {
            const currentAd = liveBannerAds[bannerSlideIdx] || liveBannerAds[0];
            return (
              <section
                aria-label="Vitrina Publicitaria Empresarial"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  marginBottom: '14px',
                  borderRadius: 0,
                  overflow: 'hidden',
                  background: '#05070a',
                  borderTop: '1px solid rgba(245, 184, 46, 0.38)',
                  borderBottom: '1px solid rgba(245, 184, 46, 0.38)',
                  borderLeft: 'none',
                  borderRight: 'none',
                  boxShadow: '0 10px 26px rgba(0, 0, 0, 0.22)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '180px',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {liveBannerAds.map((ad, idx) => {
                    const isActive = idx === (bannerSlideIdx % liveBannerAds.length);
                    const isOfficial = ad.imageUrl?.includes('banner-el-ganador-oficial');
                    return (
                      <div
                        key={ad.id || idx}
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
                        }}
                      >
                        <img
                          src={ad.imageUrl}
                          alt={ad.headline}
                          loading="eager"
                          decoding="async"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: isOfficial ? '8px 12px' : '0',
                            filter: isOfficial
                              ? 'drop-shadow(0 0 28px rgba(255, 255, 255, 0.38)) drop-shadow(0 8px 18px rgba(0,0,0,0.85))'
                              : 'none',
                            display: 'block',
                          }}
                        />
                      </div>
                    );
                  })}
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(5, 7, 10, 0.82)',
                      border: '1px solid rgba(245, 184, 46, 0.65)',
                      color: '#fde047',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {currentAd.badge || 'PUBLICIDAD ACTIVA'}
                  </span>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, #0b1622 0%, #071b14 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f5b82e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📢 {currentAd.businessName} · Banner Oficial
                    </div>
                    <div role="heading" aria-level={3} style={{ margin: '3px 0 4px', fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
                      {currentAd.headline}
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {currentAd.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <Link
                      href="/empresario/publicidad"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f5b82e 0%, #d97706 100%)',
                        color: '#090d12',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(245, 184, 46, 0.35)',
                      }}
                    >
                      📢 Subir / Gestionar Mi Publicidad →
                    </Link>

                    {liveBannerAds.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {liveBannerAds.map((ad, idx) => (
                          <button
                            key={ad.id}
                            type="button"
                            aria-label={`Ver anuncio ${idx + 1}`}
                            onClick={() => setBannerSlideIdx(idx)}
                            style={{
                              width: idx === bannerSlideIdx ? '20px' : '7px',
                              height: '7px',
                              borderRadius: '999px',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              background: idx === bannerSlideIdx ? '#f5b82e' : 'rgba(255,255,255,0.35)',
                              transition: 'all 0.2s ease',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })()}

    </>
  );
}
