import { NextResponse } from "next/server";
import { query, releaseExpiredReservations } from "../../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ drawId: string }> }) {
  const { drawId } = await context.params;
  await releaseExpiredReservations();
  const drawResult = await query("SELECT total_tickets FROM draws WHERE id = $1 AND published = 1", [drawId]);
  const draw = drawResult.rows[0] as { total_tickets: number } | undefined;
  if (!draw) return NextResponse.json({ error: "No encontramos ese sorteo." }, { status: 404 });

  const ticketResult = await query("SELECT number, status FROM tickets WHERE draw_id = $1 ORDER BY number", [drawId]);
  const tickets = ticketResult.rows as unknown as { number: number; status: "available" | "reserved" | "sold" }[];
  return NextResponse.json({ tickets, total: draw.total_tickets });
}
