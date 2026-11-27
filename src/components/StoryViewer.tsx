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
  textColor?: string;
  textBgColor?: string;
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

  // Bloquea el scroll del fondo mientras el visor pantalla completa está abierto
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Sincroniza índice si cambia initialIndex
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex]);

  // Progreso automático (10s por imagen estilo Instagram/WhatsApp; video controlado por timeupdate)
  useEffect(() => {
    if (!currentStory) return;
    if (isVideo) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const duration = 10000; // 10 segundos
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

  return (
    <div
      className="story-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        padding: 0,
        margin: 0,
        background: '#000000',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Historia de ${currentStory.merchant}`}
    >
      <div
        className="story-modal-card"
        style={{
          position: 'relative',
          width: '100vw',
          maxWidth: '100vw',
          height: '100dvh',
          maxHeight: '100dvh',
          borderRadius: 0,
          border: 'none',
          boxShadow: 'none',
          margin: 0,
          background: '#000000',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Barra de progreso superior segmentada estilo Instagram (clickeable por empresario) */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
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
        <div
          className="story-modal-header"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 26px)',
            zIndex: 30,
          }}
        >
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

        {/* Contenido Multimedia en Pantalla Completa (sin botones visibles de carrusel) */}
        <div className="story-modal-media" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Zonas táctiles invisibles izquierda (anterior) y derecha (siguiente) */}
          <div
            className="story-tap-prev"
            onClick={handleTapPrev}
            style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', zIndex: 10, cursor: 'pointer' }}
            aria-label="Historia anterior"
          />
          <div
            className="story-tap-next"
            onClick={handleTapNext}
            style={{ position: 'absolute', right: 0, top: 0, width: '65%', height: '100%', zIndex: 10, cursor: 'pointer' }}
            aria-label="Siguiente historia"
          />

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
          <div
            className="story-modal-overlay-text"
            style={{
              zIndex: 20,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
          >
            <span className="story-icon-pill">🔥 Lanzamiento Verificado</span>
            <h3 style={{ color: currentStory.textColor || '#ffffff' }}>{currentStory.headline}</h3>
            <p
              style={{
                color: currentStory.textColor || 'rgba(255,255,255,0.95)',
                background: currentStory.textBgColor || 'rgba(0,0,0,0.45)',
                padding: '6px 12px',
                borderRadius: '8px',
                backdropFilter: 'blur(4px)',
                display: 'inline-block',
                margin: '6px 0 12px 0',
                lineHeight: 1.4,
              }}
            >
              {currentStory.caption}
            </p>
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
