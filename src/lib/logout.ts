'use client';

import { getSupabaseClient } from './supabase';
import { clearSurfaceCookie, BUSINESS_PRIVATE_KEYS } from './auth-role';

const SESSION_STORAGE_KEYS = [
  'elganador_session',
  'elganador_user',
  'elganador_user_name',
  'elganador_user_email',
  'elganador_role',
  'elganador_token',
  'elganador_auth_role',
  'elganador_account',
  'elganador_logged_in',
];

/**
 * Cierra la sesión completa del usuario (cookie del servidor, Supabase Auth y localStorage)
 * y redirige a la portada inicial de acceso (/ingreso).
 * Funciona igual para ambas superficies: limpia la cookie de superficie y los
 * datos privados empresariales para que nada quede mezclado en la siguiente sesión.
 */
export async function performLogout(redirectTo: string = '/ingreso?logged_out=1') {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {}

  try {
    const sb = getSupabaseClient();
    if (sb) {
      await sb.auth.signOut();
    }
  } catch {}

  try {
    SESSION_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    BUSINESS_PRIVATE_KEYS.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {}

  clearSurfaceCookie();

  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}
