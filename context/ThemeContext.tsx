'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  isMobile: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themePreference: 'system',
  setThemePreference: () => {},
  toggleTheme: () => {},
  isMobile: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Helper para aplicar el tema de forma integral y atómica
  const applyThemeToDOM = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;

    html.setAttribute('data-theme', mode);
    html.style.colorScheme = mode;
    body.setAttribute('data-theme', mode);
    body.style.colorScheme = mode;

    if (mode === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    }

    // Actualiza dinámicamente la etiqueta <meta name="theme-color"> en el navegador móvil
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mode === 'dark' ? '#000000' : '#ffffff');
    }

    // Sincroniza la barra de estado en Android e iOS mediante Capacitor
    try {
      const cap = (window as unknown as {
        Capacitor?: {
          Plugins?: {
            StatusBar?: {
              setStyle: (opts: { style: string }) => Promise<void>;
              setBackgroundColor?: (opts: { color: string }) => Promise<void>;
            };
          };
        };
      }).Capacitor;
      const statusBar = cap?.Plugins?.StatusBar;
      if (statusBar) {
        statusBar.setStyle({ style: mode === 'dark' ? 'DARK' : 'LIGHT' });
        statusBar.setBackgroundColor?.({ color: mode === 'dark' ? '#000000' : '#ffffff' });
      }
    } catch {
      // Ignorar en entorno web estándar
    }
  };

  useEffect(() => {
    // 1. Detección precisa de dispositivo móvil (App nativa Capacitor o navegador móvil)
    const checkIsMobile = (): boolean => {
      if (typeof window === 'undefined') return false;
      const cap = (window as unknown as {
        Capacitor?: {
          isNativePlatform?: () => boolean;
          getPlatform?: () => string;
        };
      }).Capacitor;
      if (cap?.isNativePlatform?.()) return true;
      if (cap?.getPlatform?.() === 'android' || cap?.getPlatform?.() === 'ios') return true;

      const ua = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isNarrowTouch = window.matchMedia('(max-width: 1024px)').matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      return isMobileUA || isNarrowTouch;
    };

    const mobile = checkIsMobile();
    setIsMobile(mobile);

    // 2. Cargar preferencia guardada
    let savedPref: ThemePreference = 'system';
    try {
      const stored = localStorage.getItem('elganador_theme_preference') as ThemePreference | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        savedPref = stored;
      }
    } catch {}
    setThemePreferenceState(savedPref);

    // 3. Listener nativo del esquema de colores del sistema móvil (prefers-color-scheme)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const resolveAndApply = (pref: ThemePreference, systemIsDark: boolean) => {
      let resolvedMode: ThemeMode;
      if (pref === 'light') {
        resolvedMode = 'light';
      } else if (pref === 'dark') {
        resolvedMode = 'dark';
      } else {
        // En modo "system": se adapta 100% nativo a los ajustes del celular / dispositivo
        resolvedMode = systemIsDark ? 'dark' : 'light';
      }

      setTheme(resolvedMode);
      applyThemeToDOM(resolvedMode);
    };

    // Ejecución inicial inmediata
    resolveAndApply(savedPref, mediaQuery.matches);

    // Detección en tiempo real si el usuario cambia el tema en los ajustes de su celular
    const listener = (e: MediaQueryListEvent) => {
      try {
        const currentPref = (localStorage.getItem('elganador_theme_preference') as ThemePreference | null) || 'system';
        if (currentPref === 'system') {
          resolveAndApply('system', e.matches);
        }
      } catch {
        resolveAndApply('system', e.matches);
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem('elganador_theme_preference', pref);
    } catch {}

    const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const systemIsDark = mediaQuery ? mediaQuery.matches : false;

    let targetMode: ThemeMode;
    if (pref === 'light') targetMode = 'light';
    else if (pref === 'dark') targetMode = 'dark';
    else targetMode = systemIsDark ? 'dark' : 'light';

    setTheme(targetMode);
    applyThemeToDOM(targetMode);
  };

  const toggleTheme = () => {
    const nextMode = theme === 'dark' ? 'light' : 'dark';
    setThemePreference(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setThemePreference, toggleTheme, isMobile }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
