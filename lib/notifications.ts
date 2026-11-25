/**
 * lib/notifications.ts - Módulo de Notificaciones y Despacho de Comprobantes Oficiales
 * Soporta envío directo por WhatsApp y preparación de correo electrónico para compradores.
 */

import { showNativeNotification } from './nativeNotifications';

export interface TicketNotificationData {
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  drawTitle: string;
  ticketNumbers: number[];
  totalAmount: number;
  drawDate?: string;
  participationId?: string;
  liveUrl?: string;
}

/**
 * Genera el enlace directo para enviar o compartir las balotas oficiales compradas por WhatsApp.
 */
export function buildWhatsAppTicketUrl(data: TicketNotificationData): string {
  const liveUrl = data.liveUrl || "https://el-ganador-mvp.vercel.app/sorteo-en-vivo";
  const formattedNumbers = data.ticketNumbers.map((n) => `#${n}`).join(", ");
  const formattedAmount = `$${data.totalAmount.toLocaleString("es-CO")} COP`;

  const message = [
    `¡Hola ${data.buyerName}! 🎱`,
    ``,
    `Tus balotas oficiales en *El Ganador* para el sorteo *${data.drawTitle}* ya están aseguradas y emitidas en el cartón oficial.`,
    ``,
    `🎟️ *Tus números:* ${formattedNumbers}`,
    `💰 *Valor cancelado:* ${formattedAmount}`,
    `🔐 *Certificado:* Hash SHA-256 Verificado`,
    ``,
    `Sigue la extracción en vivo con física real y ruleta aquí:`,
    `👉 ${liveUrl}`,
    ``,
    `¡Mucha suerte! 🍀`
  ].join("\n");

  const phoneParam = data.buyerPhone ? `phone=${encodeURIComponent(data.buyerPhone.replace(/\D/g, ""))}&` : "";
  return `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
}

/**
 * Genera el enlace directo para compartir el recordatorio previo al sorteo en vivo.
 */
export function buildWhatsAppReminderUrl(drawTitle: string, liveUrl: string = "https://el-ganador-mvp.vercel.app/sorteo-en-vivo"): string {
  const message = [
    `🔔 *¡EL SORTEO ESTÁ POR COMENZAR!* 🔔`,
    ``,
    `La sala de extracción oficial para *${drawTitle}* ya está abierta.`,
    `Conéctate a la transmisión en vivo de El Ganador:`,
    `👉 ${liveUrl}`,
    ``,
    `¡Prepara tus balotas!`
  ].join("\n");

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * ============================================================================
 * SISTEMA DE NOTIFICACIONES INTERNAS EMPRESARIALES (SECRETARIA LEGAL IA & VENTAS)
 * ============================================================================
 */
export interface BusinessNotification {
  id: string;
  type: 'legal_approval' | 'ticket_sale' | 'kyb_verified' | 'draw_ready';
  title: string;
  message: string;
  timestamp: number;
  dateStr: string;
  read: boolean;
  radicado?: string;
  raffleTitle?: string;
  badge?: string;
  link?: string;
}

export function getBusinessNotifications(): BusinessNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('elganador_business_notifications');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function addBusinessNotification(
  notif: Omit<BusinessNotification, 'id' | 'timestamp' | 'dateStr' | 'read'>
): BusinessNotification {
  const newItem: BusinessNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    dateStr: new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    read: false,
  };

  if (typeof window !== 'undefined') {
    try {
      const current = getBusinessNotifications();
      const updated = [newItem, ...current].slice(0, 50);
      localStorage.setItem('elganador_business_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('elganador_notification_update'));
      // Aviso nativo del dispositivo (no-op en navegador web)
      void showNativeNotification({
        title: newItem.title,
        body: newItem.message.slice(0, 180),
        url: newItem.link,
      });
    } catch (e) {
      console.warn('Error al guardar notificación empresarial:', e);
    }
  }

  return newItem;
}

export function markBusinessNotificationsAsRead(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getBusinessNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    localStorage.setItem('elganador_business_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('elganador_notification_update'));
  } catch {}
}

function saveBusinessNotifications(list: BusinessNotification[]): void {
  localStorage.setItem('elganador_business_notifications', JSON.stringify(list));
  window.dispatchEvent(new Event('elganador_notification_update'));
}

/** Descarta (elimina) una notificación empresarial concreta. */
export function dismissBusinessNotification(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    saveBusinessNotifications(getBusinessNotifications().filter((n) => n.id !== id));
  } catch {}
}

/** Elimina todas las notificaciones empresariales. */
export function clearBusinessNotifications(): void {
  if (typeof window === 'undefined') return;
  try {
    saveBusinessNotifications([]);
  } catch {}
}

/**
 * ============================================================================
 * NOTIFICACIONES DEL CLIENTE: PREMIOS GANADOS (campana de la vitrina)
 * ============================================================================
 */
export const WON_PRIZES_KEY = 'elganador_won_prizes';

export interface WonPrizeNotification {
  id: string;
  drawId: string;
  title: string;
  winnerNumber: string;
  merchant: string;
  date: string;
  sha256Hash: string;
  status: 'Pendiente de entrega' | 'Reclamado';
  createdAt: number;
  /** undefined se considera NO leído (compatibilidad con premios guardados antes). */
  read?: boolean;
  /** Descartado por el usuario: se oculta pero se conserva para evitar duplicados. */
  dismissed?: boolean;
}

function readAllWonPrizes(): WonPrizeNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WON_PRIZES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllWonPrizes(list: WonPrizeNotification[]): void {
  localStorage.setItem(WON_PRIZES_KEY, JSON.stringify(list.slice(0, 100)));
  window.dispatchEvent(new Event('elganador_prizes_updated'));
}

/** Premios visibles en la campana (excluye los descartados). */
export function getWonPrizes(): WonPrizeNotification[] {
  return readAllWonPrizes().filter((p) => !p.dismissed);
}

/** Registra un premio ganado. Devuelve false si ya existía (mismo sorteo + número). */
export function addWonPrize(
  prize: Omit<WonPrizeNotification, 'read' | 'dismissed'>
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = readAllWonPrizes();
    if (list.some((p) => p.drawId === prize.drawId && p.winnerNumber === prize.winnerNumber)) {
      return false;
    }
    writeAllWonPrizes([{ ...prize, read: false }, ...list]);
    return true;
  } catch {
    return false;
  }
}

export function markWonPrizesAsRead(): void {
  if (typeof window === 'undefined') return;
  try {
    writeAllWonPrizes(readAllWonPrizes().map((p) => ({ ...p, read: true })));
  } catch {}
}

export function dismissWonPrize(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    writeAllWonPrizes(readAllWonPrizes().map((p) => (p.id === id ? { ...p, dismissed: true, read: true } : p)));
  } catch {}
}

export function dismissAllWonPrizes(): void {
  if (typeof window === 'undefined') return;
  try {
    writeAllWonPrizes(readAllWonPrizes().map((p) => ({ ...p, dismissed: true, read: true })));
  } catch {}
}

/** Marca el premio como reclamado y leído. */
export function claimWonPrize(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    writeAllWonPrizes(
      readAllWonPrizes().map((p) => (p.id === id ? { ...p, status: 'Reclamado' as const, read: true } : p))
    );
  } catch {}
}

/**
 * ============================================================================
 * PREFERENCIAS DE NOTIFICACIÓN DEL CLIENTE (guardadas desde /perfil)
 * ============================================================================
 */
export interface NotificationPrefs {
  notifyWhatsapp: boolean;
  notifyLiveDraws: boolean;
}

export function getNotificationPrefs(): NotificationPrefs {
  const defaults: NotificationPrefs = { notifyWhatsapp: true, notifyLiveDraws: true };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem('elganador_client_profile');
    if (!raw) return defaults;
    const p = JSON.parse(raw);
    return {
      notifyWhatsapp: typeof p.notifyWhatsapp === 'boolean' ? p.notifyWhatsapp : true,
      notifyLiveDraws: typeof p.notifyLiveDraws === 'boolean' ? p.notifyLiveDraws : true,
    };
  } catch {
    return defaults;
  }
}
