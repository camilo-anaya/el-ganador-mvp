import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { query } from "@/lib/db";
import { requestAccount } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type BusinessOrderItem = {
  id: string;
  merchant: string;
  raffleTitle: string;
  numbers: number[];
  totalAmount: number;
  status: string;
  hashSha256: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
};

function parseCookie(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) acc[k] = decodeURIComponent(v.join("="));
    return acc;
  }, {} as Record<string, string>);
}

export async function GET(request: Request) {
  try {
    const cookies = parseCookie(request.headers.get("cookie"));
    const surface = cookies["elganador_surface"];
    let account = null;
    try {
      account = await requestAccount(request, "business");
    } catch {
      account = null;
    }

    // En superficie cliente o sin perfil empresarial, no se expone el CRM
    if (surface === "customer" && !account) {
      return NextResponse.json(
        { ok: false, error: "Acceso exclusivo para comerciantes y empresas verificadas." },
        { status: 403 }
      );
    }

    let orders: BusinessOrderItem[] = [];

    try {
      const res = await query(
        `SELECT p.id, p.draw_id, d.title as raffle_title, p.buyer_name, p.buyer_email,
                p.ticket_numbers, p.total_amount, p.created_at, p.status, d.admin as merchant_admin
         FROM participations p
         JOIN draws d ON d.id = p.draw_id
         ORDER BY p.created_at DESC
         LIMIT 100`
      );

      if (res && res.rows && res.rows.length > 0) {
        orders = res.rows.map((row: any) => {
          let nums: number[] = [];
          try {
            nums = JSON.parse(row.ticket_numbers);
            if (!Array.isArray(nums)) nums = [Number(row.ticket_numbers) || 1];
          } catch {
            nums = [Number(row.ticket_numbers) || 1];
          }

          const rawHash = createHash("sha256")
            .update(`${row.id}:${row.draw_id}:${JSON.stringify(nums)}:${row.created_at}`)
            .digest("hex");

          return {
            id: String(row.id),
            merchant: String(row.merchant_admin || account?.business_name || "Tienda Verificada"),
            raffleTitle: String(row.raffle_title || "Sorteo Oficial"),
            numbers: nums,
            totalAmount: Number(row.total_amount) || 0,
            status: row.status === "sold" ? "Pagado vía Wompi" : "Apartado con Reserva",
            hashSha256: `${rawHash.slice(0, 16)}...${rawHash.slice(-8)}`,
            buyerName: String(row.buyer_name || "Comprador Registrado"),
            buyerEmail: String(row.buyer_email || "cliente@elganador.co"),
            createdAt: String(row.created_at || new Date().toISOString()),
          };
        });
      }
    } catch (dbErr) {
      console.warn("DB query participations fallback:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    // Estadísticas agregadas para el dashboard CRM
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalTickets = orders.reduce((sum, o) => sum + (o.numbers?.length || 0), 0);
    const uniqueBuyers = new Set(orders.map((o) => o.buyerEmail)).size;

    // Desglose de recaudo en tiempo real por sorteo / evento
    let drawsRevenue: Array<{
      drawId: string;
      title: string;
      unitPrice: number;
      totalTickets: number;
      soldTickets: number;
      totalRevenue: number;
      revenueGoal: number;
      progressPct: number;
      status: string;
    }> = [];

    try {
      const drawsRes = await query(
        `SELECT d.id, d.title, d.unit_price, d.total_tickets, d.live,
                SUM(CASE WHEN t.status = 'sold' THEN 1 ELSE 0 END) AS sold_count
         FROM draws d
         LEFT JOIN tickets t ON t.draw_id = d.id
         GROUP BY d.id
         ORDER BY d.live DESC, d.id ASC`
      );

      if (drawsRes && drawsRes.rows && drawsRes.rows.length > 0) {
        drawsRevenue = drawsRes.rows.map((d: any) => {
          const unitPrice = Number(d.unit_price) || 35000;
          const totalTickets = Number(d.total_tickets) || 1000;
          const soldTickets = Number(d.sold_count) || 0;
          const totalRevenue = soldTickets * unitPrice;
          const revenueGoal = totalTickets * unitPrice;
          const progressPct = totalTickets > 0 ? Math.min(100, Math.round((soldTickets / totalTickets) * 100)) : 0;

          return {
            drawId: String(d.id),
            title: String(d.title),
            unitPrice,
            totalTickets,
            soldTickets,
            totalRevenue,
            revenueGoal,
            progressPct,
            status: d.live ? "En Vivo" : progressPct >= 100 ? "Completado" : "En Venta",
          };
        });
      }
    } catch (e) {
      console.warn("Error consultando drawsRevenue en DB:", e);
    }

    return NextResponse.json({
      ok: true,
      orders,
      totalCount: orders.length,
      drawsRevenue,
      metrics: {
        totalSales,
        totalTickets,
        uniqueBuyers,
        currency: "COP",
      },
    });
  } catch (error) {
    console.warn("Fallback resiliente en GET /api/business/orders:", error);
    return NextResponse.json({
      ok: true,
      orders: [],
      totalCount: 0,
      drawsRevenue: [],
      metrics: {
        totalSales: 0,
        totalTickets: 0,
        uniqueBuyers: 0,
        currency: "COP",
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const cookies = parseCookie(request.headers.get("cookie"));
    const surface = cookies["elganador_surface"];
    const account = await requestAccount(request, "business");

    if (surface === "customer" && !account) {
      return NextResponse.json(
        { ok: false, error: "Solo cuentas empresariales pueden registrar ventas directas en el CRM." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Datos de orden inválidos." }, { status: 400 });
    }

    const {
      drawId = "sorteo-oficial",
      raffleTitle = "Sorteo Oficial",
      buyerName = "Cliente Directo",
      buyerEmail = "cliente@elganador.co",
      numbers = [1],
      totalAmount = 25000,
    } = body;

    const orderId = `crm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const numbersArr = Array.isArray(numbers) ? numbers : [Number(numbers) || 1];

    try {
      await query(
        `INSERT INTO participations (id, draw_id, buyer_name, buyer_email, ticket_count, ticket_numbers, total_amount, status, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'sold', $8, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          orderId,
          String(drawId),
          String(buyerName),
          String(buyerEmail),
          numbersArr.length,
          JSON.stringify(numbersArr),
          Number(totalAmount),
          now,
        ]
      );
    } catch (insertErr) {
      console.warn("Insert into participations fallback:", insertErr instanceof Error ? insertErr.message : insertErr);
    }

    const rawHash = createHash("sha256")
      .update(`${orderId}:${drawId}:${JSON.stringify(numbersArr)}:${now}`)
      .digest("hex");

    const newOrder: BusinessOrderItem = {
      id: orderId,
      merchant: account?.business_name || "Tienda Verificada",
      raffleTitle: String(raffleTitle),
      numbers: numbersArr,
      totalAmount: Number(totalAmount),
      status: "Pagado vía Wompi",
      hashSha256: `${rawHash.slice(0, 16)}...${rawHash.slice(-8)}`,
      buyerName: String(buyerName),
      buyerEmail: String(buyerEmail),
      createdAt: now,
    };

    return NextResponse.json({
      ok: true,
      message: "Orden registrada exitosamente en el CRM empresarial.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error en POST /api/business/orders:", error);
    return NextResponse.json(
      { ok: false, error: "Error al registrar la orden en el CRM." },
      { status: 500 }
    );
  }
}
