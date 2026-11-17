'use client';

import React from 'react';
import Link from 'next/link';

export default function PoliticaPrivacidadPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '30px 20px 80px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
            ← Volver a El Ganador
          </Link>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Actualizado: Noviembre 2026</span>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
          Política de Privacidad y Tratamiento de Datos Personales
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
          En <strong>El Ganador</strong> (operado en la República de Colombia), protegemos la privacidad y confidencialidad de nuestros usuarios en cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y los lineamientos de privacidad exigidos por <strong>Google Play Store</strong> y <strong>Apple App Store</strong>.
        </p>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>1. Información que Recopilamos</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            Para garantizar la validez legal de las boletas, la emisión de certificados de ganador y la entrega transparente de premios, recopilamos:
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, marginTop: '8px' }}>
            <li><strong>Datos de contacto e identificación:</strong> Nombre completo, correo electrónico, número de teléfono celular y número de identificación (cédula) para el reclamo de premios.</li>
            <li><strong>Historial de boletas y transacciones:</strong> Números seleccionados, identificador de referencia de pago y sellos criptográficos SHA-256.</li>
            <li><strong>Datos técnicos y de ubicación:</strong> Geolocalización dentro de Colombia (exigida por la normativa de juegos y sorteos) y datos de diagnóstico para optimizar la app.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>2. Pasarelas de Pago y Seguridad Financiera</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            El Ganador <strong>NO almacena números de tarjetas de crédito ni credenciales bancarias</strong>. Todas las transacciones se procesan mediante <strong>Wompi</strong> (entidad certificada PCI-DSS vinculada al Grupo Bancolombia) bajo estándares bancarios internacionales.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>3. Derechos del Usuario (Habeas Data) y Eliminación de Cuenta</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            Usted tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales. De conformidad con las políticas de Google Play y Apple App Store, usted puede solicitar la <strong>eliminación total de su cuenta y sus datos</strong> en cualquier momento:
          </p>
          <div style={{ background: '#f1f5f9', borderLeft: '4px solid #007AFF', padding: '14px 18px', borderRadius: '8px', marginTop: '12px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
              Para eliminar su cuenta, ingrese a la sección <strong>Mi Cuenta &gt; Seguridad</strong> y presione <strong>Eliminar mi Cuenta</strong>, o envíe una solicitud a <strong>soporte@elganador.co</strong> con el asunto &quot;Solicitud de Eliminación de Cuenta&quot;.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>4. Contacto del Responsable</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            Razón Social: El Ganador S.A.S.<br />
            Domicilio: Bogotá D.C., Colombia<br />
            Correo electrónico: soporte@elganador.co
          </p>
        </section>

      </div>
    </div>
  );
}
