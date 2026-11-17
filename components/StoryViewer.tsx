// components/StoryViewer.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export interface Story {
  id: string;
  merchant: string;
  avatar: string;
  storyImage: string;
  headline: string;
  caption: string;
  timeAgo: string;
  ctaText: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  icon?: string;
}

export interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const duration = 5000; // 5 segundos por historia si es imagen
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentStory = stories && stories.length > 0 ? stories[currentIndex] : null;

  useEffect(() => {
    if (!currentStory) return;

    // Reinicia el progreso al cambiar de historia
    setProgress(0);
    startTimeRef.current = Date.now();

    const interval = 50; // Actualiza cada 50ms para suavizar la barra
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, stories]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose(); // Cierra al terminar la última historia
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  const isVideo = currentStory.videoUrl || currentStory.mediaType === 'video';
  const videoSrc = currentStory.videoUrl || currentStory.storyImage;

  return (
    <div className="story-modal-backdrop" onClick={onClose}>
      <div className="story-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Barra de progreso superior segmentada estilo Instagram */}
        <div style={{ position: 'absolute', top: '10px', left: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 20 }}>
          {stories.map((_, idx) => (
            <div key={idx} className="story-progress-bar" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', height: '3px', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                  height: '100%',
                  backgroundColor: '#f5b82e',
                  transition: idx === currentIndex ? 'width 50ms linear' : 'none'
                }}
              />
            </div>
          ))}
        </div>

        {/* Cabecera del Comercio */}
        <div className="story-modal-header">
          <div className="story-modal-merchant">
            <img src={currentStory.avatar} alt={currentStory.merchant} />
            <div>
              <strong>{currentStory.merchant}</strong>
              <small>{currentStory.timeAgo} · Tienda Verificada</small>
            </div>
          </div>
          <button className="story-close-btn" onClick={onClose} aria-label="Cerrar historia">✕</button>
        </div>

        {/* Contenido Multimedia (Imagen o Video con áreas táctiles laterales) */}
        <div className="story-modal-media" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Zonas táctiles para navegar hacia atrás (izq) o adelante (der) */}
          <div onClick={handlePrev} style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', zIndex: 10, cursor: 'pointer' }} />
          <div onClick={handleNext} style={{ position: 'absolute', right: 0, top: 0, width: '65%', height: '100%', zIndex: 10, cursor: 'pointer' }} />

          {isVideo ? (
            <video src={videoSrc} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={currentStory.storyImage} alt={currentStory.headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          {/* Texto y Botón de Llamada a la Acción (CTA) */}
          <div className="story-modal-overlay-text">
            <span className="story-icon-pill">🔥 {currentStory.icon || 'Lanzamiento Verificado'}</span>
            <h3>{currentStory.headline}</h3>
            <p>{currentStory.caption}</p>
            <Link href="/comprar" className="btn-story-cta" onClick={onClose}>
              {currentStory.ctaText || 'Participar en este sorteo →'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
