import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? "";
  const txId = searchParams.get("id") ?? "";

  if (!reference && !txId) {
    return NextResponse.json({ error: "Referencia o ID inválido." }, { status: 400 });
  }

  // 0. Si viene ID de transacción de Wompi, consultar directamente Wompi
  if (txId) {
    try {
      const wompiRes = await fetch(`https://production.wompi.co/v1/transactions/${txId}`, {
        headers: { "Cache-Control": "no-cache" }
      });
      if (wompiRes.ok) {
        const wompiJson = await wompiRes.json();
        const tx = wompiJson?.data;
        if (tx) {
          return NextResponse.json({
            type: "wompi",
            status: tx.status,
            reference: tx.reference,
            amountInCents: tx.amount_in_cents,
            id: tx.id,
            paymentMethod: tx.payment_method_type,
          }, { headers: { "Cache-Control": "no-store, max-age=0" } });
        }
      }
    } catch (e) {
      console.warn("Error consultando Wompi:", e);
    }
  }

  // 1. Caso de Compra de Boletas de Sorteo (referencias 'tik_...', 'TKT-...' o IDs de participación)
  if (reference.startsWith("tik_") || reference.startsWith("part_") || reference.startsWith("TKT-") || reference.startsWith("tkt_")) {
    const rawId = reference.replace(/^(tik_|TKT-|tkt_)/, "");
    try {
      const partResult = await query(
        `SELECT p.id, p.draw_id, p.buyer_name, p.buyer_email, p.ticket_numbers, p.total_amount, p.status, d.title as draw_title
         FROM participations p
         JOIN draws d ON d.id = p.draw_id
         WHERE p.id = $1 OR p.id = $2
         LIMIT 1`,
        [reference, rawId]
      );

      const part = partResult.rows[0] as
        | {
            id: string;
            draw_id: string;
            buyer_name: string;
            buyer_email: string;
            ticket_numbers: string;
            total_amount: number;
            status: string;
            draw_title: string;
          }
        | undefined;

      if (part) {
        let ticketNumbers: number[] = [];
        try {
          ticketNumbers = JSON.parse(part.ticket_numbers);
        } catch {
          ticketNumbers = [];
        }

        const isApproved = part.status === "sold" || part.status === "paid";
        const isExpired = part.status === "expired";
        const status = isApproved ? "APPROVED" : isExpired ? "DECLINED" : "PENDING";

        return NextResponse.json(
          {
            type: "ticket",
            status,
            participationId: part.id,
            drawId: part.draw_id,
            drawTitle: part.draw_title,
            buyerName: part.buyer_name,
            buyerEmail: part.buyer_email,
            ticketNumbers,
            totalAmount: part.total_amount,
          },
          { headers: { "Cache-Control": "no-store, max-age=0" } }
        );
      }
    } catch (e) {
      console.warn("Error consultando participación de boletas:", e);
    }
  }

  // 2. Caso de Suscripción de Plan de Negocio (referencia hexadecimal de 32 caracteres)
  if (/^[a-f\d]{32}$/i.test(reference)) {
    try {
      const result = await query(
        `SELECT p.status, p.plan_id, a.plan_expires_at
         FROM plan_payments p
         JOIN business_accounts a ON a.id = p.account_id
         WHERE p.reference = $1
         LIMIT 1`,
        [reference]
      );
      const payment = result.rows[0] as { status: string; plan_id: string; plan_expires_at: string | null } | undefined;
      if (payment) {
        return NextResponse.json(
          {
            type: "plan",
            status: payment.status,
            planId: payment.plan_id,
            planExpiresAt: payment.plan_expires_at,
          },
          { headers: { "Cache-Control": "no-store, max-age=0" } }
        );
      }
    } catch (e) {
      console.warn("Error consultando pago de plan:", e);
    }
  }

  // Si no se encuentra en ninguna de las dos tablas
  return NextResponse.json({ error: "No encontramos este pago." }, { status: 404 });
}
