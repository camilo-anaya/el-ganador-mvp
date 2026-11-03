import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { activateEligibleDraws, query, releaseExpiredReservations, withTransaction, type DatabaseExecutor, type DatabaseValue } from "../../../../lib/db";
import { getCurrentBogotaMonthStart, getCurrentBogotaYearStart, getPlan } from "../../../../lib/plans";
import { colombianDepartments, raffleTerritoryScopes } from "../../../../lib/raffle-territory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readInput(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "Revisa los datos del sorteo." } as const;
  const body = raw as Record<string, unknown>;
  const text = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
  const input = {
    drawId: text("drawId", 100), title: text("title", 100), category: text("category", 50), description: text("description", 2500),
    emoji: text("emoji", 8) || "🎁", unitPrice: Number(body.unitPrice), totalTickets: Number(body.totalTickets), productValue: Number(body.productValue),
    imageUrl: text("imageUrl", 600), published: body.published !== false,
    territoryScope: text("territoryScope", 30), territoryDepartment: text("territoryDepartment", 100),
    territoryMunicipality: text("territoryMunicipality", 100), territoryMunicipalities: text("territoryMunicipalities", 1000), territoryDepartments: text("territoryDepartments", 1000),
    categoryDetails: body.categoryDetails && typeof body.categoryDetails === "object" && !Array.isArray(body.categoryDetails)
      ? Object.fromEntries(Object.entries(body.categoryDetails as Record<string, unknown>).filter(([, v]) => typeof v === "string").slice(0, 15).map(([k, v]) => [k.slice(0, 60), String(v).trim().slice(0, 250)])) : {},
    startMode: body.startMode === "threshold" ? "threshold" : "date", startThreshold: Number(body.startThreshold),
    scheduledAt: typeof body.scheduledAt === "string" ? body.scheduledAt.slice(0, 40) : "",
  };
  if (input.title.length < 3 || input.category.length < 2 || input.description.length < 8) return { error: "Completa nombre, categoría y descripción del premio." } as const;
  if (!(raffleTerritoryScopes as readonly string[]).includes(input.territoryScope)) return { error: "Selecciona si la rifa será municipal/distrital, departamental o nacional." } as const;
  if (input.territoryScope === "municipal" && (!colombianDepartments.includes(input.territoryDepartment as (typeof colombianDepartments)[number]) || input.territoryMunicipality.length < 2)) return { error: "Indica el departamento o Distrito y el municipio donde se ofrecerá la rifa." } as const;
  if (input.territoryScope === "departmental" && (!colombianDepartments.includes(input.territoryDepartment as (typeof colombianDepartments)[number]) || input.territoryDepartment === "Bogotá D.C." || input.territoryMunicipalities.length < 2)) return { error: "Indica un departamento y los municipios incluidos en la cobertura departamental." } as const;
  if (input.territoryScope === "national") {
    const normalizeArea = (area: string) => area.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO").replace(/\s+/g, " ").trim();
    const declaredAreas = input.territoryDepartments.split(/[;]+/).map((area) => normalizeArea(area)).filter(Boolean);
    const bogotaName = normalizeArea("Bogotá D.C.");
    const declaredDepartments = new Set(declaredAreas.filter((area) => area !== bogotaName));
    const knownAreas = new Set<string>(colombianDepartments.map(normalizeArea));
    const isNationwide = /^(?:todo|toda) colombia$/i.test(input.territoryDepartments);
    if (!isNationwide && (declaredAreas.some((area) => !knownAreas.has(area)) || !(declaredDepartments.size >= 2 || (declaredDepartments.size >= 1 && declaredAreas.includes(bogotaName))))) return { error: "Revisa los nombres oficiales, separados por punto y coma. Indica dos o más departamentos, o un departamento y Bogotá D.C.; para todo el país escribe “Todo Colombia”." } as const;
  }
  if (!Number.isSafeInteger(input.unitPrice) || input.unitPrice < 1000 || input.unitPrice > 1_000_000_000 || !Number.isSafeInteger(input.productValue) || input.productValue < 0 || input.productValue > 10_000_000_000) return { error: "Verifica el precio de la boleta y el valor real del premio." } as const;
  if (!Number.isSafeInteger(input.totalTickets) || input.totalTickets < 100 || ![50, 70, 80, 90, 100].includes(input.startThreshold)) return { error: "Indica al menos 100 números y el porcentaje de activación." } as const;
  if (input.startMode === "date" && (!input.scheduledAt || Number.isNaN(Date.parse(input.scheduledAt)))) return { error: "Elige una fecha válida para iniciar." } as const;
  if (input.imageUrl && !(/^(?:\/uploads\/products\/|https:\/\/[^\s]+\/storage\/v1\/object\/public\/product-images\/)[\w./-]+\.(?:jpg|jpeg|png|webp)$/i.test(input.imageUrl))) return { error: "Sube la foto del premio desde el formulario." } as const;
  return { input } as const;
}

async function canUseCartonSize(tx: DatabaseExecutor, ownerId: string, plan: ReturnType<typeof getPlan>, size: number, excludeDrawId = "") {
  if (size < 100 || size > plan.maxTicketsPerDraw || size % 100 !== 0) return false;
  if (!plan.cartonSizes) return true;
  const slots = plan.cartonSizes.filter((allowed) => allowed === size).length;
  if (!slots) return false;
  const { rows } = await tx.query("SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND published = 1 AND total_tickets = $2 AND id != $3", [ownerId, size, excludeDrawId]);
  return Number((rows[0] as { count: number }).count) < slots;
}

async function count(tx: DatabaseExecutor, sql: string, params: DatabaseValue[]) {
  const result = await tx.query(sql, params);
  return Number((result.rows[0] as { count: number }).count);
}

async function insertAvailableTickets(tx: DatabaseExecutor, drawId: string, first: number, last: number) {
  for (let start = first; start <= last; start += 200) {
    const end = Math.min(start + 199, last);
    const values: DatabaseValue[] = [];
    const tuples: string[] = [];
    for (let number = start; number <= end; number += 1) {
      const offset = values.length;
      values.push(drawId, number);
      tuples.push(`($${offset + 1}, $${offset + 2}, 'available')`);
    }
    await tx.query(`INSERT INTO tickets (draw_id, number, status) VALUES ${tuples.join(",")}`, values);
  }
}

export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  try {
    await withTransaction(async (tx) => {
      await releaseExpiredReservations(new Date().toISOString(), tx);
      await activateEligibleDraws(new Date().toISOString(), tx);
    });
    const [{ rows: draws }, { rows: monthly }, { rows: yearly }] = await Promise.all([
      query(`SELECT d.*, SUM(CASE WHEN t.status = 'sold' THEN 1 ELSE 0 END) AS sold,
          SUM(CASE WHEN t.status = 'reserved' THEN 1 ELSE 0 END) AS reserved,
          SUM(CASE WHEN t.status = 'available' THEN 1 ELSE 0 END) AS available
        FROM draws d JOIN tickets t ON t.draw_id = d.id WHERE d.owner_id = $1
        GROUP BY d.id ORDER BY d.created_at DESC`, [account.id]),
      query("SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND published_at >= $2", [account.id, getCurrentBogotaMonthStart()]),
      query("SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND published_at >= $2", [account.id, getCurrentBogotaYearStart()]),
    ]);
    const activeRaffles = (draws as { published: number }[]).filter((draw) => Number(draw.published) === 1).length;
    return NextResponse.json({ draws, account, plan: getPlan(account.plan), monthlyRafflesUsed: Number((monthly[0] as { count: number }).count), yearlyRafflesUsed: Number((yearly[0] as { count: number }).count), activeRaffles });
  } catch (error) {
    console.error("Could not load business raffles", error);
    return NextResponse.json({ error: "No pudimos cargar el panel de rifas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Revisa los datos del sorteo." }, { status: 400 }); }
  const parsed = readInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { input } = parsed;
  const plan = getPlan(account.plan);
  if (plan.demoOnly && input.published) return NextResponse.json({ error: "El plan Gratis es de demostración y no permite publicar rifas." }, { status: 403 });
  if (input.totalTickets > plan.maxTicketsPerDraw) return NextResponse.json({ error: `Tu plan permite hasta ${plan.maxTicketsPerDraw.toLocaleString("es-CO")} números por rifa.` }, { status: 403 });
  if (input.totalTickets > plan.maxTicketsPerDraw) return NextResponse.json({ error: `Tu plan permite hasta ${plan.maxTicketsPerDraw.toLocaleString("es-CO")} números por rifa.` }, { status: 403 });
  const grossGain = input.totalTickets * input.unitPrice;
  if (grossGain > plan.maxRaffleGain) return NextResponse.json({ error: `La venta bruta proyectada supera el tope de ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(plan.maxRaffleGain)} de tu plan.` }, { status: 403 });
  const id = `RIF-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const details = JSON.stringify({ ...input.categoryDetails, productValue: String(input.productValue) });
  try {
    const limitError = await withTransaction(async (tx) => {
      const monthStart = getCurrentBogotaMonthStart();
      const monthlyUsed = await count(tx, "SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND published_at >= $2", [account.id, monthStart]);
      if (input.published && plan.rafflesPerMonth !== null && monthlyUsed >= plan.rafflesPerMonth) return `Tu plan ${plan.name} permite publicar ${plan.rafflesPerMonth} rifa al mes.`;
      if (plan.rafflesPerYear !== null) {
        const yearlyUsed = await count(tx, "SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND created_at >= $2", [account.id, getCurrentBogotaYearStart()]);
        if (yearlyUsed >= plan.rafflesPerYear) return `Tu plan ${plan.name} alcanzó su límite anual de ${plan.rafflesPerYear} rifas.`;
      }
      const active = await count(tx, "SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND published = 1", [account.id]);
      if (input.published && plan.maxSimultaneousRaffles !== null && active >= plan.maxSimultaneousRaffles) return `Tu plan permite hasta ${plan.maxSimultaneousRaffles} rifas publicadas simultáneamente. Oculta una antes de publicar otra.`;
      if (input.published && !(await canUseCartonSize(tx, account.id, plan, input.totalTickets))) return "Ese tamaño de cartón no está disponible ahora en tu plan. Revisa cuántos cartones ya tienes publicados.";
      await tx.query(`INSERT INTO draws (id, title, admin, category, unit_price, total_tickets, followers, live, emoji, description,
        business_city, territory_scope, territory_department, territory_municipality, territory_municipalities, territory_departments,
        business_description, category_details, owner_id, product_value, image_url, published, start_mode, start_threshold, scheduled_at, created_at, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
      [id, input.title, account.business_name, input.category, input.unitPrice, input.totalTickets, input.emoji, input.description,
        account.business_city || "Colombia", input.territoryScope, input.territoryDepartment, input.territoryMunicipality, input.territoryMunicipalities,
        input.territoryDepartments, account.business_description, details, account.id, input.productValue, input.imageUrl,
        Number(input.published), input.startMode, input.startThreshold, input.startMode === "date" ? input.scheduledAt : null, now, input.published ? now : null]);
      await insertAvailableTickets(tx, id, 1, input.totalTickets);
      return null;
    });
    if (limitError) return NextResponse.json({ error: limitError }, { status: 403 });
    return NextResponse.json({ drawId: id, message: input.published ? "Rifa creada y publicada en el marketplace." : "Borrador guardado." }, { status: 201 });
  } catch (error) {
    console.error("Could not create raffle", error);
    return NextResponse.json({ error: "No pudimos crear la rifa." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Revisa los datos del sorteo." }, { status: 400 }); }
  const parsed = readInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { input } = parsed;
  if (!input.drawId) return NextResponse.json({ error: "No encontramos el identificador de la rifa." }, { status: 400 });
  const plan = getPlan(account.plan);
  if (plan.demoOnly && input.published) return NextResponse.json({ error: "El plan Gratis es de demostración y no permite publicar rifas." }, { status: 403 });
  if (input.totalTickets > plan.maxTicketsPerDraw) return NextResponse.json({ error: `Tu plan permite hasta ${plan.maxTicketsPerDraw.toLocaleString("es-CO")} números por rifa.` }, { status: 403 });
  if (input.totalTickets * input.unitPrice > plan.maxRaffleGain) return NextResponse.json({ error: `La venta bruta proyectada supera el tope de ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(plan.maxRaffleGain)} de tu plan.` }, { status: 403 });
  try {
    const result = await withTransaction(async (tx) => {
      const currentResult = await tx.query("SELECT total_tickets, unit_price, published, published_at FROM draws WHERE id = $1 AND owner_id = $2", [input.drawId, account.id]);
      const current = currentResult.rows[0] as { total_tickets: number; unit_price: number; published: number; published_at: string | null } | undefined;
      if (!current) return { error: "No encontramos esa rifa en tu cuenta.", status: 404 };
      const publishingNow = input.published && !current.published;
      if (publishingNow && plan.rafflesPerMonth !== null && !current.published_at) {
        const publishedThisMonth = await count(tx, "SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND published_at >= $2 AND id != $3", [account.id, getCurrentBogotaMonthStart(), input.drawId]);
        if (publishedThisMonth >= plan.rafflesPerMonth) return { error: `Tu plan ${plan.name} permite publicar ${plan.rafflesPerMonth} rifa al mes.`, status: 403 };
      }
      if (input.published && !(await canUseCartonSize(tx, account.id, plan, input.totalTickets, input.drawId))) return { error: "Ese tamaño de cartón no está disponible ahora en tu plan.", status: 403 };
      if (!current.published && input.published && plan.maxSimultaneousRaffles !== null) {
        const active = await count(tx, "SELECT COUNT(*) AS count FROM draws WHERE owner_id = $1 AND published = 1", [account.id]);
        if (active >= plan.maxSimultaneousRaffles) return { error: `Tu plan permite hasta ${plan.maxSimultaneousRaffles} rifas publicadas simultáneamente.`, status: 403 };
      }
      const reserved = await count(tx, "SELECT COUNT(*) AS count FROM tickets WHERE draw_id = $1 AND status = 'reserved'", [input.drawId]);
      if (reserved && input.unitPrice !== Number(current.unit_price)) return { error: "Espera a que venzan las reservas antes de cambiar el precio.", status: 409 };
      if (input.totalTickets < current.total_tickets) {
        const occupied = await count(tx, "SELECT COUNT(*) AS count FROM tickets WHERE draw_id = $1 AND number > $2 AND status != 'available'", [input.drawId, input.totalTickets]);
        if (occupied) return { error: "No puedes reducir el cartón por debajo de números vendidos o apartados.", status: 409 };
        await tx.query("DELETE FROM tickets WHERE draw_id = $1 AND number > $2", [input.drawId, input.totalTickets]);
      } else if (input.totalTickets > current.total_tickets) {
        await insertAvailableTickets(tx, input.drawId, Number(current.total_tickets) + 1, input.totalTickets);
      }
      const publishedAt = current.published_at ?? (input.published ? new Date().toISOString() : null);
      await tx.query(`UPDATE draws SET title = $1, category = $2, description = $3, emoji = $4, unit_price = $5, total_tickets = $6,
        category_details = $7, product_value = $8, image_url = $9, published = $10, start_mode = $11, start_threshold = $12, scheduled_at = $13, published_at = $14,
        territory_scope = $15, territory_department = $16, territory_municipality = $17, territory_municipalities = $18, territory_departments = $19
        WHERE id = $20 AND owner_id = $21`,
      [input.title, input.category, input.description, input.emoji, input.unitPrice, input.totalTickets,
        JSON.stringify({ ...input.categoryDetails, productValue: String(input.productValue) }), input.productValue, input.imageUrl,
        Number(input.published), input.startMode, input.startThreshold, input.startMode === "date" ? input.scheduledAt : null, publishedAt,
        input.territoryScope, input.territoryDepartment, input.territoryMunicipality, input.territoryMunicipalities, input.territoryDepartments, input.drawId, account.id]);
      return null;
    });
    if (result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ drawId: input.drawId, message: "Rifa actualizada." });
  } catch (error) {
    console.error("Could not update raffle", error);
    return NextResponse.json({ error: "No pudimos actualizar la rifa." }, { status: 500 });
  }
}
