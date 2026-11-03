import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query, releaseExpiredReservations } from "../../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "customer") return NextResponse.json({ error: "Inicia sesión con una cuenta de cliente." }, { status: 401 });
  await releaseExpiredReservations();
  const { rows: history } = await query(`SELECT p.id, p.draw_id, p.ticket_numbers, p.ticket_count, p.total_amount,
    p.status, p.created_at, p.expires_at, d.title, d.admin, d.emoji, d.unit_price
    FROM participations p JOIN draws d ON d.id = p.draw_id WHERE p.buyer_account_id = $1 ORDER BY p.created_at DESC LIMIT 100`, [account.id]);
  return NextResponse.json({ history });
}
