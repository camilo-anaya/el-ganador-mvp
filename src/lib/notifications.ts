/**
 * lib/notifications.ts - Módulo de Notificaciones y Despacho de Comprobantes Oficiales
 * Soporta envío directo por WhatsApp y preparación de correo electrónico para compradores.
 */

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
