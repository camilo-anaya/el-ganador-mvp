import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query } from "../../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  const { rows: posts } = await query("SELECT id, content, image_url, created_at FROM business_news WHERE account_id = $1 ORDER BY created_at DESC LIMIT 40", [account.id]);
  return NextResponse.json({ posts });
}
export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Escribe una actualización." }, { status: 400 }); }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  if (content.length < 2 || content.length > 1200 || (imageUrl && !(/^(?:\/uploads\/products\/|https:\/\/[^\s]+\/storage\/v1\/object\/public\/product-images\/)[\w./-]+\.(?:jpg|jpeg|png|webp)$/i.test(imageUrl)))) return NextResponse.json({ error: "El texto debe tener hasta 1.200 caracteres y la foto debe subirse desde el formulario." }, { status: 400 });
  const id = randomUUID(); const createdAt = new Date().toISOString();
  await query("INSERT INTO business_news (id, account_id, content, image_url, created_at) VALUES ($1, $2, $3, $4, $5)", [id, account.id, content, imageUrl, createdAt]);
  return NextResponse.json({ post: { id, content, image_url: imageUrl, created_at: createdAt } }, { status: 201 });
}
