// app/splash/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SplashScreen() {
  const router = useRouter();
  const [loadingText, setLoadingText] = useState('Verificando credenciales...');

  useEffect(() => {
    const checkUserSession = async () => {
      // Simula el tiempo de carga del Splash Screen con el logo (1.5 segundos)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        // Verifica si ya existe una sesión activa guardada en el cliente o en Supabase
        const localSession = typeof window !== 'undefined' ? localStorage.getItem('elganador_session') : null;
        let supabaseSession = null;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session) supabaseSession = data.session;
        } catch {}

        if (supabaseSession || localSession) {
          // Si ya está logueado, va directo al inicio sin pedir registro ni login
          setLoadingText('¡Sesión activa encontrada! Entrando...');
          setTimeout(() => router.push('/'), 800);
        } else {
          // Si no hay sesión, redirige al ingreso
          router.push('/ingreso');
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        router.push('/ingreso');
      }
    };

    checkUserSession();
  }, [router]);

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Logo de la App */}
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#d4af37',
        marginBottom: '16px',
        letterSpacing: '2px',
        textAlign: 'center'
      }}>
        🏆 EL GANADOR
      </div>
      <p style={{ fontSize: '14px', color: '#888', textAlign: 'center' }}>{loadingText}</p>
    </div>
  );
}
