import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId");
  const nowIso = new Date().toISOString();

  let sql = `
    SELECT s.id, s.account_id, s.media_url, s.media_type, s.caption, s.created_at, s.expires_at, s.views_count,
           a.business_name, a.business_city, a.category, a.business_photo_url
    FROM business_stories s
    JOIN business_accounts a ON a.id = s.account_id
    WHERE s.expires_at > $1
  `;
  const params: unknown[] = [nowIso];

  if (accountId) {
    sql += ` AND s.account_id = $2`;
    params.push(accountId);
  }

  sql += ` ORDER BY s.created_at DESC LIMIT 50`;

  const { rows: stories } = await query(sql, params as never[]);
  return NextResponse.json({ stories });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "Tienda XYZ";
  const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
  const mediaType = typeof body.mediaType === "string" ? body.mediaType.trim() : (mediaUrl.includes("video") || mediaUrl.startsWith("data:video") || mediaUrl.endsWith(".mp4") ? "video" : "image");
  const caption = typeof body.caption === "string" ? body.caption.trim().slice(0, 300) : "";

  if (!mediaUrl) {
    return NextResponse.json({ error: "Debes seleccionar una foto o video para la historia." }, { status: 400 });
  }

  const { rows: accs } = await query("SELECT id FROM business_accounts WHERE LOWER(business_name) = LOWER($1) LIMIT 1", [businessName]);
  const accountId = (accs as Array<{ id: string }>)[0]?.id || "biz-001";

  const id = `story-${randomUUID()}`;
  const now = new Date();
  const createdAt = now.toISOString();
  // Exactamente 24 Horas
  const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

  await query(`
    INSERT INTO business_stories (id, account_id, media_url, media_type, caption, created_at, expires_at, views_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
  `, [id, accountId, mediaUrl, mediaType, caption, createdAt, expiresAt]);

  return NextResponse.json({
    message: "📸 ¡Historia de 24 horas publicada con éxito!",
    story: { id, account_id: accountId, media_url: mediaUrl, media_type: mediaType, caption, created_at: createdAt, expires_at: expiresAt, views_count: 0 }
  }, { status: 201 });
}
