// app/empresario/formulario-8/page.tsx
// Página Oficial Imprimible del Formulario 8 de Coljuegos (Código: CMI-FR-08, Versión 7)
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Formulario8Modal, { Formulario8Data } from '@/components/Formulario8Modal';

function Formulario8PageContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<Formulario8Data | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Buscar la rifa por id en query param o cargar la más reciente
    const idParam = searchParams.get('id');
    const rafflesRaw = localStorage.getItem('elganador_raffles_list');
    const customRaw = localStorage.getItem('elganador_custom_raffles');
    const profileRaw = localStorage.getItem('elganador_business_profile');

    const profile = profileRaw ? JSON.parse(profileRaw) : {};
    let matchedRaffle: any = null;

    if (rafflesRaw) {
      const list = JSON.parse(rafflesRaw);
      if (idParam) {
        matchedRaffle = list.find((r: any) => r.id === idParam || r.radicado_number === idParam);
      }
      if (!matchedRaffle && list.length > 0) {
        matchedRaffle = list[0];
      }
    }

    if (!matchedRaffle && customRaw) {
      const customList = JSON.parse(customRaw);
      if (customList.length > 0) matchedRaffle = customList[0];
    }

    const title = searchParams.get('title') || matchedRaffle?.title || 'Sorteo Oficial Autorizado';
    const price = Number(searchParams.get('price')) || matchedRaffle?.ticket_price || 25000;
    const totalTickets = Number(searchParams.get('tickets')) || matchedRaffle?.total_tickets || 1000;
    const prize = Number(searchParams.get('prize')) || matchedRaffle?.prize_value || 15000000;
    const rad = searchParams.get('rad') || matchedRaffle?.radicado_number || matchedRaffle?.legalRadicado || 'SOL-COLJ-2026-819204';

    const totalRev = price * totalTickets;
    const tax14 = Math.round(totalRev * 0.14);
    const admin1 = Math.round(tax14 * 0.01);

    setFormData({
      radicado: rad,
      storeName: profile.storeName || matchedRaffle?.merchant || 'MOTOS CARIBE S.A.S.',
      nit: '901.834.192-5',
      department: 'Bogotá D.C. / Cundinamarca',
      city: matchedRaffle?.city || 'Bogotá D.C.',
      address: 'Carrera 15 # 85-30, Oficina 402',
      email: 'contacto@motoscaribe.com.co',
      representative: profile.storeName || 'Representante Legal Autorizado',
      phone: '+57 300 456 7890',
      activity: 'Comercio al por menor y mayor de motocicletas, accesorios y vehículos.',
      raffleTitle: title,
      isNational: true,
      ticketPrice: price,
      totalTickets: totalTickets,
      totalRevenue: totalRev,
      drawDate: matchedRaffle?.draw_date || matchedRaffle?.timeLabel,
      lotteryName: 'Lotería de Medellín (o Lotería Oficial Vigilada)',
      prizeCost: prize,
      prizeDescription: matchedRaffle?.description || 'Vehículo / Motocicleta 0 km con matrícula y SOAT vigente.',
      gainTaxPaidBy: 'empresa',
      coljuegosTax14: tax14,
      coljuegosAdmin1: admin1,
      totalTaxColjuegos: tax14 + admin1,
    });
  }, [searchParams]);

  if (!formData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Cargando Formulario 8 Oficial...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '20px 10px' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/empresario?tab=rifas"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '6px 12px',
            borderRadius: '8px',
          }}
        >
          ← Volver al Panel Empresarial
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            background: '#007AFF',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🖨️ Imprimir / Guardar en PDF
        </button>
      </div>

      <Formulario8Modal data={formData} onClose={() => window.history.back()} />
    </div>
  );
}

export default function Formulario8Page() {
  return (
    <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Cargando Formulario 8...</div>}>
      <Formulario8PageContent />
    </Suspense>
  );
}
