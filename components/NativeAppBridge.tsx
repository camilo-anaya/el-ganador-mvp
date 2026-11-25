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
    // Solo se ejecuta en dispositivo móvil nativo real (Android / iOS), nunca en navegador web
    if (typeof window === "undefined") return;
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() === "web") return;

    // 1. Configurar barra de estado transparente sobre el WebView
    try {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    } catch {}

    // 2. Exponer altura del teclado en CSS para formularios
    let showSub: any = null;
    let hideSub: any = null;
    try {
      showSub = Keyboard.addListener("keyboardWillShow", (info) => {
        document.documentElement.style.setProperty(
          "--keyboard-height",
          `${info.keyboardHeight}px`
        );
      });

      hideSub = Keyboard.addListener("keyboardWillHide", () => {
        document.documentElement.style.setProperty("--keyboard-height", "0px");
      });
    } catch {}

    // 3. Manejo nativo del botón atrás en Android
    let backSub: any = null;
    try {
      backSub = CapApp.addListener("backButton", ({ canGoBack }) => {
        if (pathname === "/" || pathname === "/inicio") {
          CapApp.minimizeApp().catch(() => {});
        } else if (canGoBack) {
          router.back();
        } else {
          router.push("/");
        }
      });
    } catch {}

    // 4. Al tocar una notificación local, abrir la ruta indicada (ej. /mis-boletas)
    let notifTapSub: any = null;
    (async () => {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        notifTapSub = await LocalNotifications.addListener(
          "localNotificationActionPerformed",
          (event) => {
            const url = (event.notification.extra as { url?: string } | undefined)?.url;
            if (url && url.startsWith("/")) router.push(url);
          }
        );
      } catch {}
    })();

    return () => {
      showSub?.then((h: any) => h.remove()).catch(() => {});
      hideSub?.then((h: any) => h.remove()).catch(() => {});
      backSub?.then((h: any) => h.remove()).catch(() => {});
      notifTapSub?.remove?.();
    };
  }, [pathname, router]);

  return null;
}
