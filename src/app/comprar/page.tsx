'use client';

import React, { Suspense } from 'react';
import ComprarBoletaPage from '../comprar-boleta/page';

export default function ComprarPage(props: any) {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Cargando cartón de rifa...</div>}>
      <ComprarBoletaPage {...props} />
    </Suspense>
  );
}
