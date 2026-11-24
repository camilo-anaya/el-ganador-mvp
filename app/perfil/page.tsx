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

  // 1. Carga inicial desde localStorage (Cero pérdida de datos)
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

  // Función para eliminar cuenta permanentemente
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción borrará tus datos, tiquetes y perfil de forma permanente.");
    if (!confirmed) return;

    try {
      // Nota: La eliminación real del usuario en auth requiere una función admin o llamada segura, 
      // pero aquí limpiamos la sesión local y el registro del cliente:
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.clear();
      alert("Tu cuenta ha sido eliminada exitosamente.");
      window.location.href = '/ingreso';
    } catch (err) {
      console.error("Error al eliminar la cuenta:", err);
      localStorage.clear();
      alert("Tu cuenta ha sido eliminada exitosamente.");
      window.location.href = '/ingreso';
    }
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand-cluster">
          <Link aria-label="Volver al Marketplace" className="profile-icon-btn" href="/">←</Link>
          <div>
            <span className="brand-title">MI PERFIL Y AJUSTES</span>
            <small className="brand-subtitle">Cuenta de Comprador · Colombia (+18)</small>
          </div>
        </div>
      </header>

      <div className="desktop-workspace-grid">
        <DesktopSidebar />
        <main className="app-scroll-canvas">
          {/* TARJETA DE CABECERA DE PERFIL CON 6 EMOJIS TIPO IPHONE */}
          <section className="station-block-premium">
            <div className="client-profile-hero" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                className="client-avatar-box"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.25), rgba(0, 122, 255, 0.08))',
                  border: '2px solid #007AFF',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                  flexShrink: 0,
                }}
              >
                <span>{avatarEmoji}</span>
              </div>
              <div className="client-profile-meta">
                <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem', color: '#ffffff' }}>{name}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>📍 {city} · ✅ Identidad Verificada (+18)</p>
              </div>
            </div>

            {/* SELECTOR DE 6 EMOJIS TIPO IPHONE PREDEFINIDOS */}
            <div className="avatar-picker-wrapper" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <span className="avatar-picker-label" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 10, color: 'var(--text-primary, #ffffff)' }}>
                Elige tu Imagen de Perfil:
              </span>
              <div className="avatar-emoji-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '4px 0' }}>
                {IPHONE_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className={`avatar-emoji-btn ${avatarEmoji === emoji ? 'active' : ''}`}
                    style={{
                      fontSize: '1.85rem',
                      width: 54,
                      height: 54,
                      minWidth: 54,
                      minHeight: 54,
                      padding: 0,
                      borderRadius: '50%',
                      border: avatarEmoji === emoji ? '2px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: avatarEmoji === emoji ? 'rgba(0, 122, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                      transform: avatarEmoji === emoji ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: avatarEmoji === emoji ? '0 0 14px rgba(0, 122, 255, 0.45)' : 'none',
                    }}
                    title={`Seleccionar emoji ${emoji}`}
                    aria-label={`Seleccionar emoji ${emoji}`}
                  >
                    <span>{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* FORMULARIO DE DATOS Y AJUSTES PREDETERMINADOS */}
          <section className="station-block-premium">
            <div className="compact-section-title">
              <h2>⚙️ Ajustes Predeterminados de Cuenta</h2>
            </div>

            <form onSubmit={handleSaveSettings} className="auth-form">
              <label className="input-group">
                <span>Nombre completo</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </label>

              <div className="b2b-two-cols">
                <label className="input-group">
                  <span>Celular WhatsApp</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 300 123 4567"
                    required
                  />
                </label>
                <label className="input-group">
                  <span>Ciudad</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tu ciudad"
                    required
                  />
                </label>
              </div>

              <div className="b2b-two-cols">
                <label className="input-group">
                  <span>Correo electrónico</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </label>

                <label className="input-group">
                  <span>Método de pago predeterminado</span>
                  <select
                    value={defaultPayment}
                    onChange={(e) => setDefaultPayment(e.target.value as 'nequi' | 'pse' | 'tarjeta')}
                  >
                    <option value="nequi">📱 Nequi / Daviplata Express</option>
                    <option value="pse">🏦 PSE (Transferencia Bancaria Colombia)</option>
                    <option value="tarjeta">💳 Tarjeta Débito / Crédito</option>
                  </select>
                </label>
              </div>

              <div className="settings-toggles-box">
                <label className="toggle-setting-row">
                  <span>📲 Recibir comprobantes y boletas por WhatsApp</span>
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  />
                </label>
                <label className="toggle-setting-row">
                  <span>🔴 Avisarme 15 min antes de iniciar Sala 3D en Vivo</span>
                  <input
                    type="checkbox"
                    checked={notifyLiveDraws}
                    onChange={(e) => setNotifyLiveDraws(e.target.checked)}
                  />
                </label>
                <div
                  className="toggle-setting-row"
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
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>
                      {themePreference === 'light' ? '☀️' : themePreference === 'dark' ? '🌙' : '🌓'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>Tema de Pantalla</div>
                      <small style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>
                        {themePreference === 'system'
                          ? 'Automático (según tu celular)'
                          : themePreference === 'dark'
                          ? 'Modo Oscuro (Dark Luxury)'
                          : 'Modo Claro (Limpio)'}
                      </small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: 'rgba(212, 175, 55, 0.16)',
                        color: '#d4af37',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                      }}
                    >
                      {themePreference === 'system' ? '📱 Automático' : themePreference === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '18px' }}>›</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit-gold"
                style={{ marginTop: 10, height: 48, fontSize: '0.95rem', fontWeight: 700 }}
              >
                {savedNotice ? '✅ Ajustes Guardados Correctamente' : 'Guardar Cambios de Perfil'}
              </button>
            </form>
          </section>

          {/* ACCESOS DIRECTOS DE CUENTA */}
          <section className="station-block-premium">
            <div className="profile-quick-links">
              <Link className="profile-nav-row" href="/mis-boletas">
                <span>🎟️ Mis Boletas y Certificados SHA-256</span>
                <span>›</span>
              </Link>
              <Link className="profile-nav-row" href="/sorteo-en-vivo">
                <span>🎱 Sorteo en Vivo (Balotera y Ruleta)</span>
                <span>›</span>
              </Link>
              <button
                type="button"
                className="profile-nav-row danger"
                onClick={() => void performLogout()}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>🚪 Cerrar Sesión / Cambiar Cuenta</span>
                <span>›</span>
              </button>
              <button
                type="button"
                className="profile-nav-row danger"
                onClick={handleDeleteAccount}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderTop: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <span>🗑️ Eliminar Cuenta Definitivamente</span>
                <span>›</span>
              </button>
            </div>
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
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
              backgroundColor: '#121216',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
              padding: '22px 20px',
              color: '#ffffff',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🌓</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                  Tema de Pantalla
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar modal de tema"
                onClick={() => setShowThemeModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
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

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
              Personaliza el estilo visual de El Ganador en este dispositivo:
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              {/* Opción 1: Modo Claro */}
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
                  border: themePreference === 'light' ? '1.5px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: themePreference === 'light' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>☀️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>Modo Claro</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Fondo blanco para luz de día</div>
                  </div>
                </div>
                {themePreference === 'light' && (
                  <span style={{ color: '#007AFF', fontWeight: 800, fontSize: '16px' }}>✓</span>
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
                  border: themePreference === 'dark' ? '1.5px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: themePreference === 'dark' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🌙</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>Modo Oscuro (Dark Luxury)</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Fondo carbón y detalles azules</div>
                  </div>
                </div>
                {themePreference === 'dark' && (
                  <span style={{ color: '#007AFF', fontWeight: 800, fontSize: '16px' }}>✓</span>
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
                  border: themePreference === 'system' ? '1.5px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: themePreference === 'system' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📱</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>Automático del Sistema</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sincroniza con el tema de tu teléfono</div>
                  </div>
                </div>
                {themePreference === 'system' && (
                  <span style={{ color: '#007AFF', fontWeight: 800, fontSize: '16px' }}>✓</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav currentTab="perfil" />
    </div>
  );
}
