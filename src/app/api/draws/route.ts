import { NextResponse } from "next/server";
import { activateEligibleDraws, query, releaseExpiredReservations, type DrawRow } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await releaseExpiredReservations();
  await activateEligibleDraws();

  const result = await query(`SELECT
      d.id, d.title, d.admin, d.category, d.unit_price, d.total_tickets,
      d.followers, d.live, d.emoji, d.description,
      d.business_city, d.business_description, d.business_followers,
      d.category_details, d.owner_id, COALESCE(a.business_photo_url, '') AS business_photo_url, COALESCE(a.business_banner_url, '') AS business_banner_url, d.product_value, d.image_url, d.published,
      d.start_mode, d.start_threshold, d.scheduled_at, d.started_at,
      SUM(CASE WHEN t.status = 'sold' THEN 1 ELSE 0 END) AS sold,
      SUM(CASE WHEN t.status = 'reserved' THEN 1 ELSE 0 END) AS reserved,
      SUM(CASE WHEN t.status = 'available' THEN 1 ELSE 0 END) AS available
    FROM draws d JOIN tickets t ON t.draw_id = d.id LEFT JOIN business_accounts a ON a.id = d.owner_id WHERE d.published = 1
    GROUP BY d.id, a.business_photo_url, a.business_banner_url
    ORDER BY d.live DESC, d.id ASC`);

  const rows = result.rows as unknown as DrawRow[];
  const draws = rows.map((draw) => ({ ...draw, live: Boolean(draw.live), sold: Number(draw.sold), reserved: Number(draw.reserved), available: Number(draw.available) }));
  return NextResponse.json({ draws });
}
