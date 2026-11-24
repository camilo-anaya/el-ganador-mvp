"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapApp } from "@capacitor/app";

interface NativeVitrinaWrapperProps {
  children: React.ReactNode;
  statusBarStyle?: "dark" | "light";
  themeColor?: string;
  className?: string;
}

/**
 * Componente integral para aplicar ajustes nativos mínimos (safe areas,
 * barra de estado, control de botón atrás en Android y anti-overscroll)
 * preservando la estructura natural de la vitrina, sorteos y demás pantallas.
 */
export function NativeVitrinaWrapper({
  children,
  statusBarStyle = "dark",
  themeColor = "#0a0a0c", // Color insignia oficial: Negro profundo (evita el color verde en la barra nativa)
  className = "",
}: NativeVitrinaWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Asegura viewportFit=cover en el meta viewport si no está presente
    let metaViewport = document.querySelector(
      'meta[name="viewport"]'
    ) as HTMLMetaElement | null;

    if (!metaViewport) {
      metaViewport = document.createElement("meta");
      metaViewport.name = "viewport";
      document.head.appendChild(metaViewport);
    }

    const currentContent = metaViewport.getAttribute("content") || "";
    const hasViewportFit = currentContent.includes("viewport-fit=");
    const hasThemeColor = Boolean(
      document.querySelector('meta[name="theme-color"]')
    );

    if (!hasViewportFit) {
      const baseContent =
        currentContent.trim() || "width=device-width, initial-scale=1";
      metaViewport.setAttribute(
        "content",
        `${baseContent}, viewport-fit=cover`
      );
    }

    if (!hasThemeColor && themeColor) {
      const metaTheme = document.createElement("meta");
      metaTheme.name = "theme-color";
      metaTheme.content = themeColor;
      document.head.appendChild(metaTheme);
    }

    // Aplica reglas base no invasivas sin comprimir vitrina ni sorteos
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
    const prevBodyOverscroll = document.body.style.overscrollBehaviorY;
    const prevBodyOverflowX = document.body.style.overflowX;
    const prevBodyMargin = document.body.style.margin;

    document.documentElement.style.overscrollBehaviorY = "none";
    document.body.style.overscrollBehaviorY = "none";
    document.body.style.overflowX = "hidden";
    document.body.style.margin = "0";

    return () => {
      document.documentElement.style.overscrollBehaviorY = prevHtmlOverscroll;
      document.body.style.overscrollBehaviorY = prevBodyOverscroll;
      document.body.style.overflowX = prevBodyOverflowX;
      document.body.style.margin = prevBodyMargin;
    };
  }, [themeColor]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const targetStyle =
      statusBarStyle === "light" ? Style.Light : Style.Dark;

    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setStyle({ style: targetStyle }).catch(() => {});

    const backSub = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (pathname === "/" || pathname === "/inicio") {
        CapApp.minimizeApp().catch(() => {});
      } else if (canGoBack) {
        router.back();
      } else {
        router.push("/");
      }
    });

    return () => {
      backSub.then((handle) => handle.remove()).catch(() => {});
    };
  }, [pathname, router, statusBarStyle]);

  return (
    <div
      ref={wrapperRef}
      data-native-vitrina="true"
      className={className}
      style={{
        width: "100%",
        minHeight: "100dvh",
        boxSizing: "border-box",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
      }}
    >
      {children}
    </div>
  );
}

export default NativeVitrinaWrapper;
