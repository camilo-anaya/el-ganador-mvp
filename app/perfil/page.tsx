// app/perfil/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DesktopSidebar from '@/components/DesktopSidebar';
import NativeBottomTabBar from '@/components/NativeBottomTabBar';
import { getUserSession } from '@/lib/nativeActions';

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
                <div className="toggle-setting-row">
                  <span>🌓 Tema de pantalla (Claro / Oscuro)</span>
                  <strong>Automático según tu celular</strong>
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
              <Link className="profile-nav-row danger" href="/ingreso?mode=login">
                <span>🚪 Cerrar Sesión / Cambiar Cuenta</span>
                <span>›</span>
              </Link>
            </div>
          </section>
        </main>
      </div>

      <NativeBottomTabBar currentTab="perfil" />
    </div>
  );
}
