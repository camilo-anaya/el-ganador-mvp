// src/components/FavoritesSection.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface MerchantFavorite {
  id: string;
  name: string;
  category: string;
  followersCount: number;
  isFollowing: boolean;
}

export default function FavoritesSection() {
  const [favorites, setFavorites] = useState<MerchantFavorite[]>([]);

  useEffect(() => {
    // Carga inicial de comercios seguidos (simulado desde localStorage o Supabase)
    const saved = localStorage.getItem('elganador_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    } else {
      setFavorites([
        { id: 'm1', name: 'TechStore Colombia', category: 'Tecnología', followersCount: 1240, isFollowing: true },
        { id: 'm2', name: 'Motos del Norte', category: 'Vehículos', followersCount: 890, isFollowing: true }
      ]);
    }
  }, []);

  const toggleFollow = (id: string) => {
    const updated = favorites.map(fav => {
      if (fav.id === id) {
        const newStatus = !fav.isFollowing;
        return {
          ...fav,
          isFollowing: newStatus,
          followersCount: newStatus ? fav.followersCount + 1 : fav.followersCount - 1
        };
      }
      return fav;
    });
    setFavorites(updated);
    localStorage.setItem('elganador_favorites', JSON.stringify(updated));
  };

  return (
    <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '16px', padding: '20px', color: '#fff', marginTop: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#d4af37', marginBottom: '12px' }}>
        ⭐ Mis Favoritos y Comercios Seguidos
      </h3>
      <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
        Sigue a tus marcas favoritas para recibir contenido exclusivo, alertas de nuevos sorteos y respaldar su popularidad.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {favorites.map((merchant) => (
          <div key={merchant.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181818', padding: '14px', borderRadius: '12px', border: '1px solid #333' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{merchant.name}</h4>
              <span style={{ fontSize: '12px', color: '#aaa' }}>{merchant.category} • <strong>{merchant.followersCount}</strong> seguidores</span>
            </div>
            <button
              onClick={() => toggleFollow(merchant.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                border: 'none',
                background: merchant.isFollowing ? '#333' : '#d4af37',
                color: merchant.isFollowing ? '#fff' : '#000'
              }}
            >
              {merchant.isFollowing ? 'Siguiendo ✓' : 'Seguir +'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
