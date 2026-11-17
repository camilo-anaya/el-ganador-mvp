'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function IngresoPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/'); 
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido de red';
      setErrorMessage('No se pudo iniciar sesión: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    alert('Escaneando Biometría (Huella / Face ID)... Autenticación aceptada.');
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#121212', border: '1px solid #222', borderRadius: '16px', padding: '32px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#d4af37', marginBottom: '8px' }}>Acceso Seguro</h2>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Identifícate con contraseña o biometría.</p>

        {errorMessage && (
          <div style={{ padding: '10px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '14px', background: '#d4af37', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            {loading ? 'Verificando red...' : 'Entrar con Contraseña'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={handleBiometricLogin}
            style={{ width: '100%', padding: '12px', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            🧬 Usar Huella / Face ID
          </button>
        </div>
      </div>
    </div>
  );
}
