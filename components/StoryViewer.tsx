'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Story {
  id: string;
  merchant: string;
  avatar: string;
  storyImage: string;
  headline: string;
  caption: string;
  timeAgo: string;
  ctaText: string;
  videoUrl?: string; // Opcional: si existe, se reproduce como video de hasta 2 min
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentStory = stories[currentIndex];
  const isVideo = Boolean(currentStory.videoUrl);

  useEffect(() => {
    // Si es video, el progreso se gestiona mediante el evento timeupdate del elemento HTML video
    if (isVideo) {
      setProgress(0);
      return;
    }

    // Si es imagen, aplica la regla de Instagram: exactamente 5 segundos
    setProgress(0);
    const duration = 5000; 
    const interval = 50; 
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

    timerRef.current = timer;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, stories, isVideo]);

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setProgress(0);
    }
  };

  // Cierra el visor a voluntad de inmediato al presionar la '✕'
  const handleForceClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  // Progreso en tiempo real sincronizado con la duración del video (hasta 2 min)
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      if (total > 0) {
        setProgress((current / total) * 100);
      }
    }
  };

  return (
    <div className="story-modal-backdrop">
      <div className="story-modal-card">
        {/* Barra de progreso superior segmentada estilo Instagram */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 20 }}>
          {stories.map((_, idx) => {
            let fillWidth = '0%';
            if (idx < currentIndex) {
              fillWidth = '100%';
            } else if (idx === currentIndex) {
              fillWidth = `${progress}%`;
            }

            return (
              <div 
                key={idx} 
                style={{ 
                  flex: 1, 
                  backgroundColor: 'rgba(255, 255, 255, 0.35)', 
                  height: '4px', 
                  borderRadius: '999px', 
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div 
                  style={{
                    width: fillWidth,
                    height: '100%',
                    backgroundColor: '#f5b82e',
                    transition: isVideo ? 'none' : 'width 50ms linear'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Cabecera del Comercio */}
        <div className="story-modal-header">
          <div className="story-modal-merchant">
            <img src={currentStory.avatar} alt={currentStory.merchant} />
            <div>
              <strong>{currentStory.merchant}</strong>
              <small>{currentStory.timeAgo}</small>
            </div>
          </div>
          <button type="button" className="story-close-btn" onClick={handleForceClose}>✕</button>
        </div>

        {/* Contenido Multimedia */}
        <div className="story-modal-media" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Zonas táctiles laterales (izq: retroceder, der: avanzar) */}
          <div onClick={handlePrev} style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', zIndex: 10, cursor: 'pointer' }} />
          <div onClick={handleNext} style={{ position: 'absolute', right: 0, top: 0, width: '65%', height: '100%', zIndex: 10, cursor: 'pointer' }} />

          {isVideo ? (
            <video 
              ref={videoRef}
              src={currentStory.videoUrl} 
              autoPlay 
              playsInline 
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleNext}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <img src={currentStory.storyImage} alt="Story content" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          {/* Textos y Llamada a la Acción (CTA) */}
          <div className="story-modal-overlay-text">
            <span className="story-icon-pill">🔥 Lanzamiento Verificado</span>
            <h3>{currentStory.headline}</h3>
            <p>{currentStory.caption}</p>
            <a href="/comprar" className="btn-story-cta">
              {currentStory.ctaText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
