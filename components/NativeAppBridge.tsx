"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapApp } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";

export function NativeAppBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Configurar barra de estado transparente sobre el WebView
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

    // 2. Exponer altura del teclado en CSS para formularios
    const showSub = Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${info.keyboardHeight}px`
      );
    });

    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
    });

    // 3. Manejo nativo del botón atrás en Android
    const backSub = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (pathname === "/" || pathname === "/inicio") {
        CapApp.minimizeApp();
      } else if (canGoBack) {
        router.back();
      } else {
        router.push("/");
      }
    });

    return () => {
      showSub.then((h) => h.remove());
      hideSub.then((h) => h.remove());
      backSub.then((h) => h.remove());
    };
  }, [pathname, router]);

  return null;
}
