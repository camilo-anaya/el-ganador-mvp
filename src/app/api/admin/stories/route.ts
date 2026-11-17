import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") {
    return NextResponse.json({ error: "Inicia sesión con una cuenta comercial." }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const { rows: stories } = await query(`
    SELECT id, account_id, media_url, media_type, caption, created_at, expires_at, views_count
    FROM business_stories
    WHERE account_id = $1 AND expires_at > $2
    ORDER BY created_at DESC
  `, [account.id, nowIso]);

  return NextResponse.json({ stories });
}

export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") {
    return NextResponse.json({ error: "Inicia sesión con una cuenta comercial." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
  const mediaType = typeof body.mediaType === "string" ? body.mediaType.trim() : (mediaUrl.includes("video") || mediaUrl.startsWith("data:video") || mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm") || mediaUrl.endsWith(".mov") ? "video" : "image");
  const caption = typeof body.caption === "string" ? body.caption.trim().slice(0, 300) : "";

  if (!mediaUrl) {
    return NextResponse.json({ error: "Debes seleccionar una fotografía o video para la historia." }, { status: 400 });
  }

  const id = `story-${randomUUID()}`;
  const now = new Date();
  const createdAt = now.toISOString();
  // Duración exacta de 24 Horas
  const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

  await query(`
    INSERT INTO business_stories (id, account_id, media_url, media_type, caption, created_at, expires_at, views_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
  `, [id, account.id, mediaUrl, mediaType, caption, createdAt, expiresAt]);

  return NextResponse.json({
    message: "📸 ¡Historia de 24 horas publicada con éxito! Se borrará automáticamente al expirar.",
    story: { id, account_id: account.id, media_url: mediaUrl, media_type: mediaType, caption, created_at: createdAt, expires_at: expiresAt, views_count: 0 }
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") {
    return NextResponse.json({ error: "Inicia sesión con una cuenta comercial." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  const storyId = typeof body.storyId === "string" ? body.storyId.trim() : "";
  if (!storyId) {
    return NextResponse.json({ error: "Indica la historia a eliminar." }, { status: 400 });
  }

  await query(`DELETE FROM business_stories WHERE id = $1 AND account_id = $2`, [storyId, account.id]);
  return NextResponse.json({ message: "Historia eliminada." });
}
