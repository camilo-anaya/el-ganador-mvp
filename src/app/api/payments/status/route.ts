import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference") ?? "";
  if (!/^[a-f\d]{32}$/i.test(reference)) return NextResponse.json({ error: "Referencia inválida." }, { status: 400 });

  const result = await query(`SELECT p.status, p.plan_id, a.plan_expires_at
    FROM plan_payments p JOIN business_accounts a ON a.id = p.account_id WHERE p.reference = $1 LIMIT 1`, [reference]);
  const payment = result.rows[0] as { status: string; plan_id: string; plan_expires_at: string | null } | undefined;
  if (!payment) return NextResponse.json({ error: "No encontramos este pago." }, { status: 404 });

  return NextResponse.json({ status: payment.status, planId: payment.plan_id, planExpiresAt: payment.plan_expires_at }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
