import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
    }

    const {
      reference,
      drawId = "sorteo-oficial",
      raffleTitle = "Sorteo Oficial El Ganador",
      merchant = "El Ganador Oficial",
      buyerName = "Comprador Registrado",
      buyerEmail = "cliente@elganador.co",
      buyerPhone = "+573001234567",
      numbers = [1],
      totalAmount = 25000,
    } = body;

    if (!reference || typeof reference !== "string") {
      return NextResponse.json({ error: "Se requiere referencia única." }, { status: 400 });
    }

    const numbersArr = Array.isArray(numbers)
      ? numbers.map((n: unknown) => Number(n)).filter((n: number) => !isNaN(n))
      : [Number(numbers) || 1];

    const amountNum = Number(totalAmount) || 25000;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora de vigencia de reserva

    // 1. Asegurar que el sorteo exista en la tabla local draws (para respetar la clave foránea)
    try {
      await query(
        `INSERT INTO draws (id, title, admin, category, unit_price, total_tickets, emoji, description, published, created_at)
         VALUES ($1, $2, $3, 'sorteos', $4, 10000, '🎟️', $5, 1, $6)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, admin = EXCLUDED.admin`,
        [
          String(drawId),
          String(raffleTitle),
          String(merchant),
          Math.max(1000, Math.round(amountNum / (numbersArr.length || 1))),
          String(raffleTitle),
          now,
        ]
      );
    } catch (drawErr) {
      console.warn("Aviso al asegurar draw en SQLite:", drawErr instanceof Error ? drawErr.message : drawErr);
    }

    // 2. Insertar la participación en estado 'pending' asociada a la referencia
    try {
      await query(
        `INSERT INTO participations (id, draw_id, buyer_name, buyer_email, ticket_count, ticket_numbers, total_amount, status, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
         ON CONFLICT (id) DO UPDATE SET status = 'pending', total_amount = EXCLUDED.total_amount`,
        [
          String(reference),
          String(drawId),
          String(buyerName),
          String(buyerEmail),
          numbersArr.length,
          JSON.stringify(numbersArr),
          amountNum,
          now,
          expiresAt,
        ]
      );
    } catch (partErr) {
      console.warn("Aviso al insertar participations en SQLite:", partErr instanceof Error ? partErr.message : partErr);
    }

    // 3. Sincronizar con Supabase si está disponible
    if (supabase) {
      try {
        await supabase
          .from("tickets")
          .upsert(
            numbersArr.map((num: number) => ({
              raffle_id: String(drawId),
              number: num,
              status: "pending",
              buyer_name: String(buyerName),
              buyer_email: String(buyerEmail),
              buyer_phone: String(buyerPhone),
              reference: String(reference),
              total_cop: amountNum,
              created_at: now,
            })),
            { onConflict: "raffle_id,number" }
          );
      } catch (sbErr) {
        // Fallback silencioso si la tabla de Supabase difiere
        console.warn("Aviso al sincronizar tickets con Supabase:", sbErr instanceof Error ? sbErr.message : sbErr);
      }
    }

    return NextResponse.json({
      ok: true,
      reference,
      drawId,
      numbers: numbersArr,
      totalAmount: amountNum,
      status: "pending",
    });
  } catch (error) {
    console.error("Error en POST /api/payments/create-intent:", error);
    return NextResponse.json(
      { error: "Error al registrar la intención de pago." },
      { status: 500 }
    );
  }
}
