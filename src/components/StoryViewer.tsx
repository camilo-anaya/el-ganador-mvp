'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didSwipe = useRef<boolean>(false);

  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(stories.length - 1, 0));
  const currentStory = stories[safeIndex];
  const isVideo = Boolean(currentStory?.videoUrl);

  const handleNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
    setCurrentIndex((prev) => {
      if (prev < stories.length - 1) {
        return prev + 1;
      }
      setTimeout(() => onClose(), 0);
      return prev;
    });
  }, [stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  // Sincroniza índice si cambia initialIndex
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex]);

  // Progreso automático (5s por imagen estilo Instagram; video controlado por timeupdate)
  useEffect(() => {
    if (!currentStory) return;
    if (isVideo) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => (prev + step >= 100 ? 100 : prev + step));
    }, interval);

    timerRef.current = timer;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [safeIndex, stories.length, isVideo, currentStory]);

  // Avanza automáticamente al llegar al 100% sin llamar setState dentro del updater
  useEffect(() => {
    if (!isVideo && progress >= 100) {
      handleNext();
    }
  }, [progress, isVideo, handleNext]);

  // Navegación con teclado (←, →, Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, onClose]);

  if (!currentStory) return null;

  const handleForceClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  // Swipe táctil izquierda / derecha para pasar historias de empresarios
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didSwipe.current = true;
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handleTapPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    handlePrev();
  };

  const handleTapNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    handleNext();
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

  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < stories.length - 1;

  return (
    <div
      className="story-modal-backdrop"
      style={{ zIndex: 10000 }}
      onClick={handleForceClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Historia de ${currentStory.merchant}`}
    >
      <div
        className="story-modal-card"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Barra de progreso superior segmentada estilo Instagram (clickeable por empresario) */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            gap: '6px',
            zIndex: 30,
          }}
        >
          {stories.map((st, idx) => {
            let fillWidth = '0%';
            if (idx < safeIndex) {
              fillWidth = '100%';
            } else if (idx === safeIndex) {
              fillWidth = `${progress}%`;
            }

            return (
              <button
                key={st.id || idx}
                type="button"
                aria-label={`Ver historia de ${st.merchant}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (timerRef.current) clearInterval(timerRef.current);
                  setProgress(0);
                  setCurrentIndex(idx);
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.35)',
                  height: '4px',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: fillWidth,
                    height: '100%',
                    backgroundColor: '#f5b82e',
                    transition: isVideo ? 'none' : 'width 50ms linear',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Cabecera del Comercio */}
        <div className="story-modal-header" style={{ zIndex: 30 }}>
          <div className="story-modal-merchant">
            <img src={currentStory.avatar} alt={currentStory.merchant} />
            <div>
              <strong>{currentStory.merchant}</strong>
              <small>
                {currentStory.timeAgo} · {safeIndex + 1}/{stories.length}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="story-close-btn"
            onClick={handleForceClose}
            aria-label="Cerrar historias"
          >
            ✕
          </button>
        </div>

        {/* Contenido Multimedia */}
        <div className="story-modal-media" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Zonas táctiles laterales (izq: retroceder, der: avanzar) */}
          <div
            onClick={handleTapPrev}
            style={{ position: 'absolute', left: 0, top: 0, width: '32%', height: '100%', zIndex: 10, cursor: 'pointer' }}
            aria-hidden="true"
          />
          <div
            onClick={handleTapNext}
            style={{ position: 'absolute', right: 0, top: 0, width: '68%', height: '100%', zIndex: 10, cursor: 'pointer' }}
            aria-hidden="true"
          />

          {/* Botón visible IZQUIERDA (Historia anterior de empresario) */}
          <button
            type="button"
            className="story-nav-arrow story-nav-prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Historia anterior"
            title="Historia anterior"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 25,
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1.5px solid rgba(255, 255, 255, 0.45)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: hasPrev ? 1 : 0.4,
              padding: 0,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            }}
          >
            ‹
          </button>

          {/* Botón visible DERECHA (Siguiente historia de empresario) */}
          <button
            type="button"
            className="story-nav-arrow story-nav-next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label={hasNext ? 'Siguiente historia' : 'Finalizar historias'}
            title={hasNext ? 'Siguiente historia' : 'Finalizar historias'}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 25,
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1.5px solid rgba(255, 255, 255, 0.45)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            }}
          >
            ›
          </button>

          {isVideo ? (
            <video
              key={currentStory.id}
              ref={videoRef}
              src={currentStory.videoUrl}
              autoPlay
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleNext}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.storyImage}
              alt={currentStory.merchant}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Textos y Llamada a la Acción (CTA) */}
          <div className="story-modal-overlay-text" style={{ zIndex: 20 }}>
            <span className="story-icon-pill">🔥 Lanzamiento Verificado</span>
            <h3>{currentStory.headline}</h3>
            <p>{currentStory.caption}</p>
            <a
              href="/comprar"
              className="btn-story-cta"
              onClick={(e) => e.stopPropagation()}
            >
              {currentStory.ctaText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
