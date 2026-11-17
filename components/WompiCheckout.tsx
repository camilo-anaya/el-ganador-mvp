// src/components/WompiCheckout.tsx
'use client';

import React from 'react';

interface WompiCheckoutProps {
  raffleId: string;
  ticketNumber: number | string;
  priceInPesos: number;
  userEmail: string;
  userName?: string;
  userPhone?: string;
}

export default function WompiCheckout({
  raffleId,
  ticketNumber,
  priceInPesos,
  userEmail,
  userName = 'Carlos Martínez',
  userPhone = '3001234567'
}: WompiCheckoutProps) {
  const handleOpenWompi = () => {
    const amountInCents = priceInPesos * 100;
    const reference = `TKT-${raffleId}-${ticketNumber}-${Date.now()}`;
    const configuredKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_WOMPI_PUB_KEY || '';
    const publicKey = configuredKey && !configuredKey.includes('tu_llave')
      ? configuredKey
      : 'pub_test_Q5yDA9xoKdePiumALrhQV9RLG2ECZldD';
    
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co';
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const redirectUrl = isLocal ? undefined : `${origin}/mis-boletas?status=aprobado&ref=${reference}`;
    const cleanPhone = userPhone.replace(/\D/g, '').slice(-10) || '3001234567';

    // Si window.WidgetCheckout está disponible (cargado desde widget.js)
    if (typeof window !== 'undefined' && (window as unknown as { WidgetCheckout?: new (options: Record<string, unknown>) => { open: (cb: (res: { transaction?: { id: string; status: string } }) => void) => void } }).WidgetCheckout) {
      const WidgetCheckout = (window as unknown as { WidgetCheckout: new (options: Record<string, unknown>) => { open: (cb: (res: { transaction?: { id: string; status: string } }) => void) => void } }).WidgetCheckout;
      
      const config: Record<string, unknown> = {
        currency: 'COP',
        amountInCents,
        amount_in_cents: amountInCents,
        reference,
        publicKey,
        public_key: publicKey,
        customerData: {
          email: userEmail,
          fullName: userName,
          phoneNumber: cleanPhone,
          phoneNumberPrefix: '+57',
          legalId: '123456789',
          legalIdType: 'CC'
        },
        customer_data: {
          email: userEmail,
          fullName: userName,
          phoneNumber: cleanPhone,
          phoneNumberPrefix: '+57',
          legalId: '123456789',
          legalIdType: 'CC'
        }
      };

      if (redirectUrl) {
        config.redirectUrl = redirectUrl;
      }

      const checkout = new WidgetCheckout(config);

      checkout.open((result) => {
        const transaction = result?.transaction;
        if (transaction?.status === 'APPROVED') {
          alert('🎉 ¡Pago aprobado con éxito mediante Wompi! Tu boleta quedó sellada.');
          window.location.href = redirectUrl || '/';
        } else if (transaction?.status === 'DECLINED' || transaction?.status === 'ERROR') {
          alert('⚠️ El pago no fue procesado. Puedes intentar con otro medio de pago.');
        }
      });
      return;
    }

    // Fallback: Redirección directa al Checkout web oficial de Wompi
    const wompiCheckoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&redirect-url=${encodeURIComponent(redirectUrl || '')}&customer-data:email=${encodeURIComponent(userEmail)}&customer-data:full-name=${encodeURIComponent(userName)}&customer-data:phone-number=${encodeURIComponent(userPhone)}`;

    window.location.href = wompiCheckoutUrl;
  };

  return (
    <button
      type="button"
      onClick={handleOpenWompi}
      style={{
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, #007AFF 0%, #0051B3 100%)',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '15px',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)',
        transition: 'transform 0.15s ease'
      }}
    >
      🔒 Pagar Boleta #{ticketNumber} con Wompi (PSE / Nequi / Tarjeta)
    </button>
  );
}
