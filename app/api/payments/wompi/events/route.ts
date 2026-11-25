import { NextResponse } from "next/server";
import { query, withTransaction } from "../../../../../lib/db";
import { advancePlanExpiry, getPlan, plans } from "../../../../../lib/plans";
import { verifyWompiEvent } from "../../../../../lib/wompi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WompiTransaction = {
  id?: unknown;
  reference?: unknown;
  status?: unknown;
  amount_in_cents?: unknown;
  currency?: unknown;
  customer_data?: {
    email?: string;
    full_name?: string;
    phone_number?: string;
  };
  customer_email?: string;
};

export async function POST(request: Request) {
  const eventSecret = process.env.WOMPI_EVENTS_SECRET || "prod_events_xpD0hmytOSB2mln6TtjIIo7SVEQIG2qy";
  if (!eventSecret) return NextResponse.json({ error: "Wompi events are not configured." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid event body." }, { status: 400 }); }
  if (!verifyWompiEvent(body, eventSecret, request.headers.get("X-Event-Checksum"))) {
    return NextResponse.json({ error: "Invalid event signature." }, { status: 401 });
  }

  if (!body || typeof body !== "object" || !("event" in body) || body.event !== "transaction.updated") {
    return NextResponse.json({ received: true });
  }
  const data = "data" in body && body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const transaction = data.transaction as WompiTransaction | undefined;
  const transactionId = typeof transaction?.id === "string" ? transaction.id : "";
  const reference = typeof transaction?.reference === "string" ? transaction.reference : "";
  const status = typeof transaction?.status === "string" ? transaction.status.toUpperCase() : "";
  const amountInCents = Number(transaction?.amount_in_cents);
  const currency = typeof transaction?.currency === "string" ? transaction.currency : "";
  const acceptedStatuses = new Set(["PENDING", "APPROVED", "DECLINED", "ERROR", "VOIDED"]);

  if (!transactionId || !reference || !acceptedStatuses.has(status) || !Number.isSafeInteger(amountInCents)) {
    return NextResponse.json({ received: true });
  }

  const now = new Date().toISOString();

  // =========================================================================
  // CASO 1: COMPRA DE BOLETAS DE SORTEO (Referencia comienza con 'tik_')
  // =========================================================================
  if (reference.startsWith("tik_") || reference.startsWith("TKT-") || reference.startsWith("tkt_")) {
    const rawId = reference.replace(/^(tik_|TKT-|tkt_)/, "");
    try {
      await withTransaction(async (tx) => {
        const partResult = await tx.query(
          `SELECT id, draw_id, total_amount, buyer_name, buyer_email, ticket_numbers, status
           FROM participations
           WHERE id = $1 OR id = $2
           LIMIT 1`,
          [reference, rawId]
        );

        const part = partResult.rows[0] as
          | {
              id: string;
              draw_id: string;
              total_amount: number;
              buyer_name: string;
              buyer_email: string;
              ticket_numbers: string;
              status: string;
            }
          | undefined;

        if (!part) {
          console.warn("Wompi ticket webhook: no se encontró la participación", { reference });
          return;
        }

        if (status === "APPROVED") {
          // Marcar participación como vendida/pagada
          await tx.query(
            `UPDATE participations SET status = 'sold' WHERE id = $1`,
            [part.id]
          );

          // Confirmar boletas oficiales
          await tx.query(
            `UPDATE tickets SET status = 'sold', hold_until = NULL WHERE participation_id = $1`,
            [part.id]
          );

          // Registrar evento de pago
          const eventId = `wompi_tik:${transactionId}:${status}`;
          try {
            await tx.query(
              `INSERT INTO payment_events (id, account_id, event_type, description, amount, created_at)
               VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT(id) DO NOTHING`,
              [
                eventId,
                part.buyer_email || "cliente",
                `wompi.ticket.approved`,
                `Compra aprobada de boletas en sorteo ${part.draw_id} · ref: ${reference}`,
                amountInCents,
                now,
              ]
            );
          } catch {}
        } else if (status === "DECLINED" || status === "ERROR" || status === "VOIDED") {
          // Liberar boletas si el pago falló o fue anulado
          await tx.query(
            `UPDATE participations SET status = 'expired' WHERE id = $1`,
            [part.id]
          );
          await tx.query(
            `UPDATE tickets SET status = 'available', participation_id = NULL, hold_until = NULL WHERE participation_id = $1`,
            [part.id]
          );
        }
      });

      return NextResponse.json({ received: true, type: "ticket", status });
    } catch (err) {
      console.error("Error procesando webhook de boleta Wompi:", err);
      return NextResponse.json({ error: "Error en transacción de boleta." }, { status: 500 });
    }
  }

  // =========================================================================
  // CASO 2: SUSCRIPCIÓN DE PLAN DE NEGOCIO (Referencia hexadecimal de 32 chars)
  // =========================================================================
  if (/^[a-f\d]{32}$/i.test(reference)) {
    const outcome = await withTransaction(async (tx) => {
      const result = await tx.query(`SELECT p.id, p.account_id, p.plan_id, p.amount_in_cents, p.currency, p.status, p.wompi_transaction_id, a.plan_expires_at
        FROM plan_payments p JOIN business_accounts a ON a.id = p.account_id WHERE p.reference = $1 LIMIT 1`, [reference]);
      const payment = result.rows[0] as { id: string; account_id: string; plan_id: string; amount_in_cents: number; currency: string; status: string; wompi_transaction_id: string | null; plan_expires_at: string | null } | undefined;
      if (!payment || Number(payment.amount_in_cents) !== amountInCents || payment.currency !== currency || currency !== "COP") return "unmatched";
      if (!Object.hasOwn(plans, payment.plan_id) || getPlan(payment.plan_id).demoOnly || getPlan(payment.plan_id).subscriptionPrice * 100 !== amountInCents) return "unmatched";
      if (payment.wompi_transaction_id && payment.wompi_transaction_id !== transactionId) return "transaction-mismatch";
      if (payment.status === status) return "duplicate";
      const terminalStatuses = new Set(["APPROVED", "DECLINED", "ERROR", "VOIDED"]);
      if (terminalStatuses.has(payment.status) && payment.status !== status && !(payment.status === "APPROVED" && status === "VOIDED")) return "stale";

      // Reclamar transición de estado atómicamente
      const transition = await tx.query(`UPDATE plan_payments SET status = $1, wompi_transaction_id = $2, updated_at = $3
        WHERE id = $4 AND status = $5`, [status, transactionId, now, payment.id, payment.status]);
      if (transition.rowCount === 0) return "duplicate";
      if (status === "APPROVED") {
        const planExpiresAt = advancePlanExpiry(payment.plan_id, payment.plan_expires_at, new Date(now));
        if (!planExpiresAt) throw new Error("The paid plan has no valid subscription period.");
        await tx.query("UPDATE business_accounts SET account_status = 'active', plan = $1, plan_expires_at = $2 WHERE id = $3", [payment.plan_id, planExpiresAt, payment.account_id]);
      } else if (status === "VOIDED") {
        await tx.query(`UPDATE business_accounts SET account_status = CASE WHEN plan_expires_at IS NOT NULL AND plan_expires_at > $1
          THEN 'active' ELSE 'payment_voided' END WHERE id = $2`, [now, payment.account_id]);
      } else if (status === "DECLINED" || status === "ERROR") {
        await tx.query("UPDATE business_accounts SET account_status = 'payment_failed' WHERE id = $1 AND account_status = 'pending_payment'", [payment.account_id]);
      }

      const eventId = `wompi:${transactionId}:${status}`;
      await tx.query(`INSERT INTO payment_events (id, account_id, event_type, description, amount, created_at)
        VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT(id) DO NOTHING`,
      [eventId, payment.account_id, `wompi.transaction.${status.toLowerCase()}`, `Actualización Wompi · referencia ${reference}`, amountInCents, now]);
      return "updated";
    });

    if (outcome === "unmatched" || outcome === "transaction-mismatch") {
      console.error("Wompi event did not match a pending plan payment", { outcome });
    }
  }

  // =========================================================================
  // CASO 3: SUSCRIPCIÓN DE PAUTA PUBLICITARIA Y BANNER (Referencia 'PLAN-' o 'SUB-')
  // =========================================================================
  if (
    reference.startsWith("PLAN-") ||
    reference.startsWith("SUB-") ||
    reference.startsWith("plan_") ||
    reference.startsWith("sub_")
  ) {
    try {
      // 1. Extraer planId y ciclo de facturación
      const parts = reference.split("-");
      // Formato: PLAN-[PLAN_ID]-[CYCLE]-[TIMESTAMP]
      const planId = (parts[1] || "PRO").toLowerCase();
      const billingCycle = (parts[2] || "MENSUAL").toLowerCase() as "mensual" | "trimestral" | "anual";
      const days = billingCycle === "anual" ? 365 : billingCycle === "trimestral" ? 90 : 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const priority = planId === "enterprise" ? 2 : 1;

      // Extraer datos del cliente si vienen en Wompi
      const customerData = (transaction?.customer_data || data?.customer_data || {}) as Record<string, unknown>;
      const customerEmail = String(
        customerData?.email ||
        transaction?.customer_email ||
        (data as Record<string, unknown>)?.customer_email ||
        "empresa@elganador.co"
      ).trim().toLowerCase();
      const customerName = String(
        customerData?.full_name ||
        (data as Record<string, unknown>)?.customer_name ||
        "Empresa Aliada"
      ).trim();

      // Asegurar existencia de tabla banner_ads
      await query(`
        CREATE TABLE IF NOT EXISTS banner_ads (
          id TEXT PRIMARY KEY,
          business_email TEXT NOT NULL,
          brand TEXT NOT NULL,
          tag TEXT NOT NULL,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          coupon TEXT NOT NULL,
          cta_text TEXT NOT NULL,
          cta_link TEXT NOT NULL,
          image_url TEXT NOT NULL,
          badge TEXT NOT NULL,
          plan_id TEXT NOT NULL DEFAULT 'pro',
          billing_cycle TEXT NOT NULL DEFAULT 'mensual',
          priority INTEGER NOT NULL DEFAULT 1,
          paid INTEGER NOT NULL DEFAULT 0,
          active INTEGER NOT NULL DEFAULT 0,
          subscription_status TEXT NOT NULL DEFAULT 'pending',
          payment_reference TEXT,
          impressions INTEGER NOT NULL DEFAULT 0,
          clicks INTEGER NOT NULL DEFAULT 0,
          activated_at TEXT,
          expires_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      if (status === "APPROVED") {
        // Buscar si ya existía un borrador o registro previo con esta referencia o email
        const existingRes = await query(
          `SELECT * FROM banner_ads WHERE payment_reference = $1 OR LOWER(business_email) = $2 ORDER BY updated_at DESC LIMIT 1`,
          [reference, customerEmail]
        );
        const existing = existingRes.rows[0] as Record<string, unknown> | undefined;

        const tag = planId === "enterprise" ? "👑 PATROCINADOR ENTERPRISE VIP" : "⚡ PATROCINADOR PRO ACTIVO";
        const category = `${planId === "enterprise" ? "Cobertura Nacional" : "Cobertura Regional"} · Suscripción ${billingCycle}`;
        const badge = `✓ Suscripción ${billingCycle} activa`;
        const title = existing?.title ? String(existing.title) : "Promoción Oficial El Ganador";
        const description = existing?.description ? String(existing.description) : "Patrocinador verificado con suscripción activa en El Ganador.";
        const coupon = existing?.coupon ? String(existing.coupon) : "Cupón: ELGANADOR";
        const ctaText = existing?.cta_text ? String(existing.cta_text) : "Ver Vitrina & Promoción →";
        const ctaLink = existing?.cta_link ? String(existing.cta_link) : "/empresario/publicidad";
        const imageUrl = existing?.image_url ? String(existing.image_url) : "/banner-el-ganador-oficial.jpg";
        const brand = existing?.brand ? String(existing.brand) : customerName;
        const adId = existing ? String(existing.id) : `ad-sub-${reference}`;

        if (existing) {
          await query(
            `UPDATE banner_ads
             SET paid = 1, active = 1, subscription_status = 'active',
                 plan_id = $1, billing_cycle = $2, priority = $3,
                 payment_reference = $4, activated_at = $5, expires_at = $6, updated_at = $7
             WHERE id = $8`,
            [planId, billingCycle, priority, reference, now, expiresAt, now, adId]
          );
        } else {
          await query(
            `INSERT INTO banner_ads (
              id, business_email, brand, tag, category, title, description, coupon, cta_text, cta_link,
              image_url, badge, plan_id, billing_cycle, priority, paid, active, subscription_status,
              payment_reference, impressions, clicks, activated_at, expires_at, created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,1,1,'active',$16,0,0,$17,$18,$19,$20)`,
            [adId, customerEmail, brand, tag, category, title, description, coupon, ctaText, ctaLink, imageUrl, badge, planId, billingCycle, priority, reference, now, expiresAt, now, now]
          );
        }

        // Registrar evento de pago y actualizar cuenta empresarial
        try {
          const eventId = `wompi:sub:${transactionId}:${status}`;
          const accRes = await query(`SELECT id FROM business_accounts WHERE LOWER(email) = $1 LIMIT 1`, [customerEmail]);
          const accId = accRes.rows[0]?.id ? String(accRes.rows[0].id) : "biz-001";

          await query(
            `UPDATE business_accounts
             SET ad_plan = $1, ad_plan_expires_at = $2, ad_impressions_limit = COALESCE(ad_impressions_limit, 0) + $3
             WHERE id = $4`,
            [planId, expiresAt, planId === "enterprise" ? 100000 : 25000, accId]
          );

          await query(
            `INSERT INTO payment_events (id, account_id, event_type, description, amount, created_at)
             VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT(id) DO NOTHING`,
            [
              eventId,
              accId,
              `wompi.subscription.${status.toLowerCase()}`,
              `🎉 Suscripción Publicitaria Aprobada (${planId.toUpperCase()} - ${billingCycle}): ${brand} ($${(amountInCents / 100).toLocaleString("es-CO")} COP) · Ref: ${reference}`,
              amountInCents,
              now,
            ]
          );

          console.log(`[WOMPI WEBHOOK] ✅ Suscripción publicitaria activada: ${brand} (${planId.toUpperCase()} - ${billingCycle}) Ref: ${reference}`);
        } catch (e) {
          console.warn("Error registrando payment_event de suscripción publicitaria:", e);
        }
      } else if (status === "DECLINED" || status === "ERROR") {
        await query(
          `UPDATE banner_ads SET subscription_status = 'failed', active = 0, updated_at = $1 WHERE payment_reference = $2`,
          [now, reference]
        );
      }
    } catch (err) {
      console.error("Error procesando webhook de suscripción publicitaria:", err);
    }
  }

  return NextResponse.json({ received: true });
}
