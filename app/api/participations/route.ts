import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../lib/auth";
import { query, releaseExpiredReservations, withTransaction } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  drawId?: unknown;
  buyerName?: unknown;
  buyerEmail?: unknown;
  ticketNumbers?: unknown;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "El formato de la solicitud no es válido." }, { status: 400 });
    }
    body = parsed as RequestBody;
  } catch {
    return NextResponse.json({ error: "El formato de la solicitud no es válido." }, { status: 400 });
  }

  const drawId = typeof body.drawId === "string" ? body.drawId : "";
  const buyerName = typeof body.buyerName === "string" ? body.buyerName.trim() : "";
  const buyerEmail = typeof body.buyerEmail === "string" ? body.buyerEmail.trim().toLowerCase() : "";
  const numbers = Array.isArray(body.ticketNumbers) ? body.ticketNumbers : [];
  if (!drawId || buyerName.length < 2 || buyerName.length > 100) {
    return NextResponse.json({ error: "Escribe tu nombre para reservar." }, { status: 400 });
  }
  if (buyerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return NextResponse.json({ error: "Escribe un correo electrónico válido." }, { status: 400 });
  }
  if (numbers.length < 1 || numbers.length > 10 || numbers.some((number) => !Number.isInteger(number) || number < 1)
    || new Set(numbers).size !== numbers.length) {
    return NextResponse.json({ error: "Selecciona entre 1 y 10 números disponibles." }, { status: 400 });
  }

  const account = await requestAccount(request);
  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const participationId = randomUUID();

  try {
    const selectedNumbers = numbers as number[];
    const customer = account?.role === "customer" ? account : null;
    const reservation = await withTransaction(async (tx) => {
      await releaseExpiredReservations(createdAt, tx);
      const drawResult = await tx.query("SELECT unit_price, total_tickets FROM draws WHERE id = $1 AND published = 1", [drawId]);
      const draw = drawResult.rows[0] as { unit_price: number; total_tickets: number } | undefined;
      if (!draw) throw new ReservationError("not-found");
      if (selectedNumbers.some((number) => number > draw.total_tickets)) throw new ReservationError("invalid-number");
      const totalAmount = Number(draw.unit_price) * selectedNumbers.length;

      await tx.query(`INSERT INTO participations
        (id, draw_id, buyer_name, buyer_email, ticket_count, ticket_numbers, total_amount, status, created_at, expires_at, buyer_account_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'reserved', $8, $9, $10)`,
      [participationId, drawId, customer?.display_name ?? buyerName, customer?.email ?? buyerEmail,
        selectedNumbers.length, JSON.stringify(selectedNumbers), totalAmount, createdAt, expiresAt, customer?.id ?? null]);

      for (const number of selectedNumbers) {
        const reserved = await tx.query(`UPDATE tickets SET status = 'reserved', participation_id = $1, hold_until = $2
          WHERE draw_id = $3 AND number = $4 AND status = 'available' RETURNING number`, [participationId, expiresAt, drawId, number]);
        if (reserved.rowCount !== 1) throw new ReservationError("unavailable", number);
      }
      return totalAmount;
    });
    return NextResponse.json({
      reservation: {
        id: participationId,
        drawId,
        numbers: selectedNumbers,
        totalAmount: reservation,
        status: "reserved",
        createdAt,
        expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ReservationError && error.code === "not-found") return NextResponse.json({ error: "No encontramos ese sorteo." }, { status: 404 });
    if (error instanceof ReservationError && error.code === "invalid-number") return NextResponse.json({ error: "Uno de los números no pertenece a este sorteo." }, { status: 400 });
    if (error instanceof ReservationError && error.code === "unavailable") return NextResponse.json({ error: `El número ${String(error.number).padStart(4, "0")} ya no está disponible. Elige otro.` }, { status: 409 });
    console.error("Could not create raffle reservation", error);
    return NextResponse.json({ error: "No pudimos reservar los números. Inténtalo de nuevo." }, { status: 500 });
  }
}

class ReservationError extends Error {
  constructor(readonly code: "not-found" | "invalid-number" | "unavailable", readonly number?: number) { super(code); }
}
