'use client';

import { getSupabaseClient } from './supabase';

const SESSION_STORAGE_KEYS = [
  'elganador_session',
  'elganador_user',
  'elganador_role',
  'elganador_token',
  'elganador_auth_role',
  'elganador_account',
  'elganador_logged_in',
];

/**
 * Cierra la sesión completa del usuario (cookie del servidor, Supabase Auth y localStorage)
 * y redirige a la pantalla de inicio de sesión.
 */
export async function performLogout(redirectTo: string = '/ingreso?mode=login&logged_out=1') {
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
    sessionStorage.clear();
  } catch {}

  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}
