import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get("accountId");
    const businessName = url.searchParams.get("businessName");

    let sql = `
      SELECT n.id, n.content, n.image_url, n.images_json, n.created_at,
             COALESCE(n.ticket_price, 25000) AS ticket_price,
             COALESCE(n.ticket_count, 100) AS ticket_count,
             COALESCE(n.mechanic, 'balotera') AS mechanic,
             a.id AS account_id, a.business_name, a.business_city, a.category, a.business_photo_url
      FROM business_news n
      JOIN business_accounts a ON a.id = n.account_id
    `;
    const params: unknown[] = [];

    if (accountId) {
      params.push(accountId);
      sql += ` WHERE a.id = $${params.length}`;
    } else if (businessName) {
      params.push(businessName);
      sql += ` WHERE LOWER(a.business_name) = LOWER($${params.length})`;
    }

    sql += ` ORDER BY n.created_at DESC LIMIT 40`;

    const { rows } = await query(sql, params as never[]);
    const posts = (rows as Array<Record<string, unknown>>).map((r) => {
      let images: string[] = [];
      if (typeof r.images_json === "string" && r.images_json.trim()) {
        try {
          const parsed = JSON.parse(r.images_json);
          if (Array.isArray(parsed)) {
            images = parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
          }
        } catch {}
      }
      if (!images.length && typeof r.image_url === "string" && r.image_url.trim()) {
        images = [r.image_url.trim()];
      }
      return {
        ...r,
        images: images.slice(0, 6),
        image_url: images[0] || "",
      };
    });

    return NextResponse.json({ posts });
  } catch (err) {
    console.warn("GET /api/news fallback:", err);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "Tienda XYZ";
  let images: string[] = Array.isArray(body.images)
    ? body.images.filter((img): img is string => typeof img === "string" && img.length > 0).slice(0, 6)
    : (typeof body.imageUrl === "string" && body.imageUrl.trim() ? [body.imageUrl.trim()] : []);

  if (content.length < 3) {
    return NextResponse.json({ error: "Escribe un comentario sobre el próximo sorteo." }, { status: 400 });
  }

  if (images.length === 0) {
    images = ["/premios/iphone-18-pro.jpg"];
  }

  const ticketPrice = typeof body.ticketPrice === "number" && !isNaN(body.ticketPrice) && body.ticketPrice > 0
    ? Math.round(body.ticketPrice)
    : (Number(body.ticketPrice) > 0 ? Math.round(Number(body.ticketPrice)) : 25000);
  const ticketCount = typeof body.ticketCount === "number" && !isNaN(body.ticketCount) && body.ticketCount > 0
    ? Math.round(body.ticketCount)
    : (Number(body.ticketCount) > 0 ? Math.round(Number(body.ticketCount)) : 100);
  
  // Regla estricta: La Ruleta 3D solo llega hasta 50 números máximo.
  // De 51 números en adelante se convierte automáticamente en Balotera 3D.
  let mechanic = typeof body.mechanic === "string" && body.mechanic.toLowerCase() === "ruleta" ? "ruleta" : "balotera";
  if (ticketCount > 50) {
    mechanic = "balotera";
  }

  const id = "post-" + randomUUID().slice(0, 8);
  const createdAt = new Date().toISOString();

  const { rows: accs } = await query("SELECT id, business_city, category FROM business_accounts WHERE LOWER(business_name) = LOWER($1) LIMIT 1", [businessName]);
  const acc = (accs as Array<{ id: string; business_city?: string; category?: string }>)[0];
  const accountId = acc?.id || "biz-001";
  const city = acc?.business_city || "Colombia";
  const cat = acc?.category || "Tecnología";

  await query(
    `INSERT INTO business_news (id, account_id, content, image_url, images_json, ticket_price, ticket_count, mechanic, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, accountId, content, images[0] || "", JSON.stringify(images), ticketPrice, ticketCount, mechanic, createdAt]
  );

  // También registrar el sorteo en la tabla draws para que aparezca y tenga cartón digital
  const drawId = "drw-" + id.slice(5);
  try {
    const scheduledAt = typeof body.drawDate === "string" && body.drawDate.trim() ? body.drawDate.trim() : null;
    await query(
      `INSERT OR IGNORE INTO draws (id, title, admin, category, unit_price, total_tickets, followers, live, emoji, description, business_city, image_url, published, start_mode, scheduled_at, created_at, mechanic)
       VALUES ($1, $2, $3, $4, $5, $6, 120, 0, '🎟️', $7, $8, $9, 1, 'date', $10, $11, $12)`,
      [drawId, typeof body.productTitle === "string" && body.productTitle.trim() ? body.productTitle.trim() : `Sorteo ${businessName}`, businessName, cat, ticketPrice, ticketCount, content, city, images[0] || "", scheduledAt, createdAt, mechanic]
    );
  } catch {}

  return NextResponse.json({
    post: {
      id,
      account_id: accountId,
      content,
      image_url: images[0] || "",
      images,
      ticket_price: ticketPrice,
      ticket_count: ticketCount,
      mechanic,
      created_at: createdAt,
      business_name: businessName,
      draw_id: drawId,
    }
  }, { status: 201 });
}
