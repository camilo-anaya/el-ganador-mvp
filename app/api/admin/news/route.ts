import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query } from "../../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  const { rows } = await query("SELECT id, content, image_url, images_json, created_at FROM business_news WHERE account_id = $1 ORDER BY created_at DESC LIMIT 40", [account.id]);
  const posts = (rows as Array<Record<string, unknown>>).map((r) => {
    let images: string[] = [];
    if (typeof r.images_json === "string" && r.images_json.trim()) {
      try {
        const parsed = JSON.parse(r.images_json);
        if (Array.isArray(parsed)) images = parsed.filter((u): u is string => typeof u === "string");
      } catch {}
    }
    if (!images.length && typeof r.image_url === "string" && r.image_url.trim()) {
      images = [r.image_url.trim()];
    }
    return { ...r, images, image_url: images[0] || "" };
  });
  return NextResponse.json({ posts });
}
export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Escribe una actualización." }, { status: 400 }); }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  let images: string[] = Array.isArray(body.images)
    ? body.images.filter((img): img is string => typeof img === "string" && img.length > 0).slice(0, 6)
    : (typeof body.imageUrl === "string" && body.imageUrl.trim() ? [body.imageUrl.trim()] : []);
  if (content.length < 2 || content.length > 1200) return NextResponse.json({ error: "El texto debe tener entre 2 y 1.200 caracteres." }, { status: 400 });
  const id = randomUUID(); const createdAt = new Date().toISOString();
  await query("INSERT INTO business_news (id, account_id, content, image_url, images_json, created_at) VALUES ($1, $2, $3, $4, $5, $6)", [id, account.id, content, images[0] || "", JSON.stringify(images), createdAt]);
  return NextResponse.json({ post: { id, content, image_url: images[0] || "", images, created_at: createdAt } }, { status: 201 });
}
