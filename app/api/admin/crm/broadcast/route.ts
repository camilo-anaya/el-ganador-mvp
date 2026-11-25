import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIP_MIN_SPENT_COP = 200000;

/** Cuenta destinatarios REALES a partir de las compras confirmadas en la base de datos. */
async function countRealRecipients(audience: string): Promise<number> {
  try {
    let sql = `SELECT COUNT(*) AS c FROM (
      SELECT lower(buyer_email) AS email FROM participations
      WHERE status IN ('sold', 'paid') AND buyer_email <> ''
      GROUP BY lower(buyer_email)`;
    const params: unknown[] = [];
    if (audience === "vip") {
      sql += ` HAVING SUM(total_amount) >= ${VIP_MIN_SPENT_COP}`;
    } else if (audience === "active") {
      sql += ` HAVING MAX(created_at) >= $1`;
      params.push(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    }
    sql += `)`;
    const res = await query(sql, params as any[]);
    return Number((res.rows[0] as { c: number } | undefined)?.c) || 0;
  } catch {
    return 0;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { drawId, drawTitle, audience, messageTemplate, channel } = body || {};

    const id = randomUUID();
    const now = new Date().toISOString();
    const segment = audience === "vip" || audience === "active" ? audience : "all";
    const recipientCount = await countRealRecipients(segment);

    // Estado 'queued': la difusión queda registrada, pero NO se afirma entrega
    // hasta que exista un proveedor de mensajería (WhatsApp Business / correo) conectado.
    await query(
      `INSERT INTO crm_broadcasts
        (id, draw_id, draw_title, audience_segment, recipient_count, message_template, channel, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued', $8)`,
      [
        id,
        drawId || "RIF-2026-000184",
        drawTitle || "Sorteo Oficial",
        segment,
        recipientCount,
        messageTemplate || "",
        channel || "whatsapp_and_email",
        now,
      ]
    );

    const message =
      recipientCount > 0
        ? `Difusión registrada para ${recipientCount.toLocaleString("es-CO")} cliente(s) con compras confirmadas. El envío por WhatsApp/correo se ejecutará cuando conectes tu proveedor de mensajería.`
        : "Difusión registrada, pero aún no hay clientes con compras confirmadas en este segmento.";

    return NextResponse.json({
      ok: true,
      campaignId: id,
      status: "queued",
      recipientCount,
      deliveredCount: 0,
      message,
      sentAt: now,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Error al registrar la difusión" }, { status: 500 });
  }
}
