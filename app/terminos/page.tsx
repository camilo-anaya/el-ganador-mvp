'use client';

import React from 'react';
import Link from 'next/link';

export default function TerminosCondicionesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '30px 20px 80px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
            ← Volver a El Ganador
          </Link>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Versión: 2.0 (Colombia)</span>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
          Términos y Condiciones de Uso
        </h1>

        {/* CLÁUSULA MANDATORIA DE APPLE Y GOOGLE */}
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
            ⚠️ Declaración Legal Obligatoria (Apple Inc. y Google LLC):
          </strong>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#7f1d1d', lineHeight: 1.5 }}>
            <strong>Apple Inc. y Google LLC no son patrocinadores, organizadores ni están involucrados de ninguna manera</strong> en los sorteos, rifas, actividades promocionales o premiaciones que se publiquen o celebren a través de esta aplicación. Todos los premios son ofrecidos y garantizados directamente por los comerciantes autorizados y respaldados legalmente bajo la normativa colombiana.
          </p>
        </div>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>1. Objeto y Naturaleza de la Plataforma</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            <strong>El Ganador</strong> es una plataforma tecnológica que conecta a comerciantes, empresas y usuarios en Colombia para la realización y participación en sorteos y rifas transparentes. Toda rifa publicada en la plataforma debe contar con su correspondiente resolución o permiso legal expedido por la autoridad territorial competente (Alcaldías Municipales, Gobernaciones o Coljuegos), en estricto cumplimiento de la <strong>Ley 643 de 2001</strong>.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>2. Requisitos de Participación</h2>
          <ul style={{ paddingLeft: '20px', fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            <li>Ser mayor de dieciocho (18) años de edad.</li>
            <li>Encontrarse ubicado en el territorio de la República de Colombia al momento de la compra.</li>
            <li>Suministrar información real y verificable (cédula de ciudadanía o extranjería).</li>
          </ul>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>3. Emisión de Boletas y Sello Criptográfico</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            Cada boleta pagada exitosamente a través de la pasarela autorizada (Wompi) recibe un <strong>sello criptográfico digital (hash SHA-256)</strong> con fecha y hora exactas, el cual es inmutable e infalsificable y garantiza la propiedad del número seleccionado por el comprador.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>4. Entrega de Premios</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            El comerciante organizador es el responsable legal de la entrega material del premio ofertado en las condiciones publicadas. El Ganador emite un <strong>Certificado Digital de Ganador</strong> para respaldar la reclamación física y legal del premio ante las autoridades.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>5. Ley Aplicable y Jurisdicción</h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            Estos términos se rigen e interpretan de conformidad con las leyes de la República de Colombia. Cualquier controversia será sometida a la justicia ordinaria colombiana.
          </p>
        </section>

      </div>
    </div>
  );
}
