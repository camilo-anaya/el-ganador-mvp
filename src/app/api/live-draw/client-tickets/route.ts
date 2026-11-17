import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email")?.trim().toLowerCase();
    const account = await requestAccount(request);

    let buyerAccountId = account?.id;
    let queryEmail = emailParam || account?.email || null;

    if (account && account.email) {
      await query("UPDATE participations SET buyer_account_id = $1 WHERE lower(buyer_email) = lower($2) AND buyer_account_id IS NULL", [account.id, account.email]);
    }

    if (!buyerAccountId && !queryEmail) {
      return NextResponse.json({
        ok: true,
        authenticated: !!account,
        account: account ? { id: account.id, displayName: account.display_name, role: account.role, email: account.email } : null,
        tickets: [],
        draws: []
      });
    }

    let participationsQuery = "";
    let params: any[] = [];

    if (buyerAccountId && queryEmail) {
      participationsQuery = `
        SELECT p.id, p.draw_id, p.buyer_name, p.buyer_email, p.ticket_numbers, p.ticket_count, p.status, p.created_at, d.title as draw_title, d.total_tickets
        FROM participations p
        JOIN draws d ON d.id = p.draw_id
        WHERE p.buyer_account_id = $1 OR LOWER(p.buyer_email) = LOWER($2)
        ORDER BY p.created_at DESC LIMIT 50
      `;
      params = [buyerAccountId, queryEmail];
    } else if (buyerAccountId) {
      participationsQuery = `
        SELECT p.id, p.draw_id, p.buyer_name, p.buyer_email, p.ticket_numbers, p.ticket_count, p.status, p.created_at, d.title as draw_title, d.total_tickets
        FROM participations p
        JOIN draws d ON d.id = p.draw_id
        WHERE p.buyer_account_id = $1
        ORDER BY p.created_at DESC LIMIT 50
      `;
      params = [buyerAccountId];
    } else {
      participationsQuery = `
        SELECT p.id, p.draw_id, p.buyer_name, p.buyer_email, p.ticket_numbers, p.ticket_count, p.status, p.created_at, d.title as draw_title, d.total_tickets
        FROM participations p
        JOIN draws d ON d.id = p.draw_id
        WHERE LOWER(p.buyer_email) = LOWER($1)
        ORDER BY p.created_at DESC LIMIT 50
      `;
      params = [queryEmail];
    }

    const { rows } = await query<any>(participationsQuery, params);

    const ticketNumbersSet = new Set<string>();
    const drawsList: Array<{ id: string; title: string; tickets: string[] }> = [];
    let detectedBuyerName = account?.display_name || "";

    for (const row of rows) {
      if (!detectedBuyerName && row.buyer_name) {
        detectedBuyerName = row.buyer_name;
      }
      let numbers: number[] = [];
      try {
        if (typeof row.ticket_numbers === "string") {
          if (row.ticket_numbers.startsWith("[")) {
            numbers = JSON.parse(row.ticket_numbers);
          } else {
            numbers = row.ticket_numbers.split(",").map((n: string) => parseInt(n.trim(), 10)).filter(Boolean);
          }
        } else if (Array.isArray(row.ticket_numbers)) {
          numbers = row.ticket_numbers;
        }
      } catch {}

      const formatted = numbers.map((n) => {
        const total = row.total_tickets || 99;
        const padLen = total > 100 ? (total > 999 ? 4 : 3) : 2;
        return String(n).padStart(padLen, "0");
      });

      formatted.forEach((t) => ticketNumbersSet.add(t));
      drawsList.push({
        id: row.draw_id,
        title: row.draw_title || "Sorteo Oficial",
        tickets: formatted
      });
    }

    return NextResponse.json({
      ok: true,
      authenticated: !!account,
      account: account ? { id: account.id, displayName: account.display_name, role: account.role, email: account.email } : null,
      buyerName: detectedBuyerName,
      tickets: Array.from(ticketNumbersSet),
      draws: drawsList
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Error al consultar boletas" }, { status: 500 });
  }
}
