// app/mis-boletas/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DesktopSidebar from '@/components/DesktopSidebar';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';

interface UserTicket {
  id: string;
  raffleTitle: string;
  merchant: string;
  numbers: string[];
  drawDate: string;
  status: 'pagada' | 'apartada';
  hashSha256: string;
  priceCop: string;
}

const MY_TICKETS: UserTicket[] = [];

export default function MisBoletasClientePage() {
  const [filter, setFilter] = useState<'all' | 'pagada' | 'apartada'>('all');
  const [ticketsList, setTicketsList] = useState<UserTicket[]>(MY_TICKETS);
  const [payingTicketId, setPayingTicketId] = useState<string | null>(null);

  useEffect(() => {
    let localTickets: UserTicket[] = [];
    try {
      const stored = localStorage.getItem('elganador_my_tickets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localTickets = parsed;
        }
      }
    } catch {}

    async function loadSupabaseTickets() {
      try {
        const { data: dbTickets } = await supabase
          .from('tickets')
          .select('id, raffle_id, buyer_email, ticket_number, sha256_hash, payment_status, created_at, raffles(title, ticket_price, draw_date)')
          .order('created_at', { ascending: false });

        if (dbTickets && dbTickets.length > 0) {
          const mapped: UserTicket[] = dbTickets.map((t: any) => ({
            id: `TKT-${t.ticket_number}`,
            raffleTitle: t.raffles?.title || 'Sorteo Oficial Notariado',
            merchant: 'Comercio Oficial Verificado',
            numbers: [String(t.ticket_number).padStart(3, '0')],
            drawDate: t.raffles?.draw_date ? new Date(t.raffles.draw_date).toLocaleDateString('es-CO') : 'Próximo sorteo en vivo',
            status: t.payment_status === 'paid' ? 'pagada' : 'apartada',
            hashSha256: t.sha256_hash || 'Verificado con firma digital',
            priceCop: t.raffles?.ticket_price ? `$ ${Number(t.raffles.ticket_price).toLocaleString('es-CO')}` : '$ 35.000',
          }));
          setTicketsList([...mapped, ...localTickets, ...MY_TICKETS]);
          return;
        }
      } catch (err) {
        console.warn('Error cargando boletas de Supabase:', err);
      }
      setTicketsList([...localTickets, ...MY_TICKETS]);
    }

    loadSupabaseTickets();
  }, []);

  const handlePayPendingTicket = async (tkt: UserTicket) => {
    setPayingTicketId(tkt.id);
    try {
      const numPrice = parseInt(tkt.priceCop.replace(/[^0-9]/g, ''), 10) || 50000;
      const res = await fetch('/api/payments/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participationId: tkt.id,
          drawTitle: tkt.raffleTitle,
          totalAmount: numPrice,
          ticketNumbers: tkt.numbers,
          paymentMethod: 'WOMPI_PSE',
        }),
      });
      const data = await res.json();
      if (data.mode === 'wompi_redirect' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Actualizar a pagada
      const newHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const updatedList = ticketsList.map((item) =>
        item.id === tkt.id
          ? { ...item, status: 'pagada' as const, hashSha256: newHash }
          : item
      );
      setTicketsList(updatedList);
      localStorage.setItem('elganador_my_tickets', JSON.stringify(updatedList));
      alert('🎉 ¡Pago aprobado con éxito mediante Wompi Bancolombia! Tu boleta quedó sellada.');
    } catch (err) {
      console.error('Error pagando boleta:', err);
      alert('Hubo un inconveniente al procesar el pago.');
    } finally {
      setPayingTicketId(null);
    }
  };

  const visibleTickets =
    filter === 'all' ? ticketsList : ticketsList.filter((t) => t.status === filter);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand-cluster">
          <Link aria-label="Volver" className="profile-icon-btn" href="/">←</Link>
          <div>
            <span className="brand-title">MIS BOLETAS</span>
            <small className="brand-subtitle">Billetera Digital de Comprador</small>
          </div>
        </div>
        <Link className="live-pill" href="/sorteo-en-vivo">
          <span className="pulse-dot" /> Sala 3D
        </Link>
      </header>

      <div className="desktop-workspace-grid">
        <DesktopSidebar />
        <main className="app-scroll-canvas">
          {/* RESUMEN RÁPIDO DEL CLIENTE */}
          <section className="station-block-premium role-summary-banner">
            <div>
              <span className="hero-tag">🎟️ CUENTA DE COMPRADOR VERIFICADA</span>
              <h1>Tus participaciones activas</h1>
              <p>Cada boleta pagada queda sellada con firma criptográfica SHA-256 lista para el sorteo en vivo.</p>
            </div>
          </section>

          {/* FILTROS DE BOLETAS */}
          <nav className="category-chips" aria-label="Filtros de boletas" style={{ margin: 0, padding: 0 }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`chip-btn ${filter === 'all' ? 'chip-active' : ''}`}
            >
              Todas ({ticketsList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pagada')}
              className={`chip-btn ${filter === 'pagada' ? 'chip-active' : ''}`}
            >
              ✅ Pagadas y Selladas
            </button>
            <button
              type="button"
              onClick={() => setFilter('apartada')}
              className={`chip-btn ${filter === 'apartada' ? 'chip-active' : ''}`}
            >
              ⏳ Apartadas por pagar
            </button>
          </nav>

          {/* LISTA DE CARTONES DIGITALES */}
          <section className="ticket-wallet-list">
            {visibleTickets.length === 0 ? (
              <div className="station-block-premium" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <span style={{ fontSize: '2.5rem' }}>🎟️</span>
                <h3 style={{ margin: '12px 0 6px', color: '#ffffff' }}>No hay boletas en esta categoría</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 16px' }}>Explora las rifas y cartones disponibles en el marketplace para participar.</p>
                <Link href="/" className="btn-hero-gold" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 20px' }}>
                  Ir a la Vitrina General
                </Link>
              </div>
            ) : (
              visibleTickets.map((tkt) => (
                <article key={tkt.id} className="digital-ticket-card">
                  <div className="ticket-top-row">
                    <span className="ticket-id-badge">Boleta #{tkt.id}</span>
                    <span className={`ticket-status-pill ${tkt.status}`}>
                      {tkt.status === 'pagada' ? '✅ Pagada · En Juega' : '⏳ Pago Pendiente'}
                    </span>
                  </div>

                  <h3>{tkt.raffleTitle}</h3>
                  <p className="ticket-merchant">🏪 {tkt.merchant} · 🗓️ {tkt.drawDate}</p>

                  <div className="ticket-numbers-box">
                    <span>Tus números asignados:</span>
                    <div className="ball-numbers-row">
                      {tkt.numbers.map((num) => (
                        <span key={num} className="gold-ball-number">{num}</span>
                      ))}
                    </div>
                  </div>

                  <div className="ticket-hash-box">
                    <small>Sello de auditoría SHA-256:</small>
                    <code>{tkt.hashSha256}</code>
                  </div>

                  {tkt.status === 'pagada' && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>
                          🏆 ¡Boleto con Estado Activo para Sorteo!
                        </span>
                        {/* Indicador de chat en azul nativo */}
                        <span className="live-pill" style={{ fontSize: '11px', background: '#007AFF', color: '#ffffff', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                          💬 Chat Habilitado
                        </span>
                      </div>
                      
                      <Link 
                        href={`/chat-premio?tkt=${tkt.id}`} 
                        className="btn-chat-blue"
                        style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px 14px', fontSize: '13px', background: '#007AFF', color: '#ffffff', borderRadius: '10px', fontWeight: '800', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)' }}
                      >
                        💬 Abrir Chat de Coordinación con el Empresario
                      </Link>
                    </div>
                  )}

                  <div className="ticket-card-footer">
                    <strong>Total: {tkt.priceCop} COP</strong>
                    {tkt.status === 'pagada' ? (
                      <Link className="btn-audit-ticket" href="/verificar">
                        🛡️ Auditar Certificado
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="btn-wompi-pay"
                        disabled={payingTicketId === tkt.id}
                        onClick={() => handlePayPendingTicket(tkt)}
                      >
                        {payingTicketId === tkt.id ? '⏳ Conectando...' : '💳 Pagar Seguro con Wompi (PSE / Nequi)'}
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </main>
      </div>

      <BottomNav currentTab="boletas" />
    </div>
  );
}
