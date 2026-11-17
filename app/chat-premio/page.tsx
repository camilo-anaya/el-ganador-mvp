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
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* CABECERA DEL CHAT */}
      <header className="app-topbar">
        <div className="brand-cluster">
          <Link aria-label="Volver" className="profile-icon-btn" href="/mis-boletas">←</Link>
          <div>
            <span className="brand-title">CHAT DE COORDINACIÓN</span>
            <small className="brand-subtitle">🏪 Motos Caribe Oficial · Sorteo Yamaha MT-09</small>
          </div>
        </div>
      </header>

      {/* ÁREA DE MENSAJES */}
      <main className="app-scroll-canvas" style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <span style={{ background: '#222', color: '#d4af37', padding: '6px 12px', borderRadius: '15px', fontSize: '11px', border: '1px solid #d4af37' }}>
            🛡️ Canal de Entrega Seguro · Respaldado por El Ganador
          </span>
        </div>

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'client' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'client' ? '#d4af37' : '#1a1a1a',
              color: msg.sender === 'client' ? '#000' : '#fff',
              padding: '12px 16px',
              borderRadius: '12px',
              maxWidth: '80%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: msg.sender === 'merchant' ? '1px solid #333' : 'none',
            }}
          >
            <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.4' }}>{msg.text}</p>
            <span style={{ display: 'block', fontSize: '10px', marginTop: '4px', textAlign: 'right', opacity: 0.7 }}>
              {msg.time}
            </span>
          </div>
        ))}
      </main>

      {/* BARRA DE ENTRADA DE TEXTO */}
      <footer style={{ padding: '15px', background: '#0a0a0a', borderTop: '1px solid #222' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Escribe tu mensaje o dirección de entrega..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#161616',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn-submit-gold"
            style={{ padding: '0 20px', borderRadius: '8px', fontWeight: 'bold' }}
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
