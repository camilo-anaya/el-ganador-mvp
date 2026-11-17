// src/components/DesktopScrollStrip.tsx
'use client';

import React, { useRef, useState } from 'react';

interface DesktopScrollStripProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export default function DesktopScrollStrip({
  children,
  className = '',
  ariaLabel,
}: DesktopScrollStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false });

  // 1. Permite que el scroll vertical (arriba/abajo) mueva la página libremente;
  //    solo convierte a horizontal si se presiona Shift + rueda.
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    if (e.shiftKey && el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  // 2. Arrastre con clic izquierdo del mouse / trackpad (Click & Drag)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    dragState.current = {
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.4;
    if (Math.abs(walk) > 5) dragState.current.moved = true;
    trackRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const stopDragging = () => setIsDragging(false);

  // Evita abrir enlaces por accidente si el usuario estaba arrastrando con el mouse
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  const scrollByOffset = (offset: number) => {
    trackRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="hybrid-strip-wrapper">
      <button
        type="button"
        aria-label="Desplazar a la izquierda"
        className="desktop-scroll-arrow desktop-carousel-arrow carousel-arrow-btn scroll-arrow-btn left"
        onClick={() => scrollByOffset(-280)}
      >
        ‹
      </button>

      <div
        ref={trackRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={handleClickCapture}
        aria-label={ariaLabel}
        className={`hybrid-strip-track ${isDragging ? 'is-dragging' : ''} ${className}`}
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Desplazar a la derecha"
        className="desktop-scroll-arrow desktop-carousel-arrow carousel-arrow-btn scroll-arrow-btn right"
        onClick={() => scrollByOffset(280)}
      >
        ›
      </button>
    </div>
  );
}
