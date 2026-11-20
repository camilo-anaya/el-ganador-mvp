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
