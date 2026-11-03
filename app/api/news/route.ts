import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const { rows: posts } = await query(`SELECT n.id, n.content, n.image_url, n.created_at,
    a.id AS account_id, a.business_name, a.business_city, a.category
    FROM business_news n JOIN business_accounts a ON a.id = n.account_id
    ORDER BY n.created_at DESC LIMIT 40`);
  return NextResponse.json({ posts });
}
