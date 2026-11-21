// app/todos-los-sorteos/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

interface RaffleItem {
  id: string;
  title: string;
  merchant: string;
  price: number;
  progress: number;
  category?: string;
  image?: string;
  ballotGrid?: number;
}

const DEFAULT_RAFFLES: RaffleItem[] = [
  {
    id: 'rf-1',
    title: 'Smartphone 5G Pro Max + Smartwatch',
    merchant: 'TechStore Colombia',
    price: 25000,
    progress: 92,
    category: 'tech',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    ballotGrid: 100,
  },
  {
    id: 'rf-2',
    title: 'Yamaha MT-09 0 km + Matrícula',
    merchant: 'Motos Caribe Oficial',
    price: 35000,
    progress: 88,
    category: 'motos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    ballotGrid: 100,
  },
  {
    id: 'rf-5',
    title: 'Toyota Hilux 4x4 Diésel 2026',
    merchant: 'AutoPremier Colombia 4x4',
    price: 50000,
    progress: 78,
    category: 'vehiculos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    ballotGrid: 100,
  },
  {
    id: 'rf-3',
    title: 'Cronógrafo Suizo & Cadena Oro 18K',
    merchant: 'Joyas & Diamantes ABC',
    price: 50000,
    progress: 64,
    category: 'joyas',
    image: '/reloj-alta-gama.jpg',
    ballotGrid: 100,
  },
  {
    id: 'rf-6',
    title: 'PlayStation 5 Pro + 2 Mandos DualSense',
    merchant: 'TechStore Colombia',
    price: 30000,
    progress: 86,
    category: 'gaming',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    ballotGrid: 100,
  },
  {
    id: 'rf-4',
    title: 'Calzado Diseñador + Gafas VIP',
    merchant: 'Boutique Elegance & Óptica VIP',
    price: 15000,
    progress: 52,
    category: 'moda',
    image: '/zapatos-sandalias-dama.jpg',
    ballotGrid: 100,
  },
  {
    id: 'rf-7',
    title: 'Viaje a Cancún All-Inclusive (2 Personas)',
    merchant: 'Viajes & Sueños VIP',
    price: 25000,
    progress: 58,
    category: 'viajes',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    ballotGrid: 100,
  },
  {
    id: 'rf-8',
    title: 'Smart TV 65" 4K + Barra de Sonido',
    merchant: 'Hogar & Confort VIP',
    price: 20000,
    progress: 62,
    category: 'hogar',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    ballotGrid: 100,
  },
];

export default function TodosLosSorteosPage() {
  const [raffles, setRaffles] = useState<RaffleItem[]>(DEFAULT_RAFFLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Carga de sorteos activos de Supabase + LocalStorage
  useEffect(() => {
    async function fetchRaffles() {
      try {
        const { data, error } = await supabase
          .from('raffles')
          .select('*')
          .eq('status', 'active');

        if (data && data.length > 0) {
          const mapped: RaffleItem[] = data.map((r: any) => ({
            id: r.id,
            title: r.title,
            merchant: r.merchant_name || r.merchant || 'Empresa Aliada',
            price: r.ticket_price || r.price || 20000,
            progress: r.sold_percent || r.progress || 50,
            category: r.category || 'general',
            image: r.image_url || r.image,
            ballotGrid: r.ballot_grid || 100,
          }));
          setRaffles(mapped);
          return;
        }
      } catch (err) {
        console.warn('Usando catálogo local de sorteos:', err);
      }

      // Complementar con sorteos creados localmente si existen
      try {
        const custom = localStorage.getItem('elganador_custom_raffles');
        if (custom) {
          const parsed = JSON.parse(custom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const extra = parsed.map((c: any) => ({
              id: c.id,
              title: c.title,
              merchant: c.merchant || 'Mi Empresa',
              price: c.price || 25000,
              progress: c.soldPercent || 10,
              category: c.category || 'tech',
              image: c.image || '/galeria-premios-el-ganador-realista.jpg',
              ballotGrid: c.ballotGrid || 100,
            }));
            setRaffles([...extra, ...DEFAULT_RAFFLES]);
            return;
          }
        }
      } catch {}

      setRaffles(DEFAULT_RAFFLES);
    }

    fetchRaffles();
  }, []);

  const filteredRaffles = raffles.filter((r) => {
    const matchesCat = selectedCat === 'all' || r.category === selectedCat;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.merchant.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="todos-los-sorteos-page" style={{ minHeight: '100vh', background: '#0b1320', color: '#ffffff', padding: '24px 20px 100px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 24px)', fontWeight: 900, color: '#d4af37', WebkitTextFillColor: '#d4af37', margin: 0 }}>
            🎲 Todos los Sorteos Disponibles
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Explora el catálogo oficial de rifas activas en Colombia
          </p>
        </div>
        <Link
          href="/"
          style={{
            color: '#cbd5e1',
            textDecoration: 'none',
            background: '#1e293b',
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid #334155',
            fontWeight: 700,
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ✕ Volver al Inicio
        </Link>
      </div>

      {/* Buscador y Filtros Rápidos */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por premio o empresa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 260px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'tech', label: '⚡ Tecnología' },
            { id: 'motos', label: '🏍️ Motos & 4x4' },
            { id: 'joyas', label: '💎 Joyas' },
            { id: 'gaming', label: '🎮 Gaming' },
            { id: 'moda', label: '👠 Moda' },
            { id: 'viajes', label: '✈️ Viajes' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              style={{
                background: selectedCat === cat.id ? '#0284c7' : '#1e293b',
                color: selectedCat === cat.id ? '#ffffff' : '#94a3b8',
                border: selectedCat === cat.id ? '1px solid #38bdf8' : '1px solid #334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuadrícula (Grid) de Sorteos en Bloques */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredRaffles.map((raffle) => (
          <div
            key={raffle.id}
            style={{
              background: '#111e33',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Imagen o contenedor de imagen */}
            <div
              style={{
                background: '#0b1320',
                height: '150px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '24px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {raffle.image ? (
                <img
                  src={raffle.image}
                  alt={raffle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>🎟️</span>
              )}
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: '#d4af37',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              >
                ${raffle.price.toLocaleString('es-CO')} COP
              </span>
            </div>

            <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold' }}>
              🏪 {raffle.merchant}
            </span>

            <h3 style={{ fontSize: '15.5px', fontWeight: 'bold', color: '#ffffff', WebkitTextFillColor: '#ffffff', margin: 0, lineHeight: 1.35 }}>
              {raffle.title}
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
              <span>Venta de balotas:</span>
              <strong style={{ color: raffle.progress >= 80 ? '#10b981' : '#f59e0b' }}>
                {raffle.progress}% vendido
              </strong>
            </div>

            {/* Barra de Progreso */}
            <div
              style={{
                width: '100%',
                background: '#1e293b',
                height: '6px',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${raffle.progress}%`,
                  height: '100%',
                  background: raffle.progress >= 80 ? '#10b981' : '#0284c7',
                }}
              />
            </div>

            {/* Botón de Acción */}
            <Link
              href={`/comprar?raffleId=${raffle.id}`}
              style={{
                textAlign: 'center',
                padding: '12px',
                background: 'linear-gradient(135deg, #d4af37, #b48008)',
                color: '#000000',
                fontWeight: 900,
                fontSize: '13.5px',
                borderRadius: '10px',
                textDecoration: 'none',
                marginTop: 'auto',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
              }}
            >
              Apartar Boleta →
            </Link>
          </div>
        ))}
      </div>

      {filteredRaffles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🔍</p>
          <h3 style={{ margin: '0 0 6px', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>No se encontraron sorteos</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Prueba buscando con otro término o seleccionando otra categoría.</p>
        </div>
      )}

      {/* Barra de navegación inferior móvil flotante */}
      <BottomNav currentTab="explorar" />
    </div>
  );
}
