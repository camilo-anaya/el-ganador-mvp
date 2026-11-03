import { NextResponse } from "next/server";
import { withTransaction } from "../../../../../lib/db";
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
};

export async function POST(request: Request) {
  const eventSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
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

  if (!transactionId || !/^[a-f\d]{32}$/i.test(reference) || !acceptedStatuses.has(status) || !Number.isSafeInteger(amountInCents)) {
    return NextResponse.json({ received: true });
  }

  const now = new Date().toISOString();
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

    // Claim this state transition atomically: concurrent duplicate webhooks must not extend a plan twice.
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
  return NextResponse.json({ received: true });
}
