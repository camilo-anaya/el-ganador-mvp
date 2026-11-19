// hooks/useRealtimeFeed.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useRealtimeFeed<T>(initialData: T, intervalMs = 30000) {
  const [data, setData] = useState<T>(() => initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const didMountScrollRef = useRef(false);

  const refreshNow = useCallback(async (manual = false) => {
    const now = Date.now();
    // Evita bucles: si ya está cargando o si hace menos de 8s se actualizó automáticamente, ignora
    if (isFetchingRef.current) return;
    if (!manual && now - lastFetchTimeRef.current < 8000) return;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    if (manual) setIsRefreshing(true);

    try {
      const res = await fetch('/api/feed', {
        cache: 'no-store',
      });
      if (res.ok) {
        const fresh = await res.json();
        setData(fresh);
        setLastSync(
          new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      }
    } catch {
      // Silencioso en caso de corte de red
    } finally {
      isFetchingRef.current = false;
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Solo 1 vez al montar la página: sube el scroll a (0,0) y hace la primera carga
  useEffect(() => {
    if (!didMountScrollRef.current && typeof window !== 'undefined') {
      didMountScrollRef.current = true;
      window.scrollTo(0, 0);
      refreshNow(false);
    }
  }, [refreshNow]);

  // Sincronización tranquila en segundo plano cada 30s (sin disparar reload de página)
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshNow(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, refreshNow]);

  return { data, isRefreshing, lastSync, refreshNow };
}
