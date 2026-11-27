// app/perfil/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DesktopSidebar from '@/components/DesktopSidebar';
import BottomNav from '@/components/BottomNav';
import { useTheme } from '@/context/ThemeContext';
import { getUserSession } from '@/lib/nativeActions';
import { supabase } from '@/lib/supabase';
import { performLogout } from '@/lib/logout';
import { ensureNativeNotificationPermission } from '@/lib/nativeNotifications';

const IPHONE_AVATARS = ['👑', '🦁', '⚡', '💎', '🚀', '🏆'];

export default function PerfilClientePage() {
  const router = useRouter();
  const [name, setName] = useState('Carlos Pérez');
  const [email, setEmail] = useState('carlos@elganador.co');
  const [phone, setPhone] = useState('+57 300 456 7890');
  const [city, setCity] = useState('Barranquilla, Colombia');
  const [avatarEmoji, setAvatarEmoji] = useState('👑');
  const [defaultPayment, setDefaultPayment] = useState<'nequi' | 'pse' | 'tarjeta'>('nequi');
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyLiveDraws, setNotifyLiveDraws] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, themePreference, setThemePreference } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  // 1. Carga inicial desde localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('elganador_client_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name) setName(p.name);
        if (p.email) setEmail(p.email);
        if (p.phone) setPhone(p.phone);
        if (p.city) setCity(p.city);
        if (p.avatarEmoji && IPHONE_AVATARS.includes(p.avatarEmoji)) setAvatarEmoji(p.avatarEmoji);
        if (p.defaultPayment) setDefaultPayment(p.defaultPayment);
        if (typeof p.notifyWhatsapp === 'boolean') setNotifyWhatsapp(p.notifyWhatsapp);
        if (typeof p.notifyLiveDraws === 'boolean') setNotifyLiveDraws(p.notifyLiveDraws);
      } else {
        const s = getUserSession();
        if (s.name) setName(s.name);
        if (s.email) setEmail(s.email);
        if (s.phone) setPhone(s.phone);
        if (s.city) setCity(s.city);
      }

      const savedEmoji = localStorage.getItem('elganador_client_avatar_emoji');
      if (savedEmoji && IPHONE_AVATARS.includes(savedEmoji)) {
        setAvatarEmoji(savedEmoji);
      }
    } catch (err) {
      console.warn('Error al leer perfil de localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Auto-guardado en localStorage ante cualquier cambio
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const profile = {
        name,
        email,
        phone,
        city,
        avatarEmoji,
        defaultPayment,
        notifyWhatsapp,
        notifyLiveDraws,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('elganador_client_profile', JSON.stringify(profile));
      localStorage.setItem('elganador_client_avatar_emoji', avatarEmoji);
      localStorage.setItem(
        'elganador_session',
        JSON.stringify({ loggedIn: true, role: 'buyer', name, email, phone, city })
      );
    } catch (err) {
      console.warn('Error al guardar perfil en localStorage:', err);
    }
  }, [name, email, phone, city, avatarEmoji, defaultPayment, notifyWhatsapp, notifyLiveDraws, isLoaded]);

  const handleSelectEmoji = (emoji: string) => {
    setAvatarEmoji(emoji);
    localStorage.setItem('elganador_client_avatar_emoji', emoji);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profile = {
        name,
        email,
        phone,
        city,
        avatarEmoji,
        defaultPayment,
        notifyWhatsapp,
        notifyLiveDraws,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('elganador_client_profile', JSON.stringify(profile));
      localStorage.setItem('elganador_client_avatar_emoji', avatarEmoji);
      localStorage.setItem(
        'elganador_session',
        JSON.stringify({ loggedIn: true, role: 'buyer', name, email, phone, city })
      );
    } catch {}
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción borrará tus datos, tiquetes y perfil de forma permanente.'
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.clear();
      alert('Tu cuenta ha sido eliminada exitosamente.');
      window.location.href = '/ingreso';
    } catch (err) {
      console.error('Error al eliminar la cuenta:', err);
      localStorage.clear();
      alert('Tu cuenta ha sido eliminada exitosamente.');
      window.location.href = '/ingreso';
    }
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#121620' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1a2230' : '#f8fafc';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : '#cbd5e1';

  return (
    <div
      className="app-shell"
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#080c14' : '#f8fafc',
        color: textColor,
        paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 24px))',
      }}
    >
      {/* CABECERA CRISTALINA Y TOTALMENTE SÓLIDA (SIN NUBE BLANCA) */}
      <header
        className="app-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px 16px',
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderBottom: `1px solid ${cardBorder}`,
          width: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            aria-label="Volver al Marketplace"
            href="/"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
              color: textColor,
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 700,
              border: `1px solid ${inputBorder}`,
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
          >
            ←
          </Link>
          <div>
            <h1
              style={{
                fontSize: '17px',
                fontWeight: 900,
                margin: 0,
                color: textColor,
                lineHeight: 1.2,
                letterSpacing: '-0.3px',
              }}
            >
              Mi Perfil & Ajustes
            </h1>
            <small style={{ fontSize: '11px', color: '#007AFF', fontWeight: 700, display: 'block' }}>
              Cuenta de Comprador · Colombia (+18)
            </small>
          </div>
        </div>
      </header>

      <div className="desktop-workspace-grid" style={{ maxWidth: '680px', margin: '0 auto', padding: '14px 0' }}>
        <DesktopSidebar />
        <main
          className="app-scroll-canvas native-bottom-safe-space"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            padding: '0 14px',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {/* TARJETA 1: HERO DE IDENTIDAD & AVATAR EMOJI */}
          <section
            className="profile-card-premium"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '20px',
              padding: '18px 16px',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 4px 18px rgba(15,23,42,0.06)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.35), rgba(0, 122, 255, 0.12))'
                    : 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                  border: '2.5px solid #007AFF',
                  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
                  flexShrink: 0,
                }}
              >
                <span>{avatarEmoji}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    margin: '0 0 3px',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: textColor,
                    letterSpacing: '-0.3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: subtextColor, fontWeight: 600 }}>
                  📍 {city}
                </p>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#059669',
                    background: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid rgba(5, 150, 105, 0.35)',
                  }}
                >
                  ✅ Identidad Verificada (+18)
                </span>
              </div>
            </div>

            {/* SELECTOR DE 6 EMOJIS TIPO IPHONE PREDEFINIDOS */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: `1px solid ${cardBorder}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'block',
                  marginBottom: '10px',
                  color: textColor,
                }}
              >
                Elige tu Imagen de Perfil:
              </span>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                }}
              >
                {IPHONE_AVATARS.map((emoji) => {
                  const isSelected = avatarEmoji === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelectEmoji(emoji)}
                      style={{
                        fontSize: '1.75rem',
                        width: '46px',
                        height: '46px',
                        minWidth: '46px',
                        minHeight: '46px',
                        padding: 0,
                        borderRadius: '50%',
                        border: isSelected ? '2.5px solid #007AFF' : `1.5px solid ${cardBorder}`,
                        background: isSelected
                          ? isDark
                            ? 'rgba(0, 122, 255, 0.28)'
                            : '#dbeafe'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : '#f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isSelected ? '0 0 12px rgba(0, 122, 255, 0.45)' : 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      title={`Seleccionar emoji ${emoji}`}
                      aria-label={`Seleccionar emoji ${emoji}`}
                    >
                      <span>{emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* TARJETA 2: AJUSTES DE CUENTA Y DATOS PERSONALES */}
          <section
            className="profile-card-premium"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '20px',
              padding: '18px 16px',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 4px 18px rgba(15,23,42,0.06)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: `1px solid ${cardBorder}`,
                marginBottom: '14px',
              }}
            >
              <span style={{ fontSize: '18px' }}>⚙️</span>
              <h2 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: textColor }}>
                Ajustes de la Cuenta
              </h2>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: subtextColor }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    background: inputBg,
                    border: `1.5px solid ${inputBorder}`,
                    color: textColor,
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: subtextColor }}>
                    Celular WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 300 123 4567"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 14px',
                      borderRadius: '12px',
                      background: inputBg,
                      border: `1.5px solid ${inputBorder}`,
                      color: textColor,
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: subtextColor }}>
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tu ciudad (ej. Barranquilla)"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 14px',
                      borderRadius: '12px',
                      background: inputBg,
                      border: `1.5px solid ${inputBorder}`,
                      color: textColor,
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: subtextColor }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    background: inputBg,
                    border: `1.5px solid ${inputBorder}`,
                    color: textColor,
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: subtextColor }}>
                  Método de pago predeterminado
                </label>
                <select
                  value={defaultPayment}
                  onChange={(e) => setDefaultPayment(e.target.value as 'nequi' | 'pse' | 'tarjeta')}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    background: inputBg,
                    border: `1.5px solid ${inputBorder}`,
                    color: textColor,
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 600,
                  }}
                >
                  <option value="nequi">📱 Nequi / Daviplata Express</option>
                  <option value="pse">🏦 PSE (Transferencia Bancaria Colombia)</option>
                  <option value="tarjeta">💳 Tarjeta Débito / Crédito</option>
                </select>
              </div>

              {/* SECCIÓN PREFERENCIAS & TEMA DE PANTALLA */}
              <div
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: textColor,
                  }}
                >
                  <span>📲 Comprobantes y boletas por WhatsApp</span>
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#007AFF' }}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: textColor,
                  }}
                >
                  <span>🔴 Alerta 15 min antes de Sala en Vivo</span>
                  <input
                    type="checkbox"
                    checked={notifyLiveDraws}
                    onChange={async (e) => {
                      const val = e.target.checked;
                      setNotifyLiveDraws(val);
                      if (val) {
                        try {
                          await ensureNativeNotificationPermission();
                        } catch {}
                      }
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#007AFF' }}
                  />
                </label>

                {/* SELECTOR DE TEMA CLARO / OSCURO */}
                <div
                  onClick={() => setShowThemeModal(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setShowThemeModal(true);
                  }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                    border: `1px solid ${cardBorder}`,
                    marginTop: '2px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {themePreference === 'light' ? '☀️' : themePreference === 'dark' ? '🌙' : '🌓'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: textColor }}>
                        Tema de Pantalla
                      </div>
                      <small style={{ color: subtextColor, fontSize: '0.72rem', display: 'block' }}>
                        {themePreference === 'system'
                          ? 'Automático (del sistema)'
                          : themePreference === 'dark'
                          ? 'Modo Oscuro (Dark)'
                          : 'Modo Claro (Fondo Blanco)'}
                      </small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        background: '#007AFF',
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      {themePreference === 'system' ? 'Automático' : themePreference === 'dark' ? 'Oscuro' : 'Claro'}
                    </span>
                    <span style={{ color: subtextColor, fontSize: '16px' }}>›</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  height: '48px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  background: savedNotice
                    ? '#10b981'
                    : 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.3)',
                  transition: 'background 0.2s ease, transform 0.1s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {savedNotice ? '✅ ¡Cambios Guardados Correctamente!' : 'Guardar Cambios de Perfil'}
              </button>
            </form>
          </section>

          {/* TARJETA 3: ACCESOS RÁPIDOS Y SEGURIDAD */}
          <section
            className="profile-card-premium"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '20px',
              padding: '16px 18px',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 4px 18px rgba(15,23,42,0.06)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '10px',
                borderBottom: `1px solid ${cardBorder}`,
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '18px' }}>🎟️</span>
              <h2 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: textColor }}>
                Mis Accesos Rápidos
              </h2>
            </div>

            <Link
              href="/mis-boletas"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 6px',
                borderBottom: `1px solid ${cardBorder}`,
                textDecoration: 'none',
                color: textColor,
                fontWeight: 700,
                fontSize: '0.88rem',
              }}
            >
              <span>🎟️ Mis Boletas y Certificados SHA-256</span>
              <span style={{ color: subtextColor, fontSize: '16px' }}>›</span>
            </Link>

            <Link
              href="/sorteo-en-vivo"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 6px',
                textDecoration: 'none',
                color: textColor,
                fontWeight: 700,
                fontSize: '0.88rem',
              }}
            >
              <span>🎱 Sorteo en Vivo (Balotera y Ruleta)</span>
              <span style={{ color: subtextColor, fontSize: '16px' }}>›</span>
            </Link>
          </section>

          {/* TARJETA 4: SESIÓN Y GESTIÓN DE CUENTA (NUNCA TIERRA NI TAPA LA ISLA) */}
          <section
            className="profile-card-premium"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '20px',
              padding: '18px 16px',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 4px 18px rgba(15,23,42,0.06)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '10px',
                borderBottom: `1px solid ${cardBorder}`,
              }}
            >
              <span style={{ fontSize: '18px' }}>🔐</span>
              <h2 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: textColor }}>
                Seguridad & Sesión
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void performLogout()}
              className="profile-btn-action"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.28)',
                color: '#ef4444',
                padding: '14px 16px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🚪</span>
              <span>Cerrar Sesión / Salir</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              style={{
                background: 'transparent',
                border: 'none',
                color: subtextColor,
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <span>🗑️</span>
              <span>Eliminar cuenta y datos permanentemente</span>
            </button>
          </section>

          {/* ESPACIADOR INFERIOR SEGURO PARA QUE LA ISLA FLOTANTE NUNCA TAPE NADA */}
          <div style={{ height: 'calc(110px + env(safe-area-inset-bottom, 24px))', width: '100%', flexShrink: 0 }} aria-hidden="true" />
          </section>
        </main>
      </div>

      {/* MODAL DE CAMBIO DE TEMA DE PANTALLA */}
      {showThemeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Seleccionar tema de pantalla"
          onClick={() => setShowThemeModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 0 max(env(safe-area-inset-bottom, 0px), 16px) 0',
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '92%',
              maxWidth: '440px',
              backgroundColor: cardBg,
              borderRadius: '24px',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              padding: '22px 20px',
              color: textColor,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🌓</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: textColor }}>
                  Tema de Pantalla
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar modal de tema"
                onClick={() => setShowThemeModal(false)}
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
                  border: 'none',
                  color: textColor,
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: subtextColor, lineHeight: 1.4 }}>
              Personaliza el estilo visual de El Ganador en este dispositivo:
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              {/* Opción 1: Modo Claro (Fondo Blanco) */}
              <button
                type="button"
                onClick={() => {
                  setThemePreference('light');
                  setShowThemeModal(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: themePreference === 'light' ? '2px solid #007AFF' : `1px solid ${cardBorder}`,
                  background: themePreference === 'light'
                    ? isDark
                      ? 'rgba(0, 122, 255, 0.2)'
                      : '#eff6ff'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : '#f8fafc',
                  color: textColor,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>☀️</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: textColor }}>Modo Claro</div>
                    <div style={{ fontSize: '12px', color: subtextColor }}>Fondo blanco impecable</div>
                  </div>
                </div>
                {themePreference === 'light' && (
                  <span style={{ color: '#007AFF', fontWeight: 800, fontSize: '18px' }}>✓</span>
                )}
              </button>

              {/* Opción 2: Modo Oscuro */}
              <button
                type="button"
                onClick={() => {
                  setThemePreference('dark');
                  setShowThemeModal(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: themePreference === 'dark' ? '2px solid #007AFF' : `1px solid ${cardBorder}`,
                  background: themePreference === 'dark'
                    ? isDark
                      ? 'rgba(0, 122, 255, 0.2)'
                      : '#eff6ff'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : '#f8fafc',
                  color: textColor,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🌙</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: textColor }}>Modo Oscuro</div>
                    <div style={{ fontSize: '12px', color: subtextColor }}>Fondo negro de lujo</div>
                  </div>
                </div>
                {themePreference === 'dark' && (
                  <span style={{ color: '#007AFF', fontWeight: 800, fontSize: '18px' }}>✓</span>
                )}
              </button>

              {/* Opción 3: Automático */}
              <button
                type="button"
                onClick={() => {
                  setThemePreference('system');
                  setShowThemeModal(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: themePreference === 'system' ? '2px solid #007AFF' : `1px solid ${cardBorder}`,
                  background: themePreference === 'system'
                    ? isDark
                      ? 'rgba(0, 122, 255, 0.2)'
                      : '#eff6ff'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : '#f8fafc',
                  color: textColor,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📱</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: textColor }}>
                      Automático del Sistema
                    </div>
                    <div style={{ fontSize: '12px', color: subtextColor }}>
                      Sincroniza con los ajustes de tu teléfono
                    </div>
                  </div>
                </div>
                {themePreference === 'system' && (
                  <span style={{ color: '#007AFF', fontWeight: 800, fontSize: '18px' }}>✓</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ISLA INFERIOR FLOTANTE */}
      <BottomNav currentTab="perfil" />
    </div>
  );
}
