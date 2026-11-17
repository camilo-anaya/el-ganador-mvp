import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query, withTransaction } from "../../../../lib/db";
import { getPlan, plans } from "../../../../lib/plans";
import { createWompiCheckoutUrl } from "../../../../lib/wompi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con tu cuenta de negocio para renovar el plan." }, { status: 401 });
  if (!Object.hasOwn(plans, account.plan) || getPlan(account.plan).demoOnly) {
    return NextResponse.json({ error: "La demo gratis no requiere renovación pagada." }, { status: 400 });
  }

  try {
    const checkoutUrl = await withTransaction(async (tx) => {
      // A no-op update locks the account row so simultaneous clicks reuse one checkout.
      await tx.query("UPDATE business_accounts SET account_status = account_status WHERE id = $1", [account.id]);
      const latestResult = await tx.query(`SELECT plan_id, reference, amount_in_cents, status
        FROM plan_payments WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`, [account.id]);
      const latest = latestResult.rows[0] as { plan_id: string; reference: string; amount_in_cents: number; status: string } | undefined;
      const plan = getPlan(account.plan);
      const amountInCents = plan.subscriptionPrice * 100;

      if (latest?.status === "PENDING" && latest.plan_id === account.plan && Number(latest.amount_in_cents) === amountInCents) {
        return createWompiCheckoutUrl({ requestUrl: request.url, reference: latest.reference, amountInCents });
      }

      const reference = randomUUID().replaceAll("-", "");
      const url = createWompiCheckoutUrl({ requestUrl: request.url, reference, amountInCents });
      const now = new Date().toISOString();
      await tx.query(`INSERT INTO plan_payments (id, account_id, plan_id, reference, amount_in_cents, currency, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'COP', 'PENDING', $6, $7)`, [randomUUID(), account.id, account.plan, reference, amountInCents, now, now]);
      return url;
    });
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos iniciar la renovación." }, { status: 503 });
  }
}
