// lib/native-haptics.ts
'use client';

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Dispara una vibración sutil y precisa para selección de pestañas o botones
 */
export async function triggerHapticSelection(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(10);
    }
  } catch {
    // Fail silently in unsupported environments
  }
}

/**
 * Dispara impacto físico leve para pulsación de botones interactivos
 */
export async function triggerHapticLight(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(12);
    }
  } catch {
    // Fail silently
  }
}

/**
 * Dispara impacto de éxito para compras de boletas o acciones confirmadas
 */
export async function triggerHapticSuccess(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([15, 30, 25]);
    }
  } catch {
    // Fail silently
  }
}
