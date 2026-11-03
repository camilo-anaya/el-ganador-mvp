import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query, withTransaction } from "../../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  return NextResponse.json({ account });
}

export async function PATCH(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Revisa los datos del perfil." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (name.length < 2 || name.length > 100 || city.length > 100 || description.length > 500 || category.length < 2 || category.length > 50) return NextResponse.json({ error: "Revisa nombre, ciudad, categoría y descripción." }, { status: 400 });
  await withTransaction(async (tx) => {
    await tx.query("UPDATE business_accounts SET business_name = $1, business_city = $2, business_description = $3, category = $4 WHERE id = $5", [name, city, description, category, account.id]);
    await tx.query("UPDATE draws SET admin = $1, business_city = $2, business_description = $3 WHERE owner_id = $4", [name, city || "Colombia", description, account.id]);
  });
  return NextResponse.json({ message: "Perfil del local actualizado." });
}
