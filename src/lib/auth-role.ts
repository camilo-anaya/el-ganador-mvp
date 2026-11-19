// lib/auth-role.ts
// Núcleo NEUTRAL de identidad: solo decide en qué "superficie" vive la sesión
// (cliente o empresarial). No contiene lógica de negocio de ninguna de las dos.
//
// Superficie CLIENTE   → "/" y rutas del comprador.
// Superficie EMPRESARIAL → "/empresario/*" (su propio layout, navegación y datos).
//
// La cookie `elganador_surface` solo se usa para ENRUTAR en middleware.ts
// (UX). La autorización real de datos sigue en las APIs (/api/auth/me?role=…).

export type Surface = 'business' | 'customer';

export const SURFACE_COOKIE = 'elganador_surface';

/** Llaves de localStorage PRIVADAS de la superficie empresarial. */
export const BUSINESS_PRIVATE_KEYS = [
  'elganador_business_profile',
  'elganador_business_ad',
  'elganador_business_docs',
  'elganador_empresario_tab',
  'elganador_raffle_draft',
  'elganador_biz_orders',
  'elganador_kyb_status',
  'elganador_kyb_docs',
  'elganador_active_plan',
  'elganador_pending_banner_ad',
] as const;

export function readSurface(): Surface | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('elganador_session');
    const fromSession = raw ? JSON.parse(raw)?.role : null;
    const role = fromSession || window.localStorage.getItem('elganador_role');
    if (role === 'business') return 'business';
    if (role === 'buyer' || role === 'customer') return 'customer';
  } catch {
    /* sesión corrupta: se trata como invitado */
  }
  return null;
}

export function writeSurfaceCookie(surface: Surface) {
  if (typeof document === 'undefined') return;
  document.cookie = `${SURFACE_COOKIE}=${surface}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

export function clearSurfaceCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SURFACE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Activa una superficie al iniciar sesión. Al entrar como cliente se purgan
 * los datos privados empresariales para que nunca se mezclen entre sí.
 */
export function activateSurface(surface: Surface) {
  if (typeof window === 'undefined') return;
  writeSurfaceCookie(surface);
  if (surface === 'customer') {
    for (const key of BUSINESS_PRIVATE_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* noop */
      }
    }
  }
}

/** Ruta de aterrizaje de cada superficie. */
export function homeFor(surface: Surface) {
  return surface === 'business' ? '/empresario' : '/';
}
