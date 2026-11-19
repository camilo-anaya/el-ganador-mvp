// components/business/BusinessGuard.tsx
// Guarda de la superficie EMPRESARIAL. Solo renderiza si hay sesión empresarial.
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readSurface, writeSurfaceCookie } from '@/lib/auth-role';

export default function BusinessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const surface = readSurface();
    if (surface === 'business') {
      writeSurfaceCookie('business');
      setAllowed(true);
      return;
    }
    router.replace(surface === 'customer' ? '/' : '/ingreso?mode=login&role=business');
  }, [router]);

  if (!allowed) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: '#64748b', fontWeight: 600 }}>
        Verificando acceso empresarial…
      </div>
    );
  }
  return <div className="business-surface">{children}</div>;
}
