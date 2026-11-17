// components/LikeButton.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface LikeButtonProps {
  initialLikes?: number;
  initialLiked?: boolean;
  publicationId?: string;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  style?: React.CSSProperties;
}

export default function LikeButton({
  initialLikes = 45,
  initialLiked = false,
  publicationId,
  onLikeChange,
  style,
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);

  useEffect(() => {
    if (publicationId && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`elganador_like_${publicationId}`);
        if (stored !== null) {
          const isLiked = JSON.parse(stored);
          setLiked(isLiked);
          if (isLiked && !initialLiked) {
            setLikes(initialLikes + 1);
          }
        }
      } catch {}
    }
  }, [publicationId, initialLikes, initialLiked]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLiked = !liked;
    const nextCount = nextLiked ? likes + 1 : Math.max(0, likes - 1);
    setLiked(nextLiked);
    setLikes(nextCount);

    if (publicationId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`elganador_like_${publicationId}`, JSON.stringify(nextLiked));
      } catch {}
    }

    if (onLikeChange) {
      onLikeChange(nextLiked, nextCount);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      style={{
        background: 'transparent',
        border: 'none',
        color: liked ? '#ef4444' : '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 700,
        padding: '4px 8px',
        borderRadius: '8px',
        transition: 'transform 0.15s ease',
        ...style,
      }}
      title={liked ? 'Quitar Me gusta' : 'Dar Me gusta'}
    >
      <span>{liked ? '❤️' : '🤍'}</span>
      <span>{likes} Me gusta</span>
    </button>
  );
}
