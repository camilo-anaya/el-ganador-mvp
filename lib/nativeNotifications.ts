/**
 * lib/nativeNotifications.ts - Notificaciones locales nativas (Android / iOS) vía Capacitor.
 * En navegador web todas las funciones son no-op seguras.
 * Nota: son avisos LOCALES del dispositivo. Push remotos entre usuarios requieren backend (FCM/APNs).
 */
import { Capacitor } from "@capacitor/core";

const CHANNEL_ID = "el-ganador";

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform() && Capacitor.getPlatform() !== "web";
}

export async function ensureNativeNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    if (current.display === "denied") return false;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === "granted";
  } catch {
    return false;
  }
}

/**
 * Programa el recordatorio "Sala 3D en Vivo" 15 min antes del sorteo.
 * Devuelve false si la fecha no es válida o ya pasó (no se programa nada).
 */
export async function scheduleLiveDrawReminder(drawTitle: string, drawAt: Date | string | number | null | undefined): Promise<boolean> {
  if (!drawAt) return false;
  const when = new Date(drawAt);
  if (Number.isNaN(when.getTime())) return false;
  const reminderAt = new Date(when.getTime() - 15 * 60 * 1000);
  if (reminderAt.getTime() <= Date.now()) return false;
  return showNativeNotification({
    title: "🔴 Tu sorteo empieza en 15 minutos",
    body: `${drawTitle}: entra a la Sala 3D en Vivo y prepara tus balotas.`,
    at: reminderAt,
    url: "/sorteo-en-vivo",
  });
}

export interface NativeNotificationInput {
  title: string;
  body: string;
  /** Si se indica, se programa para esa fecha; si no, se muestra de inmediato. */
  at?: Date;
  /** Ruta interna a abrir al tocar la notificación (ej. "/mis-boletas"). */
  url?: string;
}

export async function showNativeNotification(input: NativeNotificationInput): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const granted = await ensureNativeNotificationPermission();
    if (!granted) return false;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: "El Ganador",
        description: "Premios, sorteos y trámites",
        importance: 4,
        visibility: 1,
      });
    } catch {
      /* iOS no usa canales */
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 2147483000) + 1,
          title: input.title,
          body: input.body,
          channelId: CHANNEL_ID,
          schedule: input.at ? { at: input.at, allowWhileIdle: true } : undefined,
          extra: input.url ? { url: input.url } : undefined,
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}
