// app/chat-premio/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Message {
  sender: 'client' | 'merchant';
  text: string;
  time: string;
}

export default function ChatPremioPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'merchant',
      text: '¡Hola! Felicitaciones por ganar la Yamaha MT-09 en el sorteo verificado por SHA-256. Por favor indícanos tu ciudad y datos para coordinar la entrega o el envío de tu premio.',
      time: '10:15 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      sender: 'client',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMsg]);
    setInputText('');

    // Simulación de respuesta automática del comercio
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'merchant',
          text: 'Entendido. Hemos recibido tus datos. En breve un asesor se pondrá en contacto para finalizar el acta de entrega.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  return (
    <div
      className="app-shell full-bleed-chat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        minHeight: '100dvh',
        width: '100vw',
        maxWidth: '100vw',
        paddingBottom: 0,
        margin: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: '#0a0f1d',
      }}
    >
      {/* CABECERA DEL CHAT */}
      <header
        className="app-topbar"
        style={{
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 16px) 16px 12px',
          width: '100%',
          boxSizing: 'border-box',
          background: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="brand-cluster" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <Link
            aria-label="Volver"
            className="profile-icon-btn"
            href="/mis-boletas"
            style={{
              color: '#38bdf8',
              fontSize: '20px',
              textDecoration: 'none',
              fontWeight: 800,
              padding: '6px 10px',
            }}
          >
            ←
          </Link>
          <div style={{ flex: 1 }}>
            <span className="brand-title" style={{ display: 'block', fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
              CHAT DE COORDINACIÓN
            </span>
            <small className="brand-subtitle" style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>
              🏪 Motos Caribe Oficial · Sorteo Yamaha MT-09
            </small>
          </div>
        </div>
      </header>

      {/* ÁREA DE MENSAJES */}
      <main
        className="app-scroll-canvas"
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ textAlign: 'center', margin: '4px 0 10px' }}>
          <span
            style={{
              background: 'rgba(0, 122, 255, 0.15)',
              color: '#38bdf8',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'inline-block',
            }}
          >
            🛡️ Canal Oficial de Entrega Seguro · Respaldado por El Ganador
          </span>
        </div>

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'client' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'client' ? 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)' : '#1e293b',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '14px',
              maxWidth: '85%',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              border: msg.sender === 'merchant' ? '1px solid #334155' : 'none',
              wordBreak: 'break-word',
            }}
          >
            <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.45' }}>{msg.text}</p>
            <span style={{ display: 'block', fontSize: '10px', marginTop: '6px', textAlign: 'right', opacity: 0.75 }}>
              {msg.time}
            </span>
          </div>
        ))}
      </main>

      {/* BARRA DE ENTRADA DE TEXTO */}
      <footer
        style={{
          padding: '12px 16px max(calc(env(safe-area-inset-bottom, 0px) + 12px), 14px)',
          background: '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <input
            type="text"
            placeholder="Escribe tu mensaje o dirección de entrega..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            className="btn-submit-gold"
            style={{
              padding: '0 20px',
              borderRadius: '10px',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Enviar 📨
          </button>
        </form>
      </footer>
    </div>
  );
}
